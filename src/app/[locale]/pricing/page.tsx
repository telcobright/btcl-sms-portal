'use client'

import React, { useState } from 'react';
import {Footer} from "@/components/layout/Footer";
import {Header} from "@/components/layout/Header";
import {Button} from "@/components/ui/Button";
import Link from "next/link";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/components/ui/Card";
import CheckoutModal from "@/components/checkout/CheckoutModal";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

const PricingPage = ({ params }: { params: Promise<{ locale: string }> }) => {
  const [selectedService, setSelectedService] = useState('bulk-sms')
  const [locale, setLocale] = React.useState('en')
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<any>(null)
  const router = useRouter()

  const isLoggedIn = () => {
    if (typeof window !== 'undefined') {
      return !!localStorage.getItem('authToken')
    }
    return false
  }

  const handleBuyNow = (pkg: any) => {
    if (!isLoggedIn()) {
      toast.error(locale === 'en' ? 'Please login to purchase' : 'কেনার জন্য অনুগ্রহ করে লগইন করুন')
      router.push(`/${locale}/login`)
      return
    }
    setSelectedPackage(pkg)
    setIsCheckoutOpen(true)
  }

  React.useEffect(() => {
    params.then(p => setLocale(p.locale))
  }, [params])

  const services = [
    { id: 'bulk-sms', name: locale === 'en' ? 'Bulk SMS' : 'বাল্ক এসএমএস', icon: '📱', color: 'blue' },
    { id: 'contact-center', name: locale === 'en' ? 'Contact Center' : 'কন্টাক্ট সেন্টার', icon: '🎧', color: 'purple' },
    { id: 'hosted-pbx', name: locale === 'en' ? 'Hosted PBX' : 'হোস্টেড PBX', icon: '☎️', color: 'green' },
    { id: 'voice-broadcast', name: locale === 'en' ? 'Voice Broadcast' : 'ভয়েস ব্রডকাস্ট', icon: '📢', color: 'orange' },
  ]

  // SMS Pricing
  const smsPackages = [
    {
      id: 'small',
      name: locale === 'en' ? 'Small Business' : 'ছোট ব্যবসা',
      sms: 20000,
      rate: 0.32,
      validity: 30,
      popular: false,
      features: [
        locale === 'en' ? 'Basic API Access' : 'বেসিক API অ্যাক্সেস',
        locale === 'en' ? 'Email Support' : 'ইমেইল সাপোর্ট',
        locale === 'en' ? 'Standard Delivery' : 'স্ট্যান্ডার্ড ডেলিভারি',
        locale === 'en' ? 'Basic Reports' : 'বেসিক রিপোর্ট',
        locale === 'en' ? 'Single Sender ID' : 'একক প্রেরক ID'
      ]
    },
    {
      id: 'medium',
      name: locale === 'en' ? 'Medium Business' : 'মাঝারি ব্যবসা',
      sms: 50000,
      rate: 0.30,
      validity: 60,
      popular: true,
      features: [
        locale === 'en' ? 'Advanced API' : 'অ্যাডভান্সড API',
        locale === 'en' ? 'Priority Support' : 'অগ্রাধিকার সাপোর্ট',
        locale === 'en' ? 'Fast Delivery' : 'দ্রুত ডেলিভারি',
        locale === 'en' ? 'Custom Sender ID' : 'কাস্টম প্রেরক ID',
        locale === 'en' ? 'Detailed Analytics' : 'বিস্তারিত অ্যানালিটিক্স',
        locale === 'en' ? 'Multiple Projects' : 'একাধিক প্রকল্প'
      ]
    },
    {
      id: 'large',
      name: locale === 'en' ? 'Large Business' : 'বড় ব্যবসা',
      sms: 100000,
      rate: 0.28,
      validity: 90,
      popular: false,
      features: [
        locale === 'en' ? 'Premium API' : 'প্রিমিয়াম API',
        locale === 'en' ? '24/7 Phone Support' : '২৪/৭ ফোন সাপোর্ট',
        locale === 'en' ? 'Instant Delivery' : 'তাৎক্ষণিক ডেলিভারি',
        locale === 'en' ? 'Multiple Sender IDs' : 'একাধিক প্রেরক ID',
        locale === 'en' ? 'Advanced Analytics' : 'উন্নত অ্যানালিটিক্স',
        locale === 'en' ? 'Dedicated Manager' : 'ডেডিকেটেড ম্যানেজার',
        locale === 'en' ? 'Priority Routing' : 'অগ্রাধিকার রাউটিং'
      ]
    }
  ]

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

  // Voice Broadcast Pricing
  const voiceBroadcastPackages = [
    {
      id: 'starter',
      name: locale === 'en' ? 'Starter' : 'স্টার্টার',
      minutes: 5000,
      rate: 1.2,
      popular: false,
      features: [
        locale === 'en' ? '5,000 Call Minutes' : '৫,০০০ কল মিনিট',
        locale === 'en' ? 'Text-to-Speech' : 'টেক্সট-টু-স্পিচ',
        locale === 'en' ? 'Basic Scheduling' : 'বেসিক সময়সূচী',
        locale === 'en' ? 'Delivery Reports' : 'ডেলিভারি রিপোর্ট',
        locale === 'en' ? 'Email Support' : 'ইমেইল সাপোর্ট'
      ]
    },
    {
      id: 'growth',
      name: locale === 'en' ? 'Growth' : 'গ্রোথ',
      minutes: 15000,
      rate: 1.0,
      popular: true,
      features: [
        locale === 'en' ? '15,000 Call Minutes' : '১৫,০০০ কল মিনিট',
        locale === 'en' ? 'Text-to-Speech & Audio Upload' : 'টেক্সট-টু-স্পিচ ও অডিও আপলোড',
        locale === 'en' ? 'Advanced Scheduling' : 'উন্নত সময়সূচী',
        locale === 'en' ? 'Detailed Analytics' : 'বিস্তারিত বিশ্লেষণ',
        locale === 'en' ? 'Retry Logic' : 'পুনঃচেষ্টা লজিক',
        locale === 'en' ? 'Priority Support' : 'অগ্রাধিকার সাপোর্ট'
      ]
    },
    {
      id: 'enterprise',
      name: locale === 'en' ? 'Enterprise' : 'এন্টারপ্রাইজ',
      minutes: 50000,
      rate: 0.8,
      popular: false,
      features: [
        locale === 'en' ? '50,000+ Call Minutes' : '৫০,০০০+ কল মিনিট',
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
      case 'bulk-sms': return smsPackages
      case 'contact-center': return contactCenterPackages
      case 'hosted-pbx': return pbxPackages
      case 'voice-broadcast': return voiceBroadcastPackages
      default: return smsPackages
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
          </div>
        </div>

        {/* Service Selector */}
        <div className="py-12 bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-wrap justify-center gap-4">
              {services.map((service) => (
                <button
                  key={service.id}
                  onClick={() => setSelectedService(service.id)}
                  className={`flex items-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 ${
                    selectedService === service.id
                      ? `bg-gradient-to-r ${getServiceColor(service.color)} text-white shadow-lg scale-105`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-2xl">{service.icon}</span>
                  <span>{service.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="py-20">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {locale === 'en' ? 'Choose Your Plan' : 'আপনার পরিকল্পনা চয়ন করুন'}
              </h2>
              <p className="text-xl text-gray-600">
                {selectedService === 'bulk-sms' && (locale === 'en' ? '(Excluding 15% VAT)' : '(১৫% ভ্যাট বাদে)')}
                {selectedService === 'contact-center' && (locale === 'en' ? 'Monthly subscription pricing' : 'মাসিক সাবস্ক্রিপশন মূল্য')}
                {selectedService === 'hosted-pbx' && (locale === 'en' ? 'Monthly subscription pricing' : 'মাসিক সাবস্ক্রিপশন মূল্য')}
                {selectedService === 'voice-broadcast' && (locale === 'en' ? 'Pay per minute pricing' : 'প্রতি মিনিট মূল্য')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {getCurrentPackages().map((pkg: any) => (
                <div key={pkg.id}
                     className={`relative bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-2xl transition-all duration-300 ${pkg.popular ? 'border-orange-400 border-2 transform scale-105 shadow-2xl' : ''}`}>
                  {pkg.popular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                      <div className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-6 py-2 rounded-full text-sm font-semibold uppercase tracking-wide shadow-lg">
                        {locale === 'en' ? 'POPULAR' : 'জনপ্রিয়'}
                      </div>
                    </div>
                  )}

                  <div className="px-8 py-8">
                    <div className="text-center mb-6">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">{pkg.name}</h3>
                      <div className="mb-4">
                        {selectedService === 'bulk-sms' && (
                          <>
                            <span className="text-4xl font-bold text-gray-900">৳{pkg.rate.toFixed(2)}</span>
                            <span className="text-gray-600 text-lg">/SMS</span>
                            <div className="text-sm text-gray-500 mt-2">
                              {locale === 'en' ? 'Total:' : 'মোট:'} ৳{(pkg.sms * pkg.rate).toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {pkg.sms.toLocaleString()} SMS • {pkg.validity} {locale === 'en' ? 'days' : 'দিন'}
                            </div>
                          </>
                        )}
                        {selectedService === 'contact-center' && (
                          <>
                            <span className="text-4xl font-bold text-gray-900">
                              {typeof pkg.price === 'number' ? `৳${pkg.price.toLocaleString()}` : pkg.price}
                            </span>
                            <span className="text-gray-600 text-lg">/month</span>
                            <div className="text-sm text-gray-500 mt-2">
                              {typeof pkg.users === 'number' ? `${pkg.users} ${locale === 'en' ? 'Users' : 'ব্যবহারকারী'}` : pkg.users}
                            </div>
                          </>
                        )}
                        {selectedService === 'hosted-pbx' && (
                          <>
                            <span className="text-4xl font-bold text-gray-900">
                              {typeof pkg.price === 'number' ? `৳${pkg.price.toLocaleString()}` : pkg.price}
                            </span>
                            <span className="text-gray-600 text-lg">/month</span>
                            <div className="text-sm text-gray-500 mt-2">
                              {typeof pkg.extensions === 'number' ? `${pkg.extensions} ${locale === 'en' ? 'Extensions' : 'এক্সটেনশন'}` : pkg.extensions}
                            </div>
                          </>
                        )}
                        {selectedService === 'voice-broadcast' && (
                          <>
                            <span className="text-4xl font-bold text-gray-900">৳{pkg.rate.toFixed(2)}</span>
                            <span className="text-gray-600 text-lg">/min</span>
                            <div className="text-sm text-gray-500 mt-2">
                              {locale === 'en' ? 'Total:' : 'মোট:'} ৳{(pkg.minutes * pkg.rate).toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-500">
                              {pkg.minutes.toLocaleString()} {locale === 'en' ? 'minutes' : 'মিনিট'}
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mb-6">
                      {selectedService === 'hosted-pbx' && typeof pkg.price === 'number' ? (
                        <Button
                          onClick={() => handleBuyNow(pkg)}
                          className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${
                            pkg.popular
                              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 hover:shadow-lg transform hover:scale-105'
                              : 'bg-btcl-primary text-white hover:bg-btcl-secondary hover:shadow-lg'
                          }`}
                        >
                          {locale === 'en' ? 'Buy Now' : 'এখনই কিনুন'}
                        </Button>
                      ) : (
                        <Link href={`/${locale}/contact`}>
                          <Button
                            className={`w-full py-4 px-6 rounded-xl font-semibold text-lg transition-all duration-300 ${
                              pkg.popular
                                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 hover:shadow-lg transform hover:scale-105'
                                : 'bg-btcl-primary text-white hover:bg-btcl-secondary hover:shadow-lg'
                            }`}
                          >
                            {typeof pkg.price === 'string' || typeof pkg.extensions === 'string'
                              ? (locale === 'en' ? 'Contact Sales' : 'সেলস যোগাযোগ')
                              : (locale === 'en' ? 'Get Started' : 'শুরু করুন')}
                          </Button>
                        </Link>
                      )}
                    </div>

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

            {selectedService === 'bulk-sms' && (
              <div className="text-center mt-12">
                <div className="inline-flex items-center bg-yellow-50 border border-yellow-200 rounded-xl px-8 py-4">
                  <svg className="w-6 h-6 text-yellow-600 mr-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  <span className="text-yellow-800 font-semibold text-lg">
                    {locale === 'en' ? '15% VAT will be added to all prices' : 'সকল মূল্যে ১৫% ভ্যাট যোগ হবে'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

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
            serviceType="hosted-pbx"
            locale={locale}
          />
        )}
      </div>
  );
};

export default PricingPage;
