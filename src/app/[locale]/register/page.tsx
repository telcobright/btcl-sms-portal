'use client';
import { Header } from '@/components/layout/Header';
import { loginUser, setAuthToken } from '@/lib/api-client/auth';
import {
  addPartnerDetails,
  createPartner,
  loginPartner,
  rollbackRegistration,
  sendOtp,
  verifyOtp,
  sendEmailOtp,
  verifyEmailOtp,
} from '@/lib/api-client/partner';
import { extractNidData, NidOcrResult } from '@/lib/nid-ocr';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Controller, SubmitHandler, useForm, useWatch } from 'react-hook-form';
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
  emailOtp: string;
  phoneOtp: string;
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
  customerType: 'prepaid' | 'postpaid';
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
  // Email OTP states
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpVerified, setEmailOtpVerified] = useState(false);
  // Phone OTP states
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtpVerified, setPhoneOtpVerified] = useState(false);
  // Legacy states for compatibility
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
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  // Track sub-steps in final registration to allow retry on partial failure
  const [createdPartnerId, setCreatedPartnerId] = useState<number | null>(null);
  const [partnerJwtToken, setPartnerJwtToken] = useState<string | null>(null);
  // OCR states
  const [isExtractingOcr, setIsExtractingOcr] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrResult, setOcrResult] = useState<NidOcrResult | null>(null);
  const [nidExtractedFromOcr, setNidExtractedFromOcr] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const router = useRouter();
  const { checkAuth } = useAuth();

  // Form hooks for each step
  const verificationForm = useForm<VerificationInfo>({
    mode: 'onChange',
    defaultValues: {
      companyName: '',
      email: '',
      phone: '',
      emailOtp: '',
      phoneOtp: '',
    },
  });

  const personalInfoForm = useForm<PersonalInfo>({
    mode: 'onChange',
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
    mode: 'onChange',
    defaultValues: {
      customerType: 'prepaid',
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

  // Watch specific form fields
  const watchedNidDigitType = useWatch({ control: personalInfoForm.control, name: 'nidDigitType' });
  const watchedNidFrontSide = useWatch({ control: personalInfoForm.control, name: 'identityCardFrontSide' });
  const watchedCustomerType = useWatch({ control: otherInfoForm.control, name: 'customerType' });
  const isNidFrontUploaded = !!watchedNidFrontSide;

  // Rollback on page close/refresh and warn user if partner was partially created
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (createdPartnerId && !showSuccessPopup) {
        // Fire rollback via beacon API (works even when page is closing)
        const payload = JSON.stringify({ idPartner: createdPartnerId, email: verifiedEmail });
        navigator.sendBeacon(
          `${API_BASE_URL}${API_ENDPOINTS.partner.rollbackRegistration}`,
          new Blob([payload], { type: 'application/json' })
        );
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [createdPartnerId, verifiedEmail, showSuccessPopup]);

  // Rollback on component unmount (client-side navigation away)
  useEffect(() => {
    return () => {
      if (createdPartnerId && verifiedEmail && !showSuccessPopup) {
        const payload = JSON.stringify({ idPartner: createdPartnerId, email: verifiedEmail });
        navigator.sendBeacon(
          `${API_BASE_URL}${API_ENDPOINTS.partner.rollbackRegistration}`,
          new Blob([payload], { type: 'application/json' })
        );
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [createdPartnerId, verifiedEmail, showSuccessPopup]);

  // Rollback partially created partner and reset state
  const handleRollbackAndReset = async () => {
    if (createdPartnerId && verifiedEmail) {
      toast.loading('Rolling back registration...', { id: 'rollback' });
      await rollbackRegistration(createdPartnerId, verifiedEmail);
      toast.dismiss('rollback');
      toast.success('Registration cancelled. You can start over.');
    }
    // Reset all state
    setCreatedPartnerId(null);
    setPartnerJwtToken(null);
    setStep(1);
    setEmailOtpSent(false);
    setEmailOtpVerified(false);
    setPhoneOtpSent(false);
    setPhoneOtpVerified(false);
    setOtpSent(false);
    setOtpVerified(false);
    setVerifiedPhone('');
    setVerifiedEmail('');
    setNidVerified(false);
    setNidVerificationFailed(false);
    setNidVerificationData(null);
    setOcrResult(null);
    setNidExtractedFromOcr(false);
    verificationForm.reset();
    personalInfoForm.reset();
    otherInfoForm.reset();
  };

  // Watch verification form fields for Send OTP button
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const subscription = verificationForm.watch(async (value) => {
        if (!emailOtpSent) {
          // For Send Email OTP button — trigger validation then check
          const hasAllFields = !!(value.companyName && value.email && value.phone);
          if (hasAllFields) {
            const valid = await verificationForm.trigger(['companyName', 'email', 'phone']);
            setCanSendOtp(valid);
          } else {
            setCanSendOtp(false);
          }
        } else if (!emailOtpVerified) {
          // For Verify Email OTP button
          const hasEmailOtp = !!(value.emailOtp);
          setCanSendOtp(hasEmailOtp);
        } else if (!phoneOtpVerified) {
          // For Verify Phone OTP button
          const hasPhoneOtp = !!(value.phoneOtp);
          setCanSendOtp(hasPhoneOtp);
        }
      });
      return () => subscription.unsubscribe();
    }
  }, [verificationForm, emailOtpSent, emailOtpVerified, phoneOtpVerified]);

  // Watch personal info form fields for Next Step button
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const subscription = personalInfoForm.watch((value) => {
        const hasAllFields = !!(
          value.fullName &&
          value.dateOfBirth &&
          value.nidNumber &&
          value.identityCardFrontSide &&
          value.identityCardBackSide
        );
        setCanProceedPersonal(hasAllFields);
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
      const isValid = await verificationForm.trigger(['companyName', 'email', 'phone']);
      if (isValid) {
        // Sequential flow: Email OTP first, then Phone OTP
        if (!emailOtpSent) {
          // Step 1a: Send email OTP
          await handleSendEmailOtp();
        } else if (!emailOtpVerified) {
          // Step 1b: Verify email OTP
          await handleVerifyEmailOtp();
        } else if (!phoneOtpSent) {
          // Step 1c: Send phone OTP
          await handleSendPhoneOtp();
        } else if (!phoneOtpVerified) {
          // Step 1d: Verify phone OTP
          await handleVerifyPhoneOtp();
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

  // Send Email OTP (Step 1a)
  const handleSendEmailOtp = async () => {
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
        await new Promise(resolve => setTimeout(resolve, 1000));
        setEmailOtpSent(true);
        setEmailOtpVerified(true);
        setPhoneOtpSent(true);
        setPhoneOtpVerified(true);
        setVerifiedEmail(email);
        setVerifiedPhone(phone);
        setOtpVerified(true);
        toast.success('OTP verification skipped (disabled in config)');
        setStep(2);
        return;
      }

      // Validate partner data first
      console.log('Validating partner data...');
      const validateResponse = await fetch(`${API_BASE_URL}${API_ENDPOINTS.partner.validate}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          partnerName: companyName,
          telephone: phone,
          email: email,
        }),
      });

      const validateData = await validateResponse.json();
      console.log('Validation response:', validateData);

      if (!validateResponse.ok || validateData === false) {
        if (validateData.errorCode === '400 BAD_REQUEST') {
          if (validateData.message === 'Mobile number already exists') {
            verificationForm.setError('phone', { type: 'manual', message: 'Mobile number already exists' });
          } else if (validateData.message === 'Email already exists') {
            verificationForm.setError('email', { type: 'manual', message: 'Email already exists' });
          } else if (validateData.message === 'Partner Name already exists') {
            verificationForm.setError('companyName', { type: 'manual', message: 'Company Name already exists' });
          }
        } else {
          toast.error('Validation failed. Please check your information.');
        }
        setIsSubmitting(false);
        return;
      }

      // Send email OTP
      console.log('Validation successful, sending email OTP...');
      const response = await sendEmailOtp(email, 'registration');
      console.log('Email OTP response:', response);

      if (response.success) {
        setEmailOtpSent(true);
        startTimer(300);
        toast.success('OTP sent to your email successfully!');
      } else {
        if (response.retryAfterSeconds) {
          toast.error(`Please wait ${response.retryAfterSeconds} seconds before requesting another OTP`);
        } else {
          toast.error(response.message || 'Failed to send email OTP');
        }
      }
    } catch (error) {
      console.error('Failed to send email OTP:', error);
      toast.error('Failed to send email OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verify Email OTP (Step 1b)
  const handleVerifyEmailOtp = async () => {
    try {
      setIsSubmitting(true);
      const { email, emailOtp } = verificationForm.getValues();

      const response = await verifyEmailOtp(email, emailOtp);

      if (response.success) {
        console.log('Email OTP verified:', response);
        setEmailOtpVerified(true);
        setVerifiedEmail(email);
        toast.success('Email verified successfully! Now verify your phone.');
        // Automatically send phone OTP
        await handleSendPhoneOtp();
      } else {
        toast.error(response.message || 'Invalid email OTP. Please try again.');
      }
    } catch (error) {
      console.error('Failed to verify email OTP:', error);
      toast.error('Invalid email OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send Phone OTP (Step 1c)
  const handleSendPhoneOtp = async () => {
    try {
      setIsSubmitting(true);
      const phone = verificationForm.getValues('phone');

      console.log('Sending phone OTP...');
      const response = await sendOtp(phone);
      console.log('Phone OTP sent:', response);

      setPhoneOtpSent(true);
      startTimer(300);
      toast.success('OTP sent to your phone successfully!');
    } catch (error) {
      console.error('Failed to send phone OTP:', error);
      toast.error('Failed to send phone OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verify Phone OTP (Step 1d)
  const handleVerifyPhoneOtp = async () => {
    try {
      setIsSubmitting(true);
      const { phone, phoneOtp } = verificationForm.getValues();

      const response = await verifyOtp(phone, phoneOtp);

      // @ts-ignore
      if (response === 'OTP verified successfully.' || response.message === 'OTP verified successfully.') {
        console.log('Phone OTP verified:', response);
        setPhoneOtpVerified(true);
        setVerifiedPhone(phone);
        setOtpVerified(true);
        toast.success('Phone verified successfully!');
        setStep(2);
      } else {
        toast.error('Invalid phone OTP. Please try again.');
      }
    } catch (error) {
      console.error('Failed to verify phone OTP:', error);
      toast.error('Invalid phone OTP. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Resend OTP (for current verification step)
  const resendOtp = async () => {
    try {
      if (!FEATURE_FLAGS.OTP_VERIFICATION_ENABLED) {
        startTimer(300);
        toast.success('OTP resend skipped (disabled in config)');
        return;
      }

      if (!emailOtpVerified) {
        // Resend email OTP
        const email = verificationForm.getValues('email');
        const response = await sendEmailOtp(email, 'registration');
        if (response.success) {
          startTimer(300);
          toast.success('OTP resent to your email!');
        } else {
          toast.error(response.message || 'Failed to resend email OTP');
        }
      } else if (!phoneOtpVerified) {
        // Resend phone OTP
        const phone = verificationForm.getValues('phone');
        await sendOtp(phone);
        startTimer(300);
        toast.success('OTP resent to your phone!');
      }
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

  // Handle NID front side upload and OCR extraction
  const handleNidFrontUpload = async (file: File) => {
    if (!file) return;

    setIsExtractingOcr(true);
    setOcrProgress(0);
    setOcrResult(null);

    try {
      toast.loading('Extracting data from NID...', { id: 'ocr-loading' });

      const result = await extractNidData(file, (progress) => {
        setOcrProgress(progress);
      });

      setOcrResult(result);

      if (result.success && result.data) {
        // Auto-fill form fields with extracted data
        if (result.data.name) {
          personalInfoForm.setValue('fullName', result.data.name, { shouldValidate: true });
          toast.success('Name extracted successfully!');
        }

        if (result.data.nidNumber) {
          personalInfoForm.setValue('nidNumber', result.data.nidNumber, { shouldValidate: true });
          if (result.data.nidDigitType) {
            personalInfoForm.setValue('nidDigitType', result.data.nidDigitType, { shouldValidate: true });
          }
          setNidExtractedFromOcr(true);
          toast.success('NID number extracted successfully!');
        }

        if (result.data.dateOfBirth) {
          personalInfoForm.setValue('dateOfBirth', result.data.dateOfBirth, { shouldValidate: true });
          toast.success('Date of birth extracted successfully!');
        }

        // Overall success message
        const extractedFields = [
          result.data.name && 'Name',
          result.data.nidNumber && 'NID Number',
          result.data.dateOfBirth && 'Date of Birth',
        ].filter(Boolean);

        if (extractedFields.length > 0) {
          toast.dismiss('ocr-loading');
          toast.success(`Extracted: ${extractedFields.join(', ')}`);
        } else {
          toast.dismiss('ocr-loading');
          toast.error('Could not extract data. Please enter manually.');
        }
      } else {
        toast.dismiss('ocr-loading');
        toast.error('Failed to extract data. Please enter manually.');
      }
    } catch (error) {
      console.error('OCR extraction error:', error);
      toast.dismiss('ocr-loading');
      toast.error('OCR extraction failed. Please enter data manually.');
    } finally {
      setIsExtractingOcr(false);
      setOcrProgress(0);
    }
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

      // 2. First call: create partner (skip if already created on a previous attempt)
      let idPartner = createdPartnerId;
      if (!idPartner) {
        console.log('\n🔵 STEP 2: Creating partner account...');
        const customerPrePaidValue = otherInfoData.customerType === 'prepaid' ? 1 : 2;

        const partnerPayload = {
            partnerName: companyName,
            alternateNameOther: personalInfoData.alternateNameOther || fullName,
            alternateNameInvoice: fullName,
            telephone: verifiedPhone,
            email: verifiedEmail,
            userPassword: '11111111',
            address1: otherInfoData.address1,
            address2: otherInfoData.address2 || '',
            city: otherInfoData.city,
            state: otherInfoData.state,
            postalCode: otherInfoData.postalCode,
            country: otherInfoData.country,
            vatRegistrationNo: otherInfoData.tinNumber || 'N/A',
            invoiceAddress: otherInfoData.address1,
            customerPrePaid: customerPrePaidValue,
            partnerType: 3,
            defaultCurrency: 1,
            callSrcId: 2,
        };

        const partnerResponse = await createPartner(partnerPayload);

        idPartner = partnerResponse?.idPartner || partnerResponse?.id || null;
        if (!idPartner) {
          console.error('❌ Partner response:', partnerResponse);
          throw new Error('Partner ID missing in createPartner response');
        }
        setCreatedPartnerId(idPartner);
        console.log('✅ Partner created with ID:', idPartner);
      } else {
        console.log('⏩ Skipping partner creation (already created with ID:', idPartner, ')');
      }

      // 3. Second call: login to get JWT token (skip if already obtained)
      let jwtToken = partnerJwtToken;
      if (!jwtToken) {
        console.log('\n🔵 STEP 3: Logging in to get JWT token...');

        const loginResponse = await loginPartner(
          verifiedEmail,
          '11111111'
        );

        jwtToken = loginResponse.token;
        if (!jwtToken) {
          console.error('❌ Login response:', loginResponse);
          throw new Error('JWT token missing in login response');
        }
        setPartnerJwtToken(jwtToken);
        console.log('✅ JWT token received:', jwtToken.substring(0, 50) + '...');

        // Small delay to ensure token is propagated
        console.log('⏳ Waiting 2 seconds for token to be active...');
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } else {
        console.log('⏩ Skipping login (JWT token already obtained)');
      }

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
          password: '11111111',
        });

        // Extract partner ID
        const partnerId =
          appLoginResponse.idPartner || appLoginResponse.partnerId || idPartner;

        setAuthToken(appLoginResponse.token);
        localStorage.setItem('userEmail', verifiedEmail);
        localStorage.setItem('userPassword', '11111111');
        localStorage.setItem('partnerId', partnerId.toString()); // CRITICAL

        // Clean up company name from localStorage after successful registration
        localStorage.removeItem('companyName');

        checkAuth();

        // Store customer type for routing after popup
        const customerType = otherInfoData.customerType;
        localStorage.setItem('customerType', customerType);

        toast.success(
          'Registration completed successfully!'
        );
        console.log('✅ Registration complete! Showing success popup...');
        console.log('📋 Customer type:', customerType);
        setShowSuccessPopup(true);
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
      // Rollback the partially created partner so the user can retry from scratch
      if (createdPartnerId && verifiedEmail) {
        console.log('🔄 Rolling back partially created partner...');
        await rollbackRegistration(createdPartnerId, verifiedEmail);
        setCreatedPartnerId(null);
        setPartnerJwtToken(null);
      }
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

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 shadow-xl">
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
              <h3 className="text-2xl font-bold text-green-600 mb-2 text-center">
                Registration Successful!
              </h3>
              <p className="text-gray-700 text-center mb-2 font-medium">
                Credentials has been sent to email.
              </p>
              <p className="text-gray-600 text-center mb-4">
                Please check your email.
              </p>
              {otherInfoForm.getValues('customerType') === 'postpaid' && (
                <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4 w-full">
                  <p className="text-blue-800 text-sm text-center">
                    <strong>Note:</strong> Your postpaid account is under review. Our team will verify your documents within 24-48 business hours.
                  </p>
                </div>
              )}
              <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mb-6 w-full">
                <p className="text-amber-800 text-sm text-center">
                  <strong>Important:</strong> Please change your default password after logging in for security.
                </p>
              </div>
              <button
                onClick={() => {
                  const customerType = localStorage.getItem('customerType');
                  // Prepaid customers go to dashboard, postpaid go to pending page
                  if (customerType === 'prepaid') {
                    router.push(`/${locale}/dashboard`);
                  } else {
                    router.push(`/${locale}/postpaid-pending`);
                  }
                  // Clean up
                  localStorage.removeItem('customerType');
                }}
                className="bg-[#00A651] text-white px-6 py-3 rounded-md hover:bg-[#008f44] transition w-full font-medium"
              >
                {otherInfoForm.getValues('customerType') === 'prepaid' ? 'Go to Dashboard' : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-gray-50 py-10">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md p-8">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-black">
              {step === 1 && 'Verify Your Email & Phone'}
              {step === 2 && 'Verify Your NID'}
              {step === 3 && 'Upload Your Documents and Additional Data'}
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
                  Company Name
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
                        placeholder="Enter company name"
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
                  Mobile Number
                </label>
                <Controller
                  name="phone"
                  control={verificationForm.control}
                  rules={{
                    required: 'Mobile number is required',
                    pattern: {
                      value: /^\+8801[3-9]\d{8}$/,
                      message:
                        'Must be a valid Bangladeshi Mobile number (+8801XXXXXXXXX)',
                    },
                  }}
                  render={({ field, fieldState }) => (
                    <>
                      <input
                        type="tel"
                        {...field}
                        placeholder="+880 1XXXXXXXXX"
                        disabled={emailOtpSent}
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
                          // If starts with 1 and length suggests it's a Mobile number, add +880
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
                          emailOtpSent ? 'bg-gray-100' : ''
                        }`}
                      />
                      {fieldState.error && (
                        <p className="text-red-500 text-sm mt-1">
                          {fieldState.error.message}
                        </p>
                      )}
                      {!fieldState.error && !emailOtpSent && (
                        <p className="text-gray-500 text-sm mt-1">
                          Enter as: +8801XXXXXXXXX, 8801XXXXXXXXX, or 01XXXXXXXXX
                        </p>
                      )}
                    </>
                  )}
                />
              </div>

              {/* Email OTP Section */}
              {emailOtpSent && !emailOtpVerified && (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                    <p className="text-blue-800 text-sm">
                      <strong>Step 1 of 2:</strong> Verify your email address
                    </p>
                  </div>
                  <div>
                    <label className="block text-black font-medium mb-1">
                      Email Verification Code (Check your email inbox)
                    </label>
                    <Controller
                      name="emailOtp"
                      control={verificationForm.control}
                      rules={{
                        required: 'Email OTP is required',
                        pattern: {
                          value: /^\d{6}$/,
                          message: 'OTP must be 6 digits',
                        },
                      }}
                      render={({ field, fieldState }) => (
                        <>
                          <input
                            type="text"
                            {...field}
                            placeholder="Enter 6-digit code from email"
                            maxLength={6}
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
                      <button type="button" onClick={resendOtp} className="text-blue-600 hover:underline">
                        Resend Email OTP
                      </button>
                    )}
                  </div>
                </>
              )}

              {/* Email Verified Badge */}
              {emailOtpVerified && (
                <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-md p-3">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-800 font-medium">Email Verified</span>
                </div>
              )}

              {/* Phone OTP Section */}
              {phoneOtpSent && !phoneOtpVerified && (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                    <p className="text-blue-800 text-sm">
                      <strong>Step 2 of 2:</strong> Verify your Mobile number
                    </p>
                  </div>
                  <div>
                    <label className="block text-black font-medium mb-1">
                      Phone Verification Code (Check your SMS)
                    </label>
                    <Controller
                      name="phoneOtp"
                      control={verificationForm.control}
                      rules={{
                        required: 'Phone OTP is required',
                        pattern: {
                          value: /^\d{6}$/,
                          message: 'OTP must be 6 digits',
                        },
                      }}
                      render={({ field, fieldState }) => (
                        <>
                          <input
                            type="text"
                            {...field}
                            placeholder="Enter 6-digit code from SMS"
                            maxLength={6}
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
                      <button type="button" onClick={resendOtp} className="text-blue-600 hover:underline">
                        Resend Phone OTP
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
                  disabled={isSubmitting || (!emailOtpSent && !canSendOtp)}
                  className="bg-[#00A651] text-white px-4 py-2 rounded-md w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? 'Processing...'
                    : !emailOtpSent
                    ? 'Send Email OTP'
                    : !emailOtpVerified
                    ? 'Verify Email'
                    : !phoneOtpVerified
                    ? 'Verify Phone'
                    : 'Continue'}
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
                  {/* NID Upload Section - Must be uploaded first */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-black font-medium mb-1">
                        Upload NID (Front Side) <span className="text-red-500">*</span>
                      </label>
                      <Controller
                        name="identityCardFrontSide"
                        control={personalInfoForm.control}
                        rules={{ required: 'NID front side is required' }}
                        render={({ field: { onChange }, fieldState }) => (
                          <>
                            <input
                              type="file"
                              accept="image/*"
                              disabled={isExtractingOcr}
                              onChange={(e) => {
                                const file = e.target.files?.[0] || null;
                                onChange(file);
                                // Trigger OCR extraction for image files
                                if (file && file.type.startsWith('image/')) {
                                  handleNidFrontUpload(file);
                                }
                              }}
                              className={`w-full px-3 py-2 border ${
                                fieldState.error
                                  ? 'border-red-500'
                                  : 'border-gray-300'
                              } rounded-md text-black ${isExtractingOcr ? 'opacity-50' : ''}`}
                            />
                            {isExtractingOcr && (
                              <div className="mt-2">
                                <div className="flex items-center gap-2">
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#00A651]"></div>
                                  <span className="text-sm text-gray-600">
                                    Extracting data... {ocrProgress}%
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                  <div
                                    className="bg-[#00A651] h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${ocrProgress}%` }}
                                  ></div>
                                </div>
                              </div>
                            )}
                            {!isExtractingOcr && !fieldState.error && (
                              <div className="mt-1 space-y-1">
                                <p className="text-blue-600 text-xs">
                                  Upload NID image to auto-fill Name, NID Number & DOB
                                </p>
                                <p className="text-gray-500 text-xs">
                                  Accepted: JPG, PNG, JPEG (Max 5MB). Clear, well-lit photo recommended.
                                </p>
                              </div>
                            )}
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
                        Upload NID (Back Side) <span className="text-red-500">*</span>
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
                  </div>

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
                            disabled={!isNidFrontUploaded}
                            placeholder={isNidFrontUploaded ? "Enter your full name as shown on NID" : "Please upload NID Front Side first"}
                            className={`w-full px-3 py-2 border ${
                              fieldState.error
                                ? 'border-red-500'
                                : 'border-gray-300'
                            } rounded-md text-black disabled:bg-gray-100 disabled:cursor-not-allowed`}
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
                            disabled={!isNidFrontUploaded}
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
                            } rounded-md text-black disabled:bg-gray-100 disabled:cursor-not-allowed`}
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
                        <div className={`flex gap-6 ${!isNidFrontUploaded ? 'opacity-50' : ''}`}>
                          <label className={`flex items-center ${isNidFrontUploaded ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                            <input
                              type="radio"
                              {...field}
                              value="10"
                              checked={field.value === '10'}
                              disabled={!isNidFrontUploaded}
                              className="mr-2"
                            />
                            <span className="text-black">10 Digit NID</span>
                          </label>
                          <label className={`flex items-center ${isNidFrontUploaded ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                            <input
                              type="radio"
                              {...field}
                              value="17"
                              checked={field.value === '17'}
                              disabled={!isNidFrontUploaded}
                              className="mr-2"
                            />
                            <span className="text-black">17 Digit NID</span>
                          </label>
                        </div>
                      )}
                    />
                    {watchedNidDigitType === '17' && (
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
                        validate: async (value) => {
                          const digitType = watchedNidDigitType;
                          if (digitType === '10' && value.length !== 10) {
                            return 'NID must be exactly 10 digits';
                          }
                          if (digitType === '17' && value.length !== 17) {
                            return 'NID must be exactly 17 digits';
                          }
                          if (!/^\d+$/.test(value)) {
                            return 'NID must contain only numbers';
                          }
                          // Check NID uniqueness when length is valid
                          try {
                            const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.nid.checkNid}`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ nid: value }),
                            });
                            const data = await res.json();
                            if (data.exists) {
                              return 'This NID is already registered';
                            }
                          } catch {
                            // If check fails, allow to proceed
                          }
                          return true;
                        },
                      }}
                      render={({ field, fieldState }) => (
                        <>
                          <input
                            type="text"
                            {...field}
                            disabled={!isNidFrontUploaded}
                            placeholder={
                              !isNidFrontUploaded
                                ? 'Please upload NID Front Side first'
                                : watchedNidDigitType === '10'
                                ? 'Enter 10-digit NID'
                                : 'Enter 17-digit NID'
                            }
                            maxLength={watchedNidDigitType === '10' ? 10 : 17}
                            className={`w-full px-3 py-2 border ${
                              fieldState.error
                                ? 'border-red-500'
                                : nidExtractedFromOcr
                                ? 'border-green-500 bg-green-50'
                                : 'border-gray-300'
                            } rounded-md text-black disabled:bg-gray-100 disabled:cursor-not-allowed`}
                          />
                          {nidExtractedFromOcr && (
                            <p className="text-green-600 text-sm mt-1">
                              NID extracted from uploaded image (you can edit if needed)
                            </p>
                          )}
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
              {/* Customer Type Selection */}
              <div className="mb-6">
                <label className="block text-black font-medium mb-2">
                  Customer Type
                </label>
                <Controller
                  name="customerType"
                  control={otherInfoForm.control}
                  render={({ field }) => (
                    <div className="flex gap-6">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="radio"
                          {...field}
                          value="prepaid"
                          checked={field.value === 'prepaid'}
                          onChange={() => field.onChange('prepaid')}
                          className="mr-2"
                        />
                        <span className="text-black">Prepaid</span>
                      </label>
                      <label className={`flex items-center ${FEATURE_FLAGS.POSTPAID_ENABLED ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'}`}>
                        <input
                          type="radio"
                          {...field}
                          value="postpaid"
                          checked={field.value === 'postpaid'}
                          onChange={() => field.onChange('postpaid')}
                          disabled={!FEATURE_FLAGS.POSTPAID_ENABLED}
                          className="mr-2"
                        />
                        <span className={FEATURE_FLAGS.POSTPAID_ENABLED ? 'text-black' : 'text-gray-500'}>Postpaid</span>
                        {!FEATURE_FLAGS.POSTPAID_ENABLED && (
                          <span className="ml-2 text-xs text-gray-400 italic">(Coming soon)</span>
                        )}
                      </label>
                    </div>
                  )}
                />
                {/* Eligibility & T&C Note for Postpaid */}
                {watchedCustomerType === 'postpaid' && (
                  <div className="mt-3 space-y-2">
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                      <p className="text-red-800 text-sm">
                        <strong>Eligibility:</strong> Postpaid option is only applicable for Government / Semi-Government / Autonomous Organisations.
                      </p>
                    </div>
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-md">
                      <p className="text-amber-800 text-sm">
                        <strong>Note:</strong> T&C applies to postpaid customers. Postpaid billing is applicable only for Hosted PBX purchases. All other services will remain prepaid.
                      </p>
                    </div>
                  </div>
                )}
              </div>

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
                <button
                  type="button"
                  onClick={handleRollbackAndReset}
                  disabled={isSubmitting}
                  className="bg-red-500 text-white px-4 py-2 rounded-md w-full disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel Registration
                </button>
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
