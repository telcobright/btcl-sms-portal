'use client'

import React, { useState, useEffect } from 'react';
import {Footer} from "@/components/layout/Footer";
import {Header} from "@/components/layout/Header";
import {Button} from "@/components/ui/Button";
import Link from "next/link";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/Card";
import { AggregatorTag } from "@/components/ui/AggregatorTag";
import CheckoutModal from "@/components/checkout/CheckoutModal";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { API_BASE_URL, API_ENDPOINTS, FEATURE_FLAGS, PBX_BASE_URL, VBS_BASE_URL, HCC_BASE_URL } from "@/config/api";
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  idPartner?: number;
  email?: string;
  sub?: string;
  roles?: { name: string }[];
}

const PricingPage = ({ params }: { params: Promise<{ locale: string }> }) => {
  const [selectedService, setSelectedService] = useState('hosted-pbx')
  const [locale, setLocale] = React.useState('en')
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<any>(null)
  const [userType, setUserType] = useState<'prepaid' | 'postpaid' | null>(null)
  const [isLoadingUserType, setIsLoadingUserType] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  // activePackages maps service → active pkg id string (e.g. 'hosted-pbx' → 'silver')
  const [activePackages, setActivePackages] = useState<Record<string, string | null>>({})
  // expiredPackages maps service → expired pkg id string
  const [expiredPackages, setExpiredPackages] = useState<Record<string, string | null>>({})
  const [purchaseBlocked, setPurchaseBlocked] = useState(false)
  const [docBlockReason, setDocBlockReason] = useState<'pending' | 'rejected' | null>(null)
  // PBX pre-purchase notice (IP-phones / IP whitelisting)
  const [pbxNoticeOpen, setPbxNoticeOpen] = useState(false)
  const [pbxPendingPkg, setPbxPendingPkg] = useState<{ pkg: any; mode: 'buy' | 'apply' } | null>(null)
  const router = useRouter()

  // Package tier order per service (higher number = higher tier)
  const packageTierOrder: Record<string, Record<string, number>> = {
    'hosted-pbx':      { bronze: 1, silver: 2, gold: 3 },
    'voice-broadcast': { basic: 1, standard: 2, enterprise: 3 },
    'contact-center':  { basic: 1 },
  }

  // Maps packageId integer → pkg.id string used in pricing cards
  const packageIdToSlug: Record<number, string> = {
    9132: 'bronze', 9133: 'silver', 9134: 'gold',
    9135: 'basic',  9136: 'standard', 9137: 'enterprise',
    9140: 'basic',
  }

  const serviceBaseUrls: Record<string, string> = {
    'hosted-pbx':      PBX_BASE_URL,
    'voice-broadcast': VBS_BASE_URL,
    'contact-center':  HCC_BASE_URL,
  }

  const isLoggedIn = () => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('authToken')
    }
    return false
  }

  // Fetch user type from API by decoding JWT token
  useEffect(() => {
    const fetchUserType = async () => {
      if (typeof window === 'undefined') {
        setIsLoadingUserType(false)
        return
      }

      const authToken = localStorage.getItem('authToken')
      if (!authToken) {
        setIsLoadingUserType(false)
        return
      }

      try {
        // Decode JWT token to get idPartner and roles
        const decodedToken = jwtDecode<DecodedToken>(authToken)
        const idPartner = decodedToken?.idPartner

        // Check for ROLE_ADMIN
        const adminRole = decodedToken.roles?.some(
          (role) => role.name === 'ROLE_ADMIN'
        )
        if (adminRole) {
          setIsAdmin(true)
          // Admins are not blocked by doc validation
          setPurchaseBlocked(false)
        }

        if (!idPartner) {
          setIsLoadingUserType(false)
          return
        }

        // Fetch document statuses to check if purchase should be blocked
        if (!adminRole) {
          try {
            const MAJOR_DOCS = ['nidfront', 'nidback', 'tradelicense', 'tin']
            const docRes = await fetch(`${API_BASE_URL}${API_ENDPOINTS.partner.getDocumentStatuses}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
              body: JSON.stringify({ id: idPartner }),
            })
            if (docRes.ok) {
              const docData: Record<string, { status: string; rejectionReason: string }> = await docRes.json()
              const hasRejected = MAJOR_DOCS.some(d => docData[d]?.status === 'REJECTED')
              const hasPending = MAJOR_DOCS.some(d => !docData[d] || docData[d].status === 'PENDING' || docData[d].status === '')
              if (hasRejected) {
                setPurchaseBlocked(true)
                setDocBlockReason('rejected')
              } else if (hasPending) {
                setPurchaseBlocked(true)
                setDocBlockReason('pending')
              }
            }
          } catch { /* silent */ }
        }

        const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.partner.getPartner}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ idPartner }),
        })

        if (response.ok) {
          const data = await response.json()
          // customerPrePaid: 1 = prepaid, 2 = postpaid
          if (data.customerPrePaid === 1) {
            setUserType('prepaid')
          } else if (data.customerPrePaid === 2) {
            setUserType('postpaid')
          }
        } else {
          console.error('Failed to fetch partner data:', response.status)
        }
      } catch (e) {
        console.error('Error fetching partner data:', e)
      } finally {
        setIsLoadingUserType(false)
      }
    }

    const fetchActivePackages = async () => {
      const authToken = localStorage.getItem('authToken')
      if (!authToken) return

      try {
        const decodedToken = jwtDecode<DecodedToken>(authToken)
        const idPartner = decodedToken?.idPartner
        if (!idPartner) return

        const services = ['hosted-pbx', 'voice-broadcast', 'contact-center']
        const results = await Promise.allSettled(
          services.map(async (service) => {
            const baseUrl = serviceBaseUrls[service]

            // Step 1: Check for active package via getPurchaseForPartner
            const activeRes = await fetch(`${baseUrl}${API_ENDPOINTS.package.getPurchaseForPartner}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
              body: JSON.stringify({ idPartner }),
            })
            if (activeRes.ok) {
              const data = await activeRes.json()
              const purchases = Array.isArray(data) ? data : (data?.content ?? data?.data ?? [])
              const active = purchases.find((p: any) =>
                p.idPackage && p.idPackage !== 9999 &&
                p.status === 'ACTIVE' &&
                (!p.expireDate || new Date(p.expireDate) > new Date())
              )
              if (active) {
                return { service, slug: packageIdToSlug[active.idPackage] ?? null, expiredSlug: null }
              }
            }

            // Step 2: No active package — check purchase history for expired packages
            const historyRes = await fetch(`${baseUrl}${API_ENDPOINTS.package.getAllPurchasePartnerWise}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
              body: JSON.stringify({ page: 0, size: 5, idPartner }),
            })
            if (historyRes.ok) {
              const historyData = await historyRes.json()
              const history = Array.isArray(historyData) ? historyData : (historyData?.content ?? historyData?.data ?? [])
              const pastPurchase = history
                .filter((p: any) => p.idPackage && p.idPackage !== 9999)
                .sort((a: any, b: any) => new Date(b.purchaseDate).getTime() - new Date(a.purchaseDate).getTime())
                [0]
              if (pastPurchase) {
                return { service, slug: null, expiredSlug: packageIdToSlug[pastPurchase.idPackage] ?? null }
              }
            }

            return { service, slug: null, expiredSlug: null }
          })
        )

        const activeMap: Record<string, string | null> = {}
        const expiredMap: Record<string, string | null> = {}
        results.forEach((r) => {
          if (r.status === 'fulfilled') {
            activeMap[r.value.service] = r.value.slug
            expiredMap[r.value.service] = r.value.expiredSlug
          }
        })
        setActivePackages(activeMap)
        setExpiredPackages(expiredMap)
      } catch (e) {
        console.error('Failed to fetch active packages:', e)
      }
    }

    fetchUserType()
    fetchActivePackages()
  }, [])

  const handleBuyNow = (pkg: any, service: string) => {
    if (!isLoggedIn()) {
      toast.error(locale === 'en' ? 'Please login to purchase' : 'কেনার জন্য অনুগ্রহ করে লগইন করুন')
      router.push(`/${locale}/login`)
      return
    }
    if (purchaseBlocked) {
      if (docBlockReason === 'rejected') {
        toast.error(locale === 'en'
          ? 'Purchase restricted: One or more required documents have been rejected. Please re-upload from your dashboard.'
          : 'ক্রয় সীমাবদ্ধ: এক বা একাধিক প্রয়োজনীয় নথি প্রত্যাখ্যান করা হয়েছে।')
      } else {
        toast.error(locale === 'en'
          ? 'Purchase restricted: Your documents are under review. BTCL will approve within 3 working days.'
          : 'ক্রয় সীমাবদ্ধ: আপনার নথি পর্যালোচনাধীন। BTCL ৩ কার্যদিবসের মধ্যে অনুমোদন করবে।')
      }
      return
    }
    // Hosted PBX needs a pre-purchase notice (IP-Phones / IP whitelist heads-up)
    if (service === 'hosted-pbx') {
      setSelectedService(service)
      setPbxPendingPkg({ pkg, mode: 'buy' })
      setPbxNoticeOpen(true)
      return
    }
    setSelectedService(service)
    setSelectedPackage(pkg)
    setIsCheckoutOpen(true)
  }

  const handleApply = (pkg: any, service: string) => {
    if (!isLoggedIn()) {
      toast.error(locale === 'en' ? 'Please login to apply' : 'আবেদন করতে অনুগ্রহ করে লগইন করুন')
      router.push(`/${locale}/login`)
      return
    }
    if (purchaseBlocked) {
      if (docBlockReason === 'rejected') {
        toast.error(locale === 'en'
          ? 'Application restricted: One or more required documents have been rejected. Please re-upload from your dashboard.'
          : 'আবেদন সীমাবদ্ধ: এক বা একাধিক প্রয়োজনীয় নথি প্রত্যাখ্যান করা হয়েছে।')
      } else {
        toast.error(locale === 'en'
          ? 'Application restricted: Your documents are under review. BTCL will approve within 3 working days.'
          : 'আবেদন সীমাবদ্ধ: আপনার নথি পর্যালোচনাধীন। BTCL ৩ কার্যদিবসের মধ্যে অনুমোদন করবে।')
      }
      return
    }
    // Hosted PBX needs a pre-purchase notice (IP-Phones / IP whitelist heads-up)
    if (service === 'hosted-pbx') {
      setSelectedService(service)
      setPbxPendingPkg({ pkg, mode: 'apply' })
      setPbxNoticeOpen(true)
      return
    }
    setSelectedService(service)
    setSelectedPackage(pkg)
    setIsCheckoutOpen(true)
  }

  const proceedWithPbxPurchase = () => {
    if (!pbxPendingPkg) {
      setPbxNoticeOpen(false)
      return
    }
    setSelectedPackage(pbxPendingPkg.pkg)
    setPbxNoticeOpen(false)
    setPbxPendingPkg(null)
    setIsCheckoutOpen(true)
  }

  const cancelPbxPurchase = () => {
    setPbxNoticeOpen(false)
    setPbxPendingPkg(null)
  }

  React.useEffect(() => {
    params.then(p => setLocale(p.locale))
  }, [params])

  // Services
  const services = [
    { id: 'hosted-pbx', name: locale === 'en' ? 'Alaap Cloud IP PBX' : 'Alaap Cloud IP PBX', icon: '/alaap_cloud_ip_pbx.png', color: 'green' },
    { id: 'voice-broadcast', name: locale === 'en' ? 'Alaap Cloud Voice Broadcasting Service' : 'Alaap Cloud Voice Broadcasting Service', icon: '/alaap_voice_broadcasting.png', color: 'orange' },
    { id: 'contact-center', name: locale === 'en' ? 'Alaap Cloud Contact Center' : 'Alaap Cloud Contact Center', icon: '/alaap_cloud_contact_center.png', color: 'purple' },
    { id: 'bulk-sms', name: locale === 'en' ? 'Bulk SMS Service' : 'বাল্ক এসএমএস সেবা', icon: '/bulk_sms.png', color: 'blue' },
  ]

  // Bulk SMS slab pricing
  const smsSlabs = [
    { min: 1, max: 20000, rate: 0.32, packageId: 'basic', name: locale === 'en' ? 'Basic' : 'বেসিক' },
    { min: 20001, max: 50000, rate: 0.30, packageId: 'standard', name: locale === 'en' ? 'Standard' : 'স্ট্যান্ডার্ড' },
    { min: 50001, max: Infinity, rate: 0.28, packageId: 'enterprise', name: locale === 'en' ? 'Enterprise' : 'এন্টারপ্রাইজ' },
  ]

  const [smsQuantity, setSmsQuantity] = useState<number | ''>('')

  const getSmsSlab = (qty: number) => smsSlabs.find(s => qty >= s.min && qty <= s.max) || smsSlabs[0]

  const smsCurrentSlab = typeof smsQuantity === 'number' && smsQuantity >= 1 ? getSmsSlab(smsQuantity) : null
  const smsBasePrice = smsCurrentSlab && typeof smsQuantity === 'number' ? Math.ceil(smsQuantity * smsCurrentSlab.rate) : 0
  const smsVat = Math.ceil(smsBasePrice * 0.15)
  const smsTotal = smsBasePrice + smsVat
  const SMS_MAX_TOTAL = 500000
  const SMS_MIN_TOTAL = 10
  const smsExceedsMax = smsTotal > SMS_MAX_TOTAL
  const smsUnderMin = typeof smsQuantity === 'number' && smsQuantity >= 1 && smsTotal < SMS_MIN_TOTAL

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
        locale === 'en' ? 'Social Media Integration' : 'সোশ্যাল মিডিয়া ইন্টিগ্রেশন',
        locale === 'en' ? 'SMS' : 'এসএমএস',
        locale === 'en' ? 'Chat' : 'চ্যাট',
        locale === 'en' ? 'IVR' : 'IVR',
        locale === 'en' ? 'Call Recording' : 'কল রেকর্ডিং',
        locale === 'en' ? 'ACD (Automatic Call Distribution)' : 'ACD (স্বয়ংক্রিয় কল ডিস্ট্রিবিউশন)',
        locale === 'en' ? 'Reporting' : 'রিপোর্টিং'
      ]
    }
  ]

  // Hosted PBX Pricing
  const pbxPackages = [
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
      popular: false,
      features: [
        locale === 'en' ? '10 Extensions' : '১০টি এক্সটেনশন',
        locale === 'en' ? '5 Call Channels' : '৫টি কল চ্যানেল',
        locale === 'en' ? '2 IVR' : '২টি IVR',
        locale === 'en' ? '500 Minutes Free Talktime' : '৫০০ মিনিট ফ্রি টকটাইম',
        locale === 'en' ? 'Call Monitoring' : 'কল মনিটরিং',
        locale === 'en' ? 'Voice Message to Email' : 'ভয়েস মেসেজ টু ইমেইল',
        locale === 'en' ? 'Call Forwarding' : 'কল ফরওয়ার্ডিং',
        locale === 'en' ? 'Conference Calling' : 'কনফারেন্স কলিং',
        locale === 'en' ? 'Multi-Device Support' : 'মাল্টি-ডিভাইস সাপোর্ট',
        locale === 'en' ? 'Call Recording' : 'কল রেকর্ডিং',
        locale === 'en' ? '৳0.45/min Call Charge' : '৳০.৪৫/মিনিট কল চার্জ'
      ]
    },
    {
      id: 'silver',
      name: locale === 'en' ? 'Silver' : 'সিলভার',
      extensions: 30,
      callChannels: 7,
      ivr: 5,
      freeTalktime: 1000,
      callCharge: 0.40,
      price: 2500,
      postpaidCredit: 10000,
      popular: true,
      features: [
        locale === 'en' ? '30 Extensions' : '৩০টি এক্সটেনশন',
        locale === 'en' ? '7 Call Channels' : '৭টি কল চ্যানেল',
        locale === 'en' ? '5 IVR' : '৫টি IVR',
        locale === 'en' ? '1000 Minutes Free Talktime' : '১০০০ মিনিট ফ্রি টকটাইম',
        locale === 'en' ? 'Call Monitoring' : 'কল মনিটরিং',
        locale === 'en' ? 'Voice Message to Email' : 'ভয়েস মেসেজ টু ইমেইল',
        locale === 'en' ? 'Call Forwarding' : 'কল ফরওয়ার্ডিং',
        locale === 'en' ? 'Conference Calling' : 'কনফারেন্স কলিং',
        locale === 'en' ? 'Multi-Device Support' : 'মাল্টি-ডিভাইস সাপোর্ট',
        locale === 'en' ? 'Call Recording' : 'কল রেকর্ডিং',
        locale === 'en' ? '৳0.40/min Call Charge' : '৳০.৪০/মিনিট কল চার্জ'
      ]
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
        locale === 'en' ? 'Up to 100 Extensions*' : '১০০টি পর্যন্ত এক্সটেনশন*',
        locale === 'en' ? '15 Call Channels' : '১৫টি কল চ্যানেল',
        locale === 'en' ? '10 IVR' : '১০টি IVR',
        locale === 'en' ? '3000 Minutes Free Talktime' : '৩০০০ মিনিট ফ্রি টকটাইম',
        locale === 'en' ? 'Call Monitoring' : 'কল মনিটরিং',
        locale === 'en' ? 'Voice Message to Email' : 'ভয়েস মেসেজ টু ইমেইল',
        locale === 'en' ? 'Call Forwarding' : 'কল ফরওয়ার্ডিং',
        locale === 'en' ? 'Conference Calling' : 'কনফারেন্স কলিং',
        locale === 'en' ? 'Multi-Device Support' : 'মাল্টি-ডিভাইস সাপোর্ট',
        locale === 'en' ? 'Call Recording' : 'কল রেকর্ডিং',
        locale === 'en' ? '৳0.35/min Call Charge' : '৳০.৩৫/মিনিট কল চার্জ'
      ]
    }
  ]

  // Voice Broadcast slab pricing
  const vbsSlabs = [
    { min: 1, max: 20000, rate: 0.90, packageId: 'basic', packageIdInt: 9135, name: locale === 'en' ? 'Basic' : 'বেসিক' },
    { min: 20001, max: 50000, rate: 0.80, packageId: 'standard', packageIdInt: 9136, name: locale === 'en' ? 'Standard' : 'স্ট্যান্ডার্ড' },
    { min: 50001, max: Infinity, rate: 0.60, packageId: 'enterprise', packageIdInt: 9137, name: locale === 'en' ? 'Enterprise' : 'এন্টারপ্রাইজ' },
  ]

  const [vbsQuantity, setVbsQuantity] = useState<number | ''>('')

  const getVbsSlab = (qty: number) => vbsSlabs.find(s => qty >= s.min && qty <= s.max) || vbsSlabs[0]

  const vbsCurrentSlab = typeof vbsQuantity === 'number' && vbsQuantity >= 1 ? getVbsSlab(vbsQuantity) : null
  const vbsBasePrice = vbsCurrentSlab && typeof vbsQuantity === 'number' ? Math.ceil(vbsQuantity * vbsCurrentSlab.rate) : 0
  const vbsVat = Math.ceil(vbsBasePrice * 0.15)
  const vbsTotal = vbsBasePrice + vbsVat
  const VBS_MAX_TOTAL = 500000
  const VBS_MIN_TOTAL = 10
  const vbsExceedsMax = vbsTotal > VBS_MAX_TOTAL
  const vbsUnderMin = typeof vbsQuantity === 'number' && vbsQuantity >= 1 && vbsTotal < VBS_MIN_TOTAL

  const handleVbsBuyNow = () => {
    if (!isLoggedIn()) {
      toast.error(locale === 'en' ? 'Please login to purchase' : 'ক্রয় করতে অনুগ্রহ করে লগইন করুন')
      router.push(`/${locale}/login`)
      return
    }
    if (purchaseBlocked) {
      if (docBlockReason === 'rejected') {
        toast.error(locale === 'en' ? 'Purchase restricted: Documents rejected.' : 'ক্রয় সীমাবদ্ধ: নথি প্রত্যাখ্যাত।')
      } else {
        toast.error(locale === 'en' ? 'Purchase restricted: Documents under review.' : 'ক্রয় সীমাবদ্ধ: নথি পর্যালোচনাধীন।')
      }
      return
    }
    if (!vbsCurrentSlab || typeof vbsQuantity !== 'number' || vbsQuantity < 1) {
      toast.error(locale === 'en' ? 'Please enter a valid quantity (minimum 1)' : 'অনুগ্রহ করে সঠিক পরিমাণ লিখুন (সর্বনিম্ন ১)')
      return
    }
    if (vbsUnderMin) {
      toast.error(locale === 'en' ? 'Minimum purchase amount is ৳10' : 'সর্বনিম্ন ক্রয় পরিমাণ ৳১০')
      return
    }
    if (vbsExceedsMax) {
      toast.error(locale === 'en' ? 'Total amount cannot exceed ৳5,00,000 per purchase' : 'প্রতি ক্রয়ে মোট পরিমাণ ৳৫,০০,০০০ এর বেশি হতে পারবে না')
      return
    }
    setSelectedService('voice-broadcast')
    setSelectedPackage({
      id: vbsCurrentSlab.packageId,
      name: vbsCurrentSlab.name,
      price: vbsBasePrice,
      rate: vbsCurrentSlab.rate,
      vbsQuantity: vbsQuantity,
      features: [],
    })
    setIsCheckoutOpen(true)
  }

  // Kept for compatibility with renderSection/getCurrentPackages
  const voiceBroadcastPackages: any[] = []

  const getCurrentPackages = () => {
    switch (selectedService) {
      case 'hosted-pbx': return pbxPackages
      case 'voice-broadcast': return voiceBroadcastPackages
      case 'contact-center': return contactCenterPackages
      default: return pbxPackages
    }
  }

  const getServiceColor = (_color: string) => 'from-btcl-primary to-btcl-primary'

  // Renders the action button for a prepaid card
  const renderPrepaidButton = (pkg: any, serviceId: string) => {
    if (typeof pkg.price !== 'number') {
      return (
        <Link href={`/${locale}/contact`}>
          <Button className="w-full transform rounded-lg border-2 border-btcl-primary bg-white px-6 py-2.5 text-sm font-semibold text-btcl-primary transition-all duration-300 hover:scale-105 hover:bg-btcl-primary hover:text-white">
            {locale === 'en' ? 'Contact Sales' : 'সেলস যোগাযোগ'}
          </Button>
        </Link>
      )
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
          <p className={`text-xs text-center ${docBlockReason === 'rejected' ? 'text-red-500' : 'text-amber-600'}`}>
            {docBlockReason === 'rejected'
              ? (locale === 'en' ? 'Documents rejected — re-upload required' : 'নথি প্রত্যাখ্যাত — পুনরায় আপলোড প্রয়োজন')
              : (locale === 'en' ? 'Documents under review (up to 3 working days)' : 'নথি পর্যালোচনাধীন (৩ কার্যদিবস পর্যন্ত)')}
          </p>
        </div>
      )
    }
    if (activePackages[serviceId] === pkg.id) {
      return (
        <div className="w-full py-3 px-6 rounded-xl font-semibold text-sm text-center bg-gray-100 text-gray-500 border-2 border-gray-200 cursor-not-allowed select-none">
          ✓ {locale === 'en' ? 'Current Plan' : 'বর্তমান প্ল্যান'}
        </div>
      )
    }
    if (activePackages[serviceId]) {
      const tiers = packageTierOrder[serviceId] ?? {}
      const activeTier = tiers[activePackages[serviceId]!] ?? 0
      const thisTier = tiers[pkg.id] ?? 0
      const isUpgrade = thisTier > activeTier
      return (
        <Button
          onClick={() => handleBuyNow(pkg, serviceId)}
          className="w-full transform rounded-lg border-2 border-btcl-primary bg-white px-6 py-2.5 text-sm font-semibold text-btcl-primary transition-all duration-300 hover:scale-105 hover:bg-btcl-primary hover:text-white"
        >
          {isUpgrade ? (locale === 'en' ? '↑ Upgrade Plan' : '↑ আপগ্রেড করুন') : (locale === 'en' ? '↓ Downgrade Plan' : '↓ ডাউনগ্রেড করুন')}
        </Button>
      )
    }
    if (expiredPackages[serviceId] === pkg.id) {
      return (
        <Button onClick={() => handleBuyNow(pkg, serviceId)} className="w-full transform rounded-lg border-2 border-btcl-primary bg-white px-6 py-2.5 text-sm font-semibold text-btcl-primary transition-all duration-300 hover:scale-105 hover:bg-btcl-primary hover:text-white">
          ↻ {locale === 'en' ? 'Renew Plan' : 'প্ল্যান নবায়ন করুন'}
        </Button>
      )
    }
    return (
      <Button
        onClick={() => handleBuyNow(pkg, serviceId)}
        className="w-full transform rounded-lg border-2 border-btcl-primary bg-white px-6 py-2.5 text-sm font-semibold text-btcl-primary transition-all duration-300 hover:scale-105 hover:bg-btcl-primary hover:text-white"
      >
        {locale === 'en' ? 'Buy Now' : 'এখনই কিনুন'}
      </Button>
    )
  }

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
    const isSingle = packages.length === 1
    return (
      <div id={serviceId} className={`py-20 ${bgClass}`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl mb-4 ${accentClass}`}>
              {icon.startsWith('/') ? (
                <img src={icon} alt="" className="h-10 w-10 object-contain" />
              ) : (
                <span className="text-4xl">{icon}</span>
              )}
              <h2 className="text-2xl font-bold">{locale === 'en' ? titleEn : titleBn}</h2>
              {isPostpaid && !FEATURE_FLAGS.POSTPAID_ENABLED && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300 uppercase tracking-wider">
                  {locale === 'en' ? 'Coming Soon' : 'শীঘ্রই আসছে'}
                </span>
              )}
            </div>
            <p className="text-gray-600 text-lg">{locale === 'en' ? subtitleEn : subtitleBn}</p>
            {isPostpaid && (
              <div className="mt-4 max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  <strong>{locale === 'en' ? 'Eligibility: ' : 'যোগ্যতা: '}</strong>
                  {locale === 'en' ? 'Only applicable for Government / Semi-Government / Autonomous Organisations.' : 'শুধুমাত্র সরকারি / আধা-সরকারি / স্বায়ত্তশাসিত প্রতিষ্ঠানের জন্য।'}
                </p>
              </div>
            )}
          </div>

          {/* Cards Grid */}
          <div className={`grid gap-8 ${isSingle ? 'grid-cols-1 max-w-md mx-auto' : 'grid-cols-1 md:grid-cols-3'}`}>
            {packages.map((pkg: any) => (
              <div key={`${isPostpaid ? 'post' : 'pre'}-${serviceId}-${pkg.id}`}
                   className={`group relative bg-white rounded-2xl border border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:border-btcl-primary hover:shadow-2xl ${pkg.popular ? 'border-amber-400 border-2 shadow-2xl' : 'overflow-hidden'}`}>
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-btcl-primary to-btcl-primaryLight transition-opacity duration-300 ${pkg.popular ? 'opacity-0' : 'opacity-0 group-hover:opacity-100'}`} />
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
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{pkg.name}</h3>
                    <div className="mb-4">
                      {serviceId === 'voice-broadcast' ? (
                        <>
                          <span className="text-3xl font-bold text-gray-900">৳{pkg.rate.toFixed(2)}</span>
                          <span className="text-sm text-gray-600">/{locale === 'en' ? 'message' : 'মেসেজ'}</span>
                          <div className="text-xs text-gray-500 mt-2">{pkg.messages} {locale === 'en' ? 'VB Messages' : 'ভিবি মেসেজ'}</div>
                        </>
                      ) : serviceId === 'hosted-pbx' ? (
                        <>
                          <span className="text-3xl font-bold text-gray-900">৳{pkg.price.toLocaleString()}</span>
                          <span className="text-sm text-gray-600">/{locale === 'en' ? 'month' : 'মাস'}</span>
                          <div className="text-xs text-gray-500 mt-2">
                            {typeof pkg.extensions === 'number' ? `${pkg.extensions} ${locale === 'en' ? 'Extensions' : 'এক্সটেনশন'}` : pkg.extensions}
                          </div>
                          {isPostpaid && (
                            <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                              <div className="text-xs text-blue-600 font-medium mb-1">{locale === 'en' ? 'Postpaid Credit Limit' : 'পোস্টপেইড ক্রেডিট সীমা'}</div>
                              <div className="text-lg font-bold text-blue-900">
                                ৳{Math.ceil(pkg.price * 1.15 * 2).toLocaleString()}
                                <span className="text-sm font-normal text-blue-700">/{locale === 'en' ? 'month' : 'মাস'}</span>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        /* contact-center */
                        <>
                          <span className="text-3xl font-bold text-gray-900">৳{pkg.price.toLocaleString()}</span>
                          <span className="text-sm text-gray-600">/{locale === 'en' ? 'month' : 'মাস'}</span>
                          <div className="text-xs text-gray-500 mt-2">{typeof pkg.users === 'number' ? `${pkg.users} ${locale === 'en' ? 'Users' : 'ব্যবহারকারী'}` : pkg.users}</div>
                          {isPostpaid && (
                            <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                              <div className="text-xs text-blue-600 font-medium mb-1">{locale === 'en' ? 'Postpaid Credit Limit' : 'পোস্টপেইড ক্রেডিট সীমা'}</div>
                              <div className="text-lg font-bold text-blue-900">
                                ৳{Math.ceil(pkg.price * 1.15 * 2).toLocaleString()}
                                <span className="text-sm font-normal text-blue-700">/{locale === 'en' ? 'month' : 'মাস'}</span>
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
                        <Button disabled className="w-full py-3 px-6 rounded-xl font-semibold text-sm bg-gray-300 text-gray-600 cursor-not-allowed">
                          {locale === 'en' ? 'Coming Soon' : 'শীঘ্রই আসছে'}
                        </Button>
                      ) : typeof pkg.price === 'number' ? (
                        <Button onClick={() => handleApply(pkg, serviceId)} className="w-full transform rounded-lg border-2 border-btcl-primary bg-white px-6 py-2.5 text-sm font-semibold text-btcl-primary transition-all duration-300 hover:scale-105 hover:bg-btcl-primary hover:text-white">
                          {locale === 'en' ? 'Apply' : 'আবেদন করুন'}
                        </Button>
                      ) : (
                        <Link href={`/${locale}/contact`}><Button className="w-full transform rounded-lg border-2 border-btcl-primary bg-white px-6 py-2.5 text-sm font-semibold text-btcl-primary transition-all duration-300 hover:scale-105 hover:bg-btcl-primary hover:text-white">{locale === 'en' ? 'Contact Sales' : 'সেলস যোগাযোগ'}</Button></Link>
                      )
                    ) : renderPrepaidButton(pkg, serviceId)}
                  </div>

                  {/* Features */}
                  <div className="space-y-2">
                    {pkg.features.map((feature: string, index: number) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-btcl-primaryLight/10">
                          <svg className="h-3 w-3 text-btcl-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <span className="text-sm font-medium text-gray-700 leading-snug">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const showPrepaid = isAdmin || isLoadingUserType || userType === null || userType === 'prepaid'
  const showPostpaid = isAdmin || (!isLoadingUserType && (userType === 'postpaid' || (userType === null && !isLoggedIn())))

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
                ? 'Transparent pricing for all our enterprise communication services. Choose the plan that fits your business needs.'
                : 'আমাদের সমস্ত এন্টারপ্রাইজ যোগাযোগ সেবার জন্য স্বচ্ছ মূল্য। আপনার ব্যবসায়িক প্রয়োজন অনুযায়ী পরিকল্পনা চয়ন করুন।'}
            </p>
            {/* Quick jump links */}
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {[
                { id: 'hosted-pbx', icon: '/alaap_cloud_ip_pbx.png', en: 'Alaap Cloud IP PBX', bn: 'Alaap Cloud IP PBX' },
                { id: 'voice-broadcast', icon: '/alaap_voice_broadcasting.png', en: 'Alaap Cloud Voice Broadcasting Service', bn: 'Alaap Cloud Voice Broadcasting Service' },
                { id: 'contact-center', icon: '/alaap_cloud_contact_center.png', en: 'Alaap Cloud Contact Center', bn: 'Alaap Cloud Contact Center' },
                { id: 'bulk-sms', icon: '/bulk_sms.png', en: 'Bulk SMS Service', bn: 'বাল্ক এসএমএস সেবা' },
                { id: 'short-code', icon: '🔢', en: 'Short Code Parking', bn: 'শর্ট কোড পার্কিং' },
              ].map(s => (
                <a key={s.id} href={`#${s.id}`} className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-full text-sm font-medium transition-colors">
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
            <div className={`rounded-xl border-2 p-5 flex items-start gap-4 ${docBlockReason === 'rejected' ? 'bg-red-50 border-red-300' : 'bg-amber-50 border-amber-300'}`}>
              <div className={`p-2.5 rounded-lg ${docBlockReason === 'rejected' ? 'bg-red-100' : 'bg-amber-100'}`}>
                <svg className={`w-6 h-6 ${docBlockReason === 'rejected' ? 'text-red-600' : 'text-amber-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className={`font-bold ${docBlockReason === 'rejected' ? 'text-red-800' : 'text-amber-800'}`}>
                  {docBlockReason === 'rejected'
                    ? (locale === 'en' ? 'Purchase Disabled — Documents Rejected' : 'ক্রয় নিষ্ক্রিয় — নথি প্রত্যাখ্যাত')
                    : (locale === 'en' ? 'Purchase Disabled — Documents Under Review' : 'ক্রয় নিষ্ক্রিয় — নথি পর্যালোচনাধীন')}
                </h3>
                <p className={`text-sm mt-1 ${docBlockReason === 'rejected' ? 'text-red-700' : 'text-amber-700'}`}>
                  {docBlockReason === 'rejected'
                    ? (locale === 'en'
                      ? 'One or more required documents (NID Front, NID Back, Trade License, TIN) have been rejected. Please re-upload corrected documents from your dashboard. BTCL will review within 3 working days.'
                      : 'এক বা একাধিক প্রয়োজনীয় নথি প্রত্যাখ্যান করা হয়েছে। অনুগ্রহ করে আপনার ড্যাশবোর্ড থেকে সংশোধিত নথি পুনরায় আপলোড করুন।')
                    : (locale === 'en'
                      ? 'BTCL will review and approve your required documents (NID Front, NID Back, Trade License, TIN) within 3 working days. Document approval is mandatory before making any purchase.'
                      : 'BTCL আপনার প্রয়োজনীয় নথি (NID সামনে, NID পিছনে, ট্রেড লাইসেন্স, TIN) ৩ কার্যদিবসের মধ্যে পর্যালোচনা ও অনুমোদন করবে। যেকোনো ক্রয়ের আগে নথি অনুমোদন বাধ্যতামূলক।')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Prepaid Sections ── */}
        {showPrepaid && (
          <>
            {renderSection('hosted-pbx', '/alaap_cloud_ip_pbx.png',
              'Alaap Cloud IP PBX', 'Alaap Cloud IP PBX',
              'Monthly subscription pricing', 'মাসিক সাবস্ক্রিপশন মূল্য',
              pbxPackages, 'bg-white', 'bg-btcl-primaryLight/10 text-btcl-primaryDark'
            )}
            {/* Voice Broadcast — Slab-based pricing */}
            <div id="voice-broadcast" className="py-20 bg-btcl-primaryLight/5">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl mb-4 bg-btcl-primaryLight/10 text-btcl-primaryDark">
                    <img src="/alaap_voice_broadcasting.png" alt="" className="h-10 w-10 object-contain" />
                    <h2 className="text-2xl font-bold">{locale === 'en' ? 'Alaap Cloud Voice Broadcasting Service' : 'Alaap Cloud Voice Broadcasting Service'}</h2>
                  </div>
                  <p className="text-gray-600 text-lg">{locale === 'en' ? 'Pay per message — volume-based pricing' : 'প্রতি মেসেজ মূল্য — পরিমাণ ভিত্তিক'}</p>
                </div>

                {/* Slab Rate Table */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-btcl-primaryLight/10">
                        <th className="px-6 py-4 text-left font-semibold text-gray-700">{locale === 'en' ? 'Message Range' : 'মেসেজ পরিসীমা'}</th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-700">{locale === 'en' ? 'Slab' : 'স্ল্যাব'}</th>
                        <th className="px-6 py-4 text-right font-semibold text-gray-700">{locale === 'en' ? 'Rate / Message' : 'প্রতি মেসেজ রেট'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vbsSlabs.map((slab, idx) => (
                        <tr key={idx} className={`border-t border-gray-100 ${vbsCurrentSlab === slab ? 'bg-btcl-primaryLight/10 font-semibold' : ''}`}>
                          <td className="px-6 py-3 text-gray-800">
                            {slab.max === Infinity
                              ? `${slab.min.toLocaleString()}+`
                              : `${slab.min.toLocaleString()} – ${slab.max.toLocaleString()}`}
                          </td>
                          <td className="px-6 py-3 text-gray-600">{slab.name}</td>
                          <td className="px-6 py-3 text-right text-gray-800">৳{slab.rate.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Quantity Input + Price Calculator */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left — Input */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {locale === 'en' ? 'Enter Number of Messages' : 'মেসেজ সংখ্যা লিখুন'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={vbsQuantity}
                        onChange={(e) => {
                          const val = e.target.value
                          setVbsQuantity(val === '' ? '' : Math.max(1, parseInt(val) || 1))
                        }}
                        placeholder={locale === 'en' ? 'e.g. 15000' : 'যেমন ১৫০০০'}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 text-lg text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-btcl-primary focus:border-btcl-primary outline-none"
                      />
                      {vbsCurrentSlab && (
                        <p className="mt-2 text-sm text-btcl-primary font-medium">
                          {locale === 'en' ? `Slab: ${vbsCurrentSlab.name} — ৳${vbsCurrentSlab.rate.toFixed(2)}/message` : `স্ল্যাব: ${vbsCurrentSlab.name} — ৳${vbsCurrentSlab.rate.toFixed(2)}/মেসেজ`}
                        </p>
                      )}
                      {vbsUnderMin && (
                        <p className="mt-1 text-sm text-red-600 font-medium">
                          {locale === 'en' ? 'Minimum purchase amount is ৳10 (incl. VAT)' : 'সর্বনিম্ন ক্রয় পরিমাণ ৳১০ (ভ্যাটসহ)'}
                        </p>
                      )}
                      {vbsExceedsMax && (
                        <p className="mt-1 text-sm text-red-600 font-medium">
                          {locale === 'en' ? 'Maximum purchase limit is ৳5,00,000 (incl. VAT)' : 'সর্বোচ্চ ক্রয় সীমা ৳৫,০০,০০০ (ভ্যাটসহ)'}
                        </p>
                      )}
                    </div>

                    {/* Right — Price Breakdown */}
                    <div className="space-y-3">
                      {vbsCurrentSlab && typeof vbsQuantity === 'number' && vbsQuantity >= 1 ? (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">{typeof vbsQuantity === 'number' ? vbsQuantity.toLocaleString() : 0} × ৳{vbsCurrentSlab.rate.toFixed(2)}</span>
                            <span className="font-medium">৳{vbsBasePrice.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">{locale === 'en' ? 'VAT (15%)' : 'ভ্যাট (১৫%)'}</span>
                            <span>৳{vbsVat.toLocaleString()}</span>
                          </div>
                          <hr className="border-gray-200" />
                          <div className="flex justify-between text-lg font-bold">
                            <span>{locale === 'en' ? 'Total' : 'মোট'}</span>
                            <span className="text-btcl-primary">৳{vbsTotal.toLocaleString()}</span>
                          </div>
                          <div className="text-xs text-gray-500">{locale === 'en' ? 'Validity: 5 Years' : 'মেয়াদ: ৫ বছর'}</div>

                          {purchaseBlocked && isLoggedIn() ? (
                            <button disabled className="w-full mt-4 py-3 rounded-xl font-semibold text-lg bg-gray-300 text-gray-600 cursor-not-allowed">
                              {locale === 'en' ? 'Purchase Disabled' : 'ক্রয় নিষ্ক্রিয়'}
                            </button>
                          ) : vbsUnderMin ? (
                            <button disabled className="w-full mt-4 py-3 rounded-xl font-semibold text-lg bg-red-100 text-red-400 cursor-not-allowed">
                              {locale === 'en' ? 'Minimum ৳10 Required' : 'সর্বনিম্ন ৳১০ প্রয়োজন'}
                            </button>
                          ) : vbsExceedsMax ? (
                            <button disabled className="w-full mt-4 py-3 rounded-xl font-semibold text-lg bg-red-100 text-red-400 cursor-not-allowed">
                              {locale === 'en' ? 'Limit Exceeded (max ৳5,00,000)' : 'সীমা অতিক্রান্ত (সর্বোচ্চ ৳৫,০০,০০০)'}
                            </button>
                          ) : (
                            <button onClick={handleVbsBuyNow} className="w-full mt-4 transform rounded-lg border-2 border-btcl-primary bg-white py-2.5 px-6 text-sm font-semibold text-btcl-primary transition-all duration-300 hover:scale-105 hover:bg-btcl-primary hover:text-white">
                              {locale === 'en' ? 'Buy Now' : 'এখনই কিনুন'}
                            </button>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                          {locale === 'en' ? 'Enter quantity to see pricing' : 'মূল্য দেখতে পরিমাণ লিখুন'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {renderSection('contact-center', '/alaap_cloud_contact_center.png',
              'Alaap Cloud Contact Center', 'Alaap Cloud Contact Center',
              'Monthly subscription pricing', 'মাসিক সাবস্ক্রিপশন মূল্য',
              contactCenterPackages, 'bg-white', 'bg-btcl-primaryLight/10 text-btcl-primaryDark'
            )}
            {/* Bulk SMS — Slab-based pricing */}
            <div id="bulk-sms" className="py-20 bg-btcl-primaryLight/5">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                  <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl mb-4 bg-btcl-primaryLight/10 text-btcl-primaryDark">
                    <img src="/bulk_sms.png" alt="" className="h-10 w-10 object-contain" />
                    <h2 className="text-2xl font-bold">{locale === 'en' ? 'Bulk SMS Service' : 'বাল্ক এসএমএস সেবা'}</h2>
                  </div>
                  <p className="text-gray-600 text-lg">{locale === 'en' ? 'Pay per message — volume-based pricing' : 'প্রতি মেসেজ মূল্য — পরিমাণ ভিত্তিক'}</p>
                  <div className="mt-3 flex justify-center">
                    <AggregatorTag />
                  </div>
                </div>

                {/* Slab Rate Table */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden mb-8">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-btcl-primaryLight/10">
                        <th className="px-6 py-4 text-left font-semibold text-gray-700">{locale === 'en' ? 'Message Range' : 'মেসেজ পরিসীমা'}</th>
                        <th className="px-6 py-4 text-left font-semibold text-gray-700">{locale === 'en' ? 'Slab' : 'স্ল্যাব'}</th>
                        <th className="px-6 py-4 text-right font-semibold text-gray-700">{locale === 'en' ? 'Rate / Message' : 'প্রতি মেসেজ রেট'}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {smsSlabs.map((slab, idx) => (
                        <tr key={idx} className={`border-t border-gray-100 ${smsCurrentSlab === slab ? 'bg-btcl-primaryLight/10 font-semibold' : ''}`}>
                          <td className="px-6 py-3 text-gray-800">
                            {slab.max === Infinity
                              ? `${slab.min.toLocaleString()}+`
                              : `${slab.min.toLocaleString()} – ${slab.max.toLocaleString()}`}
                          </td>
                          <td className="px-6 py-3 text-gray-600">{slab.name}</td>
                          <td className="px-6 py-3 text-right text-gray-800">৳{slab.rate.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Quantity Input + Price Calculator */}
                <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Left — Input */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {locale === 'en' ? 'Enter Number of Messages' : 'মেসেজ সংখ্যা লিখুন'}
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={smsQuantity}
                        onChange={(e) => {
                          const val = e.target.value
                          setSmsQuantity(val === '' ? '' : Math.max(1, parseInt(val) || 1))
                        }}
                        placeholder={locale === 'en' ? 'e.g. 15000' : 'যেমন ১৫০০০'}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 text-lg text-gray-900 bg-white placeholder-gray-400 focus:ring-2 focus:ring-btcl-primary focus:border-btcl-primary outline-none"
                      />
                      {smsCurrentSlab && (
                        <p className="mt-2 text-sm text-btcl-primary font-medium">
                          {locale === 'en' ? `Slab: ${smsCurrentSlab.name} — ৳${smsCurrentSlab.rate.toFixed(2)}/message` : `স্ল্যাব: ${smsCurrentSlab.name} — ৳${smsCurrentSlab.rate.toFixed(2)}/মেসেজ`}
                        </p>
                      )}
                      {smsUnderMin && (
                        <p className="mt-1 text-sm text-red-600 font-medium">
                          {locale === 'en' ? 'Minimum purchase amount is ৳10 (incl. VAT)' : 'সর্বনিম্ন ক্রয় পরিমাণ ৳১০ (ভ্যাটসহ)'}
                        </p>
                      )}
                      {smsExceedsMax && (
                        <p className="mt-1 text-sm text-red-600 font-medium">
                          {locale === 'en' ? 'Maximum purchase limit is ৳5,00,000 (incl. VAT)' : 'সর্বোচ্চ ক্রয় সীমা ৳৫,০০,০০০ (ভ্যাটসহ)'}
                        </p>
                      )}
                    </div>

                    {/* Right — Price Breakdown */}
                    <div className="space-y-3">
                      {smsCurrentSlab && typeof smsQuantity === 'number' && smsQuantity >= 1 ? (
                        <>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">{typeof smsQuantity === 'number' ? smsQuantity.toLocaleString() : 0} × ৳{smsCurrentSlab.rate.toFixed(2)}</span>
                            <span className="font-medium">৳{smsBasePrice.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">{locale === 'en' ? 'VAT (15%)' : 'ভ্যাট (১৫%)'}</span>
                            <span>৳{smsVat.toLocaleString()}</span>
                          </div>
                          <hr className="border-gray-200" />
                          <div className="flex justify-between text-lg font-bold">
                            <span>{locale === 'en' ? 'Total' : 'মোট'}</span>
                            <span className="text-btcl-primary">৳{smsTotal.toLocaleString()}</span>
                          </div>
                          <div className="text-xs text-gray-500">{locale === 'en' ? 'Validity: 5 Years' : 'মেয়াদ: ৫ বছর'}</div>

                          {purchaseBlocked && isLoggedIn() ? (
                            <button disabled className="w-full mt-4 py-3 rounded-xl font-semibold text-lg bg-gray-300 text-gray-600 cursor-not-allowed">
                              {locale === 'en' ? 'Purchase Disabled' : 'ক্রয় নিষ্ক্রিয়'}
                            </button>
                          ) : smsUnderMin ? (
                            <button disabled className="w-full mt-4 py-3 rounded-xl font-semibold text-lg bg-red-100 text-red-400 cursor-not-allowed">
                              {locale === 'en' ? 'Minimum ৳10 Required' : 'সর্বনিম্ন ৳১০ প্রয়োজন'}
                            </button>
                          ) : smsExceedsMax ? (
                            <button disabled className="w-full mt-4 py-3 rounded-xl font-semibold text-lg bg-red-100 text-red-400 cursor-not-allowed">
                              {locale === 'en' ? 'Limit Exceeded (max ৳5,00,000)' : 'সীমা অতিক্রান্ত (সর্বোচ্চ ৳৫,০০,০০০)'}
                            </button>
                          ) : (
                            <Link href={`/${locale}/contact`} className="block">
                              <button className="w-full mt-4 transform rounded-lg border-2 border-btcl-primary bg-white py-2.5 px-6 text-sm font-semibold text-btcl-primary transition-all duration-300 hover:scale-105 hover:bg-btcl-primary hover:text-white">
                                {locale === 'en' ? 'Buy Now' : 'এখনই কিনুন'}
                              </button>
                            </Link>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                          {locale === 'en' ? 'Enter quantity to see pricing' : 'মূল্য দেখতে পরিমাণ লিখুন'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── Postpaid Sections ── */}
        {showPostpaid && (
          <>
            {renderSection('hosted-pbx', '/alaap_cloud_ip_pbx.png',
              'Alaap Cloud IP PBX — Postpaid', 'Alaap Cloud IP PBX — পোস্টপেইড',
              'Monthly subscription pricing', 'মাসিক সাবস্ক্রিপশন মূল্য',
              pbxPackages, 'bg-white', 'bg-btcl-primaryLight/10 text-btcl-primaryDark',
              true
            )}
            {renderSection('contact-center', '/alaap_cloud_contact_center.png',
              'Alaap Cloud Contact Center — Postpaid', 'Alaap Cloud Contact Center — পোস্টপেইড',
              'Monthly subscription pricing', 'মাসিক সাবস্ক্রিপশন মূল্য',
              contactCenterPackages, 'bg-btcl-primaryLight/5', 'bg-btcl-primaryLight/10 text-btcl-primaryDark',
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
                  {locale === 'en' ? 'Short Code Parking Service' : 'শর্ট কোড পার্কিং সেবা'}
                </h2>
              </div>
              <p className="text-gray-600 text-lg">
                {locale === 'en' ? 'Under IPTSP License — One-Time Charges (OTC)' : 'IPTSP লাইসেন্সের অধীনে — এককালীন চার্জ (OTC)'}
              </p>
            </div>

            {/* Cards Grid - 3 cards matching theme */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Security Deposit */}
              <div className="group relative overflow-hidden bg-white rounded-2xl border border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:border-btcl-primary hover:shadow-2xl p-7"><div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-btcl-primary to-btcl-primaryLight opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="text-center mb-6">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-r from-btcl-primary to-btcl-primary text-2xl transition-all duration-300 group-hover:scale-110">
                    🔒
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-gray-900">
                    {locale === 'en' ? 'Security Deposit' : 'সিকিউরিটি ডিপোজিট'}
                  </h3>
                  <div className="text-sm text-gray-500 mb-4">{locale === 'en' ? 'Per Number' : 'প্রতি নম্বর'}</div>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">৳1,000</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-btcl-primaryLight/10">
                      <svg className="h-3 w-3 text-btcl-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700 leading-snug">{locale === 'en' ? 'Refundable deposit' : 'ফেরতযোগ্য ডিপোজিট'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-btcl-primaryLight/10">
                      <svg className="h-3 w-3 text-btcl-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700 leading-snug">{locale === 'en' ? 'Per short code number' : 'প্রতি শর্ট কোড নম্বর'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-btcl-primaryLight/10">
                      <svg className="h-3 w-3 text-btcl-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700 leading-snug">{locale === 'en' ? 'One-time payment' : 'এককালীন পেমেন্ট'}</span>
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
                  <div className="text-sm text-gray-500 mb-4">{locale === 'en' ? 'One-Time' : 'এককালীন'}</div>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">৳5,000</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-btcl-primaryLight/10">
                      <svg className="h-3 w-3 text-btcl-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700 leading-snug">{locale === 'en' ? 'Full setup & configuration' : 'সম্পূর্ণ সেটআপ ও কনফিগারেশন'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-btcl-primaryLight/10">
                      <svg className="h-3 w-3 text-btcl-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700 leading-snug">{locale === 'en' ? 'Technical integration' : 'টেকনিক্যাল ইন্টিগ্রেশন'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-btcl-primaryLight/10">
                      <svg className="h-3 w-3 text-btcl-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700 leading-snug">{locale === 'en' ? 'Under IPTSP License' : 'IPTSP লাইসেন্সের অধীনে'}</span>
                  </div>
                </div>
              </div>

              {/* Connection Charge */}
              <div className="group relative overflow-hidden bg-white rounded-2xl border border-gray-200 transition-all duration-300 hover:-translate-y-1 hover:border-btcl-primary hover:shadow-2xl p-7"><div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-btcl-primary to-btcl-primaryLight opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="text-center mb-6">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-r from-btcl-primary to-btcl-primary text-2xl transition-all duration-300 group-hover:scale-110">
                    🔗
                  </div>
                  <h3 className="mb-3 text-xl font-bold text-gray-900">
                    {locale === 'en' ? 'Connection Charge' : 'কানেকশন চার্জ'}
                  </h3>
                  <div className="text-sm text-gray-500 mb-4">{locale === 'en' ? 'Per Number' : 'প্রতি নম্বর'}</div>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">৳1,000</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-btcl-primaryLight/10">
                      <svg className="h-3 w-3 text-btcl-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700 leading-snug">{locale === 'en' ? 'Per short code number' : 'প্রতি শর্ট কোড নম্বর'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-btcl-primaryLight/10">
                      <svg className="h-3 w-3 text-btcl-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700 leading-snug">{locale === 'en' ? 'Network activation' : 'নেটওয়ার্ক অ্যাক্টিভেশন'}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-btcl-primaryLight/10">
                      <svg className="h-3 w-3 text-btcl-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700 leading-snug">{locale === 'en' ? 'One-time payment' : 'এককালীন পেমেন্ট'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* VAT Notice */}
            <div className="mt-10 text-center">
              <div className="inline-flex items-center rounded-xl border border-yellow-200 bg-yellow-50 px-6 py-3">
                <svg className="mr-2 h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                </svg>
                <span className="text-sm font-semibold text-yellow-800">
                  {locale === 'en' ? '* VAT Applicable on all charges' : '* সকল চার্জে ভ্যাট প্রযোজ্য'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="py-16 bg-gradient-to-r from-btcl-primary to-btcl-primaryDark">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              {locale === 'en' ? 'Need a Custom Plan?' : 'কাস্টম পরিকল্পনা প্রয়োজন?'}
            </h2>
            <p className="text-xl text-white mb-8">
              {locale === 'en'
                ? 'Contact our sales team for enterprise pricing and custom solutions tailored to your specific requirements.'
                : 'আপনার নির্দিষ্ট প্রয়োজনীয়তার জন্য এন্টারপ্রাইজ মূল্য এবং কাস্টম সমাধানের জন্য আমাদের সেলস টিমের সাথে যোগাযোগ করুন।'}
            </p>
            <Link href={`/${locale}/contact`}>
              <Button size="lg" className="transform rounded-lg border-2 border-btcl-primary bg-white px-6 py-2.5 text-sm font-semibold text-btcl-primary transition-all duration-300 hover:scale-105 hover:bg-btcl-primary hover:text-white">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={cancelPbxPurchase}>
            <div
              className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-gradient-to-r from-btcl-primary to-btcl-secondary px-6 py-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-2xl">ℹ️</div>
                <h3 className="text-lg font-bold text-white">
                  {locale === 'en' ? 'Before You Subscribe' : 'সাবস্ক্রাইব করার আগে'}
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
