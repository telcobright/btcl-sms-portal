'use client'

import React, { useState, useEffect } from 'react';
import {Footer} from "@/components/layout/Footer";
import {Header} from "@/components/layout/Header";
import {Button} from "@/components/ui/Button";
import Link from "next/link";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/Card";
import CheckoutModal from "@/components/checkout/CheckoutModal";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { API_BASE_URL, API_ENDPOINTS, FEATURE_FLAGS, PBX_BASE_URL, VBS_BASE_URL, HCC_BASE_URL } from "@/config/api";
import { jwtDecode } from 'jwt-decode';

interface DecodedToken {
  idPartner?: number;
  email?: string;
  sub?: string;
}

const PricingPage = ({ params }: { params: Promise<{ locale: string }> }) => {
  const [selectedService, setSelectedService] = useState('hosted-pbx')
  const [locale, setLocale] = React.useState('en')
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<any>(null)
  const [userType, setUserType] = useState<'prepaid' | 'postpaid' | null>(null)
  const [isLoadingUserType, setIsLoadingUserType] = useState(true)
  // activePackages maps service → active pkg id string (e.g. 'hosted-pbx' → 'silver')
  const [activePackages, setActivePackages] = useState<Record<string, string | null>>({})
  // expiredPackages maps service → expired pkg id string
  const [expiredPackages, setExpiredPackages] = useState<Record<string, string | null>>({})
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
        // Decode JWT token to get idPartner
        const decodedToken = jwtDecode<DecodedToken>(authToken)
        const idPartner = decodedToken?.idPartner

        if (!idPartner) {
          setIsLoadingUserType(false)
          return
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
    setSelectedService(service)
    setSelectedPackage(pkg)
    setIsCheckoutOpen(true)
  }

  React.useEffect(() => {
    params.then(p => setLocale(p.locale))
  }, [params])

  // Services (SMS hidden)
  const services = [
    { id: 'hosted-pbx', name: locale === 'en' ? 'Hosted PBX' : 'হোস্টেড PBX', icon: '☎️', color: 'green' },
    { id: 'voice-broadcast', name: locale === 'en' ? 'Voice Broadcast' : 'ভয়েস ব্রডকাস্ট', icon: '📢', color: 'orange' },
    { id: 'contact-center', name: locale === 'en' ? 'Contact Center' : 'কন্টাক্ট সেন্টার', icon: '🎧', color: 'purple' },
  ]

  // Contact Center Pricing
  const contactCenterPackages = [
    {
      id: 'basic',
      name: locale === 'en' ? 'Basic' : 'বেসিক',
      users: locale === 'en' ? 'Per Agent' : 'প্রতি এজেন্ট',
      price: 8.5,
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
      price: 12,
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
      price: 25,
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
      price: 45,
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

  // Voice Broadcast Pricing (per VB message)
  const voiceBroadcastPackages = [
    {
      id: 'basic',
      name: locale === 'en' ? 'Basic' : 'বেসিক',
      messages: '1-20,000',
      rate: 0.90,
      price: 18,
      popular: false,
      features: [
        locale === 'en' ? '1 - 20,000 VB Messages' : '১ - ২০,০০০ ভিবি মেসেজ',
        locale === 'en' ? '৳0.90 per message' : '৳০.৯০ প্রতি মেসেজ',
        locale === 'en' ? 'Text-to-Speech' : 'টেক্সট-টু-স্পিচ',
        locale === 'en' ? 'Basic Scheduling' : 'বেসিক সময়সূচী',
        locale === 'en' ? 'Delivery Reports' : 'ডেলিভারি রিপোর্ট',
        locale === 'en' ? 'Email Support' : 'ইমেইল সাপোর্ট'
      ]
    },
    {
      id: 'standard',
      name: locale === 'en' ? 'Standard' : 'স্ট্যান্ডার্ড',
      messages: '20,001-50,000',
      rate: 0.80,
      price: 40,
      popular: true,
      features: [
        locale === 'en' ? '20,001 - 50,000 VB Messages' : '২০,০০১ - ৫০,০০০ ভিবি মেসেজ',
        locale === 'en' ? '৳0.80 per message' : '৳০.৮০ প্রতি মেসেজ',
        locale === 'en' ? 'Text-to-Speech & Audio Upload' : 'টেক্সট-টু-স্পিচ ও অডিও আপলোড',
        locale === 'en' ? 'Advanced Scheduling' : 'উন্নত সময়সূচী',
        locale === 'en' ? 'Detailed Analytics' : 'বিস্তারিত বিশ্লেষণ',
        locale === 'en' ? 'Priority Support' : 'অগ্রাধিকার সাপোর্ট'
      ]
    },
    {
      id: 'enterprise',
      name: locale === 'en' ? 'Enterprise' : 'এন্টারপ্রাইজ',
      messages: '50,000+',
      rate: 0.60,
      price: 60,
      popular: false,
      features: [
        locale === 'en' ? '50,000+ VB Messages' : '৫০,০০০+ ভিবি মেসেজ',
        locale === 'en' ? '৳0.60 per message' : '৳০.৬০ প্রতি মেসেজ',
        locale === 'en' ? 'All Features Included' : 'সব বৈশিষ্ট্য অন্তর্ভুক্ত',
        locale === 'en' ? 'API Access' : 'API অ্যাক্সেস',
        locale === 'en' ? 'Custom Integration' : 'কাস্টম ইন্টিগ্রেশন',
        locale === 'en' ? '24/7 Support' : '২৪/৭ সাপোর্ট',
        locale === 'en' ? 'Dedicated Manager' : 'ডেডিকেটেড ম্যানেজার'
      ]
    }
  ]

  const getCurrentPackages = () => {
    switch (selectedService) {
      case 'hosted-pbx': return pbxPackages
      case 'voice-broadcast': return voiceBroadcastPackages
      case 'contact-center': return contactCenterPackages
      default: return pbxPackages
    }
  }

  const getServiceColor = (color: string) => {
    const colors: { [key: string]: string } = {
      blue: 'from-blue-500 to-blue-600',
      purple: 'from-purple-500 to-purple-600',
      green: 'from-green-500 to-green-600',
      orange: 'from-orange-500 to-orange-600'
    }
    return colors[color] || colors.blue
  }

  // Renders the action button for a prepaid card
  const renderPrepaidButton = (pkg: any, serviceId: string) => {
    if (typeof pkg.price !== 'number') {
      return (
        <Link href={`/${locale}/contact`}>
          <Button className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${pkg.popular ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 hover:shadow-lg' : 'bg-btcl-primary text-white hover:bg-btcl-secondary hover:shadow-lg'}`}>
            {locale === 'en' ? 'Contact Sales' : 'সেলস যোগাযোগ'}
          </Button>
        </Link>
      )
    }
    if (activePackages[serviceId] === pkg.id) {
      return (
        <div className="w-full py-4 px-6 rounded-xl font-semibold text-lg text-center bg-gray-100 text-gray-500 border-2 border-gray-200 cursor-not-allowed select-none">
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
          className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${isUpgrade ? 'bg-btcl-primary text-white hover:bg-btcl-secondary hover:shadow-lg' : 'bg-amber-500 text-white hover:bg-amber-600 hover:shadow-lg'}`}
        >
          {isUpgrade ? (locale === 'en' ? '↑ Upgrade Plan' : '↑ আপগ্রেড করুন') : (locale === 'en' ? '↓ Downgrade Plan' : '↓ ডাউনগ্রেড করুন')}
        </Button>
      )
    }
    if (expiredPackages[serviceId] === pkg.id) {
      return (
        <Button onClick={() => handleBuyNow(pkg, serviceId)} className="w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 bg-amber-500 text-white hover:bg-amber-600 hover:shadow-lg">
          ↻ {locale === 'en' ? 'Renew Plan' : 'প্ল্যান নবায়ন করুন'}
        </Button>
      )
    }
    return (
      <Button
        onClick={() => handleBuyNow(pkg, serviceId)}
        className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${pkg.popular ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 hover:shadow-lg' : 'bg-btcl-primary text-white hover:bg-btcl-secondary hover:shadow-lg'}`}
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
              <span className="text-4xl">{icon}</span>
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
                   className={`relative bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-2xl transition-all duration-300 ${pkg.popular ? 'border-orange-400 border-2 transform scale-105 shadow-2xl' : ''}`}>
                {pkg.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-full text-sm font-semibold uppercase tracking-wide shadow-lg">
                      {locale === 'en' ? 'POPULAR' : 'জনপ্রিয়'}
                    </div>
                  </div>
                )}
                <div className="px-8 py-8">
                  {/* Price display */}
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-4">{pkg.name}</h3>
                    <div className="mb-4">
                      {serviceId === 'voice-broadcast' ? (
                        <>
                          <span className="text-4xl font-bold text-gray-900">৳{pkg.rate.toFixed(2)}</span>
                          <span className="text-gray-600 text-lg">/{locale === 'en' ? 'message' : 'মেসেজ'}</span>
                          <div className="text-sm text-gray-500 mt-2">{pkg.messages} {locale === 'en' ? 'VB Messages' : 'ভিবি মেসেজ'}</div>
                        </>
                      ) : serviceId === 'hosted-pbx' ? (
                        <>
                          <span className="text-4xl font-bold text-gray-900">৳{(isPostpaid
                            ? (pkg.id === 'bronze' ? 1200 : pkg.id === 'silver' ? 2500 : pkg.id === 'gold' ? 4500 : pkg.price)
                            : pkg.price
                          ).toLocaleString()}</span>
                          <span className="text-gray-600 text-lg">/{locale === 'en' ? 'month' : 'মাস'}</span>
                          <div className="text-sm text-gray-500 mt-2">
                            {typeof pkg.extensions === 'number' ? `${pkg.extensions} ${locale === 'en' ? 'Extensions' : 'এক্সটেনশন'}` : pkg.extensions}
                          </div>
                          {isPostpaid && (
                            <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                              <div className="text-xs text-blue-600 font-medium mb-1">{locale === 'en' ? 'Postpaid Credit Limit' : 'পোস্টপেইড ক্রেডিট সীমা'}</div>
                              <div className="text-lg font-bold text-blue-900">
                                ৳{pkg.id === 'bronze' ? '84' : pkg.id === 'silver' ? '174' : '312'}
                                <span className="text-sm font-normal text-blue-700">/{locale === 'en' ? 'month' : 'মাস'}</span>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        /* contact-center */
                        <>
                          <span className="text-4xl font-bold text-gray-900">৳{(isPostpaid
                            ? (pkg.id === 'basic' ? 8500 : pkg.price)
                            : pkg.price
                          ).toLocaleString()}</span>
                          <span className="text-gray-600 text-lg">/{locale === 'en' ? 'month' : 'মাস'}</span>
                          <div className="text-sm text-gray-500 mt-2">{typeof pkg.users === 'number' ? `${pkg.users} ${locale === 'en' ? 'Users' : 'ব্যবহারকারী'}` : pkg.users}</div>
                          {isPostpaid && (
                            <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-3">
                              <div className="text-xs text-blue-600 font-medium mb-1">{locale === 'en' ? 'Postpaid Credit Limit' : 'পোস্টপেইড ক্রেডিট সীমা'}</div>
                              <div className="text-lg font-bold text-blue-900">
                                ৳{Math.ceil(45 * 1.15 * 6)}
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
                        <Button disabled className="w-full py-4 px-6 rounded-xl font-semibold text-lg bg-gray-300 text-gray-600 cursor-not-allowed">
                          {locale === 'en' ? 'Coming Soon' : 'শীঘ্রই আসছে'}
                        </Button>
                      ) : typeof pkg.price === 'number' ? (
                        <Button onClick={() => handleApply(pkg, serviceId)} className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${pkg.popular ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 hover:shadow-lg' : 'bg-btcl-primary text-white hover:bg-btcl-secondary hover:shadow-lg'}`}>
                          {locale === 'en' ? 'Apply' : 'আবেদন করুন'}
                        </Button>
                      ) : (
                        <Link href={`/${locale}/contact`}><Button className="w-full py-4 px-6 rounded-xl font-semibold text-lg bg-btcl-primary text-white hover:bg-btcl-secondary">{locale === 'en' ? 'Contact Sales' : 'সেলস যোগাযোগ'}</Button></Link>
                      )
                    ) : renderPrepaidButton(pkg, serviceId)}
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    {pkg.features.map((feature: string, index: number) => (
                      <div key={index} className="flex items-start">
                        <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                        <span className="text-gray-700 text-sm font-medium">{feature}</span>
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

  const showPrepaid = isLoadingUserType || userType === null || userType === 'prepaid'
  const showPostpaid = !isLoadingUserType && (userType === 'postpaid' || (userType === null && !isLoggedIn()))

  return (
      <div className="min-h-screen bg-gray-50">
        <Header />

        {/* Hero Section */}
        <div className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-btcl-primary via-green-600 to-btcl-secondary">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
              {locale === 'en' ? 'Service Pricing' : 'সেবা মূল্য'}
            </h1>
            <p className="text-xl text-green-100 mb-8 max-w-3xl mx-auto">
              {locale === 'en'
                ? 'Transparent pricing for all our enterprise communication services. Choose the plan that fits your business needs.'
                : 'আমাদের সমস্ত এন্টারপ্রাইজ যোগাযোগ সেবার জন্য স্বচ্ছ মূল্য। আপনার ব্যবসায়িক প্রয়োজন অনুযায়ী পরিকল্পনা চয়ন করুন।'}
            </p>
            {/* Quick jump links */}
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {[
                { id: 'hosted-pbx', icon: '☎️', en: 'Hosted PBX', bn: 'হোস্টেড PBX' },
                { id: 'voice-broadcast', icon: '📢', en: 'Voice Broadcast', bn: 'ভয়েস ব্রডকাস্ট' },
                { id: 'contact-center', icon: '🎧', en: 'Contact Center', bn: 'কন্টাক্ট সেন্টার' },
              ].map(s => (
                <a key={s.id} href={`#${s.id}`} className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-full text-sm font-medium transition-colors">
                  <span>{s.icon}</span>
                  <span>{locale === 'en' ? s.en : s.bn}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── Prepaid Sections ── */}
        {showPrepaid && (
          <>
            {renderSection('hosted-pbx', '☎️',
              'Hosted PBX', 'হোস্টেড PBX',
              'Monthly subscription pricing', 'মাসিক সাবস্ক্রিপশন মূল্য',
              pbxPackages, 'bg-white', 'bg-green-50 text-green-800'
            )}
            {renderSection('voice-broadcast', '📢',
              'Voice Broadcast', 'ভয়েস ব্রডকাস্ট',
              'Pay per message pricing', 'প্রতি মেসেজ মূল্য',
              voiceBroadcastPackages, 'bg-orange-50', 'bg-orange-100 text-orange-800'
            )}
            {renderSection('contact-center', '🎧',
              'Contact Center', 'কন্টাক্ট সেন্টার',
              'Monthly subscription pricing', 'মাসিক সাবস্ক্রিপশন মূল্য',
              contactCenterPackages, 'bg-purple-50', 'bg-purple-100 text-purple-800'
            )}
          </>
        )}

        {/* ── Postpaid Sections ── */}
        {showPostpaid && (
          <>
            {renderSection('hosted-pbx', '☎️',
              'Hosted PBX — Postpaid', 'হোস্টেড PBX — পোস্টপেইড',
              'Monthly subscription pricing', 'মাসিক সাবস্ক্রিপশন মূল্য',
              pbxPackages, 'bg-gray-100', 'bg-green-50 text-green-800',
              true
            )}
            {renderSection('contact-center', '🎧',
              'Contact Center — Postpaid', 'কন্টাক্ট সেন্টার — পোস্টপেইড',
              'Monthly subscription pricing', 'মাসিক সাবস্ক্রিপশন মূল্য',
              contactCenterPackages, 'bg-white', 'bg-purple-100 text-purple-800',
              true
            )}
          </>
        )}

        {/* Contact CTA */}
        <div className="py-16 bg-gradient-to-r from-btcl-primary to-green-700">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              {locale === 'en' ? 'Need a Custom Plan?' : 'কাস্টম পরিকল্পনা প্রয়োজন?'}
            </h2>
            <p className="text-xl text-green-100 mb-8">
              {locale === 'en'
                ? 'Contact our sales team for enterprise pricing and custom solutions tailored to your specific requirements.'
                : 'আপনার নির্দিষ্ট প্রয়োজনীয়তার জন্য এন্টারপ্রাইজ মূল্য এবং কাস্টম সমাধানের জন্য আমাদের সেলস টিমের সাথে যোগাযোগ করুন।'}
            </p>
            <Link href={`/${locale}/contact`}>
              <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 font-semibold px-8 py-4 rounded-xl">
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
      </div>
  );
};

export default PricingPage;
