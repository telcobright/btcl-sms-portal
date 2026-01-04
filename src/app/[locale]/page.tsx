import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

// Types
interface Feature {
  title: string
  description: string
  icon: string
}

interface Service {
  id: string
  title: string
  description: string
  icon: string
  features: string[]
  color: string
  href: string
}

interface PricingPlan {
  id: string
  name: string
  sms: number
  rate: number
  validity: number
  popular: boolean
  features: string[]
}

interface HomePageProps {
  params: Promise<{
    locale: string
  }>
}

// Constants
const HERO_STATS = [
  { value: '10K+', label: 'Active Users' },
  { value: '99.9%', label: 'Uptime' },
  { value: '24/7', label: 'Support' },
] as const

const TESTIMONIALS = [
  { name: 'Ahmed Trading', industry: 'E-commerce', initial: 'A' },
  { name: 'Bangladeshi Bank', industry: 'Banking', initial: 'B' },
  { name: 'City Hospital', industry: 'Healthcare', initial: 'C' },
] as const

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params
  const t = await getTranslations()

  // Services data
  const services: Service[] = [
    {
      id: 'bulk-sms',
      title: locale === 'en' ? 'Bulk SMS Service' : 'বাল্ক এসএমএস সেবা',
      description: locale === 'en'
        ? 'Send promotional messages, alerts, and notifications to millions with our enterprise-grade bulk SMS gateway. 99.9% delivery rate across all networks in Bangladesh.'
        : 'আমাদের এন্টারপ্রাইজ-গ্রেড বাল্ক এসএমএস গেটওয়ে দিয়ে লাখো মানুষকে প্রচারমূলক বার্তা, সতর্কতা এবং বিজ্ঞপ্তি পাঠান। বাংলাদেশের সব নেটওয়ার্কে ৯৯.৯% ডেলিভারি হার।',
      icon: '📱',
      features: [
        locale === 'en' ? '99.9% High delivery rate' : '৯৯.৯% উচ্চ ডেলিভারি হার',
        locale === 'en' ? 'Custom sender ID' : 'কাস্টম প্রেরক আইডি',
        locale === 'en' ? 'RESTful API integration' : 'RESTful API ইন্টিগ্রেশন',
        locale === 'en' ? 'Real-time delivery reports' : 'রিয়েল-টাইম ডেলিভারি রিপোর্ট',
        locale === 'en' ? 'Schedule & bulk upload' : 'সময়সূচী ও বাল্ক আপলোড',
        locale === 'en' ? '24/7 technical support' : '২৪/৭ প্রযুক্তিগত সহায়তা',
      ],
      color: 'from-blue-500 to-blue-600',
      href: `/${locale}/services/bulk-sms`,
    },
    {
      id: 'contact-center',
      title: locale === 'en' ? 'Hosted Contact Center' : 'হোস্টেড কন্টাক্ট সেন্টার',
      description: locale === 'en'
        ? 'Cloud-based contact center solution with omnichannel support, IVR, intelligent call routing, and advanced analytics. Scale your customer service operations effortlessly.'
        : 'ক্লাউড-ভিত্তিক কন্টাক্ট সেন্টার সমাধান যাতে রয়েছে অমনিচ্যানেল সাপোর্ট, IVR, বুদ্ধিমান কল রাউটিং এবং উন্নত বিশ্লেষণ। আপনার গ্রাহক সেবা কার্যক্রম সহজে স্কেল করুন।',
      icon: '🎧',
      features: [
        locale === 'en' ? 'Omnichannel support (voice, chat, email)' : 'অমনিচ্যানেল সাপোর্ট (ভয়েস, চ্যাট, ইমেইল)',
        locale === 'en' ? 'Interactive IVR system' : 'ইন্টারঅ্যাক্টিভ IVR সিস্টেম',
        locale === 'en' ? 'Intelligent call routing' : 'বুদ্ধিমান কল রাউটিং',
        locale === 'en' ? 'Real-time dashboards & analytics' : 'রিয়েল-টাইম ড্যাশবোর্ড ও বিশ্লেষণ',
        locale === 'en' ? 'Call recording & quality monitoring' : 'কল রেকর্ডিং ও মান নিরীক্ষণ',
        locale === 'en' ? 'Agent performance tracking' : 'এজেন্ট কর্মক্ষমতা ট্র্যাকিং',
      ],
      color: 'from-purple-500 to-purple-600',
      href: `/${locale}/services/contact-center`,
    },
    {
      id: 'hosted-pbx',
      title: locale === 'en' ? 'Hosted PBX' : 'হোস্টেড PBX',
      description: locale === 'en'
        ? 'Enterprise phone system in the cloud with advanced call management, voicemail, unified communications, and seamless integration with your business tools.'
        : 'ক্লাউডে এন্টারপ্রাইজ ফোন সিস্টেম যাতে রয়েছে উন্নত কল ম্যানেজমেন্ট, ভয়েসমেল, ইউনিফাইড কমিউনিকেশন এবং আপনার ব্যবসায়িক সরঞ্জামের সাথে নিরবচ্ছিন্ন সংযোগ।',
      icon: '☎️',
      features: [
        locale === 'en' ? 'Unlimited virtual extensions' : 'সীমাহীন ভার্চুয়াল এক্সটেনশন',
        locale === 'en' ? 'Smart call forwarding & routing' : 'স্মার্ট কল ফরওয়ার্ডিং ও রাউটিং',
        locale === 'en' ? 'HD audio & video conferencing' : 'HD অডিও ও ভিডিও কনফারেন্সিং',
        locale === 'en' ? 'Voicemail to email' : 'ভয়েসমেল টু ইমেইল',
        locale === 'en' ? 'Mobile & desktop apps' : 'মোবাইল ও ডেস্কটপ অ্যাপ',
        locale === 'en' ? 'Auto-attendant & IVR' : 'অটো-এটেন্ডেন্ট ও IVR',
      ],
      color: 'from-green-500 to-green-600',
      href: `/${locale}/services/hosted-pbx`,
    },
    {
      id: 'voice-broadcast',
      title: locale === 'en' ? 'Voice Broadcast Service' : 'ভয়েস ব্রডকাস্ট সেবা',
      description: locale === 'en'
        ? 'Deliver pre-recorded voice messages to thousands simultaneously for announcements, alerts, and campaigns. Perfect for emergency notifications and marketing campaigns.'
        : 'ঘোষণা, সতর্কতা এবং প্রচারাভিযানের জন্য একযোগে হাজারো মানুষের কাছে পূর্ব-রেকর্ড করা ভয়েস বার্তা পৌঁছে দিন। জরুরি বিজ্ঞপ্তি এবং মার্কেটিং ক্যাম্পেইনের জন্য নিখুঁত।',
      icon: '📢',
      features: [
        locale === 'en' ? 'Mass voice calling (1000+ calls/min)' : 'গণ ভয়েস কলিং (১০০০+ কল/মিনিট)',
        locale === 'en' ? 'Text-to-speech in multiple languages' : 'একাধিক ভাষায় টেক্সট-টু-স্পিচ',
        locale === 'en' ? 'Pre-recorded message upload' : 'পূর্ব-রেকর্ড করা বার্তা আপলোড',
        locale === 'en' ? 'Campaign scheduling & automation' : 'ক্যাম্পেইন সময়সূচী ও অটোমেশন',
        locale === 'en' ? 'Detailed call analytics & reports' : 'বিস্তারিত কল বিশ্লেষণ ও রিপোর্ট',
        locale === 'en' ? 'Retry logic for failed calls' : 'ব্যর্থ কলের জন্য পুনঃচেষ্টা লজিক',
      ],
      color: 'from-orange-500 to-orange-600',
      href: `/${locale}/services/voice-broadcast`,
    },
  ]

  // Feature data
  const features: Feature[] = [
    {
      title: t('home.features.reliable.title'),
      description: t('home.features.reliable.description'),
      icon: '🔒',
    },
    {
      title: t('home.features.fast.title'),
      description: t('home.features.fast.description'),
      icon: '⚡',
    },
    {
      title: t('home.features.secure.title'),
      description: t('home.features.secure.description'),
      icon: '🛡️',
    },
    {
      title: t('home.features.support.title'),
      description: t('home.features.support.description'),
      icon: '📞',
    },
  ]

  // Pricing plans data
  const pricingPlans: PricingPlan[] = [
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
        locale === 'en' ? 'Single Sender ID' : 'একক প্রেরক ID',
      ],
    },
    {
      id: 'medium',
      name: locale === 'en' ? 'Medium Business' : 'মাঝারি ব্যবসা',
      sms: 50000,
      rate: 0.3,
      validity: 60,
      popular: true,
      features: [
        locale === 'en' ? 'Advanced API' : 'অ্যাডভান্সড API',
        locale === 'en' ? 'Priority Support' : 'অগ্রাধিকার সাপোর্ট',
        locale === 'en' ? 'Fast Delivery' : 'দ্রুত ডেলিভারি',
        locale === 'en' ? 'Custom Sender ID' : 'কাস্টম প্রেরক ID',
        locale === 'en' ? 'Detailed Analytics' : 'বিস্তারিত অ্যানালিটিক্স',
        locale === 'en' ? 'Multiple Projects' : 'একাধিক প্রকল্প',
      ],
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
        locale === 'en' ? 'Priority Routing' : 'অগ্রাধিকার রাউটিং',
      ],
    },
  ]

  return (
      <div className="min-h-screen bg-white">
        <Header />

        {/* Hero Section */}
        <HeroSection locale={locale} t={t} />

        {/* Services Showcase Section */}
        <ServicesShowcaseSection services={services} locale={locale} />

        {/* Features Section */}
        <FeaturesSection features={features} t={t} />

        {/* Pricing Preview Section */}
        <PricingPreviewSection pricingPlans={pricingPlans} locale={locale} t={t} />

        {/* Testimonials Section */}
        <TestimonialsSection locale={locale} t={t} />

        <Footer />
      </div>
  )
}

// Hero Section Component
function HeroSection({ locale, t }: { locale: string; t: any }) {
  return (
      <section
          className="relative flex min-h-screen items-center overflow-hidden bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/herobg.png')" }}
      >
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/50" />

        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-10 top-20 h-20 w-20 animate-pulse rounded-full bg-green-400/10 blur-xl" />
          <div className="absolute bottom-32 right-16 h-32 w-32 animate-pulse rounded-full bg-blue-400/10 blur-xl delay-1000" />
          <div className="absolute left-1/4 top-1/2 h-16 w-16 animate-pulse rounded-full bg-purple-400/10 blur-xl delay-500" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Badge/Announcement */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm text-white/90 backdrop-blur-sm transition-all duration-300 hover:bg-white/15">
              <span className="text-green-400">✨</span>
              <span>New features available now</span>
              <span className="text-green-400">📈</span>
            </div>

            {/* Main Heading */}
            <h1 className="mb-8 text-5xl font-bold leading-tight text-white md:text-6xl lg:text-7xl">
            <span className="block bg-gradient-to-r from-white via-green-100 to-white bg-clip-text text-transparent">
              BTCL Enterprise
            </span>
              <span className="block bg-gradient-to-r from-green-200 via-white to-green-200 bg-clip-text text-transparent">
                Communication Solutions
              </span>
            </h1>

            {/* Description */}
            <p className="mx-auto mb-12 max-w-3xl text-lg leading-relaxed text-green-100/80 md:text-xl">
              Empower your business with Bangladesh's leading telecommunications provider. From bulk SMS
              to hosted contact centers, PBX systems, and voice broadcast — we deliver enterprise-grade
              communication solutions trusted by thousands nationwide.
            </p>

            {/* CTA Buttons */}
            <div className="mb-24 flex flex-col items-center justify-center gap-6 sm:flex-row">
              <Link href={`/${locale}/register`} className="group">
                <Button
                    size="lg"
                    className="transform rounded-xl border-0 bg-gradient-to-r from-green-500 to-green-600 px-8 py-4 text-lg font-semibold text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:from-green-600 hover:to-green-700 hover:shadow-green-500/25"
                >
                  <span>{t('home.hero.cta')}</span>
                  <span className="ml-2 transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
                </Button>
              </Link>

              <Link href={`/${locale}/services`} className="group">
                <Button
                    variant="outline"
                    size="lg"
                    className="transform rounded-xl border-2 border-white/30 bg-white/5 px-8 py-4 text-lg font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-white/50 hover:bg-white/10"
                >
                <span className="mr-2 transition-transform duration-200 group-hover:scale-110">
                  ▶
                </span>
                  <span>{t('home.hero.learn_more')}</span>
                </Button>
              </Link>
            </div>

            {/* Stats Section */}
            <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
              {HERO_STATS.map((stat, index) => (
                  <div
                      key={index}
                      className="rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur-sm transition-all duration-300 hover:bg-white/15"
                  >
                    <div className="mb-2 text-3xl font-bold text-white">{stat.value}</div>
                    <div className="text-sm text-green-100">{stat.label}</div>
                  </div>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 transform animate-bounce">
          <div className="flex h-10 w-6 justify-center rounded-full border-2 border-white/40">
            <div className="mt-2 h-3 w-1 animate-pulse rounded-full bg-white/60" />
          </div>
        </div>
      </section>
  )
}

// Services Showcase Section Component
function ServicesShowcaseSection({ services, locale }: { services: Service[]; locale: string }) {
  return (
      <section className="bg-gradient-to-b from-gray-50 to-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="mb-16 text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-green-100 px-5 py-2 text-sm font-semibold text-green-700">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              {locale === 'en' ? 'Our Services' : 'আমাদের সেবাসমূহ'}
            </div>
            <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
              {locale === 'en' ? 'Complete Communication Suite' : 'সম্পূর্ণ যোগাযোগ সমাধান'}
            </h2>
            <p className="mx-auto max-w-3xl text-xl text-gray-600">
              {locale === 'en'
                ? 'Discover our comprehensive range of enterprise communication solutions designed to power your business'
                : 'আপনার ব্যবসা পরিচালনার জন্য ডিজাইন করা এন্টারপ্রাইজ যোগাযোগ সমাধানের আমাদের বিস্তৃত পরিসর আবিষ্কার করুন'}
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-2">
            {services.map((service, index) => (
                <ServiceCard key={service.id} service={service} index={index} />
            ))}
          </div>

          {/* View All Services CTA */}
          <div className="mt-16 text-center">
            <Link href={`/${locale}/services`}>
              <Button
                  size="lg"
                  variant="outline"
                  className="transform rounded-xl border-2 border-green-600 px-8 py-4 text-lg font-semibold text-green-600 transition-all duration-300 hover:scale-105 hover:bg-green-600 hover:text-white"
              >
                {locale === 'en' ? 'Explore All Services' : 'সকল সেবা দেখুন'}
                <span className="ml-2">→</span>
              </Button>
            </Link>
          </div>
        </div>
      </section>
  )
}

// Service Card Component
function ServiceCard({ service, index }: { service: Service; index: number }) {
  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: { text: string; bg: string; border: string } } = {
      'from-blue-500 to-blue-600': { text: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
      'from-purple-500 to-purple-600': { text: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
      'from-green-500 to-green-600': { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
      'from-orange-500 to-orange-600': { text: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    }
    return colorMap[color] || { text: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' }
  }

  const colors = getColorClasses(service.color)

  return (
      <Link href={service.href}>
        <Card className="group h-full transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
          <CardHeader className="pb-4">
            <div className="mb-6 flex items-start justify-between">
              <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r ${service.color} text-4xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl`}>
                {service.icon}
              </div>
              <div className={`rounded-full bg-gradient-to-r ${service.color} px-3 py-1 text-xs font-semibold text-white shadow-sm`}>
                {index === 0 ? 'Popular' : 'Enterprise'}
              </div>
            </div>
            <CardTitle className="mb-3 text-2xl font-bold">{service.title}</CardTitle>
            <CardDescription className="text-sm leading-relaxed text-gray-600">
              {service.description}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 space-y-2.5">
              {service.features.map((feature, featureIndex) => (
                  <div key={featureIndex} className="flex items-start gap-2.5">
                    <div className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${colors.bg}`}>
                      <svg className={`h-3 w-3 ${colors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-gray-700 leading-tight">{feature}</span>
                  </div>
              ))}
            </div>
            <div className={`mt-6 flex items-center gap-2 text-sm font-bold ${colors.text} transition-all duration-300 group-hover:gap-4`}>
              Learn More
              <svg className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </CardContent>
        </Card>
      </Link>
  )
}

// Features Section Component
function FeaturesSection({ features, t }: { features: Feature[]; t: any }) {
  return (
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
              {t('home.features.title')}
            </h2>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
                <Card key={index} className="text-center transition-all duration-300 hover:shadow-lg">
                  <CardHeader>
                    <div className="mb-4 text-4xl">{feature.icon}</div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-gray-600">{feature.description}</CardDescription>
                  </CardContent>
                </Card>
            ))}
          </div>
        </div>
      </section>
  )
}

// Pricing Preview Section Component
function PricingPreviewSection({
                                 pricingPlans,
                                 locale,
                                 t,
                               }: {
  pricingPlans: PricingPlan[]
  locale: string
  t: any
}) {
  return (
      <section className="py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Section Title */}
          <div className="mb-20 flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-8 lg:mb-0">
              <h2 className="mb-4 text-4xl font-bold text-gray-900">{t('home.pricing.title')}</h2>
              <p className="max-w-2xl text-xl text-gray-600">{t('home.pricing.subtitle')}</p>
            </div>
            <div className="flex-shrink-0">
              <Link href={`/${locale}/pricing`}>
                <Button
                    variant="outline"
                    size="lg"
                    className="rounded-xl border-2 px-8 py-3 text-lg font-semibold transition-colors hover:bg-green-200 hover:text-btcl-primary"
                >
                  View All Plans
                </Button>
              </Link>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {pricingPlans.map((pkg) => (
                <PricingCard key={pkg.id} pkg={pkg} locale={locale} />
            ))}
          </div>

          {/* VAT Notice */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center rounded-xl border border-yellow-200 bg-yellow-50 px-8 py-4">
              <svg className="mr-3 h-6 w-6 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                />
              </svg>
              <span className="text-lg font-semibold text-yellow-800">
              {locale === 'en'
                  ? '15% VAT will be added to all prices'
                  : 'সকল মূল্যে ১৫% ভ্যাট যোগ হবে'}
            </span>
            </div>
          </div>
        </div>
      </section>
  )
}

// Pricing Card Component
function PricingCard({ pkg, locale }: { pkg: PricingPlan; locale: string }) {
  return (
      <div
          className={`relative rounded-2xl border bg-white shadow-lg transition-all duration-300 hover:shadow-2xl ${
              pkg.popular
                  ? 'scale-105 transform border-2 border-orange-400 shadow-2xl'
                  : 'border-gray-200'
          }`}
      >
        {pkg.popular && (
            <div className="absolute -top-4 left-1/2 z-10 -translate-x-1/2 transform">
              <div className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 px-6 py-2 text-sm font-semibold uppercase tracking-wide text-white shadow-lg">
                {locale === 'en' ? 'POPULAR' : 'জনপ্রিয়'}
              </div>
            </div>
        )}

        <div className="px-8 py-8">
          <div className="mb-4 text-center">
            <h3 className="mb-6 text-2xl font-bold text-gray-900">{pkg.name}</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold text-gray-900">৳{pkg.rate.toFixed(2)}</span>
              <span className="text-lg text-gray-600">/SMS</span>
            </div>
            <div className="mb-6 text-sm font-medium text-gray-500">
              {locale === 'en' ? 'Total:' : 'মোট:'} ৳{(pkg.sms * pkg.rate).toLocaleString()}
            </div>
            <div className="space-y-2 rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
              <div className="flex items-center justify-center">
                <svg className="mr-2 h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                {pkg.sms.toLocaleString()} SMS
              </div>
              <div className="flex items-center justify-center">
                <svg className="mr-2 h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                      clipRule="evenodd"
                  />
                </svg>
                {pkg.validity} {locale === 'en' ? 'days validity' : 'দিন মেয়াদ'}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <Link href={`/${locale}/packages/${pkg.id}/purchase`}>
              <Button
                  className={`w-full rounded-xl px-6 py-4 text-lg font-semibold transition-all duration-300 ${
                      pkg.popular
                          ? 'transform bg-gradient-to-r from-orange-500 to-red-500 text-white hover:scale-105 hover:from-orange-600 hover:to-red-600 hover:shadow-lg'
                          : 'bg-btcl-primary text-white hover:bg-btcl-secondary hover:shadow-lg'
                  }`}
              >
                {locale === 'en' ? 'Get Started' : 'শুরু করুন'}
              </Button>
            </Link>
          </div>

          <div className="space-y-3">
            {pkg.features.map((feature, index) => (
                <div key={index} className="flex items-start">
                  <svg
                      className="mr-3 mt-0.5 h-5 w-5 flex-shrink-0 text-green-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                  >
                    <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm font-medium text-gray-700">{feature}</span>
                </div>
            ))}
          </div>
        </div>
      </div>
  )
}

// Testimonials Section Component
function TestimonialsSection({ locale, t }: { locale: string; t: any }) {
  return (
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-gray-900 md:text-4xl">
              {t('home.testimonials.title')}
            </h2>
            <p className="text-xl text-gray-600">{t('home.testimonials.subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {TESTIMONIALS.map((testimonial, index) => (
                <Card key={index} className="transition-all duration-300 hover:shadow-lg">
                  <CardContent className="pt-6">
                    <div className="mb-4 flex items-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-btcl-primary font-bold text-white">
                        {testimonial.initial}
                      </div>
                      <div className="ml-4">
                        <div className="font-semibold">{testimonial.name}</div>
                        <div className="text-sm text-gray-600">{testimonial.industry}</div>
                      </div>
                    </div>
                    <p className="italic text-gray-600">
                      {locale === 'en'
                          ? '"BTCL SMS service has revolutionized our customer communication. Reliable, fast, and cost-effective solution for our business."'
                          : '"বিটিসিএল এসএমএস সেবা আমাদের গ্রাহক যোগাযোগে বিপ্লব এনেছে। আমাদের ব্যবসার জন্য নির্ভরযোগ্য, দ্রুত এবং সাশ্রয়ী সমাধান।"'}
                    </p>
                  </CardContent>
                </Card>
            ))}
          </div>
        </div>
      </section>
  )
}