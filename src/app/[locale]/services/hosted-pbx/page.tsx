import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

interface HostedPBXPageProps {
  params: Promise<{
    locale: string
  }>
}

export default async function HostedPBXPage({ params }: HostedPBXPageProps) {
  const { locale } = await params

  const features = [
    {
      icon: '📱',
      title: locale === 'en' ? 'Extension Management' : 'এক্সটেনশন ম্যানেজমেন্ট',
      description: locale === 'en'
        ? 'Unlimited SIP extensions with individual settings, call forwarding, voicemail, and do not disturb features'
        : 'স্বতন্ত্র সেটিংস, কল ফরওয়ার্ডিং, ভয়েসমেল এবং ডিস্টার্ব করবেন না বৈশিষ্ট্য সহ সীমাহীন SIP এক্সটেনশন',
    },
    {
      icon: '🎯',
      title: locale === 'en' ? 'Interactive IVR System' : 'ইন্টারঅ্যাক্টিভ IVR সিস্টেম',
      description: locale === 'en'
        ? 'Multi-level IVR menus with time-based routing, holiday schedules, and custom announcements'
        : 'সময়-ভিত্তিক রাউটিং, ছুটির সময়সূচী এবং কাস্টম ঘোষণা সহ মাল্টি-লেভেল IVR মেনু',
    },
    {
      icon: '👥',
      title: locale === 'en' ? 'Ring Groups & Queues' : 'রিং গ্রুপ ও সারি',
      description: locale === 'en'
        ? 'Create ring groups with sequential, simultaneous, or round-robin strategies. Advanced call queue management'
        : 'ক্রমিক, একযোগে বা রাউন্ড-রবিন কৌশল সহ রিং গ্রুপ তৈরি করুন। উন্নত কল সারি ব্যবস্থাপনা',
    },
    {
      icon: '📧',
      title: locale === 'en' ? 'Voicemail to Email' : 'ভয়েসমেল টু ইমেইল',
      description: locale === 'en'
        ? 'Automatic voicemail delivery to email with audio file attachments and optional transcription'
        : 'অডিও ফাইল সংযুক্তি এবং ঐচ্ছিক ট্রান্সক্রিপশন সহ ইমেইলে স্বয়ংক্রিয় ভয়েসমেল ডেলিভারি',
    },
    {
      icon: '🎙️',
      title: locale === 'en' ? 'Call Recording' : 'কল রেকর্ডিং',
      description: locale === 'en'
        ? 'Record all calls or specific extensions with secure storage and web-based playback interface'
        : 'নিরাপদ স্টোরেজ এবং ওয়েব-ভিত্তিক প্লেব্যাক ইন্টারফেস সহ সব কল বা নির্দিষ্ট এক্সটেনশন রেকর্ড করুন',
    },
    {
      icon: '🎤',
      title: locale === 'en' ? 'Conference Rooms' : 'কনফারেন্স রুম',
      description: locale === 'en'
        ? 'Audio conference bridges with PIN protection, moderator controls, and recording capabilities'
        : 'PIN সুরক্ষা, মডারেটর নিয়ন্ত্রণ এবং রেকর্ডিং ক্ষমতা সহ অডিও কনফারেন্স ব্রিজ',
    },
    {
      icon: '⏰',
      title: locale === 'en' ? 'Time Conditions' : 'সময় শর্ত',
      description: locale === 'en'
        ? 'Route calls based on business hours, holidays, and special schedules with custom routing rules'
        : 'ব্যবসায়িক ঘন্টা, ছুটির দিন এবং কাস্টম রাউটিং নিয়ম সহ বিশেষ সময়সূচীর উপর ভিত্তি করে কল রুট করুন',
    },
    {
      icon: '🌐',
      title: locale === 'en' ? 'Web-Based Management' : 'ওয়েব-ভিত্তিক ম্যানেজমেন্ট',
      description: locale === 'en'
        ? 'Manage your entire phone system through an intuitive web interface from anywhere'
        : 'যেকোনো জায়গা থেকে একটি স্বজ্ঞাত ওয়েব ইন্টারফেসের মাধ্যমে আপনার সম্পূর্ণ ফোন সিস্টেম পরিচালনা করুন',
    },
    {
      icon: '📞',
      title: locale === 'en' ? 'Hot Desking' : 'হট ডেস্কিং',
      description: locale === 'en'
        ? 'Allow users to log in and out of phones, making any device their personal extension'
        : 'ব্যবহারকারীদের ফোনে লগ ইন এবং লগ আউট করতে দিন, যেকোনো ডিভাইসকে তাদের ব্যক্তিগত এক্সটেনশন তৈরি করুন',
    },
    {
      icon: '🔍',
      title: locale === 'en' ? 'Call Detail Records' : 'কল বিস্তারিত রেকর্ড',
      description: locale === 'en'
        ? 'Comprehensive CDR reports with filtering, export options, and detailed call analytics'
        : 'ফিল্টারিং, এক্সপোর্ট অপশন এবং বিস্তারিত কল বিশ্লেষণ সহ ব্যাপক CDR রিপোর্ট',
    },
    {
      icon: '🎵',
      title: locale === 'en' ? 'Music on Hold' : 'হোল্ডে সংগীত',
      description: locale === 'en'
        ? 'Upload custom music or announcements for callers on hold with multiple playlist support'
        : 'একাধিক প্লেলিস্ট সাপোর্ট সহ হোল্ডে থাকা কলকারীদের জন্য কাস্টম সংগীত বা ঘোষণা আপলোড করুন',
    },
    {
      icon: '📠',
      title: locale === 'en' ? 'Virtual Fax Server' : 'ভার্চুয়াল ফ্যাক্স সার্ভার',
      description: locale === 'en'
        ? 'Send and receive faxes through email with automatic PDF conversion and archiving'
        : 'স্বয়ংক্রিয় PDF রূপান্তর এবং সংরক্ষণাগার সহ ইমেইলের মাধ্যমে ফ্যাক্স পাঠান এবং গ্রহণ করুন',
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-btcl-primary via-btcl-primaryDark to-btcl-primaryDark py-24">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-10 top-10 h-40 w-40 animate-pulse rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -right-16 top-32 h-60 w-60 animate-pulse rounded-full bg-white/5 blur-3xl delay-1000" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 backdrop-blur-sm">
              <span className="text-2xl">☎️</span>
              <span className="font-semibold">
                {locale === 'en' ? 'Cloud Phone System' : 'ক্লাউড ফোন সিস্টেম'}
              </span>
            </div>

            <h1 className="mb-8 text-5xl font-bold leading-tight md:text-6xl lg:text-7xl">
              <span className="block text-white">
                {locale === 'en' ? 'Alaap Cloud IP PBX' : 'Alaap Cloud IP PBX'}
              </span>
            </h1>

            <p className="mx-auto mb-12 max-w-4xl text-xl leading-relaxed text-white/90 md:text-2xl">
              {locale === 'en'
                ? 'Full-featured cloud PBX with unlimited extensions, advanced IVR, call queues, conferencing, recording, and comprehensive management tools. No hardware required.'
                : 'সীমাহীন এক্সটেনশন, উন্নত IVR, কল সারি, কনফারেন্সিং, রেকর্ডিং এবং ব্যাপক ব্যবস্থাপনা সরঞ্জাম সহ সম্পূর্ণ-বৈশিষ্ট্যযুক্ত ক্লাউড PBX। কোন হার্ডওয়্যার প্রয়োজন নেই।'}
            </p>

            <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
              <Link href={`/${locale}/register`}>
                <Button
                  size="lg"
                  className="transform rounded-xl bg-white px-8 py-4 text-lg font-semibold text-btcl-primary shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  {locale === 'en' ? 'Request Demo' : 'ডেমো অনুরোধ করুন'}
                </Button>
              </Link>

              <Link href={`/${locale}/contact`}>
                <Button
                  variant="outline"
                  size="lg"
                  className="transform rounded-xl border-2 border-white/30 bg-white/5 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-white/50 hover:bg-white/10"
                >
                  {locale === 'en' ? 'Contact Sales' : 'সেলস যোগাযোগ'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-20 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
              {locale === 'en' ? 'Enterprise-Grade PBX Features' : 'এন্টারপ্রাইজ-গ্রেড PBX বৈশিষ্ট্য'}
            </h2>
            <p className="text-xl text-gray-600">
              {locale === 'en'
                ? 'Complete unified communications platform with advanced call management and collaboration tools'
                : 'উন্নত কল ব্যবস্থাপনা এবং সহযোগিতা সরঞ্জাম সহ সম্পূর্ণ ইউনিফাইড কমিউনিকেশন প্ল্যাটফর্ম'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {features.map((feature, index) => (
              <Card key={index} className="group transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <CardHeader>
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-btcl-primary to-btcl-primary text-4xl transition-all duration-300 group-hover:scale-110">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-btcl-primary to-btcl-primaryDark py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <h2 className="mb-6 text-4xl font-bold md:text-5xl">
              {locale === 'en' ? 'Transform Your Business Communications' : 'আপনার ব্যবসায়িক যোগাযোগ রূপান্তরিত করুন'}
            </h2>
            <p className="mb-10 text-xl text-white">
              {locale === 'en'
                ? 'Experience enterprise-grade telephony with unlimited extensions, advanced features, and no hardware investment required'
                : 'সীমাহীন এক্সটেনশন, উন্নত বৈশিষ্ট্য এবং কোন হার্ডওয়্যার বিনিয়োগ প্রয়োজন ছাড়াই এন্টারপ্রাইজ-গ্রেড টেলিফোনি অভিজ্ঞতা নিন'}
            </p>
            <Link href={`/${locale}/pricing`}>
              <Button
                size="lg"
                className="transform rounded-lg border-2 border-btcl-primary bg-white px-6 py-2.5 text-sm font-semibold text-btcl-primary transition-all duration-300 hover:scale-105 hover:bg-btcl-primary hover:text-white"
              >
                {locale === 'en' ? 'Purchase Now' : 'এখনই কিনুন'}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
