import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

// Types
interface Milestone {
  year: string
  event: string
  description: string
}

interface Stat {
  number: string
  label: string
  icon: string
}

interface CompanyValue {
  icon: string
  title: {
    en: string
    bn: string
  }
  description: {
    en: string
    bn: string
  }
}

interface Award {
  year: string
  title: string
  organization: string
  icon: string
}

interface Leader {
  name: string
  position: string
  bio: string
  initial: string
}

interface AboutPageProps {
  params: Promise<{
    locale: string
  }>
}

// Constants
const COMPANY_VALUES: readonly CompanyValue[] = [
  {
    icon: 'excellence',
    title: { en: 'Excellence', bn: 'উৎকর্ষতা' },
    description: {
      en: 'We strive for excellence in every service we provide, ensuring the highest quality standards.',
      bn: 'আমরা প্রতিটি সেবায় উৎকর্ষতার জন্য চেষ্টা করি, সর্বোচ্চ মানের নিশ্চয়তা প্রদান করি।',
    },
  },
  {
    icon: 'trust',
    title: { en: 'Trust', bn: 'আস্থা' },
    description: {
      en: 'Building lasting relationships through transparency, reliability, and consistent service delivery.',
      bn: 'স্বচ্ছতা, নির্ভরযোগ্যতা এবং ধারাবাহিক সেবা প্রদানের মাধ্যমে দীর্ঘস্থায়ী সম্পর্ক গড়ে তুলি।',
    },
  },
  {
    icon: 'innovation',
    title: { en: 'Innovation', bn: 'উদ্ভাবন' },
    description: {
      en: 'Embracing cutting-edge technology to deliver modern solutions for contemporary challenges.',
      bn: 'সমসাময়িক চ্যালেঞ্জের জন্য আধুনিক সমাধান প্রদানে অত্যাধুনিক প্রযুক্তি গ্রহণ।',
    },
  },
  {
    icon: 'accessibility',
    title: { en: 'Accessibility', bn: 'সহজলভ্যতা' },
    description: {
      en: 'Making communication services accessible to all, bridging the digital divide across Bangladesh.',
      bn: 'সকলের জন্য যোগাযোগ সেবা সহজলভ্য করা, বাংলাদেশ জুড়ে ডিজিটাল বিভাজন দূরীকরণ।',
    },
  },
] as const

const WHY_CHOOSE_BTCL_ITEMS = [
  {
    icon: 'government',
    key: 'government_backed',
  },
  {
    icon: 'star',
    key: 'experience',
  },
  {
    icon: 'globe',
    key: 'coverage',
  },
  {
    icon: 'pricing',
    key: 'pricing',
  },
] as const

// Utility functions
const getLocalizedText = (locale: string, enText: string, bnText: string): string => {
  return locale === 'en' ? enText : bnText
}

// Hook for data generation
const useAboutPageData = (locale: string) => {
  const milestones: Milestone[] = [
    {
      year: '1989',
      event: getLocalizedText(locale, 'BTCL Established', 'বিটিসিএল প্রতিষ্ঠা'),
      description: getLocalizedText(
          locale,
          'Founded as the national telecommunications company',
          'জাতীয় টেলিযোগাযোগ কোম্পানি হিসেবে প্রতিষ্ঠিত'
      ),
    },
    {
      year: '2010',
      event: getLocalizedText(locale, 'Enterprise Services Launch', 'এন্টারপ্রাইজ সেবা চালু'),
      description: getLocalizedText(
          locale,
          'Introduced SMS Gateway and PBX solutions for businesses',
          'ব্যবসার জন্য এসএমএস গেটওয়ে এবং PBX সমাধান চালু'
      ),
    },
    {
      year: '2018',
      event: getLocalizedText(locale, 'Communication Suite Expansion', 'যোগাযোগ সমাধান সম্প্রসারণ'),
      description: getLocalizedText(
          locale,
          'Launched Contact Center and Voice Broadcast services',
          'কন্টাক্ট সেন্টার এবং ভয়েস ব্রডকাস্ট সেবা চালু'
      ),
    },
    {
      year: '2024',
      event: getLocalizedText(locale, 'Modern Platform Launch', 'আধুনিক প্ল্যাটফর্ম চালু'),
      description: getLocalizedText(
          locale,
          'Unified platform for all communication services with next-gen API',
          'নতুন প্রজন্মের API সহ সকল যোগাযোগ সেবার একীভূত প্ল্যাটফর্ম'
      ),
    },
  ]

  const stats: Stat[] = [
    {
      number: '10M+',
      label: getLocalizedText(locale, 'Messages/Calls Daily', 'দৈনিক বার্তা/কল'),
      icon: '📱',
    },
    {
      number: '5000+',
      label: getLocalizedText(locale, 'Enterprise Clients', 'এন্টারপ্রাইজ ক্লায়েন্ট'),
      icon: '🏢',
    },
    {
      number: '99.9%',
      label: getLocalizedText(locale, 'Uptime Guarantee', 'আপটাইম গ্যারান্টি'),
      icon: '⚡',
    },
    {
      number: '24/7',
      label: getLocalizedText(locale, 'Customer Support', 'গ্রাহক সেবা'),
      icon: '🛡️',
    },
  ]

  const awards: Award[] = [
    {
      year: '2023',
      title: getLocalizedText(
          locale,
          'Best Telecommunications Service Provider',
          'সেরা টেলিযোগাযোগ সেবা প্রদানকারী'
      ),
      organization: getLocalizedText(locale, 'Bangladesh IT Awards', 'বাংলাদেশ আইটি অ্যাওয়ার্ডস'),
      icon: '🏆',
    },
    {
      year: '2022',
      title: getLocalizedText(
          locale,
          'Excellence in Digital Innovation',
          'ডিজিটাল উদ্ভাবনে শ্রেষ্ঠত্ব'
      ),
      organization: getLocalizedText(
          locale,
          'Digital Bangladesh Summit',
          'ডিজিটাল বাংলাদেশ সামিট'
      ),
      icon: '🥇',
    },
    {
      year: '2021',
      title: getLocalizedText(
          locale,
          'Customer Service Excellence',
          'গ্রাহক সেবায় শ্রেষ্ঠত্ব'
      ),
      organization: getLocalizedText(
          locale,
          'Telecom Industry Awards',
          'টেলিকম ইন্ডাস্ট্রি অ্যাওয়ার্ডস'
      ),
      icon: '⭐',
    },
  ]

  const leaders: Leader[] = [
    {
      name: getLocalizedText(locale, 'Mohammad Rahman', 'মোহাম্মদ রহমান'),
      position: getLocalizedText(locale, 'Managing Director', 'ব্যবস্থাপনা পরিচালক'),
      bio: getLocalizedText(
          locale,
          'Leading BTCL\'s digital transformation with over 25 years of telecommunications experience.',
          '২৫ বছরের টেলিযোগাযোগ অভিজ্ঞতা নিয়ে বিটিসিএল-এর ডিজিটাল রূপান্তরের নেতৃত্ব দিচ্ছেন।'
      ),
      initial: 'M',
    },
    {
      name: getLocalizedText(locale, 'Dr. Fatima Khatun', 'ড. ফাতিমা খাতুন'),
      position: getLocalizedText(locale, 'Chief Technology Officer', 'প্রধান প্রযুক্তি কর্মকর্তা'),
      bio: getLocalizedText(
          locale,
          'Pioneering innovative solutions and overseeing technical operations across all BTCL services.',
          'উদ্ভাবনী সমাধানের পথপ্রদর্শক এবং বিটিসিএল-এর সকল সেবার প্রযুক্তিগত কার্যক্রম তদারকি।'
      ),
      initial: 'F',
    },
    {
      name: getLocalizedText(locale, 'Ahmed Hassan', 'আহমেদ হাসান'),
      position: getLocalizedText(locale, 'Head of Enterprise Services', 'এন্টারপ্রাইজ সেবা বিভাগের প্রধান'),
      bio: getLocalizedText(
          locale,
          'Overseeing delivery excellence across SMS, Contact Center, PBX, and Voice Broadcast services with unwavering focus on customer satisfaction.',
          'গ্রাহক সন্তুষ্টির উপর অবিচল মনোনিবেশ সহ এসএমএস, কন্টাক্ট সেন্টার, PBX এবং ভয়েস ব্রডকাস্ট সেবায় শ্রেষ্ঠত্ব তদারকি।'
      ),
      initial: 'A',
    },
  ]

  return { milestones, stats, awards, leaders }
}

// Main Component
export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params
  const t = await getTranslations()
  const { milestones, stats, awards, leaders } = useAboutPageData(locale)

  return (
      <div className="min-h-screen bg-white">
        <Header />

        <HeroSection locale={locale} />
        <CompanyOverviewSection locale={locale} />
        {/* Temporarily hidden — re-enable when content is ready */}
        {/* <StatisticsSection stats={stats} locale={locale} /> */}
        {/* <TimelineSection milestones={milestones} locale={locale} /> */}
        <ValuesSection locale={locale} />
        {/* <AwardsSection awards={awards} locale={locale} /> */}
        {/* <LeadershipSection leaders={leaders} locale={locale} /> */}

        <Footer />
      </div>
  )
}

// Hero Section Component
function HeroSection({ locale }: { locale: string }) {
  return (
      <section className="relative overflow-hidden bg-gradient-to-br from-btcl-primary via-btcl-primary to-btcl-secondary py-16">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-10 top-10 h-40 w-40 animate-pulse rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -right-16 top-32 h-60 w-60 animate-pulse rounded-full bg-white/5 blur-3xl delay-1000" />
          <div className="absolute bottom-20 left-1/3 h-32 w-32 animate-pulse rounded-full bg-white/5 blur-3xl delay-500" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold text-white">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              {getLocalizedText(locale, 'Who We Are', 'আমরা কারা')}
            </div>

            <h1 className="mb-4 text-4xl font-bold text-white lg:text-5xl">
              {getLocalizedText(locale, 'About BTCL', 'বিটিসিএল সম্পর্কে')}
            </h1>

            <p className="mx-auto mb-8 max-w-3xl text-xl text-white">
              {getLocalizedText(
                  locale,
                  'Leading Bangladesh\'s telecommunications infrastructure, delivering enterprise-grade communication solutions including Bulk SMS, Alaap Cloud Contact Center, PBX, and Voice Broadcast services.',
                  'বাংলাদেশের টেলিযোগাযোগ অবকাঠামোর নেতৃত্ব দিচ্ছি, বাল্ক এসএমএস, Alaap Cloud Contact Center, PBX এবং ভয়েস ব্রডকাস্ট সহ এন্টারপ্রাইজ-গ্রেড যোগাযোগ সমাধান প্রদান করছি।'
              )}
            </p>

            <div className="mt-8 flex justify-center">
              <a
                  href="https://btcl.gov.bd/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-3 text-base font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:border-white/50 hover:bg-white/20 md:text-lg"
              >
                <span>🌐</span>
                <span>{getLocalizedText(locale, 'Visit Official BTCL Website', 'অফিসিয়াল বিটিসিএল ওয়েবসাইট দেখুন')}</span>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

          </div>
        </div>
      </section>
  )
}

// Company Overview Section Component
function CompanyOverviewSection({ locale }: { locale: string }) {
  const whyChooseItems = WHY_CHOOSE_BTCL_ITEMS.map((item) => ({
    icon: item.icon,
    text: getWhyChooseText(locale, item.key),
  }))

  return (
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <div>
              <div className="mb-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-btcl-primaryLight/20 px-4 py-1.5 text-sm font-semibold text-btcl-primaryDark">
                <span className="h-2 w-2 animate-pulse rounded-full bg-btcl-primary" />
                {getLocalizedText(locale, 'Our Mission', 'আমাদের লক্ষ্য')}
              </div>
              </div>

              <h2 className="mb-8 text-3xl font-bold text-gray-900 md:text-4xl">
                {getLocalizedText(
                    locale,
                    'Connecting Bangladesh Through Innovation',
                    'উদ্ভাবনের মাধ্যমে বাংলাদেশকে সংযুক্ত করা'
                )}
              </h2>

              <div className="space-y-6 text-lg text-gray-600">
                <p>
                  {getLocalizedText(
                      locale,
                      'Bangladesh Telecommunications Company Limited (BTCL) is the national telecommunications company of Bangladesh, committed to providing world-class communication services to businesses and individuals across the country.',
                      'বাংলাদেশ টেলিকমিউনিকেশনস কোম্পানি লিমিটেড (বিটিসিএল) বাংলাদেশের জাতীয় টেলিযোগাযোগ কোম্পানি, যা দেশব্যাপী ব্যবসা ও ব্যক্তিদের বিশ্বমানের যোগাযোগ সেবা প্রদানে প্রতিশ্রুতিবদ্ধ।'
                  )}
                </p>
                <p>
                  {getLocalizedText(
                      locale,
                      'Our comprehensive suite of enterprise communication services represents our commitment to digital transformation. From Bulk SMS and Voice Broadcast to Alaap Cloud Contact Center and PBX solutions, we offer businesses reliable, secure, and cost-effective ways to connect with their customers and streamline operations.',
                      'আমাদের এন্টারপ্রাইজ যোগাযোগ সেবার ব্যাপক পরিসর ডিজিটাল রূপান্তরের প্রতি আমাদের অঙ্গীকার প্রতিনিধিত্ব করে। বাল্ক এসএমএস ও ভয়েস ব্রডকাস্ট থেকে Alaap Cloud Contact Center এবং PBX সমাধান পর্যন্ত, আমরা ব্যবসায়িক প্রতিষ্ঠানগুলোকে তাদের গ্রাহকদের সাথে সংযোগ এবং কার্যক্রম সুগম করার জন্য নির্ভরযোগ্য, নিরাপদ এবং সাশ্রয়ী উপায় প্রদান করি।'
                  )}
                </p>
              </div>
            </div>

            <WhyChooseBTCLCard locale={locale} items={whyChooseItems} />
          </div>
        </div>
      </section>
  )
}

// Why Choose BTCL Card Component
function WhyChooseBTCLCard({ locale, items }: { locale: string; items: { icon: string; text: string }[] }) {
  const cls = "h-6 w-6 text-btcl-primary"
  const renderIcon = (key: string) => {
    switch (key) {
      case 'government':
        return (
          <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10l9-7 9 7M5 21V10m4 11V10m6 11V10m4 11V10" />
          </svg>
        )
      case 'star':
        return (
          <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2l3 7h7l-5.5 4.5L18 21l-6-4-6 4 1.5-7.5L2 9h7l3-7z" />
          </svg>
        )
      case 'globe':
        return (
          <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
          </svg>
        )
      case 'pricing':
        return (
          <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v22M17 5H9.5a3.5 3.5 0 100 7H14a3.5 3.5 0 110 7H6" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
      <div className="rounded-3xl bg-gradient-to-br from-gray-50 to-white p-8 shadow-2xl">
        <h3 className="mb-8 text-2xl font-bold text-gray-900">
          {getLocalizedText(locale, 'Why Choose BTCL?', 'কেন বিটিসিএল বেছে নেবেন?')}
        </h3>
        <div className="space-y-5">
          {items.map((item, index) => (
              <div key={index} className="group flex items-center gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-btcl-primaryLight/10 transition-all duration-300 group-hover:bg-btcl-primary/10 group-hover:scale-110">
                  {renderIcon(item.icon)}
                </div>
                <span className="font-medium text-gray-700">{item.text}</span>
              </div>
          ))}
        </div>
      </div>
  )
}

// Statistics Section Component
function StatisticsSection({ stats, locale }: { stats: Stat[]; locale: string }) {
  return (
      <section className="bg-gradient-to-r from-btcl-primary to-btcl-primary py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center text-white">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold text-white">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              {getLocalizedText(locale, 'By the Numbers', 'সংখ্যার আলোকে')}
            </div>
            <h2 className="mb-3 text-3xl font-bold md:text-4xl">
              {getLocalizedText(locale, 'Our Impact in Numbers', 'সংখ্যায় আমাদের প্রভাব')}
            </h2>
            <p className="mx-auto max-w-3xl text-base text-white/90">
              {getLocalizedText(
                  locale,
                  'Trusted by thousands of businesses across Bangladesh',
                  'বাংলাদেশের হাজারো ব্যবসার আস্থাভাজন'
              )}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
                <StatCard key={index} stat={stat} />
            ))}
          </div>
        </div>
      </section>
  )
}

// Stat Card Component
function StatCard({ stat }: { stat: Stat }) {
  return (
      <div className="group text-center text-white transition-all duration-300 hover:scale-110">
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-3xl backdrop-blur-sm transition-all duration-300 group-hover:bg-white/20">
          {stat.icon}
        </div>
        <div className="mb-2 text-4xl font-bold md:text-5xl">{stat.number}</div>
        <div className="text-lg text-white/90">{stat.label}</div>
      </div>
  )
}

// Timeline Section Component
function TimelineSection({ milestones, locale }: { milestones: Milestone[]; locale: string }) {
  return (
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-btcl-primaryLight/20 px-4 py-1.5 text-sm font-semibold text-btcl-primaryDark">
              <span className="h-2 w-2 animate-pulse rounded-full bg-btcl-primary" />
              {getLocalizedText(locale, 'Timeline', 'সময়রেখা')}
            </div>
            <h2 className="mb-3 text-3xl font-bold text-gray-900 md:text-4xl">
              {getLocalizedText(locale, 'Our Journey', 'আমাদের যাত্রা')}
            </h2>
            <p className="mx-auto max-w-3xl text-base text-gray-600">
              {getLocalizedText(
                  locale,
                  'Key milestones in BTCL\'s evolution',
                  'বিটিসিএল-এর বিকাশের প্রধান মাইলফলক'
              )}
            </p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 hidden h-full w-0.5 -translate-x-1/2 transform bg-gradient-to-b from-btcl-primary to-btcl-primaryLight/60 md:block" />

            <div className="space-y-12 md:space-y-16">
              {milestones.map((milestone, index) => (
                  <TimelineItem
                      key={milestone.year}
                      milestone={milestone}
                      index={index}
                      isReversed={index % 2 !== 0}
                  />
              ))}
            </div>
          </div>
        </div>
      </section>
  )
}

// Timeline Item Component
function TimelineItem({
                        milestone,
                        index,
                        isReversed,
                      }: {
  milestone: Milestone
  index: number
  isReversed: boolean
}) {
  return (
      <div className={`flex items-center gap-8 md:gap-16 ${isReversed ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
        {/* Content */}
        <div className="flex-1 md:w-1/2">
          <Card className="transform transition-all duration-300 hover:scale-105 hover:shadow-xl">
            <CardHeader>
              <div className="mb-4 flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-btcl-primary to-btcl-primary text-xl font-bold text-white">
                  {milestone.year}
                </div>
                <div>
                  <CardTitle className="text-xl text-gray-900">{milestone.event}</CardTitle>
                  <p className="mt-2 text-gray-600">{milestone.description}</p>
                </div>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Center dot for desktop */}
        <div className="hidden md:block">
          <div className="h-6 w-6 rounded-full bg-btcl-primary shadow-lg" />
        </div>

        {/* Spacer for alignment */}
        <div className="hidden flex-1 md:block md:w-1/2" />
      </div>
  )
}

// Values Section Component
function ValuesSection({ locale }: { locale: string }) {
  return (
      <section className="relative bg-gradient-to-b from-white via-btcl-primaryLight/5 to-white py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-btcl-primaryLight/20 px-4 py-1.5 text-sm font-semibold text-btcl-primaryDark">
              <span className="h-2 w-2 animate-pulse rounded-full bg-btcl-primary" />
              {getLocalizedText(locale, 'What Drives Us', 'যা আমাদের চালিত করে')}
            </div>
            <h2 className="mb-3 text-3xl font-bold text-gray-900 md:text-4xl">
              {getLocalizedText(locale, 'Our Core Values', 'আমাদের মূল্যবোধ')}
            </h2>
            <p className="mx-auto max-w-3xl text-base text-gray-600">
              {getLocalizedText(
                  locale,
                  'The principles that guide everything we do',
                  'যে নীতিমালা আমাদের সকল কাজকে পরিচালনা করে'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {COMPANY_VALUES.map((value, index) => (
                <ValueCard key={index} value={value} locale={locale} />
            ))}
          </div>
        </div>
      </section>
  )
}

// Value Card Component
function ValueCard({ value, locale }: { value: CompanyValue; locale: string }) {
  const cls = "h-8 w-8 text-btcl-primary"
  const renderIcon = (key: string) => {
    switch (key) {
      case 'excellence':
        return (
          <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="5" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
          </svg>
        )
      case 'trust':
        return (
          <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V8a2 2 0 014 0v3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V9a2 2 0 014 0v6c0 3-2 5-5 5h-3l-4-3-3-1c-1-.5-1.5-1.5-1-2.5l1-2c.5-1 1.5-1.5 2.5-1L8 11h8z" />
          </svg>
        )
      case 'innovation':
        return (
          <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.5 3l-1 4-4 1 5 5-1 4 4-1 5 5-4 1-1 4-5-5-4 1 1-4-5-5 4-1 1-4 5 5z" />
          </svg>
        )
      case 'accessibility':
        return (
          <svg className={cls} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />
          </svg>
        )
      default:
        return null
    }
  }

  return (
      <div className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-btcl-primary hover:shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-btcl-primary to-btcl-primaryLight opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-btcl-primaryLight/10 transition-all duration-300 group-hover:bg-btcl-primary/10 group-hover:scale-110">
          {renderIcon(value.icon)}
        </div>
        <h3 className="mb-2 text-lg font-bold text-gray-900">{value.title[locale as 'en' | 'bn']}</h3>
        <p className="text-sm leading-relaxed text-gray-600">
          {value.description[locale as 'en' | 'bn']}
        </p>
      </div>
  )
}

// Awards Section Component
function AwardsSection({ awards, locale }: { awards: Award[]; locale: string }) {
  return (
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center text-white">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold text-white">
              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
              {getLocalizedText(locale, 'Recognition', 'স্বীকৃতি')}
            </div>
            <h2 className="mb-3 text-3xl font-bold md:text-4xl">
              {getLocalizedText(locale, 'Awards & Recognition', 'পুরস্কার ও স্বীকৃতি')}
            </h2>
            <p className="mx-auto max-w-3xl text-base text-gray-300">
              {getLocalizedText(
                  locale,
                  'Recognition for our commitment to excellence',
                  'উৎকর্ষতার প্রতি আমাদের প্রতিশ্রুতির স্বীকৃতি'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {awards.map((award, index) => (
                <AwardCard key={index} award={award} />
            ))}
          </div>
        </div>
      </section>
  )
}

// Award Card Component
function AwardCard({ award }: { award: Award }) {
  return (
      <div className="group rounded-2xl bg-white/10 p-8 text-center text-white backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:bg-white/20">
        <div className="mb-6 text-6xl">{award.icon}</div>
        <div className="mb-2 text-3xl font-bold text-yellow-400">{award.year}</div>
        <h3 className="mb-4 text-xl font-bold">{award.title}</h3>
        <p className="text-gray-300">{award.organization}</p>
      </div>
  )
}

// Leadership Section Component
function LeadershipSection({ leaders, locale }: { leaders: Leader[]; locale: string }) {
  return (
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-12 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-btcl-primaryLight/20 px-4 py-1.5 text-sm font-semibold text-btcl-primaryDark">
              <span className="h-2 w-2 animate-pulse rounded-full bg-btcl-primary" />
              {getLocalizedText(locale, 'Our People', 'আমাদের মানুষ')}
            </div>
            <h2 className="mb-3 text-3xl font-bold text-gray-900 md:text-4xl">
              {getLocalizedText(locale, 'Leadership Team', 'নেতৃত্ব দল')}
            </h2>
            <p className="mx-auto max-w-3xl text-base text-gray-600">
              {getLocalizedText(
                  locale,
                  'Meet the visionaries driving BTCL forward',
                  'বিটিসিএল-কে এগিয়ে নিয়ে যাওয়া দূরদর্শীদের সাথে পরিচিত হন'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {leaders.map((leader, index) => (
                <LeaderCard key={index} leader={leader} />
            ))}
          </div>
        </div>
      </section>
  )
}

// Leader Card Component
function LeaderCard({ leader }: { leader: Leader }) {
  return (
      <Card className="group text-center transition-all duration-300 hover:scale-105 hover:shadow-xl">
        <CardHeader>
          <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-gradient-to-r from-btcl-primary to-btcl-primary p-1">
            <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-3xl font-bold text-btcl-primary">
              {leader.initial}
            </div>
          </div>
          <CardTitle className="text-xl">{leader.name}</CardTitle>
          <CardDescription className="text-lg font-semibold text-btcl-primary">
            {leader.position}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">{leader.bio}</p>
        </CardContent>
      </Card>
  )
}

// Helper function for Why Choose BTCL text
function getWhyChooseText(locale: string, key: string): string {
  const texts = {
    government_backed: {
      en: 'Government-backed reliability and trust',
      bn: 'সরকার-সমর্থিত নির্ভরযোগ্যতা ও আস্থা',
    },
    experience: {
      en: '35+ years of telecommunications expertise',
      bn: '৩৫+ বছরের টেলিযোগাযোগ দক্ষতা',
    },
    coverage: {
      en: 'Nationwide infrastructure coverage',
      bn: 'দেশব্যাপী অবকাঠামো কভারেজ',
    },
    pricing: {
      en: 'Competitive pricing with transparent billing',
      bn: 'স্বচ্ছ বিলিং সহ প্রতিযোগিতামূলক মূল্য',
    },
  }

  return texts[key as keyof typeof texts]?.[locale as 'en' | 'bn'] ?? ''
}