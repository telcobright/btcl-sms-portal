import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

interface Service {
  id: string
  title: string
  description: string
  icon: string
  features: string[]
  color: string
  href: string
}

interface ServicesPageProps {
  params: Promise<{
    locale: string
  }>
}

const getLocalizedText = (locale: string, enText: string, bnText: string): string => {
  return locale === 'en' ? enText : bnText
}

export default async function ServicesPage({ params }: ServicesPageProps) {
  const { locale } = await params

  // Services (SMS hidden) - Order: Hosted PBX, Voice Broadcast, Contact Center
  const services: Service[] = [
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
  ]

  return (
    <div className="min-h-screen bg-white">
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-btcl-primary via-green-600 to-btcl-secondary py-24">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-10 top-10 h-40 w-40 animate-pulse rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -right-16 top-32 h-60 w-60 animate-pulse rounded-full bg-white/5 blur-3xl delay-1000" />
          <div className="absolute bottom-20 left-1/3 h-32 w-32 animate-pulse rounded-full bg-white/5 blur-3xl delay-500" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 backdrop-blur-sm">
              <span className="text-2xl">🚀</span>
              <span className="font-semibold">
                {getLocalizedText(locale, 'Enterprise Solutions', 'এন্টারপ্রাইজ সমাধান')}
              </span>
            </div>

            <h1 className="mb-8 text-5xl font-bold leading-tight md:text-6xl lg:text-7xl">
              <span className="block bg-gradient-to-r from-white via-green-100 to-white bg-clip-text text-transparent">
                {getLocalizedText(locale, 'Our Services', 'আমাদের সেবাসমূহ')}
              </span>
            </h1>

            <p className="mx-auto max-w-4xl text-xl leading-relaxed text-green-100/90 md:text-2xl">
              {getLocalizedText(
                locale,
                'Comprehensive enterprise communication solutions designed to meet all your business needs with reliability and performance.',
                'নির্ভরযোগ্যতা এবং কর্মক্ষমতা সহ আপনার সমস্ত ব্যবসায়িক প্রয়োজন মেটাতে ডিজাইন করা ব্যাপক এন্টারপ্রাইজ যোগাযোগ সমাধান।'
              )}
            </p>

            <div className="mt-16 animate-bounce">
              <div className="mx-auto flex h-12 w-8 justify-center rounded-full border-2 border-white/40">
                <div className="mt-3 h-4 w-1 animate-pulse rounded-full bg-white/60" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Grid Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-20 text-center">
            <div className="mb-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                {getLocalizedText(locale, 'Complete Suite', 'সম্পূর্ণ সমাধান')}
              </span>
            </div>
            <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
              {getLocalizedText(locale, 'Enterprise Communication Services', 'এন্টারপ্রাইজ যোগাযোগ সেবা')}
            </h2>
            <p className="text-xl text-gray-600">
              {getLocalizedText(
                locale,
                'Discover our comprehensive range of services designed to power your business',
                'আপনার ব্যবসা পরিচালনার জন্য ডিজাইন করা সেবার আমাদের বিস্তৃত পরিসর আবিষ্কার করুন'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service, index) => (
              <ServiceCard key={service.id} service={service} index={index} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

// Service Card Component
function ServiceCard({ service, index }: { service: Service; index: number }) {
  const getColorClasses = (color: string) => {
    const colorMap: { [key: string]: { text: string; bg: string } } = {
      'from-blue-500 to-blue-600': { text: 'text-blue-600', bg: 'bg-blue-50' },
      'from-purple-500 to-purple-600': { text: 'text-purple-600', bg: 'bg-purple-50' },
      'from-green-500 to-green-600': { text: 'text-green-600', bg: 'bg-green-50' },
      'from-orange-500 to-orange-600': { text: 'text-orange-600', bg: 'bg-orange-50' },
    }
    return colorMap[color] || { text: 'text-green-600', bg: 'bg-green-50' }
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
              Enterprise
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
