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
      title: locale === 'en' ? 'Virtual Extensions' : 'ভার্চুয়াল এক্সটেনশন',
      description: locale === 'en'
        ? 'Unlimited extensions for your team members with customizable settings'
        : 'কাস্টমাইজযোগ্য সেটিংস সহ আপনার টিম সদস্যদের জন্য সীমাহীন এক্সটেনশন',
    },
    {
      icon: '🔄',
      title: locale === 'en' ? 'Call Forwarding' : 'কল ফরওয়ার্ডিং',
      description: locale === 'en'
        ? 'Smart call forwarding based on time, availability, and custom rules'
        : 'সময়, প্রাপ্যতা এবং কাস্টম নিয়মের উপর ভিত্তি করে স্মার্ট কল ফরওয়ার্ডিং',
    },
    {
      icon: '🎥',
      title: locale === 'en' ? 'Video Conferencing' : 'ভিডিও কনফারেন্সিং',
      description: locale === 'en'
        ? 'HD video and audio conferencing with screen sharing capabilities'
        : 'স্ক্রিন শেয়ারিং ক্ষমতা সহ HD ভিডিও এবং অডিও কনফারেন্সিং',
    },
    {
      icon: '📧',
      title: locale === 'en' ? 'Voicemail to Email' : 'ভয়েসমেল টু ইমেইল',
      description: locale === 'en'
        ? 'Receive voicemails as email attachments with transcription'
        : 'ট্রান্সক্রিপশন সহ ইমেইল সংযুক্তি হিসাবে ভয়েসমেল গ্রহণ করুন',
    },
    {
      icon: '💼',
      title: locale === 'en' ? 'Auto-Attendant' : 'অটো-এটেন্ডেন্ট',
      description: locale === 'en'
        ? 'Professional automated receptionist with customizable greetings'
        : 'কাস্টমাইজযোগ্য শুভেচ্ছা সহ পেশাদার স্বয়ংক্রিয় রিসেপশনিস্ট',
    },
    {
      icon: '📊',
      title: locale === 'en' ? 'Call Analytics' : 'কল বিশ্লেষণ',
      description: locale === 'en'
        ? 'Detailed reports on call volumes, durations, and patterns'
        : 'কল ভলিউম, সময়কাল এবং প্যাটার্ন সম্পর্কে বিস্তারিত রিপোর্ট',
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-green-800 py-24">
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
              <span className="block bg-gradient-to-r from-white via-green-100 to-white bg-clip-text text-transparent">
                {locale === 'en' ? 'BTCL Hosted PBX' : 'বিটিসিএল হোস্টেড PBX'}
              </span>
            </h1>

            <p className="mx-auto mb-12 max-w-4xl text-xl leading-relaxed text-green-100/90 md:text-2xl">
              {locale === 'en'
                ? 'Enterprise phone system in the cloud with advanced call management, unified communications, and seamless integration with your business tools.'
                : 'উন্নত কল ম্যানেজমেন্ট, ইউনিফাইড কমিউনিকেশন এবং আপনার ব্যবসায়িক সরঞ্জামের সাথে নিরবচ্ছিন্ন সংযোগ সহ ক্লাউডে এন্টারপ্রাইজ ফোন সিস্টেম।'}
            </p>

            <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
              <Link href={`/${locale}/register`}>
                <Button
                  size="lg"
                  className="transform rounded-xl bg-white px-8 py-4 text-lg font-semibold text-green-600 shadow-2xl transition-all duration-300 hover:scale-105"
                >
                  {locale === 'en' ? 'Start Free Trial' : 'বিনামূল্যে ট্রায়াল শুরু করুন'}
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
              {locale === 'en' ? 'Advanced PBX Features' : 'উন্নত PBX বৈশিষ্ট্য'}
            </h2>
            <p className="text-xl text-gray-600">
              {locale === 'en'
                ? 'Professional phone system features for businesses of all sizes'
                : 'সব আকারের ব্যবসার জন্য পেশাদার ফোন সিস্টেম বৈশিষ্ট্য'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="group transition-all duration-300 hover:scale-105 hover:shadow-xl">
                <CardHeader>
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-green-500 to-green-600 text-4xl transition-all duration-300 group-hover:scale-110">
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
      <section className="bg-gradient-to-r from-green-600 to-green-700 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <h2 className="mb-6 text-4xl font-bold md:text-5xl">
              {locale === 'en' ? 'Upgrade Your Business Phone System' : 'আপনার ব্যবসায়িক ফোন সিস্টেম আপগ্রেড করুন'}
            </h2>
            <p className="mb-10 text-xl text-green-100">
              {locale === 'en'
                ? 'Switch to cloud-based PBX and enjoy enterprise features without the hardware'
                : 'ক্লাউড-ভিত্তিক PBX-এ স্যুইচ করুন এবং হার্ডওয়্যার ছাড়াই এন্টারপ্রাইজ বৈশিষ্ট্য উপভোগ করুন'}
            </p>
            <Link href={`/${locale}/register`}>
              <Button
                size="lg"
                className="transform rounded-xl bg-white px-8 py-4 text-lg font-semibold text-green-600 shadow-2xl transition-all duration-300 hover:scale-105"
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
