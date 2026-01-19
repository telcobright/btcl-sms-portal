'use client';
import { Header } from '@/components/layout/Header';
import { loginUser, setAuthToken } from '@/lib/api-client/auth';
import {
  addPartnerDetails,
  createPartner,
  loginPartner,
  sendOtp,
  verifyOtp,
} from '@/lib/api-client/partner';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { FEATURE_FLAGS, API_BASE_URL, NID_BASE_URL, API_ENDPOINTS } from '@/config/api';

// Country list with codes
const countries = [
  { code: 'BD', name: 'Bangladesh' },
  { code: 'US', name: 'United States' },
  { code: 'UK', name: 'United Kingdom' },
  // Add more countries as needed
];

type VerificationInfo = {
  companyName: string;
  email: string;
  phone: string;
  otp: string;
};

type PersonalInfo = {
  fullName: string;
  alternateNameOther: string;
  dateOfBirth: string;
  nidNumber: string;
  nidDigitType: '10' | '17';
  password: string;
  confirmPassword: string;
  identityCardFrontSide?: File;
  identityCardBackSide?: File;
};

type OtherInfo = {
  address1: string;
  address2?: string;
  address3: string;
  address4?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  tradeLicenseNumber: string;
  tinNumber: string;
  taxReturnDate: string;
  termsAccepted: boolean;
  tradeLicenseFile: File | null;
  tinFile: File | null;
  taxReturnFile: File | null;
  jointStockFile?: File | null;
  btrcFile?: File | null;
  photoFile?: File | null;
  slaFile?: File | null;
  bincertificate?: File;
};

export default function RegisterPage() {
  const params = useParams();
  const locale = params.locale as string;
  const [step, setStep] = useState<number>(1);
  const [secondsLeft, setSecondsLeft] = useState<number>(300);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [verifiedPhone, setVerifiedPhone] = useState('');
  const [verifiedEmail, setVerifiedEmail] = useState('');
  const [canSendOtp, setCanSendOtp] = useState(false);
  const [canProceedPersonal, setCanProceedPersonal] = useState(false);
  const [nidVerified, setNidVerified] = useState(false);
  const [nidVerificationFailed, setNidVerificationFailed] = useState(false);
  const [isVerifyingNid, setIsVerifyingNid] = useState(false);
  const [nidVerificationData, setNidVerificationData] = useState<any>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const router = useRouter();
  const { checkAuth } = useAuth();

  // Form hooks for each step
  const verificationForm = useForm<VerificationInfo>({
    mode: 'onBlur',
    defaultValues: {
      companyName: '',
      email: '',
      phone: '',
      otp: '',
    },
  });

  const personalInfoForm = useForm<PersonalInfo>({
    mode: 'onBlur',
    defaultValues: {
      fullName: '',
      alternateNameOther: '',
      dateOfBirth: '',
      nidNumber: '',
      nidDigitType: '10',
      password: '',
      confirmPassword: '',
      identityCardFrontSide: undefined,
      identityCardBackSide: undefined,
    },
  });

  const otherInfoForm = useForm<OtherInfo>({
    mode: 'onBlur',
    defaultValues: {
      address1: '',
      address2: '',
      address3: '',
      address4: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'BD',
      tradeLicenseNumber: '',
      tinNumber: '',
      taxReturnDate: '',
      termsAccepted: false,
      tradeLicenseFile: null,
      tinFile: null,
      taxReturnFile: null,
      jointStockFile: null,
      btrcFile: null,
      photoFile: null,
      slaFile: null,
      bincertificate: undefined,
    },
  });

  const {
    formState: { isValid: isVerificationValid },
  } = verificationForm;
  const {
    formState: { isValid: isPersonalInfoValid },
  } = personalInfoForm;
  const {
    formState: { isValid: isOtherInfoValid },
  } = otherInfoForm;

  // Watch verification form fields for Send OTP button
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const subscription = verificationForm.watch((value) => {
        if (!otpSent) {
          // For Send OTP button
          const hasAllFields = !!(value.companyName && value.email && value.phone);
          const emailValid = !verificationForm.formState.errors.email;
          const phoneValid = !verificationForm.formState.errors.phone;
          setCanSendOtp(hasAllFields && emailValid && phoneValid);
        } else {
          // For Verify OTP button
          const hasOtp = !!(value.otp);
          setCanSendOtp(hasOtp);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [verificationForm, otpSent]);

  // Watch personal info form fields for Next Step button
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const subscription = personalInfoForm.watch((value) => {
        const hasAllFields = !!(
          value.fullName &&
          value.dateOfBirth &&
          value.nidNumber &&
          value.password &&
          value.confirmPassword &&
          value.identityCardFrontSide &&
          value.identityCardBackSide
        );
        const passwordValid = !personalInfoForm.formState.errors.password;
        const confirmValid = !personalInfoForm.formState.errors.confirmPassword;
        setCanProceedPersonal(hasAllFields && passwordValid && confirmValid);
      });
      return () => subscription.unsubscribe();
    }
  }, [personalInfoForm]);

  // start timer helper
  const startTimer = (initial = 60) => {
    setSecondsLeft(initial);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    intervalRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000) as unknown as number;
  };

  // On entering step 1, start the OTP timer if OTP was sent
  useEffect(() => {
    if (step === 1 && otpSent) {
      startTimer(300);
    } else {
      // clear timer if we leave step 1
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [step, otpSent]);

  // format mm:ss
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    const mm = m.toString().padStart(2, '0');
    const ss = sec.toString().padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const handleNext = async () => {
    if (step === 1) {
      const isValid = await verificationForm.trigger();
      if (isValid) {
        // If OTP hasn't been sent yet, send it
        if (!otpSent) {
          await handleSendOtp();
        } else {
          // If OTP has been sent, verify it
          await handleVerifyOtp();
        }
      }
    } else if (step === 2) {
      const isValid = await personalInfoForm.trigger();
      if (isValid) {
        await handleNidVerification();
      }
    } else if (step === 3) {
      const isValid = await otherInfoForm.trigger();
      if (isValid) setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    // Don't allow going back to Verification if OTP is verified
    if (step === 2 && otpVerified) {
      return;
    }
    // Don't allow going back to NID Verification if NID is verified
    if (step === 3 && nidVerified) {
      return;
    }
    if (step > 1) setStep((prev) => prev - 1);
  };

  const handleSendOtp = async () => {
    try {
      setIsSubmitting(true);
      const phone = verificationForm.getValues('phone');
      const email = verificationForm.getValues('email');
      const companyName = verificationForm.getValues('companyName');

      // Store company name in localStorage
      if (companyName) {
        localStorage.setItem('companyName', companyName);
        console.log('Company name saved to localStorage:', companyName);
      }

      // Check if OTP verification is enabled
      if (!FEATURE_FLAGS.OTP_VERIFICATION_ENABLED) {
        // Skip OTP verification
        await new Promise(resolve => setTimeout(resolve, 1000));
        setOtpSent(true);
        startTimer(300);
        toast.success('OTP verification skipped (disabled in config)');
        return;
      }

      // OTP verification is enabled - proceed with actual validation and OTP sending
      console.log('Validating partner data...');
      const validateResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.partner.validate}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          partnerName: companyName,
          telephone: phone,
          email: email,
        }),
      });

      const validateData = await validateResponse.json();
      console.log('Validation response:', validateData);

      // Check for validation errors
      if (!validateResponse.ok || validateData === false) {
        if (validateData.errorCode === '400 BAD_REQUEST') {
          if (validateData.message === 'Telephone number already exists') {
            verificationForm.setError('phone', {
              type: 'manual',
              message: 'Telephone number already exists',
            });
            setIsSubmitting(false);
            return;
          } else if (validateData.message === 'Email already exists') {
            verificationForm.setError('email', {
              type: 'manual',
              message: 'Email already exists',
            });
            setIsSubmitting(false);
            return;
          } else if (validateData.message === 'Partner Name already exists') {
            verificationForm.setError('companyName', {
              type: 'manual',
              message: 'Company Name already exists',
            });
            setIsSubmitting(false);
            return;
          }
        }
        toast.error('Validation failed. Please check your information.');
        setIsSubmitting(false);
        return;
      }

      // If validation passed, send actual OTP
      console.log('Validation successful, sending OTP...');
      const response = await sendOtp(phone);
      console.log('OTP sent:', response);
      setOtpSent(true);
      startTimer(300);
      toast.success('OTP sent successfully!');
    } catch (error) {
      console.error('Failed to send OTP:', error);
      toast.error('Failed to send OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = async () => {
    try {
      setIsSubmitting(true);
      const { phone, otp, email } = verificationForm.getValues();

      // Check if OTP verification is enabled
      if (!FEATURE_FLAGS.OTP_VERIFICATION_ENABLED) {
        // Skip OTP verification
        await new Promise(resolve => setTimeout(resolve, 1000));
        setVerifiedPhone(phone);
        setVerifiedEmail(email);
        setOtpVerified(true);
        toast.success('OTP verification skipped (disabled in config)');
        setStep(2);
        return;
      }

      // OTP verification is enabled - proceed with actual verification
      const response = await verifyOtp(phone, otp);

      // Check if OTP verification was successful
      // @ts-ignore
      if (response === 'OTP verified successfully.' || response.message === 'OTP verified successfully.') {
        console.log('OTP verified:', response);
        setVerifiedPhone(phone);
        setVerifiedEmail(email);
        setOtpVerified(true);
        toast.success('Phone number verified successfully!');
        setStep(2);
      } else {
        throw new Error('OTP verification failed');
      }
    } catch (error) {
      console.error('Failed to verify OTP:', error);
      toast.error('Invalid OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resendOtp = async () => {
    try {
      // Check if OTP verification is enabled
      if (!FEATURE_FLAGS.OTP_VERIFICATION_ENABLED) {
        // Skip OTP resending
        startTimer(300);
        toast.success('OTP resend skipped (disabled in config)');
        return;
      }

      // OTP verification is enabled - proceed with actual resend
      const phone = verificationForm.getValues('phone');
      const response = await sendOtp(phone);
      console.log('OTP resent:', response);
      startTimer(300);
      toast.success('OTP resent successfully!');
    } catch (error) {
      console.error('Failed to resend OTP:', error);
      toast.error('Failed to resend OTP. Please try again.');
    }
  };

  const handleNidVerification = async () => {
    try {
      setIsVerifyingNid(true);

      // Check if NID verification is enabled
      if (!FEATURE_FLAGS.NID_VERIFICATION_ENABLED) {
        // Skip NID verification
        await new Promise(resolve => setTimeout(resolve, 2000));
        setNidVerified(true);
        setNidVerificationFailed(false);
        setNidVerificationData({ status: true });
        // Move to next step after showing success
        setTimeout(() => {
          setStep(3);
        }, 2000);
        return;
      }

      // NID verification is enabled - proceed with actual verification
      const { fullName, dateOfBirth, nidNumber, nidDigitType } = personalInfoForm.getValues();

      // Build the verification payload
      const payload = {
        identify: {
          nid17Digit: nidDigitType === '17' ? nidNumber : null,
          nid10Digit: nidDigitType === '10' ? nidNumber : null,
        },
        verify: {
          nameEn: fullName,
          dateOfBirth: dateOfBirth,
        },
      };

      console.log('Sending NID verification request:', payload);

      // Wait for 5 seconds minimum to show the loader
      const [response] = await Promise.all([
        fetch(`${NID_BASE_URL}${API_ENDPOINTS.nid.verify}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }),
        new Promise(resolve => setTimeout(resolve, 5000))
      ]);

      const data = await response.json();
      console.log('NID verification response:', data);

      // Check verification status based on the new simplified response
      if (data.status === true) {
        // NID verified successfully
        setNidVerified(true);
        setNidVerificationFailed(false);
        setNidVerificationData(data);
        // Move to next step after showing success
        setTimeout(() => {
          setStep(3);
        }, 2000);
      } else {
        // Verification failed - status is false
        setNidVerified(false);
        setNidVerificationFailed(true);
        setNidVerificationData(null);
      }
    } catch (error) {
      console.error('NID verification error:', error);
      setNidVerified(false);
      setNidVerificationFailed(true);
      setNidVerificationData(null);
    } finally {
      setIsVerifyingNid(false);
    }
  };

  const handlePersonalInfoSubmit: SubmitHandler<PersonalInfo> = (data) => {
    console.log('Personal info submitted:', data);
    setStep(3);
  };

  // Updated registration flow
  const handleOtherInfoSubmit: SubmitHandler<OtherInfo> = async (data) => {
    setIsSubmitting(true);

    try {
      console.log('🚀 Starting registration process...');

      // 1. Gather both form data
      const personalInfoData = personalInfoForm.getValues();
      const otherInfoData = otherInfoForm.getValues();

      // Get company name from localStorage
      const companyName = localStorage.getItem('companyName');

        const fullName = personalInfoData.fullName;
      // 2. First call: create partner (NO TOKEN REQUIRED)
      console.log('\n🔵 STEP 2: Creating partner account...');
        const partnerPayload = {
            partnerName: companyName,
            alternateNameOther: personalInfoData.alternateNameOther || fullName,
            alternateNameInvoice: fullName,
            telephone: verifiedPhone,
            email: verifiedEmail,
            userPassword: personalInfoData.password,
            address1: otherInfoData.address1,
            address2: otherInfoData.address2 || '',
            city: otherInfoData.city,
            state: otherInfoData.state,
            postalCode: otherInfoData.postalCode,
            country: otherInfoData.country,
            vatRegistrationNo: otherInfoData.tinNumber || 'N/A',
            invoiceAddress: otherInfoData.address1,
            customerPrePaid: 1,
            partnerType: 3,
            defaultCurrency: 1,
            callSrcId: 2,
        };

      const partnerResponse = await createPartner(partnerPayload);

      // Extract partnerId
      const idPartner = partnerResponse?.idPartner || partnerResponse?.id;
      if (!idPartner) {
        console.error('❌ Partner response:', partnerResponse);
        throw new Error('Partner ID missing in createPartner response');
      }
      console.log('✅ Partner created with ID:', idPartner);

      // 3. Second call: login to get JWT token
      console.log('\n🔵 STEP 3: Logging in to get JWT token...');
      console.log('Login credentials:', {
        email: verifiedEmail,
        passwordLength: 8,
      });

      const loginResponse = await loginPartner(
        verifiedEmail,
        '11111111'
      );

      const jwtToken = loginResponse.token;
      if (!jwtToken) {
        console.error('❌ Login response:', loginResponse);
        throw new Error('JWT token missing in login response');
      }
      console.log('✅ JWT token received:', jwtToken.substring(0, 50) + '...');
      console.log('📋 Token payload:', {
        roles: loginResponse.authRoles,
        partnerId: loginResponse.idPartner || 'N/A',
        sessionStart: loginResponse.sessionStartDateTime,
      });

      // Small delay to ensure token is propagated
      console.log('⏳ Waiting 2 seconds for token to be active...');
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 4. Third call: add partner details (WITH TOKEN)
      console.log('\n🔵 STEP 4: Adding partner documents with JWT token...');
      const detailsPayload = {
        partnerId: idPartner,
        address1: otherInfoData.address1 ?? null,
        address2: otherInfoData.address2 ?? null,
        address3: otherInfoData.address3 ?? null,
        address4: otherInfoData.address4 ?? null,
        city: otherInfoData.city ?? null,
        state: otherInfoData.state ?? null,
        postalCode: otherInfoData.postalCode ?? null,
        nid: personalInfoData.nidNumber ?? null,
        tradeLicenseNumber: otherInfoData.tradeLicenseNumber ?? null,
        tin: otherInfoData.tinNumber ?? null,
        taxReturnDate: otherInfoData.taxReturnDate ?? null,
        countryCode: otherInfoData.country ?? null,
        tinCertificate: otherInfoData.tinFile ?? null,
        nidFront: personalInfoData.identityCardFrontSide ?? null,
        nidBack: personalInfoData.identityCardBackSide ?? null,
        vatDoc: otherInfoData.jointStockFile ?? null,
        tradeLicense: otherInfoData.tradeLicenseFile ?? null,
        photo: otherInfoData.photoFile ?? null,
        binCertificate: otherInfoData.bincertificate ?? null,
        sla: otherInfoData.slaFile ?? null,
        btrcRegistration: otherInfoData.btrcFile ?? null,
        lastTaxReturn: otherInfoData.taxReturnFile ?? null,
      };

      console.log('Calling addPartnerDetails with token...');
      const detailsResponse = await addPartnerDetails(detailsPayload, jwtToken);
      console.log('✅ Partner details added successfully:', detailsResponse);

      // 5. Auto-login for the main app (if different from partner login)
      console.log('\n🔵 STEP 5: Auto-login to main app...');
      try {
        const appLoginResponse = await loginUser({
          email: verifiedEmail,
          password: personalInfoData.password,
        });

        // Extract partner ID
        const partnerId =
          appLoginResponse.idPartner || appLoginResponse.partnerId || idPartner;

        setAuthToken(appLoginResponse.token);
        localStorage.setItem('userEmail', verifiedEmail);
        localStorage.setItem('userPassword', personalInfoData.password);
        localStorage.setItem('partnerId', partnerId.toString()); // CRITICAL

        // Clean up company name from localStorage after successful registration
        localStorage.removeItem('companyName');

        checkAuth();
        toast.success(
          'Registration completed successfully! You are now logged in.'
        );
        console.log('✅ Registration complete! Redirecting to dashboard...');
        router.push(`/${locale}/dashboard`);
      } catch (loginError) {
        console.error('⚠️ Auto login failed:', loginError);
        // Still show success message but redirect to login page
        toast.success(
          'Registration completed successfully! Please login with your credentials.'
        );
        router.push(`/${locale}/login`);
      }
    } catch (error) {
      console.error('❌ Registration failed:', error);
      // Provide more specific error messages
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-black">
              {step === 1 && 'Verify Your Phone Number'}
              {step === 2 && 'Verify Your NID'}
              {step === 3 && 'Upload Your Documents'}
            </h1>
            <p className="text-gray-600">
              Please provide your information to get started
            </p>
          </div>

          {/* Steps header (tabs) */}
          <div className="flex border mb-6">
            {['Verification', 'NID Verification', 'Other Information'].map(
              (label, i) => (
                <div
                  key={i}
                  onClick={() => {
                    // Prevent going back to Verification after OTP is verified
                    if (i === 0 && otpVerified) {
                      return;
                    }
                    // Prevent going back to NID Verification after NID is verified
                    if (i === 1 && nidVerified) {
                      return;
                    }
                    // Only allow navigation if conditions are met
                    if (
                      i === 0 && !otpVerified ||
                      (i === 1 && otpVerified && !nidVerified) ||
                      (i === 2 && nidVerified && isPersonalInfoValid)
                    ) {
                      setStep(i + 1);
                    }
                  }}
                  className={`flex-1 text-center py-3 border-r last:border-r-0 ${
                    step === i + 1
                      ? 'bg-gray-100 font-medium text-black'
                      : 'bg-white text-black'
                  } ${
                    (i === 0 && otpVerified) ||
                    (i === 1 && (nidVerified || !otpVerified)) ||
                    (i === 2 && (!nidVerified || !isPersonalInfoValid))
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer'
                  }`}
                >
                  {i + 1}. {label}
                </div>
              )
            )}
          </div>

          {/* STEP 1 - Verification */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-black font-medium mb-1">
                  Company Name (as per Aggregator License)
                </label>
                <Controller
                  name="companyName"
                  control={verificationForm.control}
                  rules={{ required: 'Company name is required' }}
                  render={({ field, fieldState }) => (
                    <>
                      <input
                        type="text"
                        {...field}
                        placeholder="Enter company name as per Aggregator License"
                        className={`w-full px-3 py-2 border ${
                          fieldState.error
                            ? 'border-red-500'
                            : 'border-gray-300'
                        } rounded-md text-black`}
                      />
                      {fieldState.error && (
                        <p className="text-red-500 text-sm mt-1">
                          {fieldState.error.message}
                        </p>
                      )}
                    </>
                  )}
                />
              </div>
              <div>
                <label className="block text-black font-medium mb-1">
                  Email Address
                </label>
                <Controller
                  name="email"
                  control={verificationForm.control}
                  rules={{
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address',
                    },
                  }}
                  render={({ field, fieldState }) => (
                    <>
                      <input
                        type="email"
                        {...field}
                        placeholder="Enter your email address"
                        className={`w-full px-3 py-2 border ${
                          fieldState.error
                            ? 'border-red-500'
                            : 'border-gray-300'
                        } rounded-md text-black`}
                      />
                      {fieldState.error && (
                        <p className="text-red-500 text-sm mt-1">
                          {fieldState.error.message}
                        </p>
                      )}
                    </>
                  )}
                />
              </div>
              <div>
                <label className="block text-black font-medium mb-1">
                  Phone Number
                </label>
                <Controller
                  name="phone"
                  control={verificationForm.control}
                  rules={{
                    required: 'Phone number is required',
                    pattern: {
                      value: /^\+8801[3-9]\d{8}$/,
                      message:
                        'Must be a valid Bangladeshi phone number (+8801XXXXXXXXX)',
                    },
                  }}
                  render={({ field, fieldState }) => (
                    <>
                      <input
                        type="tel"
                        {...field}
                        placeholder="+880 1XXXXXXXXX"
                        disabled={otpSent}
                        onChange={(e) => {
                          let value = e.target.value.replace(/\s/g, ''); // Remove spaces

                          // If already starts with +880, keep it as is
                          if (value.startsWith('+880')) {
                            // Do nothing, it's already in correct format
                          }
                          // If starts with 01, add +88
                          else if (value.startsWith('01')) {
                            value = '+88' + value;
                          }
                          // If starts with 8801 but no +, add +
                          else if (value.startsWith('8801') && !value.startsWith('+')) {
                            value = '+' + value;
                          }
                          // If starts with 1 and length suggests it's a phone number, add +880
                          else if (value.startsWith('1') && value.length >= 10 && value.length <= 11) {
                            value = '+880' + value;
                          }

                          field.onChange(value);
                        }}
                        onBlur={(e) => {
                          let value = e.target.value.replace(/\s/g, ''); // Remove spaces

                          // Final formatting on blur
                          if (value.startsWith('+880')) {
                            // Already in correct format, keep as is
                          } else if (value.startsWith('01')) {
                            value = '+88' + value;
                          } else if (value.startsWith('8801') && !value.startsWith('+')) {
                            value = '+' + value;
                          } else if (value.startsWith('1') && value.length === 10) {
                            value = '+880' + value;
                          }

                          field.onChange(value);
                          field.onBlur();
                        }}
                        className={`w-full px-3 py-2 border ${
                          fieldState.error
                            ? 'border-red-500'
                            : 'border-gray-300'
                        } rounded-md text-black ${
                          otpSent ? 'bg-gray-100' : ''
                        }`}
                      />
                      {fieldState.error && (
                        <p className="text-red-500 text-sm mt-1">
                          {fieldState.error.message}
                        </p>
                      )}
                      {!fieldState.error && !otpSent && (
                        <p className="text-gray-500 text-sm mt-1">
                          Enter as: +8801XXXXXXXXX, 8801XXXXXXXXX, or 01XXXXXXXXX
                        </p>
                      )}
                    </>
                  )}
                />
              </div>

              {otpSent && (
                <>
                  <div>
                    <label className="block text-black font-medium mb-1">
                      Verification Code
                    </label>
                    <Controller
                      name="otp"
                      control={verificationForm.control}
                      rules={{
                        required: 'OTP is required',
                        pattern: {
                          value: /^\d{5}$/,
                          message: 'OTP must be 5 digits',
                        },
                      }}
                      render={({ field, fieldState }) => (
                        <>
                          <input
                            type="text"
                            {...field}
                            className={`w-full px-3 py-2 border ${
                              fieldState.error
                                ? 'border-red-500'
                                : 'border-gray-300'
                            } rounded-md text-black`}
                          />
                          {fieldState.error && (
                            <p className="text-red-500 text-sm mt-1">
                              {fieldState.error.message}
                            </p>
                          )}
                        </>
                      )}
                    />
                  </div>

                  <div className="text-sm text-gray-600">
                    {secondsLeft > 0 ? (
                      <p>Time remaining: {formatTime(secondsLeft)}</p>
                    ) : (
                      <button
                        type="button"
                        onClick={resendOtp}
                        className="text-blue-600 hover:underline"
                      >
                        Resend OTP
                      </button>
                    )}
                  </div>
                </>
              )}

              <div className="flex justify-between pt-4 gap-4">
                <div />
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={isSubmitting || (!otpSent && !canSendOtp)}
                  className="bg-[#00A651] text-white px-4 py-2 rounded-md w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? 'Processing...'
                    : otpSent
                    ? 'Verify OTP'
                    : 'Send OTP'}
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 - NID Verification */}
          {step === 2 && (
            <>
              {/* Loading Overlay */}
              {isVerifyingNid && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-[#00A651] mb-4"></div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">NID Data Verifying</h3>
                      <p className="text-gray-600 text-center">Please Wait...</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Success Overlay */}
              {nidVerified && !isVerifyingNid && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                    <div className="flex flex-col items-center">
                      <div className="bg-green-500 rounded-full p-4 mb-4">
                        <svg
                          className="w-16 h-16 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <h3 className="text-3xl font-bold text-green-600 mb-2 text-center">NID Verification Successful</h3>
                      <p className="text-gray-600 text-center">
                        Your National ID has been successfully verified!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Failure Overlay */}
              {nidVerificationFailed && !isVerifyingNid && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
                    <div className="flex flex-col items-center">
                      <div className="bg-red-500 rounded-full p-4 mb-4">
                        <svg
                          className="w-16 h-16 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="3"
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </div>
                      <h3 className="text-3xl font-bold text-red-600 mb-2">NID Verification Failed</h3>
                      <p className="text-gray-600 text-center mb-6">
                        Voter data mismatch. Please provide correct data.
                      </p>
                      <button
                        onClick={() => setNidVerificationFailed(false)}
                        className="bg-[#00A651] text-white px-6 py-2 rounded-md hover:bg-[#008f44] transition"
                      >
                        Try Again
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <form
                onSubmit={personalInfoForm.handleSubmit(handlePersonalInfoSubmit)}
                className="space-y-6"
              >
              <div className="max-w-2xl mx-auto px-4">
                <div className="space-y-4">
                  <div>
                    <label className="block text-black font-medium mb-1">
                      Full Name (as shown on your National ID)
                    </label>
                    <Controller
                      name="fullName"
                      control={personalInfoForm.control}
                      rules={{ required: 'Full name is required' }}
                      render={({ field, fieldState }) => (
                        <>
                          <input
                            type="text"
                            {...field}
                            placeholder="Enter your full name as shown on NID"
                            className={`w-full px-3 py-2 border ${
                              fieldState.error
                                ? 'border-red-500'
                                : 'border-gray-300'
                            } rounded-md text-black`}
                          />
                          {fieldState.error && (
                            <p className="text-red-500 text-sm mt-1">
                              {fieldState.error.message}
                            </p>
                          )}
                        </>
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-black font-medium mb-1">
                      Date of Birth
                    </label>
                    <Controller
                      name="dateOfBirth"
                      control={personalInfoForm.control}
                      rules={{ required: 'Date of birth is required' }}
                      render={({ field, fieldState }) => (
                        <>
                          <input
                            type="date"
                            {...field}
                            placeholder="YYYY-MM-DD"
                            onKeyDown={(e) => {
                              // Allow typing: numbers, backspace, delete, arrows, tab
                              const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', '-'];
                              if (!allowedKeys.includes(e.key) && !/[0-9]/.test(e.key)) {
                                e.preventDefault();
                              }
                            }}
                            className={`w-full px-3 py-2 border ${
                              fieldState.error
                                ? 'border-red-500'
                                : 'border-gray-300'
                            } rounded-md text-black`}
                          />
                          {fieldState.error && (
                            <p className="text-red-500 text-sm mt-1">
                              {fieldState.error.message}
                            </p>
                          )}
                        </>
                      )}
                    />
                  </div>

                  <div>
                    <label className="block text-black font-medium mb-2">
                      NID Type
                    </label>
                    <Controller
                      name="nidDigitType"
                      control={personalInfoForm.control}
                      render={({ field }) => (
                        <div className="flex gap-6">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              {...field}
                              value="10"
                              checked={field.value === '10'}
                              className="mr-2"
                            />
                            <span className="text-black">10 Digit NID</span>
                          </label>
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="radio"
                              {...field}
                              value="17"
                              checked={field.value === '17'}
                              className="mr-2"
                            />
                            <span className="text-black">17 Digit NID</span>
                          </label>
                        </div>
                      )}
                    />
                    {personalInfoForm.watch('nidDigitType') === '17' && (
                      <p className="text-blue-600 text-sm mt-2">
                        💡 Please add birth year with the NID number to match 17 digits
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-black font-medium mb-1">
                      NID Number
                    </label>
                    <Controller
                      name="nidNumber"
                      control={personalInfoForm.control}
                      rules={{
                        required: 'NID number is required',
                        validate: (value) => {
                          const digitType = personalInfoForm.watch('nidDigitType');
                          if (digitType === '10' && value.length !== 10) {
                            return 'NID must be exactly 10 digits';
                          }
                          if (digitType === '17' && value.length !== 17) {
                            return 'NID must be exactly 17 digits';
                          }
                          if (!/^\d+$/.test(value)) {
                            return 'NID must contain only numbers';
                          }
                          return true;
                        },
                      }}
                      render={({ field, fieldState }) => (
                        <>
                          <input
                            type="text"
                            {...field}
                            placeholder={
                              personalInfoForm.watch('nidDigitType') === '10'
                                ? 'Enter 10-digit NID'
                                : 'Enter 17-digit NID'
                            }
                            maxLength={personalInfoForm.watch('nidDigitType') === '10' ? 10 : 17}
                            className={`w-full px-3 py-2 border ${
                              fieldState.error
                                ? 'border-red-500'
                                : 'border-gray-300'
                            } rounded-md text-black`}
                          />
                          {fieldState.error && (
                            <p className="text-red-500 text-sm mt-1">
                              {fieldState.error.message}
                            </p>
                          )}
                        </>
                      )}
                    />
                  </div>

                  {/* 2-Column Grid for NID Uploads and Passwords */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-black font-medium mb-1">
                        Upload NID (Front Side)
                      </label>
                      <Controller
                        name="identityCardFrontSide"
                        control={personalInfoForm.control}
                        rules={{ required: 'NID front side is required' }}
                        render={({ field: { onChange }, fieldState }) => (
                          <>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) =>
                                onChange(e.target.files?.[0] || null)
                              }
                              className={`w-full px-3 py-2 border ${
                                fieldState.error
                                  ? 'border-red-500'
                                  : 'border-gray-300'
                              } rounded-md text-black`}
                            />
                            {fieldState.error && (
                              <p className="text-red-500 text-sm mt-1">
                                {fieldState.error.message}
                              </p>
                            )}
                          </>
                        )}
                      />
                    </div>

                    <div>
                      <label className="block text-black font-medium mb-1">
                        Upload NID (Back Side)
                      </label>
                      <Controller
                        name="identityCardBackSide"
                        control={personalInfoForm.control}
                        rules={{ required: 'NID back side is required' }}
                        render={({ field: { onChange }, fieldState }) => (
                          <>
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) =>
                                onChange(e.target.files?.[0] || null)
                              }
                              className={`w-full px-3 py-2 border ${
                                fieldState.error
                                  ? 'border-red-500'
                                  : 'border-gray-300'
                              } rounded-md text-black`}
                            />
                            {fieldState.error && (
                              <p className="text-red-500 text-sm mt-1">
                                {fieldState.error.message}
                              </p>
                            )}
                          </>
                        )}
                      />
                    </div>

                    <div>
                      <label className="block text-black font-medium mb-1">
                        Password
                      </label>
                      <Controller
                        name="password"
                        control={personalInfoForm.control}
                        rules={{
                          required: 'Password is required',
                          minLength: {
                            value: 8,
                            message: 'Password must be at least 8 characters',
                          },
                          validate: {
                            hasLowercase: (value) =>
                              /[a-z]/.test(value) ||
                              'Must contain lowercase letter',
                            hasUppercase: (value) =>
                              /[A-Z]/.test(value) ||
                              'Must contain uppercase letter',
                            hasNumber: (value) =>
                              /[0-9]/.test(value) || 'Must contain number',
                          },
                        }}
                        render={({ field, fieldState }) => (
                          <>
                            <div className="relative">
                              <input
                                type={showPassword ? 'text' : 'password'}
                                {...field}
                                className={`w-full px-3 py-2 pr-10 border ${
                                  fieldState.error
                                    ? 'border-red-500'
                                    : 'border-gray-300'
                                } rounded-md text-black`}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              >
                                {showPassword ? (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                )}
                              </button>
                            </div>
                            {fieldState.error && (
                              <p className="text-red-500 text-sm mt-1">
                                {fieldState.error.message}
                              </p>
                            )}
                          </>
                        )}
                      />
                    </div>

                    <div>
                      <label className="block text-black font-medium mb-1">
                        Confirm Password
                      </label>
                      <Controller
                        name="confirmPassword"
                        control={personalInfoForm.control}
                        rules={{
                          required: 'Please confirm your password',
                          validate: (value) =>
                            value === personalInfoForm.watch('password') ||
                            'Passwords do not match',
                        }}
                        render={({ field, fieldState }) => (
                          <>
                            <div className="relative">
                              <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                {...field}
                                className={`w-full px-3 py-2 pr-10 border ${
                                  fieldState.error
                                    ? 'border-red-500'
                                    : 'border-gray-300'
                                } rounded-md text-black`}
                              />
                              <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                              >
                                {showConfirmPassword ? (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                  </svg>
                                ) : (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                )}
                              </button>
                            </div>
                            {fieldState.error && (
                              <p className="text-red-500 text-sm mt-1">
                                {fieldState.error.message}
                              </p>
                            )}
                          </>
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-4 gap-4">
                {!otpVerified && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="bg-gray-300 px-4 py-2 rounded-md w-full"
                  >
                    Back
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!canProceedPersonal || isVerifyingNid || nidVerified}
                  className="bg-[#00A651] text-white px-4 py-2 rounded-md w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {nidVerified ? 'Proceeding to Next Step...' : 'Verify NID & Continue'}
                </button>
              </div>
            </form>
            </>
          )}

          {/* STEP 3 - Other Information */}
          {step === 3 && (
            <form
              onSubmit={otherInfoForm.handleSubmit(handleOtherInfoSubmit)}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-black font-medium mb-1">
                    Address
                  </label>
                  <Controller
                    name="address1"
                    control={otherInfoForm.control}
                    rules={{ required: 'Address is required' }}
                    render={({ field, fieldState }) => (
                      <>
                        <input
                          type="text"
                          {...field}
                          className={`w-full px-3 py-2 border ${
                            fieldState.error
                              ? 'border-red-500'
                              : 'border-gray-300'
                          } rounded-md text-black`}
                        />
                        {fieldState.error && (
                          <p className="text-red-500 text-sm mt-1">
                            {fieldState.error.message}
                          </p>
                        )}
                      </>
                    )}
                  />
                </div>


                <div>
                  <label className="block text-black font-medium mb-1">
                    City
                  </label>
                  <Controller
                    name="city"
                    control={otherInfoForm.control}
                    rules={{ required: 'City is required' }}
                    render={({ field, fieldState }) => (
                      <>
                        <input
                          type="text"
                          {...field}
                          className={`w-full px-3 py-2 border ${
                            fieldState.error
                              ? 'border-red-500'
                              : 'border-gray-300'
                          } rounded-md text-black`}
                        />
                        {fieldState.error && (
                          <p className="text-red-500 text-sm mt-1">
                            {fieldState.error.message}
                          </p>
                        )}
                      </>
                    )}
                  />
                </div>

                <div>
                  <label className="block text-black font-medium mb-1">
                    Postal Code
                  </label>
                  <Controller
                    name="postalCode"
                    control={otherInfoForm.control}
                    rules={{ required: 'Postal code is required' }}
                    render={({ field, fieldState }) => (
                      <>
                        <input
                          type="text"
                          {...field}
                          className={`w-full px-3 py-2 border ${
                            fieldState.error
                              ? 'border-red-500'
                              : 'border-gray-300'
                          } rounded-md text-black`}
                        />
                        {fieldState.error && (
                          <p className="text-red-500 text-sm mt-1">
                            {fieldState.error.message}
                          </p>
                        )}
                      </>
                    )}
                  />
                </div>

                <div>
                  <label className="block text-black font-medium mb-1">
                    Country
                  </label>
                  <Controller
                    name="country"
                    control={otherInfoForm.control}
                    rules={{ required: 'Country is required' }}
                    render={({ field, fieldState }) => (
                      <>
                        <select
                          {...field}
                          className={`w-full px-3 py-2 border ${
                            fieldState.error
                              ? 'border-red-500'
                              : 'border-gray-300'
                          } rounded-md text-black`}
                        >
                          <option value="">Select Country</option>
                          {countries.map((country) => (
                            <option key={country.code} value={country.code}>
                              {country.name}
                            </option>
                          ))}
                        </select>
                        {fieldState.error && (
                          <p className="text-red-500 text-sm mt-1">
                            {fieldState.error.message}
                          </p>
                        )}
                      </>
                    )}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-black font-medium mb-1">
                    Trade License Number
                  </label>
                  <Controller
                    name="tradeLicenseNumber"
                    control={otherInfoForm.control}
                    rules={{ required: 'Trade license number is required' }}
                    render={({ field, fieldState }) => (
                      <>
                        <input
                          type="text"
                          {...field}
                          className={`w-full px-3 py-2 border ${
                            fieldState.error
                              ? 'border-red-500'
                              : 'border-gray-300'
                          } rounded-md text-black`}
                        />
                        {fieldState.error && (
                          <p className="text-red-500 text-sm mt-1">
                            {fieldState.error.message}
                          </p>
                        )}
                      </>
                    )}
                  />
                </div>

                <div>
                  <label className="block text-black font-medium mb-1">
                    Upload Trade License
                  </label>
                  <Controller
                    name="tradeLicenseFile"
                    control={otherInfoForm.control}
                    rules={{ required: 'Trade license file is required' }}
                    render={({ field: { onChange }, fieldState }) => (
                      <>
                        <input
                          type="file"
                          onChange={(e) =>
                            onChange(e.target.files?.[0] || null)
                          }
                          className={`w-full px-3 py-2 border ${
                            fieldState.error
                              ? 'border-red-500'
                              : 'border-gray-300'
                          } rounded-md text-black`}
                        />
                        {fieldState.error && (
                          <p className="text-red-500 text-sm mt-1">
                            {fieldState.error.message}
                          </p>
                        )}
                      </>
                    )}
                  />
                </div>

                <div>
                  <label className="block text-black font-medium mb-1">
                    TIN Number
                  </label>
                  <Controller
                    name="tinNumber"
                    control={otherInfoForm.control}
                    rules={{ required: 'TIN number is required' }}
                    render={({ field, fieldState }) => (
                      <>
                        <input
                          type="text"
                          {...field}
                          className={`w-full px-3 py-2 border ${
                            fieldState.error
                              ? 'border-red-500'
                              : 'border-gray-300'
                          } rounded-md text-black`}
                        />
                        {fieldState.error && (
                          <p className="text-red-500 text-sm mt-1">
                            {fieldState.error.message}
                          </p>
                        )}
                      </>
                    )}
                  />
                </div>

                <div>
                  <label className="block text-black font-medium mb-1">
                    Upload TIN
                  </label>
                  <Controller
                    name="tinFile"
                    control={otherInfoForm.control}
                    rules={{ required: 'TIN file is required' }}
                    render={({ field: { onChange }, fieldState }) => (
                      <>
                        <input
                          type="file"
                          onChange={(e) =>
                            onChange(e.target.files?.[0] || null)
                          }
                          className={`w-full px-3 py-2 border ${
                            fieldState.error
                              ? 'border-red-500'
                              : 'border-gray-300'
                          } rounded-md text-black`}
                        />
                        {fieldState.error && (
                          <p className="text-red-500 text-sm mt-1">
                            {fieldState.error.message}
                          </p>
                        )}
                      </>
                    )}
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-black font-medium mb-1">
                    Upload BIN Certificate
                  </label>
                  <Controller
                    name="bincertificate"
                    control={otherInfoForm.control}
                    rules={{ required: 'BIN Certificate is required' }}
                    render={({ field: { onChange }, fieldState }) => (
                      <>
                        <input
                          type="file"
                          onChange={(e) =>
                            onChange(e.target.files?.[0] || null)
                          }
                          className={`w-full px-3 py-2 border ${
                            fieldState.error
                              ? 'border-red-500'
                              : 'border-gray-300'
                          } rounded-md text-black`}
                        />
                        {fieldState.error && (
                          <p className="text-red-500 text-sm mt-1">
                            {fieldState.error.message}
                          </p>
                        )}
                      </>
                    )}
                  />
                </div>

                <div>
                  <label className="block text-black font-medium mb-1">
                    Tax Return Date
                  </label>
                  <Controller
                    name="taxReturnDate"
                    control={otherInfoForm.control}
                    rules={{ required: 'Tax return date is required' }}
                    render={({ field, fieldState }) => (
                      <>
                        <input
                          type="date"
                          {...field}
                          className={`w-full px-3 py-2 border ${
                            fieldState.error
                              ? 'border-red-500'
                              : 'border-gray-300'
                          } rounded-md text-black`}
                        />
                        {fieldState.error && (
                          <p className="text-red-500 text-sm mt-1">
                            {fieldState.error.message}
                          </p>
                        )}
                      </>
                    )}
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-black font-medium mb-1">
                    Upload Last Tax Return (Optional)
                  </label>
                  <Controller
                    name="taxReturnFile"
                    control={otherInfoForm.control}
                    render={({ field: { onChange }, fieldState }) => (
                      <>
                        <input
                          type="file"
                          onChange={(e) =>
                            onChange(e.target.files?.[0] || null)
                          }
                          className={`w-full px-3 py-2 border ${
                            fieldState.error
                              ? 'border-red-500'
                              : 'border-gray-300'
                          } rounded-md text-black`}
                        />
                        {fieldState.error && (
                          <p className="text-red-500 text-sm mt-1">
                            {fieldState.error.message}
                          </p>
                        )}
                      </>
                    )}
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-black font-medium mb-1">
                    Upload Joint Stock Registration Documents (Optional)
                  </label>
                  <Controller
                    name="jointStockFile"
                    control={otherInfoForm.control}
                    render={({ field: { onChange } }) => (
                      <input
                        type="file"
                        onChange={(e) => onChange(e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                      />
                    )}
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-black font-medium mb-1">
                    Upload BTRC Registration (Optional)
                  </label>
                  <Controller
                    name="btrcFile"
                    control={otherInfoForm.control}
                    render={({ field: { onChange } }) => (
                      <input
                        type="file"
                        onChange={(e) => onChange(e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                      />
                    )}
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-black font-medium mb-1">
                    Upload Photo (Optional)
                  </label>
                  <Controller
                    name="photoFile"
                    control={otherInfoForm.control}
                    render={({ field: { onChange } }) => (
                      <input
                        type="file"
                        onChange={(e) => onChange(e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                      />
                    )}
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-black font-medium mb-1">
                    Upload SLA (Optional)
                  </label>
                  <Controller
                    name="slaFile"
                    control={otherInfoForm.control}
                    render={({ field: { onChange } }) => (
                      <input
                        type="file"
                        onChange={(e) => onChange(e.target.files?.[0] || null)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-black"
                      />
                    )}
                  />
                </div>
              </div>

              <Controller
                name="termsAccepted"
                control={otherInfoForm.control}
                rules={{ required: 'You must accept the terms and conditions' }}
                render={({ field, fieldState }) => (
                  <>
                    <label className="flex items-center mt-4">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        className="mr-2 text-black"
                      />
                      <span className="text-black">Check our </span>
                      <span className="text-[#00A651] ml-1 cursor-pointer">
                        terms &amp; conditions
                      </span>
                    </label>
                    {fieldState.error && (
                      <p className="text-red-500 text-sm mt-1">
                        {fieldState.error.message}
                      </p>
                    )}
                  </>
                )}
              />

              <div className="flex justify-between pt-4 gap-4">
                {!nidVerified && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="bg-gray-300 px-4 py-2 rounded-md w-full"
                  >
                    Back
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isSubmitting || !otherInfoForm.formState.isValid}
                  className="bg-[#00A651] text-white px-4 py-2 rounded-md w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Processing...' : 'Complete Registration'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
