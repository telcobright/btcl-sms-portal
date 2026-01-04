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
    icon: '🎯',
    title: { en: 'Excellence', bn: 'উৎকর্ষতা' },
    description: {
      en: 'We strive for excellence in every service we provide, ensuring the highest quality standards.',
      bn: 'আমরা প্রতিটি সেবায় উৎকর্ষতার জন্য চেষ্টা করি, সর্বোচ্চ মানের নিশ্চয়তা প্রদান করি।',
    },
  },
  {
    icon: '🤝',
    title: { en: 'Trust', bn: 'আস্থা' },
    description: {
      en: 'Building lasting relationships through transparency, reliability, and consistent service delivery.',
      bn: 'স্বচ্ছতা, নির্ভরযোগ্যতা এবং ধারাবাহিক সেবা প্রদানের মাধ্যমে দীর্ঘস্থায়ী সম্পর্ক গড়ে তুলি।',
    },
  },
  {
    icon: '🚀',
    title: { en: 'Innovation', bn: 'উদ্ভাবন' },
    description: {
      en: 'Embracing cutting-edge technology to deliver modern solutions for contemporary challenges.',
      bn: 'সমসাময়িক চ্যালেঞ্জের জন্য আধুনিক সমাধান প্রদানে অত্যাধুনিক প্রযুক্তি গ্রহণ।',
    },
  },
  {
    icon: '🌍',
    title: { en: 'Accessibility', bn: 'সহজলভ্যতা' },
    description: {
      en: 'Making communication services accessible to all, bridging the digital divide across Bangladesh.',
      bn: 'সকলের জন্য যোগাযোগ সেবা সহজলভ্য করা, বাংলাদেশ জুড়ে ডিজিটাল বিভাজন দূরীকরণ।',
    },
  },
] as const

const WHY_CHOOSE_BTCL_ITEMS = [
  {
    icon: '🏛️',
    key: 'government_backed',
  },
  {
    icon: '⭐',
    key: 'experience',
  },
  {
    icon: '🌐',
    key: 'coverage',
  },
  {
    icon: '💰',
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
        <StatisticsSection stats={stats} locale={locale} />
        <TimelineSection milestones={milestones} locale={locale} />
        <ValuesSection locale={locale} />
        <AwardsSection awards={awards} locale={locale} />
        <LeadershipSection leaders={leaders} locale={locale} />

        <Footer />
      </div>
  )
}

// Hero Section Component
function HeroSection({ locale }: { locale: string }) {
  return (
      <section className="relative overflow-hidden bg-gradient-to-br from-btcl-primary via-green-600 to-btcl-secondary py-24">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -left-10 top-10 h-40 w-40 animate-pulse rounded-full bg-white/5 blur-3xl" />
          <div className="absolute -right-16 top-32 h-60 w-60 animate-pulse rounded-full bg-white/5 blur-3xl delay-1000" />
          <div className="absolute bottom-20 left-1/3 h-32 w-32 animate-pulse rounded-full bg-white/5 blur-3xl delay-500" />
        </div>

        <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center text-white">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-6 py-3 backdrop-blur-sm">
              <span className="text-2xl">🏛️</span>
              <span className="font-semibold">
              {getLocalizedText(locale, 'Since 1989', '১৯৮৯ সাল থেকে')}
            </span>
            </div>

            <h1 className="mb-8 text-5xl font-bold leading-tight md:text-6xl lg:text-7xl">
            <span className="block bg-gradient-to-r from-white via-green-100 to-white bg-clip-text text-transparent">
              {getLocalizedText(locale, 'About BTCL', 'বিটিসিএল সম্পর্কে')}
            </span>
            </h1>

            <p className="mx-auto max-w-4xl text-xl leading-relaxed text-green-100/90 md:text-2xl">
              {getLocalizedText(
                  locale,
                  'Leading Bangladesh\'s telecommunications infrastructure since 1989, now delivering enterprise-grade communication solutions including Bulk SMS, Hosted Contact Center, PBX, and Voice Broadcast services.',
                  '১৯৮৯ সাল থেকে বাংলাদেশের টেলিযোগাযোগ অবকাঠামোর নেতৃত্ব দিচ্ছি, এখন বাল্ক এসএমএস, হোস্টেড কন্টাক্ট সেন্টার, PBX এবং ভয়েস ব্রডকাস্ট সহ এন্টারপ্রাইজ-গ্রেড যোগাযোগ সমাধান প্রদান করছি।'
              )}
            </p>

            {/* Scroll Indicator */}
            <div className="mt-16 animate-bounce">
              <div className="mx-auto flex h-12 w-8 justify-center rounded-full border-2 border-white/40">
                <div className="mt-3 h-4 w-1 animate-pulse rounded-full bg-white/60" />
              </div>
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
              <div className="mb-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
                <span className="h-2 w-2 rounded-full bg-green-500" />
                {getLocalizedText(locale, 'Our Mission', 'আমাদের লক্ষ্য')}
              </span>
              </div>

              <h2 className="mb-8 text-4xl font-bold text-gray-900 md:text-5xl">
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
                      'Our comprehensive suite of enterprise communication services represents our commitment to digital transformation. From Bulk SMS and Voice Broadcast to Hosted Contact Centers and PBX solutions, we offer businesses reliable, secure, and cost-effective ways to connect with their customers and streamline operations.',
                      'আমাদের এন্টারপ্রাইজ যোগাযোগ সেবার ব্যাপক পরিসর ডিজিটাল রূপান্তরের প্রতি আমাদের অঙ্গীকার প্রতিনিধিত্ব করে। বাল্ক এসএমএস ও ভয়েস ব্রডকাস্ট থেকে হোস্টেড কন্টাক্ট সেন্টার এবং PBX সমাধান পর্যন্ত, আমরা ব্যবসায়িক প্রতিষ্ঠানগুলোকে তাদের গ্রাহকদের সাথে সংযোগ এবং কার্যক্রম সুগম করার জন্য নির্ভরযোগ্য, নিরাপদ এবং সাশ্রয়ী উপায় প্রদান করি।'
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
  return (
      <div className="rounded-3xl bg-gradient-to-br from-gray-50 to-white p-8 shadow-2xl">
        <h3 className="mb-8 text-2xl font-bold text-gray-900">
          {getLocalizedText(locale, 'Why Choose BTCL?', 'কেন বিটিসিএল বেছে নেবেন?')}
        </h3>
        <div className="space-y-6">
          {items.map((item, index) => (
              <div key={index} className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-xl">
                  {item.icon}
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
      <section className="bg-gradient-to-r from-btcl-primary to-green-600 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center text-white">
            <h2 className="mb-4 text-4xl font-bold md:text-5xl">
              {getLocalizedText(locale, 'Our Impact in Numbers', 'সংখ্যায় আমাদের প্রভাব')}
            </h2>
            <p className="text-xl text-green-100/90">
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
        <div className="text-lg text-green-100/90">{stat.label}</div>
      </div>
  )
}

// Timeline Section Component
function TimelineSection({ milestones, locale }: { milestones: Milestone[]; locale: string }) {
  return (
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-20 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
              {getLocalizedText(locale, 'Our Journey', 'আমাদের যাত্রা')}
            </h2>
            <p className="text-xl text-gray-600">
              {getLocalizedText(
                  locale,
                  'Key milestones in BTCL\'s evolution',
                  'বিটিসিএল-এর বিকাশের প্রধান মাইলফলক'
              )}
            </p>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-1/2 hidden h-full w-0.5 -translate-x-1/2 transform bg-gradient-to-b from-btcl-primary to-green-300 md:block" />

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
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-btcl-primary to-green-600 text-xl font-bold text-white">
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
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-20 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
              {getLocalizedText(locale, 'Our Core Values', 'আমাদের মূল্যবোধ')}
            </h2>
            <p className="text-xl text-gray-600">
              {getLocalizedText(
                  locale,
                  'The principles that guide everything we do',
                  'যে নীতিমালা আমাদের সকল কাজকে পরিচালনা করে'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
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
  return (
      <Card className="group text-center transition-all duration-300 hover:scale-105 hover:shadow-xl">
        <CardHeader>
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-r from-btcl-primary to-green-600 text-4xl transition-all duration-300 group-hover:scale-110">
            {value.icon}
          </div>
          <CardTitle className="text-2xl">{value.title[locale as 'en' | 'bn']}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-lg text-gray-600">
            {value.description[locale as 'en' | 'bn']}
          </CardDescription>
        </CardContent>
      </Card>
  )
}

// Awards Section Component
function AwardsSection({ awards, locale }: { awards: Award[]; locale: string }) {
  return (
      <section className="bg-gradient-to-r from-gray-900 to-gray-800 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-20 text-center text-white">
            <h2 className="mb-4 text-4xl font-bold md:text-5xl">
              {getLocalizedText(locale, 'Awards & Recognition', 'পুরস্কার ও স্বীকৃতি')}
            </h2>
            <p className="text-xl text-gray-300">
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
          <div className="mb-20 text-center">
            <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
              {getLocalizedText(locale, 'Leadership Team', 'নেতৃত্ব দল')}
            </h2>
            <p className="text-xl text-gray-600">
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
          <div className="mx-auto mb-6 h-24 w-24 rounded-full bg-gradient-to-r from-btcl-primary to-green-600 p-1">
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