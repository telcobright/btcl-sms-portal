import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

interface ContactCenterPageProps {
  params: Promise<{
    locale: string
  }>
}

export default async function ContactCenterPage({ params }: ContactCenterPageProps) {
  const { locale } = await params

  const features = [
    {
      icon: '📞',
      title: locale === 'en' ? 'Omnichannel Support' : 'অমনিচ্যানেল সাপোর্ট',
      description: locale === 'en'
        ? 'Handle voice calls, chat, email, and social media from one unified platform'
        : 'এক একীভূত প্ল্যাটফর্ম থেকে ভয়েস কল, চ্যাট, ইমেইল এবং সোশ্যাল মিডিয়া পরিচালনা করুন',
    },
    {
      icon: '🎯',
      title: locale === 'en' ? 'Intelligent Call Routing' : 'বুদ্ধিমান কল রাউটিং',
      description: locale === 'en'
        ? 'AI-powered routing to connect customers with the right agent every time'
        : 'প্রতিবার গ্রাহকদের সঠিক এজেন্টের সাথে সংযোগ করতে AI-চালিত রাউটিং',
    },
    {
      icon: '🎙️',
      title: locale === 'en' ? 'Interactive IVR' : 'ইন্টারঅ্যাক্টিভ IVR',
      description: locale === 'en'
        ? 'Customizable IVR menus with multi-level navigation and voice recognition'
        : 'মাল্টি-লেভেল নেভিগেশন এবং ভয়েস রিকগনিশন সহ কাস্টমাইজযোগ্য IVR মেনু',
    },
    {
      icon: '📊',
      title: locale === 'en' ? 'Real-time Analytics' : 'রিয়েল-টাইম বিশ্লেষণ',
      description: locale === 'en'
        ? 'Live dashboards with call volumes, wait times, and agent performance metrics'
        : 'কল ভলিউম, অপেক্ষার সময় এবং এজেন্ট কর্মক্ষমতা মেট্রিক্স সহ লাইভ ড্যাশবোর্ড',
    },
    {
      icon: '🎧',
      title: locale === 'en' ? 'Call Recording & Monitoring' : 'কল রেকর্ডিং ও মনিটরিং',
      description: locale === 'en'
        ? 'Record all calls for quality assurance and training purposes'
        : 'মান নিশ্চিতকরণ এবং প্রশিক্ষণের উদ্দেশ্যে সব কল রেকর্ড করুন',
    },
    {
      icon: '👥',
      title: locale === 'en' ? 'Agent Management' : 'এজেন্ট ম্যানেজমেন্ট',
      description: locale === 'en'
        ? 'Monitor agent performance, track KPIs, and manage schedules efficiently'
        : 'এজেন্ট কর্মক্ষমতা পর্যবেক্ষণ করুন, KPI ট্র্যাক করুন এবং দক্ষতার সাথে সময়সূচী পরিচালনা করুন',
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-purple-700 to-purple-800 py-24">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-10 top-10 h-40 w-40 animate-pulse rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -right-16 top-32 h-60 w-60 animate-pulse rounded-full bg-white/5 blur-3xl delay-1000" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 backdrop-blur-sm">
              <span className="text-2xl">🎧</span>
              <span className="font-semibold">
                {locale === 'en' ? 'Cloud Contact Center' : 'ক্লাউড কন্টাক্ট সেন্টার'}
              </span>
            </div>

            <h1 className="mb-8 text-5xl font-bold leading-tight md:text-6xl lg:text-7xl">
              <span className="block bg-gradient-to-r from-white via-purple-100 to-white bg-clip-text text-transparent">
                {locale === 'en' ? 'BTCL Hosted Contact Center' : 'বিটিসিএল হোস্টেড কন্টাক্ট সেন্টার'}
              </span>
            </h1>

            <p className="mx-auto mb-12 max-w-4xl text-xl leading-relaxed text-purple-100/90 md:text-2xl">
              {locale === 'en'
                ? 'Transform your customer service with our cloud-based contact center solution. Omnichannel support, intelligent routing, and real-time analytics in one platform.'
                : 'আমাদের ক্লাউড-ভিত্তিক কন্টাক্ট সেন্টার সমাধান দিয়ে আপনার গ্রাহক সেবা রূপান্তরিত করুন। এক প্ল্যাটফর্মে অমনিচ্যানেল সাপোর্ট, বুদ্ধিমান রাউটিং এবং রিয়েল-টাইম বিশ্লেষণ।'}
            </p>

            <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
              <Link href={`/${locale}/register`}>
                <Button
                  size="lg"
                  className="transform rounded-xl bg-white px-8 py-4 text-lg font-semibold text-purple-600 shadow-2xl transition-all duration-300 hover:scale-105"
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
              {locale === 'en' ? 'Comprehensive Features' : 'ব্যাপক বৈশিষ্ট্য'}
            </h2>
            <p className="text-xl text-gray-600">
              {locale === 'en'
                ? 'Everything you need to deliver exceptional customer service'
                : 'ব্যতিক্রমী গ্রাহক সেবা প্রদানের জন্য আপনার প্রয়োজনীয় সবকিছু'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="group transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <CardHeader>
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 text-4xl transition-all duration-300 group-hover:scale-110">
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
      <section className="bg-gradient-to-r from-purple-600 to-purple-700 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <h2 className="mb-6 text-4xl font-bold md:text-5xl">
              {locale === 'en' ? 'Ready to Transform Your Customer Service?' : 'আপনার গ্রাহক সেবা রূপান্তরিত করতে প্রস্তুত?'}
            </h2>
            <p className="mb-10 text-xl text-purple-100">
              {locale === 'en'
                ? 'Request a demo and see how our contact center solution can help your business'
                : 'একটি ডেমো অনুরোধ করুন এবং দেখুন আমাদের কন্টাক্ট সেন্টার সমাধান কীভাবে আপনার ব্যবসাকে সাহায্য করতে পারে'}
            </p>
            <Link href={`/${locale}/contact`}>
              <Button
                size="lg"
                className="transform rounded-xl bg-white px-8 py-4 text-lg font-semibold text-purple-600 shadow-2xl transition-all duration-300 hover:scale-105"
              >
                {locale === 'en' ? 'Schedule a Demo' : 'ডেমোর সময় নির্ধারণ করুন'}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
