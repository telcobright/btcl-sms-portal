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
      title: locale === 'en' ? 'Mass Voice Calling' : 'গণ ভয়েস কলিং',
      description: locale === 'en'
        ? 'Deliver thousands of voice calls simultaneously with 1000+ calls per minute'
        : 'প্রতি মিনিটে ১০০০+ কল সহ একযোগে হাজারো ভয়েস কল পৌঁছে দিন',
    },
    {
      icon: '🎙️',
      title: locale === 'en' ? 'Text-to-Speech' : 'টেক্সট-টু-স্পিচ',
      description: locale === 'en'
        ? 'Convert text to natural-sounding speech in multiple languages including Bangla'
        : 'বাংলা সহ একাধিক ভাষায় টেক্সটকে প্রাকৃতিক-শব্দযুক্ত স্পিচে রূপান্তর করুন',
    },
    {
      icon: '🎵',
      title: locale === 'en' ? 'Pre-recorded Messages' : 'পূর্ব-রেকর্ড করা বার্তা',
      description: locale === 'en'
        ? 'Upload and manage pre-recorded audio files for professional broadcasts'
        : 'পেশাদার ব্রডকাস্টের জন্য পূর্ব-রেকর্ড করা অডিও ফাইল আপলোড এবং পরিচালনা করুন',
    },
    {
      icon: '📅',
      title: locale === 'en' ? 'Campaign Scheduling' : 'ক্যাম্পেইন সময়সূচী',
      description: locale === 'en'
        ? 'Schedule campaigns for optimal delivery times and automate broadcasts'
        : 'সর্বোত্তম ডেলিভারি সময়ের জন্য ক্যাম্পেইন সময়সূচী এবং ব্রডকাস্ট স্বয়ংক্রিয় করুন',
    },
    {
      icon: '📊',
      title: locale === 'en' ? 'Detailed Analytics' : 'বিস্তারিত বিশ্লেষণ',
      description: locale === 'en'
        ? 'Track call completion rates, listening duration, and campaign performance'
        : 'কল সমাপ্তির হার, শোনার সময়কাল এবং ক্যাম্পেইন কর্মক্ষমতা ট্র্যাক করুন',
    },
    {
      icon: '🔄',
      title: locale === 'en' ? 'Retry Logic' : 'পুনঃচেষ্টা লজিক',
      description: locale === 'en'
        ? 'Automatic retry for failed calls with customizable retry parameters'
        : 'কাস্টমাইজযোগ্য পুনঃচেষ্টা প্যারামিটার সহ ব্যর্থ কলের জন্য স্বয়ংক্রিয় পুনঃচেষ্টা',
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
              <span className="block bg-gradient-to-r from-white via-orange-100 to-white bg-clip-text text-transparent">
                {locale === 'en' ? 'BTCL Voice Broadcast Service' : 'বিটিসিএল ভয়েস ব্রডকাস্ট সেবা'}
              </span>
            </h1>

            <p className="mx-auto mb-12 max-w-4xl text-xl leading-relaxed text-orange-100/90 md:text-2xl">
              {locale === 'en'
                ? 'Deliver pre-recorded voice messages to thousands simultaneously for announcements, alerts, and campaigns. Perfect for emergency notifications and marketing.'
                : 'ঘোষণা, সতর্কতা এবং প্রচারাভিযানের জন্য একযোগে হাজারো মানুষের কাছে পূর্ব-রেকর্ড করা ভয়েস বার্তা পৌঁছে দিন। জরুরি বিজ্ঞপ্তি এবং মার্কেটিংয়ের জন্য নিখুঁত।'}
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
