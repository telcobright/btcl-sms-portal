import { getTranslations } from 'next-intl/server'
import Link from 'next/link'

import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'

// Types
interface Office {
  name: string
  address: string
  phone: string
  email: string
  hours: string
  type: 'primary' | 'support'
}

interface SupportChannel {
  title: string
  description: string
  contact: string
  response: string
  icon: string
  color: string
}

interface FAQ {
  question: string
  answer: string
}

interface ContactPageProps {
  params: Promise<{
    locale: string
  }>
}

// Constants
const SUPPORT_CHANNEL_COLORS = {
  email: 'bg-blue-100 text-blue-600',
  phone: 'bg-green-100 text-green-600',
  chat: 'bg-purple-100 text-purple-600',
} as const

const FORM_SUBJECTS = [
  { key: 'sales', icon: '💼' },
  { key: 'support', icon: '🔧' },
  { key: 'billing', icon: '💰' },
  { key: 'partnership', icon: '🤝' },
  { key: 'other', icon: '📋' },
] as const

// Utility functions
const getLocalizedText = (locale: string, enText: string, bnText: string): string => {
  return locale === 'en' ? enText : bnText
}

// Custom hooks
const useContactData = (locale: string) => {
  const offices: Office[] = [
    {
      name: getLocalizedText(locale, 'BTCL Head Office', 'বিটিসিএল প্রধান কার্যালয়'),
      address: getLocalizedText(
          locale,
          'Telecommunications Building, 37/E, Eskaton Garden, Dhaka-1000',
          'টেলিযোগাযোগ ভবন, ৩৭/ই, ইস্কাটন গার্ডেন, ঢাকা-১০০০'
      ),
      phone: '+৮৮০ ২ ৪৮৩১১৫০০',
      email: 'mdoffice@btcl.gov.bd',
      hours: getLocalizedText(
          locale,
          'Sunday - Thursday: 9:00 AM - 5:00 PM',
          'রবিবার - বৃহস্পতিবার: সকাল ৯:০০ - বিকাল ৫:০০'
      ),
      type: 'primary',
    },
    {
      name: getLocalizedText(locale, 'SMS Support Center', 'এসএমএস সাপোর্ট সেন্টার'),
      address: getLocalizedText(
          locale,
          'BTCL Tower, Agargaon, Dhaka-1207, Bangladesh',
          'বিটিসিএল টাওয়ার, আগারগাঁও, ঢাকা-১২০৭, বাংলাদেশ'
      ),
      phone: '+880-2-8181234',
      email: 'sms@btcl.gov.bd',
      hours: getLocalizedText(locale, '24/7 Support Available', '২৪/৭ সাপোর্ট উপলব্ধ'),
      type: 'support',
    },
  ]

  const supportChannels: SupportChannel[] = [
    {
      title: getLocalizedText(locale, 'Email Support', 'ইমেইল সাপোর্ট'),
      description: getLocalizedText(
          locale,
          'Get help via email for non-urgent inquiries',
          'অজরুরি অনুসন্ধানের জন্য ইমেইলের মাধ্যমে সহায়তা পান'
      ),
      contact: 'support@btcl.gov.bd',
      response: getLocalizedText(locale, 'Response within 24 hours', '২৪ ঘন্টার মধ্যে উত্তর'),
      icon: '📧',
      color: 'email',
    },
    {
      title: getLocalizedText(locale, 'Phone Support', 'ফোন সাপোর্ট'),
      description: getLocalizedText(
          locale,
          'Speak directly with our technical support team',
          'আমাদের প্রযুক্তিগত সহায়তা দলের সাথে সরাসরি কথা বলুন'
      ),
      contact: '+880-2-8181234',
      response: getLocalizedText(locale, 'Available 24/7', '২৪/৭ উপলব্ধ'),
      icon: '📞',
      color: 'phone',
    },
    {
      title: getLocalizedText(locale, 'Live Chat', 'লাইভ চ্যাট'),
      description: getLocalizedText(
          locale,
          'Instant support through our website chat',
          'আমাদের ওয়েবসাইট চ্যাটের মাধ্যমে তাৎক্ষণিক সহায়তা'
      ),
      contact: getLocalizedText(locale, 'Available on website', 'ওয়েবসাইটে উপলব্ধ'),
      response: getLocalizedText(locale, 'Instant response', 'তাৎক্ষণিক উত্তর'),
      icon: '💬',
      color: 'chat',
    },
  ]

  const faqs: FAQ[] = [
    {
      question: getLocalizedText(locale, 'How quickly can I get started?', 'আমি কত তাড়াতাড়ি শুরু করতে পারি?'),
      answer: getLocalizedText(
          locale,
          'You can start sending SMS immediately after account verification and package purchase. The entire process typically takes 1-2 business days.',
          'অ্যাকাউন্ট যাচাইকরণ এবং প্যাকেজ ক্রয়ের পর আপনি অবিলম্বে এসএমএস পাঠানো শুরু করতে পারেন। সম্পূর্ণ প্রক্রিয়া সাধারণত ১-২ কার্যদিবস সময় নেয়।'
      ),
    },
    {
      question: getLocalizedText(
          locale,
          'What payment methods do you accept?',
          'আপনারা কী কী পেমেন্ট পদ্ধতি গ্রহণ করেন?'
      ),
      answer: getLocalizedText(
          locale,
          'We accept all major payment methods including mobile banking (bKash, Nagad, Rocket), credit/debit cards, and bank transfers through SSL Commerz.',
          'আমরা SSL Commerz এর মাধ্যমে মোবাইল ব্যাংকিং (বিকাশ, নগদ, রকেট), ক্রেডিট/ডেবিট কার্ড এবং ব্যাংক ট্রান্সফার সহ সকল প্রধান পেমেন্ট পদ্ধতি গ্রহণ করি।'
      ),
    },
    {
      question: getLocalizedText(
          locale,
          'Do you provide API documentation?',
          'আপনারা কি API ডকুমেন্টেশন প্রদান করেন?'
      ),
      answer: getLocalizedText(
          locale,
          'Yes, we provide comprehensive API documentation with code examples in multiple programming languages, along with SDKs for easy integration.',
          'হ্যাঁ, আমরা একাধিক প্রোগ্রামিং ভাষায় কোড উদাহরণ সহ ব্যাপক API ডকুমেন্টেশন প্রদান করি, সাথে সহজ ইন্টিগ্রেশনের জন্য SDK।'
      ),
    },
    {
      question: getLocalizedText(
          locale,
          'What is your SMS delivery rate?',
          'আপনাদের এসএমএস ডেলিভারি রেট কত?'
      ),
      answer: getLocalizedText(
          locale,
          'We maintain a 99.9% delivery rate with an average delivery time of less than 3 seconds for transactional messages and within 30 seconds for promotional messages.',
          'আমরা ট্রান্জেকশনাল বার্তার জন্য ৩ সেকেন্ডের কম এবং প্রমোশনাল বার্তার জন্য ৩০ সেকেন্ডের মধ্যে গড় ডেলিভারি সময় সহ ৯৯.৯% ডেলিভারি রেট বজায় রাখি।'
      ),
    },
    {
      question: getLocalizedText(
          locale,
          'Can I get a custom sender ID?',
          'আমি কি কাস্টম প্রেরক আইডি পেতে পারি?'
      ),
      answer: getLocalizedText(
          locale,
          'Yes, we provide custom sender ID services. You can use your company name or brand as the sender ID after verification process which typically takes 2-3 business days.',
          'হ্যাঁ, আমরা কাস্টম প্রেরক আইডি সেবা প্রদান করি। যাচাইকরণ প্রক্রিয়ার পর আপনি আপনার কোম্পানির নাম বা ব্র্যান্ড প্রেরক আইডি হিসেবে ব্যবহার করতে পারেন যা সাধারণত ২-৩ কার্যদিবস সময় নেয়।'
      ),
    },
  ]

  return { offices, supportChannels, faqs }
}

// Main Component
export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params
  const t = await getTranslations()
  const { offices, supportChannels, faqs } = useContactData(locale)

  return (
      <div className="min-h-screen bg-white">
        <Header />

        <HeroSection locale={locale} />
        <ContactFormSection locale={locale} supportChannels={supportChannels} />
        <OfficeLocationsFullSection offices={offices} locale={locale} />
        <FAQSection faqs={faqs} locale={locale} />

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
              <span className="text-2xl">📞</span>
              <span className="font-semibold">
              {getLocalizedText(locale, '24/7 Support', '২৪/৭ সাপোর্ট')}
            </span>
            </div>

            <h1 className="mb-8 text-5xl font-bold leading-tight md:text-6xl lg:text-7xl">
            <span className="block bg-gradient-to-r from-white via-green-100 to-white bg-clip-text text-transparent">
              {getLocalizedText(locale, 'Contact Us', 'যোগাযোগ করুন')}
            </span>
            </h1>

            <p className="mx-auto max-w-4xl text-xl leading-relaxed text-green-100/90 md:text-2xl">
              {getLocalizedText(
                  locale,
                  'Get in touch with our team for support, sales inquiries, or any questions about our SMS services.',
                  'সাপোর্ট, বিক্রয় অনুসন্ধান বা আমাদের এসএমএস সেবা সম্পর্কে যেকোনো প্রশ্নের জন্য আমাদের দলের সাথে যোগাযোগ করুন।'
              )}
            </p>

            {/* Contact Stats */}
            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
                <div className="text-3xl font-bold">24/7</div>
                <div className="text-green-100/90">
                  {getLocalizedText(locale, 'Support Available', 'সাপোর্ট উপলব্ধ')}
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
                <div className="text-3xl font-bold">&lt;1hr</div>
                <div className="text-green-100/90">
                  {getLocalizedText(locale, 'Response Time', 'প্রতিক্রিয়ার সময়')}
                </div>
              </div>
              <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-sm">
                <div className="text-3xl font-bold">98%</div>
                <div className="text-green-100/90">
                  {getLocalizedText(locale, 'Satisfaction Rate', 'সন্তুষ্টির হার')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
  )
}

// Contact Form Section Component
function ContactFormSection({
                              locale,
                              supportChannels,
                            }: {
  locale: string
  supportChannels: SupportChannel[]
}) {
  return (
      <section className="py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
            {/* Contact Form */}
            <ContactForm locale={locale} />

            {/* Contact Information */}
            <div className="space-y-12">
              <SupportChannelsSection supportChannels={supportChannels} locale={locale} />
            </div>
          </div>
        </div>
      </section>
  )
}

// Contact Form Component
function ContactForm({ locale }: { locale: string }) {
  return (
      <Card className="h-fit">
        <CardHeader className="pb-6">
          <div className="mb-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-700">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            {getLocalizedText(locale, 'Get in Touch', 'যোগাযোগ করুন')}
          </span>
          </div>
          <CardTitle className="text-3xl">
            {getLocalizedText(locale, 'Send us a Message', 'আমাদের একটি বার্তা পাঠান')}
          </CardTitle>
          <CardDescription className="text-lg">
            {getLocalizedText(
                locale,
                'Fill out the form below and we\'ll get back to you as soon as possible.',
                'নিচের ফর্মটি পূরণ করুন এবং আমরা যত তাড়াতাড়ি সম্ভব আপনার কাছে ফিরে আসব।'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {getLocalizedText(locale, 'Full Name', 'পূর্ণ নাম')} *
                </label>
                <input
                    type="text"
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-btcl-primary focus:outline-none focus:ring-2 focus:ring-btcl-primary/20"
                    placeholder={getLocalizedText(locale, 'Enter your full name', 'আপনার পূর্ণ নাম লিখুন')}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {getLocalizedText(locale, 'Company', 'কোম্পানি')}
                </label>
                <input
                    type="text"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-btcl-primary focus:outline-none focus:ring-2 focus:ring-btcl-primary/20"
                    placeholder={getLocalizedText(locale, 'Company name (optional)', 'কোম্পানির নাম (ঐচ্ছিক)')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {getLocalizedText(locale, 'Email Address', 'ইমেইল ঠিকানা')} *
                </label>
                <input
                    type="email"
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-btcl-primary focus:outline-none focus:ring-2 focus:ring-btcl-primary/20"
                    placeholder={getLocalizedText(locale, 'your@email.com', 'your@email.com')}
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700">
                  {getLocalizedText(locale, 'Phone Number', 'ফোন নম্বর')} *
                </label>
                <input
                    type="tel"
                    required
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-btcl-primary focus:outline-none focus:ring-2 focus:ring-btcl-primary/20"
                    placeholder="+880-1XXXXXXXXX"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {getLocalizedText(locale, 'Subject', 'বিষয়')} *
              </label>
              <select
                  required
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-btcl-primary focus:outline-none focus:ring-2 focus:ring-btcl-primary/20"
              >
                <option value="">
                  {getLocalizedText(locale, 'Select a subject', 'একটি বিষয় নির্বাচন করুন')}
                </option>
                {FORM_SUBJECTS.map((subject) => (
                    <option key={subject.key} value={subject.key}>
                      {subject.icon} {getSubjectText(locale, subject.key)}
                    </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {getLocalizedText(locale, 'Message', 'বার্তা')} *
              </label>
              <textarea
                  required
                  rows={6}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-btcl-primary focus:outline-none focus:ring-2 focus:ring-btcl-primary/20"
                  placeholder={getLocalizedText(
                      locale,
                      'Tell us how we can help you...',
                      'আমরা আপনাকে কীভাবে সাহায্য করতে পারি তা বলুন...'
                  )}
              />
            </div>

            <Button
                type="submit"
                className="w-full transform rounded-xl bg-gradient-to-r from-btcl-primary to-green-600 py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl"
            >
              {getLocalizedText(locale, 'Send Message', 'বার্তা পাঠান')}
            </Button>
          </form>
        </CardContent>
      </Card>
  )
}

// Support Channels Section Component
function SupportChannelsSection({
                                  supportChannels,
                                  locale,
                                }: {
  supportChannels: SupportChannel[]
  locale: string
}) {
  return (
      <div>
        <div className="mb-8">
        <span className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          {getLocalizedText(locale, 'Support Channels', 'সাপোর্ট চ্যানেল')}
        </span>
        </div>
        <h2 className="mb-8 text-3xl font-bold text-gray-900">
          {getLocalizedText(locale, 'How to Reach Us', 'আমাদের সাথে যোগাযোগের উপায়')}
        </h2>
        <div className="space-y-6">
          {supportChannels.map((channel, index) => (
              <SupportChannelCard key={index} channel={channel} />
          ))}
        </div>
      </div>
  )
}

// Support Channel Card Component
function SupportChannelCard({ channel }: { channel: SupportChannel }) {
  return (
      <Card className="group transition-all duration-300 hover:scale-105 hover:shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div
                className={`flex h-16 w-16 items-center justify-center rounded-2xl text-3xl ${
                    SUPPORT_CHANNEL_COLORS[channel.color as keyof typeof SUPPORT_CHANNEL_COLORS]
                }`}
            >
              {channel.icon}
            </div>
            <div className="flex-1">
              <h3 className="mb-2 text-xl font-bold text-gray-900">{channel.title}</h3>
              <p className="mb-4 text-gray-600">{channel.description}</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-btcl-primary" />
                  <span className="font-medium text-btcl-primary">{channel.contact}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-sm text-gray-500">{channel.response}</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
  )
}

// Office Locations Full Section Component
function OfficeLocationsFullSection({ offices, locale }: { offices: Office[]; locale: string }) {
  return (
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <div className="mb-8">
              <span className="inline-flex items-center gap-2 rounded-full bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-700">
                <span className="h-2 w-2 rounded-full bg-purple-500" />
                {getLocalizedText(locale, 'Office Locations', 'অফিসের অবস্থান')}
              </span>
            </div>
            <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
              {getLocalizedText(locale, 'Visit Our Offices', 'আমাদের অফিস ভিজিট করুন')}
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-gray-600">
              {getLocalizedText(
                locale,
                'Find us at our locations across Bangladesh. We\'re here to serve you better.',
                'বাংলাদেশ জুড়ে আমাদের অবস্থানে আমাদের খুঁজুন। আমরা আপনাকে আরও ভালভাবে সেবা দিতে এখানে আছি।'
              )}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
            {offices.map((office, index) => (
                <OfficeCard key={index} office={office} />
            ))}
          </div>
        </div>
      </section>
  )
}

// Office Card Component
function OfficeCard({ office }: { office: Office }) {
  const isPrimary = office.type === 'primary'

  return (
      <Card
          className={`group transition-all duration-300 hover:scale-105 hover:shadow-xl ${
              isPrimary ? 'border-2 border-btcl-primary/20 bg-gradient-to-br from-green-50 to-white' : ''
          }`}
      >
        <CardContent className="p-6">
          <div className="mb-4 flex items-start justify-between">
            <h3 className="text-xl font-bold text-gray-900">{office.name}</h3>
            {isPrimary && (
                <span className="rounded-full bg-btcl-primary px-3 py-1 text-xs font-semibold text-white">
              PRIMARY
            </span>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 items-center justify-center">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="text-gray-700">{office.address}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
              </div>
              <span className="font-medium text-btcl-primary">{office.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <span className="font-medium text-btcl-primary">{office.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <span className="text-gray-700">{office.hours}</span>
            </div>
          </div>
        </CardContent>
      </Card>
  )
}

// FAQ Section Component
function FAQSection({ faqs, locale }: { faqs: FAQ[]; locale: string }) {
  return (
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="mb-20 text-center">
            <div className="mb-8">
            <span className="inline-flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-2 text-sm font-semibold text-yellow-700">
              <span className="h-2 w-2 rounded-full bg-yellow-500" />
              {getLocalizedText(locale, 'Help Center', 'সাহায্য কেন্দ্র')}
            </span>
            </div>
            <h2 className="mb-4 text-4xl font-bold text-gray-900 md:text-5xl">
              {getLocalizedText(locale, 'Frequently Asked Questions', 'প্রায়শই জিজ্ঞাসিত প্রশ্ন')}
            </h2>
            <p className="text-xl text-gray-600">
              {getLocalizedText(locale, 'Quick answers to common questions', 'সাধারণ প্রশ্নের দ্রুত উত্তর')}
            </p>
          </div>

          <div className="space-y-6">
            {faqs.map((faq, index) => (
                <FAQCard key={index} faq={faq} />
            ))}
          </div>

          <div className="mt-12 text-center">
            <p className="mb-6 text-lg text-gray-600">
              {getLocalizedText(
                  locale,
                  "Can't find what you're looking for?",
                  'আপনি যা খুঁজছেন তা খুঁজে পাচ্ছেন না?'
              )}
            </p>
            <Link href="#contact-form">
              <Button className="transform rounded-xl bg-gradient-to-r from-btcl-primary to-green-600 px-8 py-3 font-semibold transition-all duration-300 hover:scale-105">
                {getLocalizedText(locale, 'Contact Support', 'সাপোর্টের সাথে যোগাযোগ করুন')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
  )
}

// FAQ Card Component
function FAQCard({ faq }: { faq: FAQ }) {
  return (
      <Card className="transition-all duration-300 hover:shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-start gap-4 text-xl">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-btcl-primary text-sm font-bold text-white">
              Q
            </div>
            {faq.question}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-bold text-green-700">
              A
            </div>
            <p className="text-gray-600">{faq.answer}</p>
          </div>
        </CardContent>
      </Card>
  )
}

// Helper function for form subjects
function getSubjectText(locale: string, key: string): string {
  const subjects = {
    sales: {
      en: 'Sales Inquiry',
      bn: 'বিক্রয় অনুসন্ধান',
    },
    support: {
      en: 'Technical Support',
      bn: 'প্রযুক্তিগত সহায়তা',
    },
    billing: {
      en: 'Billing Question',
      bn: 'বিলিং প্রশ্ন',
    },
    partnership: {
      en: 'Partnership',
      bn: 'অংশীদারিত্ব',
    },
    other: {
      en: 'Other',
      bn: 'অন্যান্য',
    },
  }

  return subjects[key as keyof typeof subjects]?.[locale as 'en' | 'bn'] ?? ''
}