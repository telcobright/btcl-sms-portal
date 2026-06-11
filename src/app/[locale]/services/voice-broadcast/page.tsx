import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

interface VoiceBroadcastPageProps {
  params: Promise<{
    locale: string
  }>
}

export default async function VoiceBroadcastPage({ params }: VoiceBroadcastPageProps) {
  const { locale } = await params

  const features = [
    {
      icon: '📞',
      title: locale === 'en' ? 'High Volume Capacity' : 'উচ্চ ভলিউম ক্ষমতা',
      description: locale === 'en'
        ? 'Broadcast voice messages to thousands of recipients simultaneously with enterprise-grade infrastructure'
        : 'এন্টারপ্রাইজ-গ্রেড অবকাঠামো সহ একসাথে হাজারো প্রাপকের কাছে ভয়েস বার্তা ব্রডকাস্ট করুন',
    },
    {
      icon: '🎙️',
      title: locale === 'en' ? 'Text-to-Speech Engine' : 'টেক্সট-টু-স্পিচ ইঞ্জিন',
      description: locale === 'en'
        ? 'Advanced TTS with natural-sounding voices in Bangla, English, and other languages with voice customization'
        : 'ভয়েস কাস্টমাইজেশন সহ বাংলা, ইংরেজি এবং অন্যান্য ভাষায় প্রাকৃতিক-শব্দযুক্ত ভয়েস সহ উন্নত TTS',
    },
    {
      icon: '🎵',
      title: locale === 'en' ? 'Audio File Management' : 'অডিও ফাইল ম্যানেজমেন্ট',
      description: locale === 'en'
        ? 'Upload, store, and manage pre-recorded audio files in MP3, WAV formats with built-in audio player'
        : 'বিল্ট-ইন অডিও প্লেয়ার সহ MP3, WAV ফর্ম্যাটে পূর্ব-রেকর্ড করা অডিও ফাইল আপলোড, সংরক্ষণ এবং পরিচালনা করুন',
    },
    {
      icon: '📋',
      title: locale === 'en' ? 'Contact List Management' : 'যোগাযোগ তালিকা ব্যবস্থাপনা',
      description: locale === 'en'
        ? 'Import contacts from CSV/Excel, create groups, manage blacklists, and organize recipient databases'
        : 'CSV/Excel থেকে যোগাযোগ আমদানি করুন, গ্রুপ তৈরি করুন, ব্ল্যাকলিস্ট পরিচালনা করুন এবং প্রাপক ডাটাবেস সংগঠিত করুন',
    },
    {
      icon: '📅',
      title: locale === 'en' ? 'Smart Scheduling' : 'স্মার্ট সময়সূচী',
      description: locale === 'en'
        ? 'Schedule campaigns with timezone support, business hours filtering, and automatic optimal timing'
        : 'টাইমজোন সাপোর্ট, ব্যবসায়িক ঘন্টা ফিল্টারিং এবং স্বয়ংক্রিয় সর্বোত্তম সময় সহ ক্যাম্পেইন শিডিউল করুন',
    },
    {
      icon: '🎯',
      title: locale === 'en' ? 'Interactive Voice Response' : 'ইন্টারঅ্যাক্টিভ ভয়েস রেসপন্স',
      description: locale === 'en'
        ? 'Collect responses using DTMF keypad input, voice recording, or automated surveys during calls'
        : 'কলের সময় DTMF কীপ্যাড ইনপুট, ভয়েস রেকর্ডিং বা স্বয়ংক্রিয় সার্ভে ব্যবহার করে প্রতিক্রিয়া সংগ্রহ করুন',
    },
    {
      icon: '🔢',
      title: locale === 'en' ? 'Dynamic Variables' : 'ডাইনামিক ভেরিয়েবল',
      description: locale === 'en'
        ? 'Personalize messages with dynamic fields like name, account number, due date, and custom variables'
        : 'নাম, অ্যাকাউন্ট নম্বর, নির্ধারিত তারিখ এবং কাস্টম ভেরিয়েবলের মতো ডাইনামিক ফিল্ড দিয়ে বার্তা ব্যক্তিগতকরণ করুন',
    },
    {
      icon: '📊',
      title: locale === 'en' ? 'Comprehensive Analytics' : 'ব্যাপক বিশ্লেষণ',
      description: locale === 'en'
        ? 'Real-time dashboards showing delivery status, call duration, completion rates, and detailed CDR reports'
        : 'ডেলিভারি স্ট্যাটাস, কল সময়কাল, সমাপ্তির হার এবং বিস্তারিত CDR রিপোর্ট দেখানো রিয়েল-টাইম ড্যাশবোর্ড',
    },
    {
      icon: '🔄',
      title: locale === 'en' ? 'Intelligent Retry System' : 'বুদ্ধিমান পুনঃচেষ্টা সিস্টেম',
      description: locale === 'en'
        ? 'Automatic retry for busy/unanswered calls with configurable attempts, intervals, and business rules'
        : 'কনফিগারযোগ্য প্রচেষ্টা, ব্যবধান এবং ব্যবসায়িক নিয়ম সহ ব্যস্ত/উত্তরহীন কলের জন্য স্বয়ংক্রিয় পুনঃচেষ্টা',
    },
    {
      icon: '🌐',
      title: locale === 'en' ? 'API Integration' : 'API ইন্টিগ্রেশন',
      description: locale === 'en'
        ? 'RESTful API for triggering campaigns, checking status, and integrating with your existing systems'
        : 'ক্যাম্পেইন ট্রিগার করা, স্ট্যাটাস পরীক্ষা এবং আপনার বিদ্যমান সিস্টেমের সাথে সংযুক্ত করার জন্য RESTful API',
    },
    {
      icon: '🔐',
      title: locale === 'en' ? 'Compliance & DND' : 'সম্মতি ও DND',
      description: locale === 'en'
        ? 'Built-in DND registry checking, time restrictions, and compliance tools to follow telecom regulations'
        : 'টেলিকম নিয়ম মেনে চলার জন্য বিল্ট-ইন DND রেজিস্ট্রি চেকিং, সময় সীমাবদ্ধতা এবং সম্মতি সরঞ্জাম',
    },
    {
      icon: '💰',
      title: locale === 'en' ? 'Cost Optimization' : 'খরচ অপ্টিমাইজেশন',
      description: locale === 'en'
        ? 'Smart routing, call length limits, and budget controls to optimize campaign costs and prevent overruns'
        : 'ক্যাম্পেইন খরচ অপ্টিমাইজ করতে এবং অতিরিক্ত খরচ প্রতিরোধে স্মার্ট রাউটিং, কল দৈর্ঘ্য সীমা এবং বাজেট নিয়ন্ত্রণ',
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-600 via-orange-700 to-orange-800 py-24">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-10 top-10 h-40 w-40 animate-pulse rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -right-16 top-32 h-60 w-60 animate-pulse rounded-full bg-white/5 blur-3xl delay-1000" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 backdrop-blur-sm">
              <span className="text-2xl">📢</span>
              <span className="font-semibold">
                {locale === 'en' ? 'Automated Voice Campaigns' : 'স্বয়ংক্রিয় ভয়েস ক্যাম্পেইন'}
              </span>
            </div>

            <h1 className="mb-8 text-5xl font-bold leading-tight md:text-6xl lg:text-7xl">
              <span className="block text-white">
                {locale === 'en' ? 'BTCL Voice Broadcast Service' : 'বিটিসিএল ভয়েস ব্রডকাস্ট সেবা'}
              </span>
            </h1>

            <p className="mx-auto mb-12 max-w-4xl text-xl leading-relaxed text-orange-100/90 md:text-2xl">
              {locale === 'en'
                ? 'Enterprise voice broadcasting platform with text-to-speech, audio file management, smart scheduling, interactive IVR, comprehensive analytics, and intelligent retry systems. Reach thousands with automated voice campaigns.'
                : 'টেক্সট-টু-স্পিচ, অডিও ফাইল ম্যানেজমেন্ট, স্মার্ট সময়সূচী, ইন্টারঅ্যাক্টিভ IVR, ব্যাপক বিশ্লেষণ এবং বুদ্ধিমান পুনঃচেষ্টা সিস্টেম সহ এন্টারপ্রাইজ ভয়েস ব্রডকাস্টিং প্ল্যাটফর্ম। স্বয়ংক্রিয় ভয়েস ক্যাম্পেইনের মাধ্যমে হাজারো মানুষের কাছে পৌঁছান।'}
            </p>

            <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
              <Link href={`/${locale}/register`}>
                <Button
                  size="lg"
                  className="transform rounded-xl bg-white px-8 py-4 text-lg font-semibold text-orange-600 shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  {locale === 'en' ? 'Start Campaign' : 'ক্যাম্পেইন শুরু করুন'}
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
              {locale === 'en' ? 'Powerful Broadcasting Features' : 'শক্তিশালী ব্রডকাস্টিং বৈশিষ্ট্য'}
            </h2>
            <p className="text-xl text-gray-600">
              {locale === 'en'
                ? 'Reach thousands with automated voice campaigns'
                : 'স্বয়ংক্রিয় ভয়েস ক্যাম্পেইনের মাধ্যমে হাজারো মানুষের কাছে পৌঁছান'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="group transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <CardHeader>
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-4xl transition-all duration-300 group-hover:scale-110">
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
      <section className="bg-gradient-to-r from-orange-600 to-orange-700 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <h2 className="mb-6 text-4xl font-bold md:text-5xl">
              {locale === 'en' ? 'Ready to Launch Your Voice Campaign?' : 'আপনার ভয়েস ক্যাম্পেইন চালু করতে প্রস্তুত?'}
            </h2>
            <p className="mb-10 text-xl text-orange-100">
              {locale === 'en'
                ? 'Start reaching thousands with automated voice messages today'
                : 'আজই স্বয়ংক্রিয় ভয়েস বার্তা দিয়ে হাজারো মানুষের কাছে পৌঁছাতে শুরু করুন'}
            </p>
            <Link href={`/${locale}/register`}>
              <Button
                size="lg"
                className="transform rounded-xl bg-white px-8 py-4 text-lg font-semibold text-orange-600 shadow-2xl transition-all duration-300 hover:scale-105"
              >
                {locale === 'en' ? 'Get Started Now' : 'এখনই শুরু করুন'}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
