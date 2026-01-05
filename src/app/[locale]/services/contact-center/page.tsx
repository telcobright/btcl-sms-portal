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
      icon: '🌐',
      title: locale === 'en' ? 'WebRTC Browser Calling' : 'WebRTC ব্রাউজার কলিং',
      description: locale === 'en'
        ? 'Make and receive calls directly from your web browser without any software installation or plugins'
        : 'কোন সফটওয়্যার ইনস্টলেশন বা প্লাগইন ছাড়াই সরাসরি আপনার ওয়েব ব্রাউজার থেকে কল করুন এবং গ্রহণ করুন',
    },
    {
      icon: '📋',
      title: locale === 'en' ? 'Integrated CRM System' : 'ইন্টিগ্রেটেড CRM সিস্টেম',
      description: locale === 'en'
        ? 'Complete customer relationship management with contacts, accounts, opportunities, and leads all in one place'
        : 'যোগাযোগ, অ্যাকাউন্ট, সুযোগ এবং লিড সহ সম্পূর্ণ গ্রাহক সম্পর্ক ব্যবস্থাপনা এক জায়গায়',
    },
    {
      icon: '📱',
      title: locale === 'en' ? 'Click-to-Call' : 'ক্লিক-টু-কল',
      description: locale === 'en'
        ? 'Click any phone number in the CRM to instantly initiate calls with automatic customer information popup'
        : 'স্বয়ংক্রিয় গ্রাহক তথ্য পপআপ সহ তাৎক্ষণিক কল শুরু করতে CRM-এ যেকোনো ফোন নম্বরে ক্লিক করুন',
    },
    {
      icon: '📊',
      title: locale === 'en' ? 'Screen Pop & Call Logging' : 'স্ক্রিন পপ ও কল লগিং',
      description: locale === 'en'
        ? 'Automatic customer record display on incoming calls with complete call history and interaction logging'
        : 'সম্পূর্ণ কল ইতিহাস এবং ইন্টারঅ্যাকশন লগিং সহ ইনকামিং কলে স্বয়ংক্রিয় গ্রাহক রেকর্ড প্রদর্শন',
    },
    {
      icon: '📧',
      title: locale === 'en' ? 'Email Integration' : 'ইমেইল ইন্টিগ্রেশন',
      description: locale === 'en'
        ? 'Send and receive emails within the system, link to contacts, and track all customer communications'
        : 'সিস্টেমের মধ্যে ইমেইল পাঠান এবং গ্রহণ করুন, যোগাযোগের সাথে লিঙ্ক করুন এবং সমস্ত গ্রাহক যোগাযোগ ট্র্যাক করুন',
    },
    {
      icon: '🎫',
      title: locale === 'en' ? 'Case Management' : 'কেস ম্যানেজমেন্ট',
      description: locale === 'en'
        ? 'Track and manage customer support cases with priority levels, assignments, and resolution workflows'
        : 'অগ্রাধিকার স্তর, অ্যাসাইনমেন্ট এবং রেজোলিউশন ওয়ার্কফ্লো সহ গ্রাহক সাপোর্ট কেস ট্র্যাক এবং পরিচালনা করুন',
    },
    {
      icon: '💡',
      title: locale === 'en' ? 'Lead & Opportunity Management' : 'লিড ও সুযোগ ব্যবস্থাপনা',
      description: locale === 'en'
        ? 'Capture leads, track opportunities, manage sales pipeline with forecasting and conversion tracking'
        : 'লিড ক্যাপচার করুন, সুযোগ ট্র্যাক করুন, পূর্বাভাস এবং রূপান্তর ট্র্যাকিং সহ সেলস পাইপলাইন পরিচালনা করুন',
    },
    {
      icon: '📅',
      title: locale === 'en' ? 'Call Scheduling & Tasks' : 'কল সময়সূচী ও কাজ',
      description: locale === 'en'
        ? 'Schedule follow-up calls, set reminders, create tasks, and manage agent calendars efficiently'
        : 'ফলো-আপ কল শিডিউল করুন, রিমাইন্ডার সেট করুন, কাজ তৈরি করুন এবং দক্ষতার সাথে এজেন্ট ক্যালেন্ডার পরিচালনা করুন',
    },
    {
      icon: '📈',
      title: locale === 'en' ? 'Campaign Management' : 'ক্যাম্পেইন ম্যানেজমেন্ট',
      description: locale === 'en'
        ? 'Create and manage outbound calling campaigns with target lists, scripting, and performance tracking'
        : 'টার্গেট তালিকা, স্ক্রিপ্টিং এবং কর্মক্ষমতা ট্র্যাকিং সহ আউটবাউন্ড কলিং ক্যাম্পেইন তৈরি এবং পরিচালনা করুন',
    },
    {
      icon: '📝',
      title: locale === 'en' ? 'Call Scripts & Notes' : 'কল স্ক্রিপ্ট ও নোট',
      description: locale === 'en'
        ? 'Access customizable call scripts during calls and add detailed notes linked to customer records'
        : 'কলের সময় কাস্টমাইজযোগ্য কল স্ক্রিপ্ট অ্যাক্সেস করুন এবং গ্রাহক রেকর্ডের সাথে লিঙ্ক করা বিস্তারিত নোট যোগ করুন',
    },
    {
      icon: '👁️',
      title: locale === 'en' ? 'Call History & Reports' : 'কল ইতিহাস ও রিপোর্ট',
      description: locale === 'en'
        ? 'Complete call detail records, interaction history, and comprehensive reporting with export capabilities'
        : 'সম্পূর্ণ কল বিস্তারিত রেকর্ড, ইন্টারঅ্যাকশন ইতিহাস এবং এক্সপোর্ট ক্ষমতা সহ ব্যাপক রিপোর্টিং',
    },
    {
      icon: '🔐',
      title: locale === 'en' ? 'Role-Based Access Control' : 'ভূমিকা-ভিত্তিক অ্যাক্সেস নিয়ন্ত্রণ',
      description: locale === 'en'
        ? 'Granular permissions and access controls to protect sensitive customer data and manage team access'
        : 'সংবেদনশীল গ্রাহক ডেটা সুরক্ষিত এবং টিম অ্যাক্সেস পরিচালনা করতে বিস্তারিত অনুমতি এবং অ্যাক্সেস নিয়ন্ত্রণ',
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
                ? 'Complete cloud contact center with WebRTC browser calling, integrated CRM, email, case management, and comprehensive customer interaction tracking. No software installation required.'
                : 'WebRTC ব্রাউজার কলিং, ইন্টিগ্রেটেড CRM, ইমেইল, কেস ম্যানেজমেন্ট এবং ব্যাপক গ্রাহক ইন্টারঅ্যাকশন ট্র্যাকিং সহ সম্পূর্ণ ক্লাউড কন্টাক্ট সেন্টার। কোন সফটওয়্যার ইনস্টলেশন প্রয়োজন নেই।'}
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
              {locale === 'en' ? 'Contact Center & CRM Features' : 'কন্টাক্ট সেন্টার ও CRM বৈশিষ্ট্য'}
            </h2>
            <p className="text-xl text-gray-600">
              {locale === 'en'
                ? 'WebRTC calling integrated with full CRM capabilities for complete customer engagement management'
                : 'সম্পূর্ণ গ্রাহক এনগেজমেন্ট ব্যবস্থাপনার জন্য সম্পূর্ণ CRM ক্ষমতার সাথে সংযুক্ত WebRTC কলিং'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
              {locale === 'en' ? 'Start with Browser-Based Calling Today' : 'আজই ব্রাউজার-ভিত্তিক কলিং শুরু করুন'}
            </h2>
            <p className="mb-10 text-xl text-purple-100">
              {locale === 'en'
                ? 'Experience WebRTC calling with integrated CRM - no downloads, no installations, just click and call'
                : 'ইন্টিগ্রেটেড CRM সহ WebRTC কলিং অভিজ্ঞতা নিন - কোন ডাউনলোড নেই, কোন ইনস্টলেশন নেই, শুধু ক্লিক এবং কল করুন'}
            </p>
            <Link href={`/${locale}/contact`}>
              <Button
                size="lg"
                className="transform rounded-xl bg-white px-8 py-4 text-lg font-semibold text-purple-600 shadow-2xl transition-all duration-300 hover:scale-105"
              >
                {locale === 'en' ? 'Request a Demo' : 'ডেমো অনুরোধ করুন'}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
