'use client';

import CheckoutModal from '@/components/checkout/CheckoutModal';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import SlabPricingSection from '@/components/pricing/SlabPricingSection';
import { AggregatorTag } from '@/components/ui/AggregatorTag';
import { Button } from '@/components/ui/Button';
import {
  API_BASE_URL,
  API_ENDPOINTS,
  FEATURE_FLAGS,
  HCC_BASE_URL,
  PBX_BASE_URL,
  VBS_BASE_URL,
} from '@/config/api';
import { jwtDecode } from 'jwt-decode';
import {
  getServiceEligibility,
  type ServiceEligibilityState,
} from '@/lib/api-client/admin';
import { getServicePricing } from '@/lib/api-client/servicePricing';
import {
  maxBuyableQuantity,
  quote,
  slabName,
  type Quote,
  type ServicePricing,
  type ServicePricingMap,
} from '@/lib/servicePricing';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

interface DecodedToken {
  idPartner?: number;
  email?: string;
  sub?: string;
  roles?: { name: string }[];
}

const PricingPage = ({ params }: { params: Promise<{ locale: string }> }) => {
  const [selectedService, setSelectedService] = useState('hosted-pbx');
  const [locale, setLocale] = React.useState('en');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [userType, setUserType] = useState<'prepaid' | 'postpaid' | null>(null);
  const [isLoadingUserType, setIsLoadingUserType] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  // activePackages maps service → active pkg id string (e.g. 'hosted-pbx' → 'silver')
  const [activePackages, setActivePackages] = useState<
    Record<string, string | null>
  >({});
  // expiredPackages maps service → expired pkg id string
  const [expiredPackages, setExpiredPackages] = useState<
    Record<string, string | null>
  >({});
  const [purchaseBlocked, setPurchaseBlocked] = useState(false);
  // Bulk SMS carries a second gate: every mandatory document approved plus an approved
  // BTRC aggregator licence. Null means not yet known — treated as not eligible, since
  // offering Buy on a failed check only leads to a refusal later.
  const [smsEligibility, setSmsEligibility] = useState<ServiceEligibilityState | null>(null);
  const [docBlockReason, setDocBlockReason] = useState<
    'pending' | 'rejected' | null
  >(null);
  // PBX pre-purchase notice (IP-phones / IP whitelisting)
  const [pbxNoticeOpen, setPbxNoticeOpen] = useState(false);
  const [pbxPendingPkg, setPbxPendingPkg] = useState<{
    pkg: any;
    mode: 'buy' | 'apply';
  } | null>(null);
  const router = useRouter();

  // Package tier order per service (higher number = higher tier)
  const packageTierOrder: Record<string, Record<string, number>> = {
    'hosted-pbx': { starter: 1, economy: 2, bronze: 3, silver: 4, gold: 5 },
    'voice-broadcast': { basic: 1, standard: 2, enterprise: 3 },
    'contact-center': { basic: 1 },
  };

  // Maps packageId integer → pkg.id string used in pricing cards
  const packageIdToSlug: Record<number, string> = {
    9142: 'starter',
    9143: 'economy',
    9132: 'bronze',
    9133: 'silver',
    9134: 'gold',
    9135: 'basic',
    9136: 'standard',
    9137: 'enterprise',
    9140: 'basic',
  };

  const serviceBaseUrls: Record<string, string> = {
    'hosted-pbx': PBX_BASE_URL,
    'voice-broadcast': VBS_BASE_URL,
    'contact-center': HCC_BASE_URL,
  };

  const isLoggedIn = () => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('authToken');
    }
    return false;
  };

  // Fetch user type from API by decoding JWT token
  useEffect(() => {
    const fetchUserType = async () => {
      if (typeof window === 'undefined') {
        setIsLoadingUserType(false);
        return;
      }

      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        setIsLoadingUserType(false);
        return;
      }

      try {
        // Decode JWT token to get idPartner and roles
        const decodedToken = jwtDecode<DecodedToken>(authToken);
        const idPartner = decodedToken?.idPartner;

        // Check for ROLE_ADMIN
        const adminRole = decodedToken.roles?.some(
          (role) => role.name === 'ROLE_ADMIN'
        );
        if (adminRole) {
          setIsAdmin(true);
          // Admins are not blocked by doc validation
          setPurchaseBlocked(false);
        }

        if (!idPartner) {
          setIsLoadingUserType(false);
          return;
        }

        // Whether this partner may buy at all is decided by the server, per customer
        // category: a private individual has no trade licence or TIN to approve, so a
        // fixed list of four documents here would show them "under review" forever.
        if (!adminRole) {
          const eligibility = await getServiceEligibility(idPartner, authToken);
          if (eligibility) {
            setSmsEligibility(eligibility.sms);
            if (eligibility.rejected.length > 0) {
              setPurchaseBlocked(true);
              setDocBlockReason('rejected');
            } else if (!eligibility.mandatoryApproved) {
              setPurchaseBlocked(true);
              setDocBlockReason('pending');
            } else {
              setPurchaseBlocked(false);
              setDocBlockReason(null);
            }
          }
        }

        const response = await fetch(
          `${API_BASE_URL}${API_ENDPOINTS.partner.getPartner}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ idPartner }),
          }
        );

        if (response.ok) {
          const data = await response.json();
          // customerPrePaid: 1 = prepaid, 2 = postpaid
          if (data.customerPrePaid === 1) {
            setUserType('prepaid');
          } else if (data.customerPrePaid === 2) {
            setUserType('postpaid');
          }
        } else {
          console.error('Failed to fetch partner data:', response.status);
        }
      } catch (e) {
        console.error('Error fetching partner data:', e);
      } finally {
        setIsLoadingUserType(false);
      }
    };

    const fetchActivePackages = async () => {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) return;

      try {
        const decodedToken = jwtDecode<DecodedToken>(authToken);
        const idPartner = decodedToken?.idPartner;
        if (!idPartner) return;

        const services = ['hosted-pbx', 'voice-broadcast', 'contact-center'];
        const results = await Promise.allSettled(
          services.map(async (service) => {
            const baseUrl = serviceBaseUrls[service];

            // Step 1: Check for active package via getPurchaseForPartner
            const activeRes = await fetch(
              `${baseUrl}${API_ENDPOINTS.package.getPurchaseForPartner}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({ idPartner }),
              }
            );
            if (activeRes.ok) {
              const data = await activeRes.json();
              const purchases = Array.isArray(data)
                ? data
                : (data?.content ?? data?.data ?? []);
              // Only subscription PLANS decide active/expired here — a partner's
              // TopUp / TF_min / Mint / Postpaid_Credit are ACTIVE-and-valid but
              // are NOT the plan, so they must not count (otherwise an expired
              // Bronze looks "active" because TF_min is still valid).
              const active = purchases.find(
                (p: any) =>
                  p.idPackage &&
                  packageIdToSlug[p.idPackage] &&
                  p.status === 'ACTIVE' &&
                  (!p.expireDate || new Date(p.expireDate) > new Date())
              );
              if (active) {
                return {
                  service,
                  slug: packageIdToSlug[active.idPackage] ?? null,
                  expiredSlug: null,
                };
              }
            }

            // Step 2: No active package — check purchase history for expired packages
            const historyRes = await fetch(
              `${baseUrl}${API_ENDPOINTS.package.getAllPurchasePartnerWise}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${authToken}`,
                },
                body: JSON.stringify({ page: 0, size: 20, idPartner }),
              }
            );
            if (historyRes.ok) {
              const historyData = await historyRes.json();
              const history = Array.isArray(historyData)
                ? historyData
                : (historyData?.content ?? historyData?.data ?? []);
              // Only consider purchases that map to a pricing plan (bronze/silver/…)
              // — a partner's most recent purchase is often a TopUp/TF_min, which has
              // no slug, so sorting all purchases would yield expiredSlug=null and the
              // expired plan card would wrongly show "Buy Now" instead of "Renew Plan".
              const pastPurchase = history
                .filter(
                  (p: any) =>
                    p.idPackage &&
                    p.idPackage !== 9999 &&
                    packageIdToSlug[p.idPackage]
                )
                .sort(
                  (a: any, b: any) =>
                    new Date(b.purchaseDate).getTime() -
                    new Date(a.purchaseDate).getTime()
                )[0];
              if (pastPurchase) {
                return {
                  service,
                  slug: null,
                  expiredSlug: packageIdToSlug[pastPurchase.idPackage] ?? null,
                };
              }
            }

            return { service, slug: null, expiredSlug: null };
          })
        );

        const activeMap: Record<string, string | null> = {};
        const expiredMap: Record<string, string | null> = {};
        results.forEach((r) => {
          if (r.status === 'fulfilled') {
            activeMap[r.value.service] = r.value.slug;
            expiredMap[r.value.service] = r.value.expiredSlug;
          }
        });
        setActivePackages(activeMap);
        setExpiredPackages(expiredMap);
      } catch (e) {
        console.error('Failed to fetch active packages:', e);
      }
    };

    fetchUserType();
    fetchActivePackages();
  }, []);

  const handleBuyNow = (pkg: any, service: string) => {
    if (!isLoggedIn()) {
      toast.error(
        locale === 'en'
          ? 'Please login to purchase'
          : 'কেনার জন্য অনুগ্রহ করে লগইন করুন'
      );
      router.push(`/${locale}/login`);
      return;
    }
    if (purchaseBlocked) {
      if (docBlockReason === 'rejected') {
        toast.error(
          locale === 'en'
            ? 'Purchase restricted: One or more required documents have been rejected. Please re-upload from your dashboard.'
            : 'ক্রয় সীমাবদ্ধ: এক বা একাধিক প্রয়োজনীয় নথি প্রত্যাখ্যান করা হয়েছে।'
        );
      } else {
        toast.error(
          locale === 'en'
            ? 'Purchase restricted: Your documents are under review. BTCL will approve within 3 working days.'
            : 'ক্রয় সীমাবদ্ধ: আপনার নথি পর্যালোচনাধীন। BTCL ৩ কার্যদিবসের মধ্যে অনুমোদন করবে।'
        );
      }
      return;
    }
    // Hosted PBX needs a pre-purchase notice (IP-Phones / IP whitelist heads-up)
    if (service === 'hosted-pbx') {
      setSelectedService(service);
      setPbxPendingPkg({ pkg, mode: 'buy' });
      setPbxNoticeOpen(true);
      return;
    }
    setSelectedService(service);
    setSelectedPackage(pkg);
    setIsCheckoutOpen(true);
  };

  const handleApply = (pkg: any, service: string) => {
    if (!isLoggedIn()) {
      toast.error(
        locale === 'en'
          ? 'Please login to apply'
          : 'আবেদন করতে অনুগ্রহ করে লগইন করুন'
      );
      router.push(`/${locale}/login`);
      return;
    }
    if (purchaseBlocked) {
      if (docBlockReason === 'rejected') {
        toast.error(
          locale === 'en'
            ? 'Application restricted: One or more required documents have been rejected. Please re-upload from your dashboard.'
            : 'আবেদন সীমাবদ্ধ: এক বা একাধিক প্রয়োজনীয় নথি প্রত্যাখ্যান করা হয়েছে।'
        );
      } else {
        toast.error(
          locale === 'en'
            ? 'Application restricted: Your documents are under review. BTCL will approve within 3 working days.'
            : 'আবেদন সীমাবদ্ধ: আপনার নথি পর্যালোচনাধীন। BTCL ৩ কার্যদিবসের মধ্যে অনুমোদন করবে।'
        );
      }
      return;
    }
    // Hosted PBX needs a pre-purchase notice (IP-Phones / IP whitelist heads-up)
    if (service === 'hosted-pbx') {
      setSelectedService(service);
      setPbxPendingPkg({ pkg, mode: 'apply' });
      setPbxNoticeOpen(true);
      return;
    }
    setSelectedService(service);
    setSelectedPackage(pkg);
    setIsCheckoutOpen(true);
  };

  const proceedWithPbxPurchase = () => {
    if (!pbxPendingPkg) {
      setPbxNoticeOpen(false);
      return;
    }
    setSelectedPackage(pbxPendingPkg.pkg);
    setPbxNoticeOpen(false);
    setPbxPendingPkg(null);
    setIsCheckoutOpen(true);
  };

  const cancelPbxPurchase = () => {
    setPbxNoticeOpen(false);
    setPbxPendingPkg(null);
  };

  React.useEffect(() => {
    params.then((p) => setLocale(p.locale));
  }, [params]);

  // Services
  const services = [
    {
      id: 'hosted-pbx',
      name: locale === 'en' ? 'Alaap Cloud IP PBX' : 'Alaap Cloud IP PBX',
      icon: '/alaap_cloud_ip_pbx.png',
      color: 'green',
    },
    {
      id: 'voice-broadcast',
      name:
        locale === 'en'
          ? 'Alaap Cloud Voice Broadcasting Service'
          : 'Alaap Cloud Voice Broadcasting Service',
      icon: '/alaap_voice_broadcasting.png',
      color: 'orange',
    },
    {
      id: 'contact-center',
      name:
        locale === 'en'
          ? 'Alaap Cloud Contact Center'
          : 'Alaap Cloud Contact Center',
      icon: '/alaap_cloud_contact_center.png',
      color: 'purple',
    },
    {
      id: 'bulk-sms',
      name: locale === 'en' ? 'Bulk SMS Service' : 'Bulk SMS Service',
      icon: '/bulk_sms.png',
      color: 'blue',
    },
  ];

  // Voice Broadcasting and Bulk SMS are priced by slabs an admin edits at /admin/pricing.
  // PaymentGateWay refuses a purchase whose amounts differ from these, so there is no
  // built-in fallback: if they cannot be loaded, the sections say so and offer no Buy.
  const [servicePricing, setServicePricing] = useState<ServicePricingMap | null>(null);
  const [pricingStatus, setPricingStatus] = useState<'loading' | 'error' | 'ready'>('loading');

  const loadServicePricing = React.useCallback(async () => {
    setPricingStatus('loading');
    try {
      setServicePricing(await getServicePricing());
      setPricingStatus('ready');
    } catch (err) {
      console.error('Could not load service pricing:', err);
      setPricingStatus('error');
    }
  }, []);

  useEffect(() => {
    loadServicePricing();
  }, [loadServicePricing]);

  const [smsQuantity, setSmsQuantity] = useState<number | ''>('');
  const smsQuote =
    servicePricing?.sms && typeof smsQuantity === 'number' && smsQuantity >= 1
      ? quote(servicePricing.sms, smsQuantity)
      : null;

  // Contact Center Pricing
  const contactCenterPackages = [
    {
      id: 'basic',
      name: locale === 'en' ? 'Basic' : 'বেসিক',
      users: locale === 'en' ? 'Per Agent' : 'প্রতি এজেন্ট',
      price: 8500,
      popular: true,
      features: [
        locale === 'en' ? 'Audio Call' : 'অডিও কল',
        locale === 'en'
          ? 'Social Media Integration'
          : 'সোশ্যাল মিডিয়া ইন্টিগ্রেশন',
        locale === 'en' ? 'SMS' : 'এসএমএস',
        locale === 'en' ? 'Chat' : 'চ্যাট',
        locale === 'en' ? 'IVR' : 'IVR',
        locale === 'en' ? 'Call Recording' : 'কল রেকর্ডিং',
        locale === 'en'
          ? 'ACD (Automatic Call Distribution)'
          : 'ACD (স্বয়ংক্রিয় কল ডিস্ট্রিবিউশন)',
        locale === 'en' ? 'Reporting' : 'রিপোর্টিং',
      ],
    },
  ];

  // Hosted PBX Pricing
  const pbxPackages = [
    {
      id: 'starter',
      name: locale === 'en' ? 'Starter' : 'স্টার্টার',
      extensions: 3,
      callChannels: 2,
      ivr: 1,
      freeTalktime: 60,
      callCharge: 0.45,
      price: 250,
      postpaidCredit: 1000,
      popular: false,
      features: [
        locale === 'en' ? '3 Extensions' : '৩টি এক্সটেনশন',
        locale === 'en' ? '2 Call Channels' : '২টি কল চ্যানেল',
        locale === 'en' ? '1 IVR' : '১টি IVR',
        locale === 'en' ? '60 Minutes Free Talktime*' : '৬০ মিনিট ফ্রি টকটাইম*',
        locale === 'en' ? 'Call Monitoring' : 'কল মনিটরিং',
        locale === 'en' ? 'Voice Message to Email' : 'ভয়েস মেসেজ টু ইমেইল',
        locale === 'en' ? 'Call Forwarding' : 'কল ফরওয়ার্ডিং',
        locale === 'en' ? 'Conference Calling' : 'কনফারেন্স কলিং',
        locale === 'en' ? 'Multi-Device Support' : 'মাল্টি-ডিভাইস সাপোর্ট',
        locale === 'en' ? 'Call Recording' : 'কল রেকর্ডিং',
        locale === 'en' ? '৳0.45/min Call Charge' : '৳০.৪৫/মিনিট কল চার্জ',
      ],
    },
    {
      id: 'economy',
      name: locale === 'en' ? 'Economy' : 'ইকোনমি',
      extensions: 5,
      callChannels: 2,
      ivr: 1,
      freeTalktime: 120,
      callCharge: 0.45,
      price: 450,
      postpaidCredit: 2000,
      popular: false,
      features: [
        locale === 'en' ? '5 Extensions' : '৫টি এক্সটেনশন',
        locale === 'en' ? '2 Call Channels' : '২টি কল চ্যানেল',
        locale === 'en' ? '1 IVR' : '১টি IVR',
        locale === 'en' ? '120 Minutes Free Talktime*' : '১২০ মিনিট ফ্রি টকটাইম*',
        locale === 'en' ? 'Call Monitoring' : 'কল মনিটরিং',
        locale === 'en' ? 'Voice Message to Email' : 'ভয়েস মেসেজ টু ইমেইল',
        locale === 'en' ? 'Call Forwarding' : 'কল ফরওয়ার্ডিং',
        locale === 'en' ? 'Conference Calling' : 'কনফারেন্স কলিং',
        locale === 'en' ? 'Multi-Device Support' : 'মাল্টি-ডিভাইস সাপোর্ট',
        locale === 'en' ? 'Call Recording' : 'কল রেকর্ডিং',
        locale === 'en' ? '৳0.45/min Call Charge' : '৳০.৪৫/মিনিট কল চার্জ',
      ],
    },
    {
      id: 'bronze',
      name: locale === 'en' ? 'Bronze' : 'ব্রোঞ্জ',
      extensions: 10,
      callChannels: 5,
      ivr: 2,
      freeTalktime: 500,
      callCharge: 0.45,
      price: 1200,
      postpaidCredit: 5000,
      popular: true,
      features: [
        locale === 'en' ? '10 Extensions' : '১০টি এক্সটেনশন',
        locale === 'en' ? '5 Call Channels' : '৫টি কল চ্যানেল',
        locale === 'en' ? '2 IVR' : '২টি IVR',
        locale === 'en' ? '500 Minutes Free Talktime*' : '৫০০ মিনিট ফ্রি টকটাইম*',
        locale === 'en' ? 'Call Monitoring' : 'কল মনিটরিং',
        locale === 'en' ? 'Voice Message to Email' : 'ভয়েস মেসেজ টু ইমেইল',
        locale === 'en' ? 'Call Forwarding' : 'কল ফরওয়ার্ডিং',
        locale === 'en' ? 'Conference Calling' : 'কনফারেন্স কলিং',
        locale === 'en' ? 'Multi-Device Support' : 'মাল্টি-ডিভাইস সাপোর্ট',
        locale === 'en' ? 'Call Recording' : 'কল রেকর্ডিং',
        locale === 'en' ? '৳0.45/min Call Charge' : '৳০.৪৫/মিনিট কল চার্জ',
      ],
    },
    {
      id: 'silver',
      name: locale === 'en' ? 'Silver' : 'সিলভার',
      extensions: 30,
      callChannels: 7,
      ivr: 5,
      freeTalktime: 1000,
      callCharge: 0.4,
      price: 2500,
      postpaidCredit: 10000,
      popular: false,
      features: [
        locale === 'en' ? '30 Extensions' : '৩০টি এক্সটেনশন',
        locale === 'en' ? '7 Call Channels' : '৭টি কল চ্যানেল',
        locale === 'en' ? '5 IVR' : '৫টি IVR',
        locale === 'en'
          ? '1000 Minutes Free Talktime*'
          : '১০০০ মিনিট ফ্রি টকটাইম*',
        locale === 'en' ? 'Call Monitoring' : 'কল মনিটরিং',
        locale === 'en' ? 'Voice Message to Email' : 'ভয়েস মেসেজ টু ইমেইল',
        locale === 'en' ? 'Call Forwarding' : 'কল ফরওয়ার্ডিং',
        locale === 'en' ? 'Conference Calling' : 'কনফারেন্স কলিং',
        locale === 'en' ? 'Multi-Device Support' : 'মাল্টি-ডিভাইস সাপোর্ট',
        locale === 'en' ? 'Call Recording' : 'কল রেকর্ডিং',
        locale === 'en' ? '৳0.40/min Call Charge' : '৳০.৪০/মিনিট কল চার্জ',
      ],
    },
    {
      id: 'gold',
      name: locale === 'en' ? 'Gold' : 'গোল্ড',
      extensions: locale === 'en' ? 'Up to 100' : '১০০ পর্যন্ত',
      callChannels: 15,
      ivr: 10,
      freeTalktime: 3000,
      callCharge: 0.35,
      price: 4500,
      postpaidCredit: 20000,
      popular: false,
      features: [
        locale === 'en' ? 'Up to 100 Extensions' : '১০০টি পর্যন্ত এক্সটেনশন',
        locale === 'en' ? '15 Call Channels' : '১৫টি কল চ্যানেল',
        locale === 'en' ? '10 IVR' : '১০টি IVR',
        locale === 'en'
          ? '3000 Minutes Free Talktime*'
          : '৩০০০ মিনিট ফ্রি টকটাইম*',
        locale === 'en' ? 'Call Monitoring' : 'কল মনিটরিং',
        locale === 'en' ? 'Voice Message to Email' : 'ভয়েস মেসেজ টু ইমেইল',
        locale === 'en' ? 'Call Forwarding' : 'কল ফরওয়ার্ডিং',
        locale === 'en' ? 'Conference Calling' : 'কনফারেন্স কলিং',
        locale === 'en' ? 'Multi-Device Support' : 'মাল্টি-ডিভাইস সাপোর্ট',
        locale === 'en' ? 'Call Recording' : 'কল রেকর্ডিং',
        locale === 'en' ? '৳0.35/min Call Charge' : '৳০.৩৫/মিনিট কল চার্জ',
      ],
    },
  ];

  // Voice Broadcast: slabs and limits come from the admin panel (see loadServicePricing).
  const [vbsQuantity, setVbsQuantity] = useState<number | ''>('');
  const vbsQuote =
    servicePricing?.vbs && typeof vbsQuantity === 'number' && vbsQuantity >= 1
      ? quote(servicePricing.vbs, vbsQuantity)
      : null;

  // Short keys the checkout uses to tell a renewal from an upgrade. Slabs keep the key of
  // the package they buy; a slab on any other package has none, and checks out as a renewal.
  const slabPackageKeys: Record<number, string> = {
    9135: 'basic', 9136: 'standard', 9137: 'enterprise', // Voice Broadcasting
    9138: 'basic', 9139: 'standard', 9140: 'enterprise', 9141: 'premium', // Bulk SMS
  };

  /** What CheckoutModal needs for a slab purchase. Amounts are the ones PaymentGateWay expects. */
  const slabPackage = (q: Quote) => ({
    id: slabPackageKeys[q.slab!.packageId] ?? `package-${q.slab!.packageId}`,
    packageIdInt: q.slab!.packageId,
    name: slabName(q.slab!, locale),
    price: q.price,
    vat: q.vat,
    total: q.total,
    rate: q.slab!.rate,
    features: [],
  });

  /** Why this quantity cannot be bought, or null when it can. */
  const slabQuoteProblem = (pricing: ServicePricing | undefined, q: Quote | null): string | null => {
    const en = locale === 'en';
    if (!pricing) return en ? 'Prices are not loaded yet. Please try again.' : 'মূল্য এখনও লোড হয়নি। আবার চেষ্টা করুন।';
    if (!q) return null;
    if (q.noSlab || q.overMaxQuantity) {
      const max = maxBuyableQuantity(pricing);
      return en
        ? `Maximum ${max?.toLocaleString() ?? ''} messages per purchase`
        : `প্রতি ক্রয়ে সর্বোচ্চ ${max?.toLocaleString() ?? ''} মেসেজ`;
    }
    if (q.underMin)
      return en
        ? `Minimum purchase amount is ৳${pricing.limits.minTotal.toLocaleString()}`
        : `সর্বনিম্ন ক্রয় পরিমাণ ৳${pricing.limits.minTotal.toLocaleString()}`;
    if (q.overMaxTotal)
      return en
        ? `Total amount cannot exceed ৳${pricing.limits.maxTotal?.toLocaleString()} per purchase`
        : `প্রতি ক্রয়ে মোট পরিমাণ ৳${pricing.limits.maxTotal?.toLocaleString()} এর বেশি হতে পারবে না`;
    return null;
  };

  const handleVbsBuyNow = () => {
    if (!isLoggedIn()) {
      toast.error(
        locale === 'en'
          ? 'Please login to purchase'
          : 'ক্রয় করতে অনুগ্রহ করে লগইন করুন'
      );
      router.push(`/${locale}/login`);
      return;
    }
    if (purchaseBlocked) {
      if (docBlockReason === 'rejected') {
        toast.error(
          locale === 'en'
            ? 'Purchase restricted: Documents rejected.'
            : 'ক্রয় সীমাবদ্ধ: নথি প্রত্যাখ্যাত।'
        );
      } else {
        toast.error(
          locale === 'en'
            ? 'Purchase restricted: Documents under review.'
            : 'ক্রয় সীমাবদ্ধ: নথি পর্যালোচনাধীন।'
        );
      }
      return;
    }
    const problem = slabQuoteProblem(servicePricing?.vbs, vbsQuote);
    if (problem || !vbsQuote?.slab || typeof vbsQuantity !== 'number') {
      toast.error(problem ?? (locale === 'en' ? 'Please enter a valid quantity (minimum 1)' : 'অনুগ্রহ করে সঠিক পরিমাণ লিখুন (সর্বনিম্ন ১)'));
      return;
    }
    setSelectedService('voice-broadcast');
    setSelectedPackage({
      ...slabPackage(vbsQuote),
      vbsQuantity: vbsQuantity,
    });
    setIsCheckoutOpen(true);
  };

  // Bulk SMS buy — mirrors handleVbsBuyNow (slab pricing, 5-yr validity, gateway).
  const handleSmsBuyNow = () => {
    if (!isLoggedIn()) {
      toast.error(
        locale === 'en'
          ? 'Please login to purchase'
          : 'ক্রয় করতে অনুগ্রহ করে লগইন করুন'
      );
      router.push(`/${locale}/login`);
      return;
    }
    if (purchaseBlocked) {
      if (docBlockReason === 'rejected') {
        toast.error(
          locale === 'en'
            ? 'Purchase restricted: Documents rejected.'
            : 'ক্রয় সীমাবদ্ধ: নথি প্রত্যাখ্যাত।'
        );
      } else {
        toast.error(
          locale === 'en'
            ? 'Purchase restricted: Documents under review.'
            : 'ক্রয় সীমাবদ্ধ: নথি পর্যালোচনাধীন।'
        );
      }
      return;
    }
    const problem = slabQuoteProblem(servicePricing?.sms, smsQuote);
    if (problem || !smsQuote?.slab || typeof smsQuantity !== 'number') {
      toast.error(problem ?? (locale === 'en' ? 'Please enter a valid quantity (minimum 1)' : 'অনুগ্রহ করে সঠিক পরিমাণ লিখুন (সর্বনিম্ন ১)'));
      return;
    }
    setSelectedService('bulk-sms');
    setSelectedPackage({
      ...slabPackage(smsQuote),
      smsQuantity: smsQuantity,
    });
    setIsCheckoutOpen(true);
  };

  // Kept for compatibility with renderSection/getCurrentPackages
  const voiceBroadcastPackages: any[] = [];

  const getCurrentPackages = () => {
    switch (selectedService) {
      case 'hosted-pbx':
        return pbxPackages;
      case 'voice-broadcast':
        return voiceBroadcastPackages;
      case 'contact-center':
        return contactCenterPackages;
      default:
        return pbxPackages;
    }
  };

  const getServiceColor = (_color: string) =>
    'from-btcl-primary to-btcl-primary';

  // Renders the action button for a prepaid card
  /**
   * Why Bulk SMS cannot be bought right now, or null when it can.
   *
   * Derived once so the pricing section and the package buttons cannot disagree.
   * Unknown eligibility counts as blocked: offering Buy after a failed check only
   * leads to a refusal at payment. Admins are exempt, as elsewhere on this page.
   */
  const smsGate = (() => {
    if (!isLoggedIn() || isAdmin) return null;
    if (smsEligibility?.eligible) return null;
    const state = smsEligibility?.state ?? 'UNKNOWN';
    return {
      state,
      needsUpload: state === 'NOT_UPLOADED' || state === 'REJECTED',
      rejectionReason: smsEligibility?.btrcRejectionReason ?? null,
      message:
        smsEligibility?.message ??
        (locale === 'en'
          ? 'Could not check your Bulk SMS eligibility. Please refresh.'
          : 'বাল্ক এসএমএস যোগ্যতা যাচাই করা যায়নি। রিফ্রেশ করুন।'),
    };
  })();

  const renderPrepaidButton = (pkg: any, serviceId: string) => {
    if (typeof pkg.price !== 'number') {
      return (
        <Link href={`/${locale}/contact`}>
          <Button className="w-full transform rounded-lg border-2 border-btcl-primary bg-white px-6 py-2.5 text-sm font-semibold text-btcl-primary transition-all duration-300 hover:scale-105 hover:bg-btcl-primary hover:text-white">
            {locale === 'en' ? 'Contact Sales' : 'সেলস যোগাযোগ'}
          </Button>
        </Link>
      );
    }
    // Bulk SMS needs a BTRC aggregator licence approved on top of the mandatory
    // documents, so it gets its own prompt: upload it, wait for approval, or fix a
    // rejection. Admins are exempt, as they are from the document block below.
    if (serviceId === 'bulk-sms' && smsGate) {
      {
        const state = smsGate.state;
        const needsUpload = smsGate.needsUpload;
        const sms = { message: smsGate.message, btrcRejectionReason: smsGate.rejectionReason };
        return (
          <div className="space-y-2">
            <Button
              disabled
              className="w-full py-3 px-6 rounded-xl font-semibold text-sm bg-gray-300 text-gray-600 cursor-not-allowed"
            >
              {locale === 'en' ? 'BTRC Licence Required' : 'বিটিআরসি লাইসেন্স প্রয়োজন'}
            </Button>
            <p
              className={`text-xs text-center ${
                state === 'REJECTED' ? 'text-red-500' : 'text-amber-600'
              }`}
            >
              {sms?.message ??
                (locale === 'en'
                  ? 'Could not check your Bulk SMS eligibility. Please refresh.'
                  : 'বাল্ক এসএমএস যোগ্যতা যাচাই করা যায়নি। রিফ্রেশ করুন।')}
            </p>
            {state === 'REJECTED' && sms?.btrcRejectionReason && (
              <p className="text-xs text-center text-red-500">
                {sms.btrcRejectionReason}
              </p>
            )}
            {needsUpload && (
              <Link href={`/${locale}/dashboard/documents`}>
                <Button className="w-full transform rounded-lg border-2 border-btcl-primary bg-white px-6 py-2.5 text-sm font-semibold text-btcl-primary transition-all duration-300 hover:bg-btcl-primary hover:text-white">
                  {locale === 'en'
                    ? 'Upload BTRC Licence'
                    : 'বিটিআরসি লাইসেন্স আপলোড করুন'}
                </Button>
              </Link>
            )}
          </div>
        );
      }
    }

    // Show disabled button when purchase is blocked due to documents
    if (purchaseBlocked && isLoggedIn()) {
      return (
        <div className="space-y-2">
          <Button
            onClick={() => handleBuyNow(pkg, serviceId)}
            className="w-full py-3 px-6 rounded-xl font-semibold text-sm bg-gray-300 text-gray-600 cursor-not-allowed opacity-75"
          >
            {locale === 'en' ? 'Purchase Disabled' : 'ক্রয় নিষ্ক্রিয়'}
          </Button>
          <p
            className={`text-xs text-center ${docBlockReason === 'rejected' ? 'text-red-500' : 'text-amber-600'}`}
          >
            {docBlockReason === 'rejected'
              ? locale === 'en'
                ? 'Documents rejected — re-upload required'
                : 'নথি প্রত্যাখ্যাত — পুনরায় আপলোড প্রয়োজন'
              : locale === 'en'
                ? 'Documents under review (up to 3 working days)'
                : 'নথি পর্যালোচনাধীন (৩ কার্যদিবস পর্যন্ত)'}
          </p>
        </div>
      );
    }
    // The plan the customer is already on. It still says so, but renewing it early is
    // allowed now: the backend starts the new period at the current expiry rather than
    // today (PackagePurchaseService.renewalStart), so no paid day is lost. Before that
    // it restarted from today, and a dead button was the only thing stopping a customer
    // from losing the remainder — which also left the PBX portal telling them to "renew
    // before it expires" with nowhere to do it.
    if (activePackages[serviceId] === pkg.id) {
      return (
        <div className="space-y-2">
          <Button
            onClick={() => handleBuyNow(pkg, serviceId)}
            className="w-full transform rounded-lg border-2 border-btcl-primary bg-white px-6 py-2.5 text-sm font-semibold text-btcl-primary transition-all duration-300 hover:scale-105 hover:bg-btcl-primary hover:text-white"
          >
            ↻ {locale === 'en' ? 'Renew Plan' : 'প্ল্যান নবায়ন করুন'}
          </Button>
          <p className="text-xs text-center text-gray-500">
            ✓{' '}
            {locale === 'en'
              ? 'Your current plan — renewing adds to the time you have left'
              : 'আপনার বর্তমান প্ল্যান — নবায়ন করলে অবশিষ্ট সময়ের সাথে যোগ হবে'}
          </p>
        </div>
      );
    }
    if (activePackages[serviceId]) {
      const tiers = packageTierOrder[serviceId] ?? {};
      const activeTier = tiers[activePackages[serviceId]!] ?? 0;
      const thisTier = tiers[pkg.id] ?? 0;
      const isUpgrade = thisTier > activeTier;
      return (
        <Button
          onClick={() => handleBuyNow(pkg, serviceId)}
          className="w-full transform rounded-lg border-2 border-btcl-primary bg-white px-6 py-2.5 text-sm font-semibold text-btcl-primary transition-all duration-300 hover:scale-105 hover:bg-btcl-primary hover:text-white"
        >
          {isUpgrade
            ? locale === 'en'
              ? '↑ Upgrade Plan'
              : '↑ আপগ্রেড করুন'
            : locale === 'en'
              ? '↓ Downgrade Plan'
              : '↓ ডাউনগ্রেড করুন'}
        </Button>
      );
    }
    if (expiredPackages[serviceId] === pkg.id) {
      return (
        <Button
          onClick={() => handleBuyNow(pkg, serviceId)}
          className="w-full transform rounded-lg border-2 border-btcl-primary bg-white px-6 py-2.5 text-sm font-semibold text-btcl-primary transition-all duration-300 hover:scale-105 hover:bg-btcl-primary hover:text-white"
        >
          ↻ {locale === 'en' ? 'Renew Plan' : 'প্ল্যান নবায়ন করুন'}
        </Button>
      );
    }
    if (expiredPackages[serviceId]) {
      // Current plan is expired: the expired tier shows "Renew" (above); the other
      // tiers become Upgrade (higher) / Downgrade (lower) relative to it, just like
      // when the plan is active.
      const tiers = packageTierOrder[serviceId] ?? {};
      const expiredTier = tiers[expiredPackages[serviceId]!] ?? 0;
      const thisTier = tiers[pkg.id] ?? 0;
      const isUpgrade = thisTier > expiredTier;
      return (
        <Button
          onClick={() => handleBuyNow(pkg, serviceId)}
          className="w-full transform rounded-lg border-2 border-btcl-primary bg-white px-6 py-2.5 text-sm font-semibold text-btcl-primary transition-all duration-300 hover:scale-105 hover:bg-btcl-primary hover:text-white"
        >
          {isUpgrade
            ? locale === 'en'
              ? '↑ Upgrade Plan'
              : '↑ আপগ্রেড করুন'
            : locale === 'en'
              ? '↓ Downgrade Plan'
              : '↓ ডাউনগ্রেড করুন'}
        </Button>
      );
    }
    return (
      <Button
        onClick={() => handleBuyNow(pkg, serviceId)}
        className="w-full transform rounded-lg border-2 border-btcl-primary bg-white px-6 py-2.5 text-sm font-semibold text-btcl-primary transition-all duration-300 hover:scale-105 hover:bg-btcl-primary hover:text-white"
      >
        {locale === 'en' ? 'Buy Now' : 'এখনই কিনুন'}
      </Button>
    );
  };

  // Renders a full section of package cards for a given service
  const renderSection = (
    serviceId: string,
    icon: string,
    titleEn: string,
    titleBn: string,
    subtitleEn: string,
    subtitleBn: string,
    packages: any[],
    bgClass: string,
    accentClass: string,
    isPostpaid = false
  ) => {
    const isSingle = packages.length === 1;
    // Widen the container and fan the cards into a single row as the plan count
    // grows (PBX now has 5 tiers: Starter/Economy/Bronze/Silver/Gold).
    const containerMax = packages.length >= 5 ? 'max-w-screen-2xl' : 'max-w-6xl';
    const cardGap = packages.length >= 5 ? 'gap-5' : 'gap-8';
    const gridCols = isSingle
      ? 'grid-cols-1 max-w-md mx-auto'
      : packages.length >= 5
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5'
      : packages.length === 4
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
      : 'grid-cols-1 md:grid-cols-3';
    return (
      <div id={serviceId} className={`py-20 ${bgClass}`}>
        <div className={`${containerMax} mx-auto px-4 sm:px-6 lg:px-8`}>
          {/* Section Header */}
          <div className="text-center mb-12">
            <div
              className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl mb-4 ${accentClass}`}
            >
              {icon.startsWith('/') ? (
                <img src={icon} alt="" className="h-10 w-10 object-contain" />
              ) : (
                <span className="text-4xl">{icon}</span>
              )}
              <h2 className="text-2xl font-bold">
                {locale === 'en' ? titleEn : titleBn}
              </h2>
              {isPostpaid && !FEATURE_FLAGS.POSTPAID_ENABLED && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300 uppercase tracking-wider">
                  {locale === 'en' ? 'Coming Soon' : 'শীঘ্রই আসছে'}
                </span>
              )}
            </div>
            <p className="text-gray-600 text-lg">
              {locale === 'en' ? subtitleEn : subtitleBn}
            </p>
            {/* Postpaid rates are public, but eligibility is not. Anyone can read the
                plans; only a Government customer can select postpaid at registration.
                Spelling out the conditions here means a private applicant learns that
                before filling in a form they cannot complete. */}
            {isPostpaid && (
              <div className="mt-4 max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-lg p-4 text-left">
                <p className="text-sm font-semibold text-red-900">
                  {locale === 'en'
                    ? 'Eligibility & Terms — Government organisations only'
                    : 'যোগ্যতা ও শর্তাবলি — শুধুমাত্র সরকারি প্রতিষ্ঠানের জন্য'}
                </p>
                <ul className="mt-2 space-y-1.5 text-sm text-red-800 list-disc pl-5">
                  <li>
                    {locale === 'en'
                      ? 'Postpaid billing is available only to Government, Semi-Government and Autonomous organisations.'
                      : 'পোস্টপেইড বিলিং শুধুমাত্র সরকারি, আধা-সরকারি ও স্বায়ত্তশাসিত প্রতিষ্ঠানের জন্য প্রযোজ্য।'}
                  </li>
                  <li>
                    {locale === 'en'
                      ? 'You must register as a Government customer and upload a valid office order or authorisation letter.'
                      : 'আপনাকে সরকারি গ্রাহক হিসেবে নিবন্ধন করতে হবে এবং বৈধ অফিস আদেশ বা অনুমোদনপত্র আপলোড করতে হবে।'}
                  </li>
                  <li>
                    {locale === 'en'
                      ? 'Applications from private individuals or private companies will not be accepted.'
                      : 'ব্যক্তিগত বা বেসরকারি প্রতিষ্ঠানের আবেদন গ্রহণ করা হবে না।'}
                  </li>
                  <li>
                    {locale === 'en'
                      ? 'Postpaid billing applies to Alaap Cloud IP PBX purchases only; all other services remain prepaid.'
                      : 'পোস্টপেইড বিলিং শুধুমাত্র আলাপ ক্লাউড আইপি পিবিএক্স ক্রয়ের ক্ষেত্রে প্রযোজ্য; অন্যান্য সকল সেবা প্রিপেইড থাকবে।'}
                  </li>
                  <li>
                    {locale === 'en'
                      ? 'Accounts are activated after BTCL verifies the submitted documents.'
                      : 'জমা দেওয়া কাগজপত্র বিটিসিএল যাচাই করার পর অ্যাকাউন্ট সক্রিয় করা হয়।'}
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Cards Grid */}
          <div
            className={`grid ${cardGap} ${gridCols}`}
          >
            {packages.map((pkg: any) => (
              <div
                key={`${isPostpaid ? 'post' : 'pre'}-${serviceId}-${pkg.id}`}
                className={`group relative bg-white rounded-2xl border border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:border-btcl-primary hover:shadow-2xl ${pkg.popular ? 'border-amber-400 border-2 shadow-2xl' : 'overflow-hidden'}`}
              >
                <div
                  className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-btcl-primary to-btcl-primaryLight transition-opacity duration-300 ${pkg.popular ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`}
                />
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-6 py-2 rounded-full text-sm font-semibold uppercase tracking-wide shadow-lg">
                      {locale === 'en' ? 'POPULAR' : 'জনপ্রিয়'}
                    </div>
                  </div>
                )}
                <div className="p-7">
                  {/* Price display */}
                  <div className="text-center mb-5">
                    <h3 className="text-xl font-bold text-gray-900 mb-3">
                      {pkg.name}
                    </h3>
                    <div className="mb-4">
                      {serviceId === 'voice-broadcast' ? (
                        <>
                          <span className="text-3xl font-bold text-gray-900">
                            ৳{pkg.rate.toFixed(2)}
                          </span>
                          <span className="text-sm text-gray-600">
                            /{locale === 'en' ? 'message' : 'মেসেজ'}
                          </span>
                          <div className="text-xs text-gray-500 mt-2">
                            {pkg.messages}{' '}
                            {locale === 'en' ? 'VB Messages' : 'ভিবি মেসেজ'}
                          </div>
                        </>
                      ) : serviceId === 'hosted-pbx' ? (
                        <>
                          <span className="text-3xl font-bold text-gray-900">
                            ৳{pkg.price.toLocaleString()}
                          </span>
                          <span className="text-sm text-gray-600">
                            /{locale === 'en' ? 'month' : 'মাস'}
                          </span>
                          <div className="text-xs text-gray-500 mt-2">
                            {typeof pkg.extensions === 'number'
                              ? `${pkg.extensions} ${locale === 'en' ? 'Extensions' : 'এক্সটেনশন'}`
                              : pkg.extensions}
                          </div>
                          {isPostpaid && (
                            <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                              <div className="text-xs text-blue-600 font-medium mb-1">
                                {locale === 'en'
                                  ? 'Postpaid Credit Limit'
                                  : 'পোস্টপেইড ক্রেডিট সীমা'}
                              </div>
                              <div className="text-lg font-bold text-blue-900">
                                ৳
                                {Math.ceil(
                                  pkg.price * 1.15 * 2
                                ).toLocaleString()}
                                <span className="text-sm font-normal text-blue-700">
                                  /{locale === 'en' ? 'month' : 'মাস'}
                                </span>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        /* contact-center */
                        <>
                          <span className="text-3xl font-bold text-gray-900">
                            ৳{pkg.price.toLocaleString()}
                          </span>
                          <span className="text-sm text-gray-600">
                            /{locale === 'en' ? 'month' : 'মাস'}
                          </span>
                          <div className="text-xs text-gray-500 mt-2">
                            {typeof pkg.users === 'number'
                              ? `${pkg.users} ${locale === 'en' ? 'Users' : 'ব্যবহারকারী'}`
                              : pkg.users}
                          </div>
                          {isPostpaid && (
                            <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                              <div className="text-xs text-blue-600 font-medium mb-1">
                                {locale === 'en'
                                  ? 'Postpaid Credit Limit'
                                  : 'পোস্টপেইড ক্রেডিট সীমা'}
                              </div>
                              <div className="text-lg font-bold text-blue-900">
                                ৳
                                {Math.ceil(
                                  pkg.price * 1.15 * 2
                                ).toLocaleString()}
                                <span className="text-sm font-normal text-blue-700">
                                  /{locale === 'en' ? 'month' : 'মাস'}
                                </span>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action button */}
                  <div className="mb-6">
                    {isPostpaid ? (
                      !FEATURE_FLAGS.POSTPAID_ENABLED ? (
                        <Button
                          disabled
                          className="w-full py-3 px-6 rounded-xl font-semibold text-sm bg-gray-300 text-gray-600 cursor-not-allowed"
                        >
                          {locale === 'en' ? 'Coming Soon' : 'শীঘ্রই আসছে'}
                        </Button>
                      ) : typeof pkg.price === 'number' ? (
                        <Button
                          onClick={() => handleApply(pkg, serviceId)}
                          className="w-full transform rounded-lg border-2 border-btcl-primary bg-white px-6 py-2.5 text-sm font-semibold text-btcl-primary transition-all duration-300 hover:scale-105 hover:bg-btcl-primary hover:text-white"
                        >
                          {locale === 'en' ? 'Apply' : 'আবেদন করুন'}
                        </Button>
                      ) : (
                        <Link href={`/${locale}/contact`}>
                          <Button className="w-full transform rounded-lg border-2 border-btcl-primary bg-white px-6 py-2.5 text-sm font-semibold text-btcl-primary transition-all duration-300 hover:scale-105 hover:bg-btcl-primary hover:text-white">
                            {locale === 'en' ? 'Contact Sales' : 'সেলস যোগাযোগ'}
                          </Button>
                        </Link>
                      )
                    ) : (
                      renderPrepaidButton(pkg, serviceId)
                    )}
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    {pkg.features.map((feature: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-btcl-primaryLight/10">
                          <svg
                            className="h-3 w-3 text-btcl-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-700 leading-snug">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Free talktime is a joining allowance, not part of the monthly subscription.
              Read off the plans rather than hardcoded to the PBX section, so a section
              whose plans carry no talktime does not show a footnote about it. */}
          {packages.some((pkg) => pkg.freeTalktime) && (
            <p className="mt-8 text-center text-sm text-gray-500">
              {locale === 'en'
                ? '*Free Talktime is a one-time allowance, given once when the package is activated. It is not renewed with each monthly billing cycle.'
                : '*ফ্রি টকটাইম একবারই প্রদান করা হয় — প্যাকেজ চালুর সময় একবার। প্রতি মাসের বিলিং চক্রে এটি পুনরায় দেওয়া হয় না।'}
            </p>
          )}
        </div>
      </div>
    );
  };

  const showPrepaid =
    isAdmin || isLoadingUserType || userType === null || userType === 'prepaid';
  const showPostpaid =
    isAdmin ||
    (!isLoadingUserType &&
      (userType === 'postpaid' || (userType === null && !isLoggedIn())));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-btcl-primary via-btcl-primary to-btcl-secondary">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold text-white">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
            {locale === 'en' ? 'Plans & Pricing' : 'প্ল্যান ও মূল্য'}
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
            {locale === 'en' ? 'Service Pricing' : 'সেবা মূল্য'}
          </h1>
          <p className="text-xl text-white mb-8 max-w-3xl mx-auto">
            {locale === 'en'
              ? 'Transparent pricing for all our corporate communication services. Choose the plan that fits your business needs.'
              : 'আমাদের সমস্ত কর্পোরেট যোগাযোগ সেবার জন্য স্বচ্ছ মূল্য। আপনার ব্যবসায়িক প্রয়োজন অনুযায়ী পরিকল্পনা চয়ন করুন।'}
          </p>
          {/* Quick jump links */}
          <div className="flex flex-wrap justify-center gap-3 mt-2">
            {[
              {
                id: 'hosted-pbx',
                icon: '/alaap_cloud_ip_pbx.png',
                en: 'Alaap Cloud IP PBX',
                bn: 'Alaap Cloud IP PBX',
              },
              {
                id: 'voice-broadcast',
                icon: '/alaap_voice_broadcasting.png',
                en: 'Alaap Cloud Voice Broadcasting Service',
                bn: 'Alaap Cloud Voice Broadcasting Service',
              },
              {
                id: 'contact-center',
                icon: '/alaap_cloud_contact_center.png',
                en: 'Alaap Cloud Contact Center',
                bn: 'Alaap Cloud Contact Center',
              },
              {
                id: 'bulk-sms',
                icon: '/bulk_sms.png',
                en: 'Bulk SMS Service',
                bn: 'Bulk SMS Service',
              },
              {
                id: 'short-code',
                icon: '🔢',
                en: 'Short Code Parking',
                bn: 'শর্ট কোড পার্কিং',
              },
            ].map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-full text-sm font-medium transition-colors"
              >
                {s.icon.startsWith('/') ? (
                  <img src={s.icon} alt="" className="h-5 w-5 object-contain" />
                ) : (
                  <span>{s.icon}</span>
                )}
                <span>{locale === 'en' ? s.en : s.bn}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Document Approval Banner */}
      {purchaseBlocked && isLoggedIn() && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div
            className={`rounded-xl border-2 p-5 flex items-start gap-4 ${docBlockReason === 'rejected' ? 'bg-red-50 border-red-300' : 'bg-amber-50 border-amber-300'}`}
          >
            <div
              className={`p-2.5 rounded-lg ${docBlockReason === 'rejected' ? 'bg-red-100' : 'bg-amber-100'}`}
            >
              <svg
                className={`w-6 h-6 ${docBlockReason === 'rejected' ? 'text-red-600' : 'text-amber-600'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <div>
              <h3
                className={`font-bold ${docBlockReason === 'rejected' ? 'text-red-800' : 'text-amber-800'}`}
              >
                {docBlockReason === 'rejected'
                  ? locale === 'en'
                    ? 'Purchase Disabled — Documents Rejected'
                    : 'ক্রয় নিষ্ক্রিয় — নথি প্রত্যাখ্যাত'
                  : locale === 'en'
                    ? 'Purchase Disabled — Documents Under Review'
                    : 'ক্রয় নিষ্ক্রিয় — নথি পর্যালোচনাধীন'}
              </h3>
              <p
                className={`text-sm mt-1 ${docBlockReason === 'rejected' ? 'text-red-700' : 'text-amber-700'}`}
              >
                {docBlockReason === 'rejected'
                  ? locale === 'en'
                    ? 'One or more required documents (NID Front, NID Back, Trade License, TIN) have been rejected. Please re-upload corrected documents from your dashboard. BTCL will review within 3 working days.'
                    : 'এক বা একাধিক প্রয়োজনীয় নথি প্রত্যাখ্যান করা হয়েছে। অনুগ্রহ করে আপনার ড্যাশবোর্ড থেকে সংশোধিত নথি পুনরায় আপলোড করুন।'
                  : locale === 'en'
                    ? 'BTCL will review and approve your required documents (NID Front, NID Back, Trade License, TIN) within 3 working days. Document approval is mandatory before making any purchase.'
                    : 'BTCL আপনার প্রয়োজনীয় নথি (NID সামনে, NID পিছনে, ট্রেড লাইসেন্স, TIN) ৩ কার্যদিবসের মধ্যে পর্যালোচনা ও অনুমোদন করবে। যেকোনো ক্রয়ের আগে নথি অনুমোদন বাধ্যতামূলক।'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Prepaid Sections ── */}
      {showPrepaid && (
        <>
          {renderSection(
            'hosted-pbx',
            '/alaap_cloud_ip_pbx.png',
            'Alaap Cloud IP PBX',
            'Alaap Cloud IP PBX',
            'Monthly subscription pricing',
            'মাসিক সাবস্ক্রিপশন মূল্য',
            pbxPackages,
            'bg-white',
            'bg-btcl-primaryLight/10 text-btcl-primaryDark'
          )}
          {/* Voice Broadcast — Slab-based pricing (admin-edited, /admin/pricing) */}
          <SlabPricingSection
            id="voice-broadcast"
            locale={locale}
            icon="/alaap_voice_broadcasting.png"
            title="Alaap Cloud Voice Broadcasting Service"
            pricing={servicePricing?.vbs}
            status={pricingStatus}
            onRetry={loadServicePricing}
            quantity={vbsQuantity}
            setQuantity={setVbsQuantity}
            currentQuote={vbsQuote}
            purchaseDisabled={purchaseBlocked && isLoggedIn()}
            onBuy={handleVbsBuyNow}
          />
          {renderSection(
            'contact-center',
            '/alaap_cloud_contact_center.png',
            'Alaap Cloud Contact Center',
            'Alaap Cloud Contact Center',
            'Monthly subscription pricing',
            'মাসিক সাবস্ক্রিপশন মূল্য',
            contactCenterPackages,
            'bg-white',
            'bg-btcl-primaryLight/10 text-btcl-primaryDark'
          )}
          {/* Bulk SMS — Slab-based pricing (admin-edited, /admin/pricing) */}
          <SlabPricingSection
            id="bulk-sms"
            locale={locale}
            icon="/bulk_sms.png"
            title="Bulk SMS Service"
            headerExtra={<AggregatorTag />}
            pricing={servicePricing?.sms}
            status={pricingStatus}
            onRetry={loadServicePricing}
            quantity={smsQuantity}
            setQuantity={setSmsQuantity}
            currentQuote={smsQuote}
            purchaseDisabled={purchaseBlocked && isLoggedIn()}
            // Bulk SMS needs an approved BTRC aggregator licence on top of the mandatory
            // documents, so the gate replaces the Buy button here.
            gate={
              smsGate ? (
              <div className="mt-4 space-y-2">
              <button
                disabled
                className="w-full py-3 rounded-xl font-semibold text-sm bg-gray-200 text-gray-500 cursor-not-allowed"
              >
                {locale === 'en'
                  ? 'BTRC Licence Required'
                  : 'বিটিআরসি লাইসেন্স প্রয়োজন'}
              </button>
              <p
                className={`text-xs text-center ${
                  smsGate.state === 'REJECTED'
                    ? 'text-red-500'
                    : 'text-amber-600'
                }`}
              >
                {smsGate.message}
              </p>
              {smsGate.state === 'REJECTED' &&
                smsGate.rejectionReason && (
                  <p className="text-xs text-center text-red-500">
                    {smsGate.rejectionReason}
                  </p>
                )}
              {smsGate.needsUpload && (
                <Link href={`/${locale}/dashboard/documents`}>
                  <button className="w-full transform rounded-lg border-2 border-btcl-primary bg-white py-2.5 px-6 text-sm font-semibold text-btcl-primary transition-all duration-300 hover:bg-btcl-primary hover:text-white">
                    {locale === 'en'
                      ? 'Upload BTRC Licence'
                      : 'বিটিআরসি লাইসেন্স আপলোড করুন'}
                  </button>
                </Link>
              )}
            </div>
              ) : undefined
            }
            onBuy={handleSmsBuyNow}
          />
        </>
      )}

      {/* ── Postpaid Sections ── */}
      {showPostpaid && (
        <>
          {renderSection(
            'hosted-pbx',
            '/alaap_cloud_ip_pbx.png',
            'Alaap Cloud IP PBX — Postpaid',
            'Alaap Cloud IP PBX — পোস্টপেইড',
            'Monthly subscription pricing',
            'মাসিক সাবস্ক্রিপশন মূল্য',
            pbxPackages,
            'bg-white',
            'bg-btcl-primaryLight/10 text-btcl-primaryDark',
            true
          )}
          {renderSection(
            'contact-center',
            '/alaap_cloud_contact_center.png',
            'Alaap Cloud Contact Center — Postpaid',
            'Alaap Cloud Contact Center — পোস্টপেইড',
            'Monthly subscription pricing',
            'মাসিক সাবস্ক্রিপশন মূল্য',
            contactCenterPackages,
            'bg-btcl-primaryLight/5',
            'bg-btcl-primaryLight/10 text-btcl-primaryDark',
            true
          )}
        </>
      )}

      {/* ── Short Code Parking Service ── */}
      <div id="short-code" className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header - matches other sections */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl mb-4 bg-btcl-primaryLight/10 text-btcl-primaryDark">
              <span className="text-4xl">🔢</span>
              <h2 className="text-2xl font-bold">
                {locale === 'en'
                  ? 'Short Code Parking Service'
                  : 'শর্ট কোড পার্কিং সেবা'}
              </h2>
            </div>
            <p className="text-gray-600 text-lg">
              {locale === 'en'
                ? 'Under IPTSP License — One-Time Charges (OTC)'
                : 'IPTSP লাইসেন্সের অধীনে — এককালীন চার্জ (OTC)'}
            </p>
          </div>

          {/* Cards Grid - 3 cards matching theme */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Security Deposit */}
            <div className="group relative overflow-hidden bg-white rounded-2xl border border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:border-btcl-primary hover:shadow-2xl p-7">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-btcl-primary to-btcl-primaryLight opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="text-center mb-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-r from-btcl-primary to-btcl-primary text-2xl transition-all duration-300 group-hover:scale-110">
                  🔒
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900">
                  {locale === 'en' ? 'Security Deposit' : 'সিকিউরিটি ডিপোজিট'}
                </h3>
                <div className="text-sm text-gray-500 mb-4">
                  {locale === 'en' ? 'Per Number' : 'প্রতি নম্বর'}
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">
                    ৳1,000
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-btcl-primaryLight/10">
                    <svg
                      className="h-3 w-3 text-btcl-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 leading-snug">
                    {locale === 'en'
                      ? 'Refundable deposit'
                      : 'ফেরতযোগ্য ডিপোজিট'}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-btcl-primaryLight/10">
                    <svg
                      className="h-3 w-3 text-btcl-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 leading-snug">
                    {locale === 'en'
                      ? 'Per short code number'
                      : 'প্রতি শর্ট কোড নম্বর'}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-btcl-primaryLight/10">
                    <svg
                      className="h-3 w-3 text-btcl-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 leading-snug">
                    {locale === 'en' ? 'One-time payment' : 'এককালীন পেমেন্ট'}
                  </span>
                </div>
              </div>
            </div>

            {/* Installation Charge */}
            <div className="group relative bg-white rounded-2xl border-2 border-btcl-primary shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl p-7">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                <div className="bg-gradient-to-r from-btcl-primary to-btcl-primary text-white px-6 py-2 rounded-full text-sm font-semibold uppercase tracking-wide shadow-lg">
                  {locale === 'en' ? 'REQUIRED' : 'আবশ্যিক'}
                </div>
              </div>
              <div className="text-center mb-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-r from-btcl-primary to-btcl-primary text-2xl transition-all duration-300 group-hover:scale-110">
                  🔧
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900">
                  {locale === 'en' ? 'Installation Charge' : 'ইনস্টলেশন চার্জ'}
                </h3>
                <div className="text-sm text-gray-500 mb-4">
                  {locale === 'en' ? 'One-Time' : 'এককালীন'}
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">
                    ৳5,000
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-btcl-primaryLight/10">
                    <svg
                      className="h-3 w-3 text-btcl-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 leading-snug">
                    {locale === 'en'
                      ? 'Full setup & configuration'
                      : 'সম্পূর্ণ সেটআপ ও কনফিগারেশন'}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-btcl-primaryLight/10">
                    <svg
                      className="h-3 w-3 text-btcl-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 leading-snug">
                    {locale === 'en'
                      ? 'Technical integration'
                      : 'টেকনিক্যাল ইন্টিগ্রেশন'}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-btcl-primaryLight/10">
                    <svg
                      className="h-3 w-3 text-btcl-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 leading-snug">
                    {locale === 'en'
                      ? 'Under IPTSP License'
                      : 'IPTSP লাইসেন্সের অধীনে'}
                  </span>
                </div>
              </div>
            </div>

            {/* Connection Charge */}
            <div className="group relative overflow-hidden bg-white rounded-2xl border border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:border-btcl-primary hover:shadow-2xl p-7">
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-btcl-primary to-btcl-primaryLight opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="text-center mb-6">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-r from-btcl-primary to-btcl-primary text-2xl transition-all duration-300 group-hover:scale-110">
                  🔗
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900">
                  {locale === 'en' ? 'Connection Charge' : 'কানেকশন চার্জ'}
                </h3>
                <div className="text-sm text-gray-500 mb-4">
                  {locale === 'en' ? 'Per Number' : 'প্রতি নম্বর'}
                </div>
                <div className="mb-4">
                  <span className="text-3xl font-bold text-gray-900">
                    ৳1,000
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-btcl-primaryLight/10">
                    <svg
                      className="h-3 w-3 text-btcl-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 leading-snug">
                    {locale === 'en'
                      ? 'Per short code number'
                      : 'প্রতি শর্ট কোড নম্বর'}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-btcl-primaryLight/10">
                    <svg
                      className="h-3 w-3 text-btcl-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 leading-snug">
                    {locale === 'en'
                      ? 'Network activation'
                      : 'নেটওয়ার্ক অ্যাক্টিভেশন'}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-btcl-primaryLight/10">
                    <svg
                      className="h-3 w-3 text-btcl-primary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-gray-700 leading-snug">
                    {locale === 'en' ? 'One-time payment' : 'এককালীন পেমেন্ট'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* VAT Notice */}
          <div className="mt-10 text-center">
            <div className="inline-flex items-center rounded-xl border border-yellow-200 bg-yellow-50 px-6 py-3">
              <svg
                className="mr-2 h-5 w-5 text-yellow-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm font-semibold text-yellow-800">
                {locale === 'en'
                  ? '* VAT Applicable on all charges'
                  : '* সকল চার্জে ভ্যাট প্রযোজ্য'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="py-16 bg-gradient-to-r from-btcl-primary to-btcl-primaryDark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {locale === 'en'
              ? 'Need a Custom Plan?'
              : 'কাস্টম পরিকল্পনা প্রয়োজন?'}
          </h2>
          <p className="text-xl text-white mb-8">
            {locale === 'en'
              ? 'Contact our sales team for corporate pricing and custom solutions tailored to your specific requirements.'
              : 'আপনার নির্দিষ্ট প্রয়োজনীয়তার জন্য কর্পোরেট মূল্য এবং কাস্টম সমাধানের জন্য আমাদের সেলস টিমের সাথে যোগাযোগ করুন।'}
          </p>
          <Link href={`/${locale}/contact`}>
            <Button
              size="lg"
              className="transform rounded-lg border-2 border-btcl-primary bg-white px-6 py-2.5 text-sm font-semibold text-btcl-primary transition-all duration-300 hover:scale-105 hover:bg-btcl-primary hover:text-white"
            >
              {locale === 'en' ? 'Contact Sales' : 'সেলস যোগাযোগ'}
            </Button>
          </Link>
        </div>
      </div>

      <Footer />

      {/* Checkout Modal */}
      {selectedPackage && (
        <CheckoutModal
          pkg={selectedPackage}
          isOpen={isCheckoutOpen}
          onClose={() => {
            setIsCheckoutOpen(false);
            setSelectedPackage(null);
          }}
          serviceType={selectedService}
          locale={locale}
        />
      )}

      {/* Hosted PBX pre-purchase notice */}
      {pbxNoticeOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={cancelPbxPurchase}
        >
          <div
            className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-btcl-primary to-btcl-secondary px-6 py-5 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-2xl">
                ℹ️
              </div>
              <h3 className="text-lg font-bold text-white">
                {locale === 'en'
                  ? 'Before You Subscribe'
                  : 'সাবস্ক্রাইব করার আগে'}
              </h3>
            </div>
            <div className="px-6 py-6">
              <p className="text-gray-700 leading-relaxed">
                {locale === 'en'
                  ? 'Dear Subscriber, you are kindly requested to pre-arrange necessary IP-Phones and Whitelist of your internet IP at BTCL PBX Network. Here, package subscription date is the billing start date.'
                  : 'প্রিয় গ্রাহক, আপনাকে অনুগ্রহ করে প্রয়োজনীয় আইপি-ফোন আগে থেকে ব্যবস্থা করতে এবং বিটিসিএল PBX নেটওয়ার্কে আপনার ইন্টারনেট আইপি হোয়াইটলিস্ট করতে অনুরোধ করা হচ্ছে। এখানে, প্যাকেজ সাবস্ক্রিপশনের তারিখই বিলিং শুরুর তারিখ।'}
              </p>
            </div>
            <div className="px-6 pb-6 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <Button
                onClick={cancelPbxPurchase}
                className="px-6 py-3 rounded-xl font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                {locale === 'en' ? 'Cancel' : 'বাতিল'}
              </Button>
              <Button
                onClick={proceedWithPbxPurchase}
                className="transform rounded-lg border-2 border-btcl-primary bg-white px-6 py-2.5 text-sm font-semibold text-btcl-primary transition-all duration-300 hover:scale-105 hover:bg-btcl-primary hover:text-white"
              >
                {locale === 'en' ? 'Proceed' : 'এগিয়ে যান'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingPage;
