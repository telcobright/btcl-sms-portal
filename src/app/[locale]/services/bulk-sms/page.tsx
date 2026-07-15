import { pageMetadata } from '@/config/seo'
import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import Link from 'next/link'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { FeatureIcon } from '@/components/ui/FeatureIcon'
import { AggregatorTag } from '@/components/ui/AggregatorTag'

interface BulkSMSPageProps {
  params: Promise<{
    locale: string
  }>
}

const getLocalizedText = (locale: string, enText: string, bnText: string): string => {
  return locale === 'en' ? enText : bnText
}

export async function generateMetadata({ params }: BulkSMSPageProps): Promise<Metadata> {
  const { locale } = await params
  return pageMetadata(locale, '/services/bulk-sms')
}

export default async function BulkSMSPage({ params }: BulkSMSPageProps) {
  const { locale } = await params

  const features = [
    {
      icon: '🎯',
      title: locale === 'en' ? '99.9% Delivery Rate' : '৯৯.৯% ডেলিভারি হার',
      description: locale === 'en'
        ? 'Industry-leading delivery success across all networks in Bangladesh'
        : 'বাংলাদেশের সব নেটওয়ার্কে শিল্প-নেতৃত্বাধীন ডেলিভারি সাফল্য',
    },
    {
      icon: '⚡',
      title: locale === 'en' ? 'Instant Delivery' : 'তাৎক্ষণিক ডেলিভারি',
      description: locale === 'en'
        ? 'Messages delivered within seconds with real-time status updates'
        : 'রিয়েল-টাইম স্ট্যাটাস আপডেট সহ সেকেন্ডের মধ্যে বার্তা ডেলিভারি',
    },
    {
      icon: '🔧',
      title: locale === 'en' ? 'Custom Sender ID' : 'কাস্টম প্রেরক আইডি',
      description: locale === 'en'
        ? 'Brand your messages with personalized sender IDs for better recognition'
        : 'ভাল স্বীকৃতির জন্য ব্যক্তিগতকৃত প্রেরক আইডি দিয়ে আপনার বার্তা ব্র্যান্ড করুন',
    },
    {
      icon: '🔌',
      title: locale === 'en' ? 'RESTful API' : 'RESTful API',
      description: locale === 'en'
        ? 'Easy integration with comprehensive documentation and SDKs'
        : 'ব্যাপক ডকুমেন্টেশন এবং SDK সহ সহজ ইন্টিগ্রেশন',
    },
    {
      icon: '📊',
      title: locale === 'en' ? 'Advanced Analytics' : 'উন্নত বিশ্লেষণ',
      description: locale === 'en'
        ? 'Detailed reports and real-time delivery tracking dashboard'
        : 'বিস্তারিত রিপোর্ট এবং রিয়েল-টাইম ডেলিভারি ট্র্যাকিং ড্যাশবোর্ড',
    },
    {
      icon: '🔒',
      title: locale === 'en' ? 'Secure & Reliable' : 'নিরাপদ ও নির্ভরযোগ্য',
      description: locale === 'en'
        ? 'Bank-grade security with encrypted transmission and data protection'
        : 'এনক্রিপ্টেড ট্রান্সমিশন এবং ডেটা সুরক্ষা সহ ব্যাংক-গ্রেড নিরাপত্তা',
    },
  ]

  const smsServiceTypes = [
    {
      title: getLocalizedText(locale, 'Promotional SMS', 'প্রমোশনাল এসএমএস'),
      description: getLocalizedText(
        locale,
        'Send marketing messages, offers, and promotional content to your customer base with high delivery rates.',
        'উচ্চ ডেলিভারি রেট সহ আপনার গ্রাহক বেসে মার্কেটিং বার্তা, অফার এবং প্রমোশনাল কন্টেন্ট পাঠান।'
      ),
      icon: '📢',
      features: [
        getLocalizedText(locale, 'Custom sender ID', 'কাস্টম প্রেরক আইডি'),
        getLocalizedText(locale, 'Schedule messages', 'বার্তা সময়সূচী'),
        getLocalizedText(locale, 'Bulk upload', 'বাল্ক আপলোড'),
        getLocalizedText(locale, 'Real-time tracking', 'রিয়েল-টাইম ট্র্যাকিং'),
      ],
    },
    {
      title: getLocalizedText(locale, 'Transactional SMS', 'লেনদেন এসএমএস'),
      description: getLocalizedText(
        locale,
        'Send OTPs, alerts, confirmations, and other transaction-related messages with priority delivery.',
        'অগ্রাধিকার ডেলিভারি সহ ওটিপি, সতর্কতা, নিশ্চিতকরণ এবং অন্যান্য লেনদেন-সম্পর্কিত বার্তা পাঠান।'
      ),
      icon: '🔐',
      features: [
        getLocalizedText(locale, 'Priority routing', 'অগ্রাধিকার রাউটিং'),
        getLocalizedText(locale, 'High delivery speed', 'উচ্চ ডেলিভারি গতি'),
        getLocalizedText(locale, '24/7 availability', '২৪/৭ সহজলভ্যতা'),
        getLocalizedText(locale, 'API integration', 'API ইন্টিগ্রেশন'),
      ],
    },
    {
      title: getLocalizedText(locale, 'Two-Way SMS', 'দ্বিমুখী এসএমএস'),
      description: getLocalizedText(
        locale,
        'Enable interactive communication with customers through two-way messaging capabilities.',
        'দ্বিমুখী মেসেজিং ক্ষমতার মাধ্যমে গ্রাহকদের সাথে ইন্টারঅ্যাক্টিভ যোগাযোগ সক্ষম করুন।'
      ),
      icon: '💬',
      features: [
        getLocalizedText(locale, 'Receive replies', 'উত্তর গ্রহণ'),
        getLocalizedText(locale, 'Keyword automation', 'কিওয়ার্ড অটোমেশন'),
        getLocalizedText(locale, 'Conversation tracking', 'কথোপকথন ট্র্যাকিং'),
        getLocalizedText(locale, 'Auto responses', 'স্বয়ংক্রিয় প্রতিক্রিয়া'),
      ],
    },
    {
      title: getLocalizedText(locale, 'Voice SMS', 'ভয়েস এসএমএস'),
      description: getLocalizedText(
        locale,
        'Deliver voice messages directly to mobile phones for important announcements and alerts.',
        'গুরুত্বপূর্ণ ঘোষণা এবং সতর্কতার জন্য সরাসরি মোবাইল ফোনে ভয়েস বার্তা পৌঁছে দিন।'
      ),
      icon: '🎵',
      features: [
        getLocalizedText(locale, 'Text-to-speech', 'টেক্সট-টু-স্পিচ'),
        getLocalizedText(locale, 'Multiple languages', 'একাধিক ভাষা'),
        getLocalizedText(locale, 'Voice recording', 'ভয়েস রেকর্ডিং'),
        getLocalizedText(locale, 'Call reporting', 'কল রিপোর্টিং'),
      ],
    },
  ]

  const apiFeatures = [
    {
      title: 'RESTful API',
      description: getLocalizedText(
        locale,
        'Easy-to-integrate REST API with comprehensive documentation and code examples.',
        'ব্যাপক ডকুমেন্টেশন এবং কোড উদাহরণ সহ সহজ-ইন্টিগ্রেট REST API।'
      ),
      icon: '🔌',
    },
    {
      title: getLocalizedText(locale, 'SDKs Available', 'SDK উপলব্ধ'),
      description: getLocalizedText(
        locale,
        'Software Development Kits for popular programming languages including PHP, Python, Java, and .NET.',
        'PHP, Python, Java এবং .NET সহ জনপ্রিয় প্রোগ্রামিং ভাষার জন্য সফটওয়্যার ডেভেলপমেন্ট কিট।'
      ),
      icon: '📦',
    },
    {
      title: getLocalizedText(locale, 'Webhook Support', 'ওয়েবহুক সাপোর্ট'),
      description: getLocalizedText(
        locale,
        'Real-time delivery notifications and status updates through webhook callbacks.',
        'ওয়েবহুক কলব্যাকের মাধ্যমে রিয়েল-টাইম ডেলিভারি বিজ্ঞপ্তি এবং স্ট্যাটাস আপডেট।'
      ),
      icon: '🔔',
    },
    {
      title: getLocalizedText(locale, 'Rate Limiting', 'রেট লিমিটিং'),
      description: getLocalizedText(
        locale,
        'Configurable rate limits to control message sending frequency and protect your application.',
        'বার্তা প্রেরণের ফ্রিকোয়েন্সি নিয়ন্ত্রণ এবং আপনার অ্যাপ্লিকেশন সুরক্ষার জন্য কনফিগারযোগ্য রেট লিমিট।'
      ),
      icon: '⚙️',
    },
  ]

  const industries = [
    { name: getLocalizedText(locale, 'Banking & Finance', 'ব্যাংকিং ও অর্থ'), icon: '🏦' },
    { name: getLocalizedText(locale, 'E-commerce', 'ই-কমার্স'), icon: '🛒' },
    { name: getLocalizedText(locale, 'Healthcare', 'স্বাস্থ্যসেবা'), icon: '🏥' },
    { name: getLocalizedText(locale, 'Education', 'শিক্ষা'), icon: '🎓' },
    { name: getLocalizedText(locale, 'Real Estate', 'রিয়েল এস্টেট'), icon: '🏡' },
    { name: getLocalizedText(locale, 'Travel & Tourism', 'ভ্রমণ ও পর্যটন'), icon: '✈️' },
  ]

  const technicalSpecs = [
    {
      icon: '📝',
      value: '160',
      label: getLocalizedText(locale, 'Characters per SMS', 'এসএমএস প্রতি অক্ষর'),
      description: getLocalizedText(locale, 'Standard SMS length', 'স্ট্যান্ডার্ড এসএমএস দৈর্ঘ্য'),
    },
    {
      icon: '⚡',
      value: '1000',
      label: getLocalizedText(locale, 'SMS per second', 'প্রতি সেকেন্ডে এসএমএস'),
      description: getLocalizedText(locale, 'Maximum throughput', 'সর্বোচ্চ থ্রুপুট'),
    },
    {
      icon: '🎯',
      value: '99.9%',
      label: getLocalizedText(locale, 'Delivery rate', 'ডেলিভারি রেট'),
      description: getLocalizedText(locale, 'Success rate', 'সফলতার হার'),
    },
    {
      icon: '⏱️',
      value: '<3s',
      label: getLocalizedText(locale, 'Average delivery time', 'গড় ডেলিভারি সময়'),
      description: getLocalizedText(locale, 'Typical delivery', 'সাধারণ ডেলিভারি'),
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
              {locale === 'en' ? 'Corporate SMS Solution' : 'কর্পোরেট এসএমএস সমাধান'}
            </div>

            <h1 className="mb-4 text-4xl font-bold text-white lg:text-5xl">
              {locale === 'en' ? 'BTCL Bulk SMS Service' : 'BTCL Bulk SMS Service'}
            </h1>

            <p className="mx-auto mb-8 max-w-3xl text-xl text-white">
              {locale === 'en'
                ? 'Reach millions instantly with Bangladesh\'s most reliable SMS gateway. Send promotional messages, alerts, and notifications with 99.9% delivery rate.'
                : 'বাংলাদেশের সবচেয়ে নির্ভরযোগ্য এসএমএস গেটওয়ে দিয়ে লাখো মানুষের কাছে তাৎক্ষণিকভাবে পৌঁছান। ৯৯.৯% ডেলিভারি হার সহ প্রচারমূলক বার্তা, সতর্কতা এবং বিজ্ঞপ্তি পাঠান।'}
            </p>

            <div className="mb-6 flex justify-center">
              <AggregatorTag tone="dark" />
            </div>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href={`/${locale}/register`}>
                <Button
                  size="lg"
                  className="transform rounded-lg bg-white px-6 py-2.5 text-sm font-semibold text-btcl-primary transition-all duration-300 hover:scale-105 hover:bg-btcl-primaryLight hover:text-white"
                >
                  {locale === 'en' ? 'Get Started Free' : 'বিনামূল্যে শুরু করুন'}
                </Button>
              </Link>

              <Link href={`/${locale}/pricing`}>
                <Button
                  variant="outline"
                  size="lg"
                  className="transform rounded-lg border-2 border-white/40 bg-transparent px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 hover:border-white hover:bg-white hover:text-btcl-primary"
                >
                  {locale === 'en' ? 'View Pricing' : 'মূল্য দেখুন'}
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
              {locale === 'en' ? 'Gateway Capabilities' : 'গেটওয়ে সক্ষমতা'}
            </div>
            <h2 className="mb-3 text-3xl font-bold text-gray-900 md:text-4xl">
              {locale === 'en' ? 'Powerful Features' : 'শক্তিশালী বৈশিষ্ট্য'}
            </h2>
            <p className="mx-auto max-w-3xl text-base text-gray-600">
              {locale === 'en'
                ? 'Everything you need to communicate with your customers effectively'
                : 'আপনার গ্রাহকদের সাথে কার্যকরভাবে যোগাযোগের জন্য আপনার প্রয়োজনীয় সবকিছু'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
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

      {/* SMS Service Types Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-btcl-primaryLight/20 px-4 py-1.5 text-sm font-semibold text-btcl-primaryDark">
              <span className="h-2 w-2 animate-pulse rounded-full bg-btcl-primary" />
              {getLocalizedText(locale, 'Service Types', 'সেবার ধরন')}
            </div>
            <h2 className="mb-3 text-3xl font-bold text-gray-900 md:text-4xl">
              {getLocalizedText(locale, 'SMS Service Types', 'এসএমএস সেবার ধরন')}
            </h2>
            <p className="mx-auto max-w-3xl text-base text-gray-600">
              {getLocalizedText(
                locale,
                'Choose from our range of specialized SMS services',
                'আমাদের বিশেষায়িত এসএমএস সেবার পরিসর থেকে বেছে নিন'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {smsServiceTypes.map((service, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-btcl-primary hover:shadow-2xl"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-btcl-primary to-btcl-primaryLight opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-btcl-primaryLight/10 transition-all duration-300 group-hover:bg-btcl-primary/10 group-hover:scale-110">
                  <FeatureIcon emoji={service.icon} className="h-7 w-7 text-btcl-primary" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-gray-900">{service.title}</h3>
                <p className="mb-4 text-sm leading-relaxed text-gray-600">{service.description}</p>
                <ul className="space-y-2">
                  {service.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start gap-2">
                      <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-btcl-primaryLight/10">
                        <svg className="h-3 w-3 text-btcl-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-sm font-medium text-gray-700 leading-snug">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API Features Section */}
      <section className="bg-btcl-primaryLight/5 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-btcl-primaryLight/20 px-4 py-1.5 text-sm font-semibold text-btcl-primaryDark">
              <span className="h-2 w-2 animate-pulse rounded-full bg-btcl-primary" />
              {getLocalizedText(locale, 'For Developers', 'ডেভেলপারদের জন্য')}
            </div>
            <h2 className="mb-3 text-3xl font-bold text-gray-900 md:text-4xl">
              {getLocalizedText(locale, 'Developer-Friendly API', 'ডেভেলপার-বান্ধব API')}
            </h2>
            <p className="mx-auto max-w-3xl text-base text-gray-600">
              {getLocalizedText(
                locale,
                'Integrate SMS capabilities into your applications with our robust API',
                'আমাদের শক্তিশালী API দিয়ে আপনার অ্যাপ্লিকেশনে এসএমএস ক্ষমতা সংযুক্ত করুন'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {apiFeatures.map((feature, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-btcl-primary hover:shadow-2xl"
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-btcl-primary to-btcl-primaryLight opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                <div className="mb-4 flex items-center gap-4">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-btcl-primaryLight/10 transition-all duration-300 group-hover:bg-btcl-primary/10 group-hover:scale-110">
                    <FeatureIcon emoji={feature.icon} className="h-7 w-7 text-btcl-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Specifications Section */}
      <section className="bg-gradient-to-r from-btcl-primary to-btcl-primaryDark py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center text-white">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold text-white">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              {getLocalizedText(locale, 'By the Numbers', 'সংখ্যার আলোকে')}
            </div>
            <h2 className="mb-3 text-3xl font-bold md:text-4xl">
              {getLocalizedText(locale, 'Technical Specifications', 'প্রযুক্তিগত বিশেষত্ব')}
            </h2>
            <p className="mx-auto max-w-3xl text-base text-white/90">
              {getLocalizedText(
                locale,
                'Built for scale with corporate-grade performance',
                'কর্পোরেট-গ্রেড কর্মক্ষমতা সহ স্কেলের জন্য নির্মিত'
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
            {technicalSpecs.map((spec, index) => (
              <div key={index} className="group text-center text-white transition-all duration-300 hover:-translate-y-1">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm transition-all duration-300 group-hover:bg-white/20 group-hover:scale-110">
                  <FeatureIcon emoji={spec.icon} className="h-7 w-7 text-white" />
                </div>
                <div className="mb-1 text-3xl font-bold text-white md:text-4xl">{spec.value}</div>
                <div className="text-sm font-semibold text-white/90">{spec.label}</div>
                {spec.description && <div className="mt-1 text-xs text-white/70">{spec.description}</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries Section */}
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-btcl-primaryLight/20 px-4 py-1.5 text-sm font-semibold text-btcl-primaryDark">
              <span className="h-2 w-2 animate-pulse rounded-full bg-btcl-primary" />
              {getLocalizedText(locale, 'Customers', 'গ্রাহকবৃন্দ')}
            </div>
            <h2 className="mb-3 text-3xl font-bold text-gray-900 md:text-4xl">
              {getLocalizedText(locale, 'Industries We Serve', 'আমরা যে শিল্পে সেবা দিই')}
            </h2>
            <p className="mx-auto max-w-3xl text-base text-gray-600">
              {getLocalizedText(
                locale,
                'Trusted by businesses across various industries',
                'বিভিন্ন শিল্পের ব্যবসায়িক প্রতিষ্ঠানের আস্থাভাজন'
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {industries.map((industry, index) => (
              <div
                key={index}
                className="group rounded-2xl border border-gray-200 bg-white p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-btcl-primary hover:shadow-xl"
              >
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-btcl-primaryLight/10 transition-all duration-300 group-hover:bg-btcl-primary/10 group-hover:scale-110">
                  <FeatureIcon emoji={industry.icon} className="h-6 w-6 text-btcl-primary" />
                </div>
                <div className="text-sm font-semibold text-gray-900">{industry.name}</div>
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
              {locale === 'en' ? 'Ready to get started?' : 'শুরু করতে প্রস্তুত?'}
            </h2>
            <p className="mx-auto mb-8 max-w-3xl text-base text-white/90">
              {locale === 'en'
                ? 'Choose your plan and start sending A2P SMS within minutes. No setup fees, no long-term contracts.'
                : 'আপনার প্ল্যান নির্বাচন করুন এবং মিনিটের মধ্যে A2P SMS পাঠানো শুরু করুন। কোন সেটআপ ফি নেই, দীর্ঘমেয়াদী চুক্তি নেই।'}
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href={`/${locale}/pricing`}>
                <Button
                  size="lg"
                  className="transform rounded-lg border-2 border-btcl-primary bg-white px-6 py-2.5 text-sm font-semibold text-btcl-primary transition-all duration-300 hover:scale-105 hover:bg-btcl-primary hover:text-white"
                >
                  {locale === 'en' ? 'Purchase Package Today' : 'আজই প্যাকেজ কিনুন'}
                </Button>
              </Link>
              <Link href={`/${locale}/contact`}>
                <Button
                  size="lg"
                  className="transform rounded-lg border-2 border-white/40 bg-transparent px-6 py-2.5 text-sm font-semibold text-white transition-all duration-300 hover:scale-105 hover:border-white hover:bg-white hover:text-btcl-primary"
                >
                  {locale === 'en' ? 'Talk to Sales' : 'সেলসের সাথে কথা বলুন'}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
