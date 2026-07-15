import { pageMetadata } from '@/config/seo'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { FeatureIcon } from '@/components/ui/FeatureIcon'

interface ContactCenterPageProps {
  params: Promise<{
    locale: string
  }>
}

export async function generateMetadata({ params }: ContactCenterPageProps): Promise<Metadata> {
  const { locale } = await params
  return pageMetadata(locale, '/services/contact-center')
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
        ? 'Click any Mobile number in the CRM to instantly initiate calls with automatic customer information popup'
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
      <section className="relative overflow-hidden bg-gradient-to-br from-btcl-primary via-btcl-primary to-btcl-secondary py-16">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-10 top-10 h-40 w-40 animate-pulse rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -right-16 top-32 h-60 w-60 animate-pulse rounded-full bg-white/5 blur-3xl delay-1000" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold text-white">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              {locale === 'en' ? 'Cloud Contact Center' : 'ক্লাউড কন্টাক্ট সেন্টার'}
            </div>

            <h1 className="mb-4 text-4xl font-bold text-white lg:text-5xl">
              {locale === 'en' ? 'Alaap Cloud Contact Center' : 'Alaap Cloud Contact Center'}
            </h1>

            <p className="mx-auto mb-8 max-w-3xl text-xl text-white">
              {locale === 'en'
                ? 'Complete cloud contact center with WebRTC browser calling, integrated CRM, email, case management, and comprehensive customer interaction tracking. No software installation required.'
                : 'WebRTC ব্রাউজার কলিং, ইন্টিগ্রেটেড CRM, ইমেইল, কেস ম্যানেজমেন্ট এবং ব্যাপক গ্রাহক ইন্টারঅ্যাকশন ট্র্যাকিং সহ সম্পূর্ণ ক্লাউড কন্টাক্ট সেন্টার। কোন সফটওয়্যার ইনস্টলেশন প্রয়োজন নেই।'}
            </p>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href={`/${locale}/register`}>
                <Button
                  size="lg"
                  className="transform rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-btcl-primary transition-all duration-300 hover:scale-105 hover:bg-btcl-primaryLight hover:text-white"
                >
                  {locale === 'en' ? 'Request Demo' : 'ডেমো অনুরোধ করুন'}
                </Button>
              </Link>

              <Link href={`/${locale}/contact`}>
                <Button
                  variant="outline"
                  size="lg"
                  className="transform rounded-lg border-2 border-white/40 bg-transparent px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 hover:border-white hover:bg-white hover:text-btcl-primary"
                >
                  {locale === 'en' ? 'Contact Sales' : 'সেলস যোগাযোগ'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-btcl-primaryLight/5 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-btcl-primaryLight/20 px-4 py-1.5 text-sm font-semibold text-btcl-primaryDark">
              <span className="h-2 w-2 animate-pulse rounded-full bg-btcl-primary" />
              {locale === 'en' ? 'CRM & Calling Suite' : 'CRM ও কলিং সুট'}
            </div>
            <h2 className="mb-3 text-3xl font-bold text-gray-900 md:text-4xl">
              {locale === 'en' ? 'Contact Center & CRM Features' : 'কন্টাক্ট সেন্টার ও CRM বৈশিষ্ট্য'}
            </h2>
            <p className="mx-auto max-w-3xl text-base text-gray-600">
              {locale === 'en'
                ? 'WebRTC calling integrated with full CRM capabilities for complete customer engagement management'
                : 'সম্পূর্ণ গ্রাহক এনগেজমেন্ট ব্যবস্থাপনার জন্য সম্পূর্ণ CRM ক্ষমতার সাথে সংযুক্ত WebRTC কলিং'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-btcl-primary hover:shadow-2xl"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-btcl-primary to-btcl-primaryLight opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-btcl-primaryLight/10 transition-all duration-300 group-hover:bg-btcl-primary/10 group-hover:scale-110">
                  <FeatureIcon emoji={feature.icon} className="h-7 w-7 text-btcl-primary" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-900">{feature.title}</h3>
                <p className="text-sm leading-relaxed text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-btcl-primary to-btcl-primaryDark py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <h2 className="mb-3 text-3xl font-bold md:text-4xl">
              {locale === 'en' ? 'Start with Browser-Based Calling Today' : 'আজই ব্রাউজার-ভিত্তিক কলিং শুরু করুন'}
            </h2>
            <p className="mx-auto mb-8 max-w-3xl text-base text-white/90">
              {locale === 'en'
                ? 'Experience WebRTC calling with integrated CRM - no downloads, no installations, just click and call'
                : 'ইন্টিগ্রেটেড CRM সহ WebRTC কলিং অভিজ্ঞতা নিন - কোন ডাউনলোড নেই, কোন ইনস্টলেশন নেই, শুধু ক্লিক এবং কল করুন'}
            </p>
            <Link href={`/${locale}/contact`}>
              <Button
                size="lg"
                className="transform rounded-lg border-2 border-btcl-primary bg-white px-6 py-2.5 text-sm font-semibold text-btcl-primary transition-all duration-300 hover:scale-105 hover:bg-btcl-primary hover:text-white"
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
