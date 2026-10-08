import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { IndividualTariff } from '@/components/pricing/IndividualTariff';
import StartingFromPrice from '@/components/pricing/StartingFromPrice';
import { AggregatorTag } from '@/components/ui/AggregatorTag';
import { Button } from '@/components/ui/Button';
import { pageMetadata } from '@/config/seo';
import type { Metadata } from 'next';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { Building2 } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

// Types
interface Feature {
  title: string;
  description: string;
  icon: string;
}

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
  color: string;
  href: string;
  restricted?: boolean;
}

interface HomePageProps {
  params: Promise<{
    locale: string;
  }>;
}

// Constants
const HERO_STATS = [
  { value: '10K+', label: 'Active Users' },
  { value: '99.9%', label: 'Uptime' },
  { value: '24/7', label: 'Support' },
] as const;

const TESTIMONIALS = [
  { name: 'Ahmed Trading', industry: 'E-commerce', initial: 'A' },
  { name: 'Bangladeshi Bank', industry: 'Banking', initial: 'B' },
  { name: 'City Hospital', industry: 'Healthcare', initial: 'C' },
] as const;

export async function generateMetadata({ params }: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  return pageMetadata(locale, '');
}

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = await params;
  const t = await getTranslations();

  // Services data - Order: Alaap Cloud IP PBX, Voice Broadcast, Contact Center, Bulk SMS
  const services: Service[] = [
    {
      id: 'hosted-pbx',
      title: locale === 'en' ? 'Alaap Cloud IP PBX' : 'Alaap Cloud IP PBX',
      description:
        locale === 'en'
          ? 'Corporate phone system in the cloud with advanced call management, voicemail, unified communications, and seamless integration with your business tools.'
          : 'ক্লাউডে কর্পোরেট ফোন সিস্টেম যাতে রয়েছে উন্নত কল ম্যানেজমেন্ট, ভয়েসমেল, ইউনিফাইড কমিউনিকেশন এবং আপনার ব্যবসায়িক সরঞ্জামের সাথে নিরবচ্ছিন্ন সংযোগ।',
      icon: '/alaap_cloud_ip_pbx.png',
      features: [
        locale === 'en'
          ? 'Unlimited virtual extensions'
          : 'সীমাহীন ভার্চুয়াল এক্সটেনশন',
        locale === 'en'
          ? 'Smart call forwarding & routing'
          : 'স্মার্ট কল ফরওয়ার্ডিং ও রাউটিং',
        locale === 'en'
          ? 'HD audio & video conferencing'
          : 'HD অডিও ও ভিডিও কনফারেন্সিং',
        locale === 'en' ? 'Voicemail to email' : 'ভয়েসমেল টু ইমেইল',
        locale === 'en' ? 'Mobile & desktop apps' : 'মোবাইল ও ডেস্কটপ অ্যাপ',
        locale === 'en' ? 'Auto-attendant & IVR' : 'অটো-এটেন্ডেন্ট ও IVR',
      ],
      color: 'from-btcl-primary to-btcl-primary',
      href: `/${locale}/services/hosted-pbx`,
    },
    {
      id: 'voice-broadcast',
      title:
        locale === 'en'
          ? 'Alaap Cloud Voice Broadcasting Service'
          : 'Alaap Cloud Voice Broadcasting Service',
      description:
        locale === 'en'
          ? 'Deliver pre-recorded voice messages to thousands simultaneously for announcements, alerts, and campaigns. Perfect for emergency notifications and marketing campaigns.'
          : 'ঘোষণা, সতর্কতা এবং প্রচারাভিযানের জন্য একযোগে হাজারো মানুষের কাছে পূর্ব-রেকর্ড করা ভয়েস বার্তা পৌঁছে দিন। জরুরি বিজ্ঞপ্তি এবং মার্কেটিং ক্যাম্পেইনের জন্য নিখুঁত।',
      icon: '/alaap_voice_broadcasting.png',
      features: [
        locale === 'en'
          ? 'Mass voice calling (1000+ calls/min)'
          : 'গণ ভয়েস কলিং (১০০০+ কল/মিনিট)',
        locale === 'en'
          ? 'Text-to-speech in multiple languages'
          : 'একাধিক ভাষায় টেক্সট-টু-স্পিচ',
        locale === 'en'
          ? 'Pre-recorded message upload'
          : 'পূর্ব-রেকর্ড করা বার্তা আপলোড',
        locale === 'en'
          ? 'Campaign scheduling & automation'
          : 'ক্যাম্পেইন সময়সূচী ও অটোমেশন',
        locale === 'en'
          ? 'Detailed call analytics & reports'
          : 'বিস্তারিত কল বিশ্লেষণ ও রিপোর্ট',
        locale === 'en'
          ? 'Retry logic for failed calls'
          : 'ব্যর্থ কলের জন্য পুনঃচেষ্টা লজিক',
      ],
      color: 'from-btcl-primary to-btcl-primary',
      href: `/${locale}/services/voice-broadcast`,
    },
    {
      id: 'contact-center',
      title:
        locale === 'en'
          ? 'Alaap Cloud Contact Center'
          : 'Alaap Cloud Contact Center',
      description:
        locale === 'en'
          ? 'Cloud-based contact center solution with omnichannel support, IVR, intelligent call routing, and advanced analytics. Scale your customer service operations effortlessly.'
          : 'ক্লাউড-ভিত্তিক কন্টাক্ট সেন্টার সমাধান যাতে রয়েছে অমনিচ্যানেল সাপোর্ট, IVR, বুদ্ধিমান কল রাউটিং এবং উন্নত বিশ্লেষণ। আপনার গ্রাহক সেবা কার্যক্রম সহজে স্কেল করুন।',
      icon: '/alaap_cloud_contact_center.png',
      features: [
        locale === 'en'
          ? 'Omnichannel support (voice, chat, email)'
          : 'অমনিচ্যানেল সাপোর্ট (ভয়েস, চ্যাট, ইমেইল)',
        locale === 'en'
          ? 'Interactive IVR system'
          : 'ইন্টারঅ্যাক্টিভ IVR সিস্টেম',
        locale === 'en' ? 'Intelligent call routing' : 'বুদ্ধিমান কল রাউটিং',
        locale === 'en'
          ? 'Real-time dashboards & analytics'
          : 'রিয়েল-টাইম ড্যাশবোর্ড ও বিশ্লেষণ',
        locale === 'en'
          ? 'Call recording & quality monitoring'
          : 'কল রেকর্ডিং ও মান নিরীক্ষণ',
        locale === 'en'
          ? 'Agent performance tracking'
          : 'এজেন্ট কর্মক্ষমতা ট্র্যাকিং',
      ],
      color: 'from-btcl-primary to-btcl-primary',
      href: `/${locale}/services/contact-center`,
    },
    {
      id: 'bulk-sms',
      title: locale === 'en' ? 'Bulk SMS Service' : 'Bulk SMS Service',
      description:
        locale === 'en'
          ? 'Send promotional messages, alerts, and notifications to millions with our corporate-grade bulk SMS gateway. 99.9% delivery rate across all networks in Bangladesh.'
          : 'আমাদের কর্পোরেট-গ্রেড বাল্ক এসএমএস গেটওয়ে দিয়ে লাখো মানুষকে প্রচারমূলক বার্তা, সতর্কতা এবং বিজ্ঞপ্তি পাঠান। বাংলাদেশের সব নেটওয়ার্কে ৯৯.৯% ডেলিভারি হার।',
      icon: '/bulk_sms.png',
      features: [
        locale === 'en'
          ? '99.9% High delivery rate'
          : '৯৯.৯% উচ্চ ডেলিভারি হার',
        locale === 'en' ? 'Custom sender ID' : 'কাস্টম প্রেরক আইডি',
        locale === 'en' ? 'RESTful API integration' : 'RESTful API ইন্টিগ্রেশন',
        locale === 'en'
          ? 'Real-time delivery reports'
          : 'রিয়েল-টাইম ডেলিভারি রিপোর্ট',
        locale === 'en' ? 'Schedule & bulk upload' : 'সময়সূচী ও বাল্ক আপলোড',
        locale === 'en' ? '24/7 technical support' : '২৪/৭ প্রযুক্তিগত সহায়তা',
      ],
      color: 'from-btcl-primary to-btcl-primary',
      href: `/${locale}/services/bulk-sms`,
      restricted: true,
    },
  ];

  // Feature data
  const features: Feature[] = [
    {
      title: t('home.features.reliable.title'),
      description: t('home.features.reliable.description'),
      icon: 'uptime',
    },
    {
      title: t('home.features.fast.title'),
      description: t('home.features.fast.description'),
      icon: 'delivery',
    },
    {
      title: t('home.features.secure.title'),
      description: t('home.features.secure.description'),
      icon: 'secure',
    },
    {
      title: t('home.features.support.title'),
      description: t('home.features.support.description'),
      icon: 'support',
    },
  ];


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
      <PricingPreviewSection locale={locale} t={t} />

      {/* Testimonials Section - hidden */}
      {/* <TestimonialsSection locale={locale} t={t} /> */}

      <Footer />
    </div>
  );
}

// Hero Section Component
function HeroSection({ locale, t }: { locale: string; t: any }) {
  return (
    <section
      className="relative flex items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat min-h-[50vh]"
      style={{ backgroundImage: "url('/btcl_banner_2.png')" }}
    >
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/70 via-black/60 to-black/50" />

      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute left-10 top-20 h-20 w-20 animate-pulse rounded-full bg-btcl-primaryLight/10 blur-xl" />
        <div className="absolute bottom-32 right-16 h-32 w-32 animate-pulse rounded-full bg-blue-400/10 blur-xl delay-1000" />
        <div className="absolute left-1/4 top-1/2 h-16 w-16 animate-pulse rounded-full bg-purple-400/10 blur-xl delay-500" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge/Announcement */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-2.5 text-base text-white/90 backdrop-blur-sm transition-all duration-300 hover:bg-white/15">
            <Building2
              className="h-5 w-5 text-btcl-primaryLight"
              strokeWidth={2}
            />
            <span>Cloud Based Corporate Service</span>
          </div>

          {/* Main Heading */}
          <h1 className="mb-6 text-4xl font-bold leading-tight text-white md:text-5xl lg:text-6xl xl:text-7xl">
            <span className="block text-white">
              Alaap Cloud Corporate Service
            </span>
          </h1>

          {/* Description */}
          <p className="mx-auto mb-8 max-w-3xl text-lg leading-relaxed text-white/80 md:text-xl lg:text-2xl">
            BTCL delivering
            corporate-grade communication solutions
          </p>

          {/* CTA Buttons */}
          <div className="mb-4 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href={`/${locale}/register`} className="group">
              <Button className="transform rounded-lg border-0 bg-gradient-to-r from-btcl-primary to-btcl-primary px-8 py-4 text-base md:text-lg font-semibold text-white shadow-xl transition-all duration-300 hover:scale-105 hover:from-btcl-primary hover:to-btcl-primaryDark">
                <span>{t('home.hero.cta')}</span>
                <span className="ml-2 transition-transform duration-200 group-hover:translate-x-1">
                  →
                </span>
              </Button>
            </Link>

            <Link href={`/${locale}/services`} className="group">
              <Button
                variant="outline"
                className="transform rounded-lg border-2 border-white/30 bg-white/5 px-8 py-4 text-base md:text-lg font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:border-white/50 hover:bg-white/10"
              >
                <span className="mr-2 transition-transform duration-200 group-hover:scale-110">
                  ▶
                </span>
                <span>{t('home.hero.learn_more')}</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// Services Showcase Section Component
function ServicesShowcaseSection({
  services,
  locale,
}: {
  services: Service[];
  locale: string;
}) {
  return (
    <section className="bg-gradient-to-b from-gray-50 to-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-btcl-primaryLight/20 px-4 py-1.5 text-sm font-semibold text-btcl-primaryDark">
            <span className="h-2 w-2 animate-pulse rounded-full bg-btcl-primary" />
            {locale === 'en' ? 'Our Services' : 'আমাদের সেবাসমূহ'}
          </div>
          <h2 className="mb-3 text-3xl font-bold text-gray-900 md:text-4xl">
            {locale === 'en'
              ? 'Complete Communication Suite'
              : 'সম্পূর্ণ যোগাযোগ সমাধান'}
          </h2>
          <p className="mx-auto max-w-3xl text-base text-gray-600">
            {locale === 'en'
              ? 'Discover our comprehensive range of corporate communication solutions designed to power your business'
              : 'আপনার ব্যবসা পরিচালনার জন্য ডিজাইন করা কর্পোরেট যোগাযোগ সমাধানের আমাদের বিস্তৃত পরিসর আবিষ্কার করুন'}
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {services.map((service, index) => (
            <ServiceCard key={service.id} service={service} index={index} />
          ))}
        </div>

        {/* For Individuals: the one package sold to a personal account */}
        <div className="mt-14 grid grid-cols-1 items-start gap-8 lg:grid-cols-5">
          <div className="lg:col-span-2 lg:pt-6">
            <div className="mb-4 inline-flex rounded-full bg-gradient-to-r from-btcl-primary to-btcl-primary px-2.5 py-1 text-xs font-semibold text-white shadow-sm">
              {locale === 'en' ? 'Individual' : 'ব্যক্তিগত'}
            </div>
            <h3 className="mb-3 text-2xl font-bold text-gray-900 md:text-3xl">
              Individual IP-Telephone
            </h3>
            <p className="mb-6 text-base leading-relaxed text-gray-600">
              {locale === 'en'
                ? 'For customers registered as an Individual: one DID number and one extension, with IVR, call recording, call forwarding and voice message to email. 250 free minutes with every paid month.'
                : 'ব্যক্তিগত হিসেবে নিবন্ধিত গ্রাহকদের জন্য: একটি ডিআইডি নম্বর ও একটি এক্সটেনশন, সাথে IVR, কল রেকর্ডিং, কল ফরওয়ার্ডিং ও ভয়েস মেসেজ টু ইমেইল। প্রতিটি পরিশোধিত মাসে ২৫০ মিনিট ফ্রি টকটাইম।'}
            </p>
            <Link
              href={`/${locale}/pricing#iptsp-individual`}
              className="inline-flex items-center gap-2 text-sm font-bold text-btcl-primary transition-all duration-300 hover:gap-3"
            >
              {locale === 'en' ? 'View details' : 'বিস্তারিত দেখুন'}
              <span>→</span>
            </Link>
          </div>
          <div className="lg:col-span-3">
            <IndividualTariff locale={locale} />
          </div>
        </div>

        {/* View All Services CTA */}
        <div className="mt-10 text-center">
          <Link href={`/${locale}/services`}>
            <Button
              variant="outline"
              className="transform rounded-lg border-2 border-btcl-primary px-6 py-2.5 text-sm font-semibold text-btcl-primary transition-all duration-300 hover:scale-105 hover:bg-btcl-primary hover:text-white"
            >
              {locale === 'en' ? 'Explore All Services' : 'সকল সেবা দেখুন'}
              <span className="ml-2">→</span>
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

// Service Card Component
function ServiceCard({ service, index }: { service: Service; index: number }) {
  const getColorClasses = (color: string) => {
    const colorMap: {
      [key: string]: { text: string; bg: string; border: string };
    } = {
      'from-blue-500 to-blue-600': {
        text: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
      },
      'from-purple-500 to-purple-600': {
        text: 'text-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
      },
      'from-btcl-primary to-btcl-primary': {
        text: 'text-btcl-primary',
        bg: 'bg-btcl-primaryLight/10',
        border: 'border-btcl-primaryLight/30',
      },
      'from-orange-500 to-orange-600': {
        text: 'text-orange-600',
        bg: 'bg-orange-50',
        border: 'border-orange-200',
      },
    };
    return (
      colorMap[color] || {
        text: 'text-btcl-primary',
        bg: 'bg-btcl-primaryLight/10',
        border: 'border-btcl-primaryLight/30',
      }
    );
  };

  const colors = getColorClasses(service.color);

  return (
    <Link href={service.href} className="block h-full">
      <Card className="group relative flex h-full flex-col overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-btcl-primary hover:shadow-2xl">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-btcl-primary to-btcl-primaryLight opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        <CardHeader className="pb-3">
          <div className="mb-4 flex items-start justify-between">
            {service.icon.startsWith('/') ? (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110">
                <img
                  src={service.icon}
                  alt=""
                  className="h-full w-full object-contain"
                />
              </div>
            ) : (
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r ${service.color} text-3xl shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl`}
              >
                {service.icon}
              </div>
            )}
            <div
              className={`rounded-full bg-gradient-to-r ${service.color} px-2.5 py-1 text-xs font-semibold text-white shadow-sm`}
            >
              Corporate
            </div>
          </div>
          <CardTitle className="mb-2 text-xl font-bold">
            {service.title}
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed text-gray-600">
            {service.description}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col">
          <div className="mb-4 space-y-2">
            {service.features.slice(0, 4).map((feature, featureIndex) => (
              <div key={featureIndex} className="flex items-start gap-2">
                <div
                  className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${colors.bg}`}
                >
                  <svg
                    className={`h-3 w-3 ${colors.text}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-sm font-medium text-gray-700 leading-snug">
                  {feature}
                </span>
              </div>
            ))}
            {service.features.length > 4 && (
              <div className="pt-1 text-xs text-gray-500">
                +{service.features.length - 4} more features
              </div>
            )}
          </div>
          {service.restricted && (
            <div className="mt-auto pt-4">
              <AggregatorTag />
            </div>
          )}
          <div
            className={`${service.restricted ? 'mt-3' : 'mt-auto'} flex items-center gap-2 pt-4 text-sm font-bold ${colors.text} transition-all duration-300 group-hover:gap-3`}
          >
            Learn More
            <svg
              className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

// Features Section Component
function FeaturesSection({ features, t }: { features: Feature[]; t: any }) {
  const renderIcon = (key: string) => {
    const cls = 'h-8 w-8 text-btcl-primary';
    switch (key) {
      case 'uptime':
        return (
          <svg
            className={cls}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 12a9 9 0 1018 0 9 9 0 00-18 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 7v5l3 2"
            />
          </svg>
        );
      case 'delivery':
        return (
          <svg
            className={cls}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M13 2L4.5 13h6L11 22l8.5-11h-6L13 2z"
            />
          </svg>
        );
      case 'secure':
        return (
          <svg
            className={cls}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 2l8 3v6c0 5-3.5 9.5-8 11-4.5-1.5-8-6-8-11V5l8-3z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4"
            />
          </svg>
        );
      case 'support':
        return (
          <svg
            className={cls}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4 6a2 2 0 012-2h2.5a1 1 0 01.95.68l1.2 3.6a1 1 0 01-.27 1.05L8.6 10.9a12 12 0 005.5 5.5l1.57-1.78a1 1 0 011.05-.27l3.6 1.2a1 1 0 01.68.95V19a2 2 0 01-2 2h-1C9.7 21 3 14.3 3 6V5z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <section className="relative bg-btcl-primaryLight/5 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-btcl-primaryLight/20 px-4 py-1.5 text-sm font-semibold text-btcl-primaryDark">
            <span className="h-2 w-2 animate-pulse rounded-full bg-btcl-primary" />
            Our Advantage
          </div>
          <h2 className="mb-3 text-3xl font-bold text-gray-900 md:text-4xl">
            {t('home.features.title')}
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-btcl-primary hover:shadow-2xl"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-btcl-primary to-btcl-primaryLight opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-btcl-primaryLight/10 transition-all duration-300 group-hover:bg-btcl-primary/10 group-hover:scale-110">
                {renderIcon(feature.icon)}
              </div>
              <h3 className="mb-2 text-lg font-bold text-gray-900">
                {feature.title}
              </h3>
              <p className="text-sm leading-relaxed text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Pricing Preview Section Component
function PricingPreviewSection({ locale, t }: { locale: string; t: any }) {
  // Pricing data - Order: Alaap Cloud IP PBX, Voice Broadcast, Contact Center, Bulk SMS
  const servicePricing = [
    {
      id: 'hosted-pbx',
      icon: '/alaap_cloud_ip_pbx.png',
      name: locale === 'en' ? 'Alaap Cloud IP PBX' : 'Alaap Cloud IP PBX',
      price: '৳1,200',
      unit: locale === 'en' ? '/month' : '/মাস',
      description: locale === 'en' ? 'Starting from' : 'শুরু হচ্ছে',
      features: [
        locale === 'en' ? '10 Extensions' : '১০ এক্সটেনশন',
        locale === 'en' ? '500 Min Free Talktime*' : '৫০০ মিনিট ফ্রি টকটাইম*',
        locale === 'en' ? 'Call Recording' : 'কল রেকর্ডিং',
      ],
      color: 'from-btcl-primary to-btcl-primary',
    },
    {
      id: 'voice-broadcast',
      icon: '/alaap_voice_broadcasting.png',
      name:
        locale === 'en'
          ? 'Alaap Cloud Voice Broadcasting Service'
          : 'Alaap Cloud Voice Broadcasting Service',
      // Lowest slab rate, loaded from the admin-edited pricing.
      slabService: 'vbs' as const,
      price: '',
      unit: locale === 'en' ? '/message' : '/মেসেজ',
      description: locale === 'en' ? 'Starting from' : 'শুরু হচ্ছে',
      features: [
        locale === 'en' ? 'Text-to-Speech' : 'টেক্সট-টু-স্পিচ',
        locale === 'en' ? 'Advanced Scheduling' : 'উন্নত সময়সূচী',
        locale === 'en' ? 'Delivery Reports' : 'ডেলিভারি রিপোর্ট',
      ],
      color: 'from-btcl-primary to-btcl-primary',
    },
    {
      id: 'contact-center',
      icon: '/alaap_cloud_contact_center.png',
      name:
        locale === 'en'
          ? 'Alaap Cloud Contact Center'
          : 'Alaap Cloud Contact Center',
      price: '৳8,500',
      unit: locale === 'en' ? '/agent/month' : '/এজেন্ট/মাস',
      description: locale === 'en' ? 'Starting from' : 'শুরু হচ্ছে',
      features: [
        locale === 'en' ? 'Audio Call & Chat' : 'অডিও কল ও চ্যাট',
        locale === 'en' ? 'IVR & ACD' : 'IVR ও ACD',
        locale === 'en'
          ? 'Social Media Integration'
          : 'সোশ্যাল মিডিয়া ইন্টিগ্রেশন',
      ],
      color: 'from-btcl-primary to-btcl-primary',
    },
    {
      id: 'bulk-sms',
      icon: '/bulk_sms.png',
      name: locale === 'en' ? 'Bulk SMS Service' : 'Bulk SMS Service',
      // Lowest slab rate, loaded from the admin-edited pricing.
      slabService: 'sms' as const,
      price: '',
      unit: locale === 'en' ? '/SMS' : '/এসএমএস',
      description: locale === 'en' ? 'Starting from' : 'শুরু হচ্ছে',
      features: [
        locale === 'en' ? '99.9% delivery rate' : '৯৯.৯% ডেলিভারি হার',
        locale === 'en' ? 'Custom sender ID' : 'কাস্টম প্রেরক আইডি',
        locale === 'en' ? 'API integration' : 'API ইন্টিগ্রেশন',
      ],
      color: 'from-btcl-primary to-btcl-primary',
    },
  ];

  return (
    <section className="py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Title */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-btcl-primaryLight/20 px-4 py-1.5 text-sm font-semibold text-btcl-primaryDark">
            <span className="h-2 w-2 animate-pulse rounded-full bg-btcl-primary" />
            Pricing
          </div>
          <h2 className="mb-3 text-3xl font-bold text-gray-900 md:text-4xl">
            {t('home.pricing.title')}
          </h2>
          <p className="mx-auto max-w-3xl text-base text-gray-600">
            {t('home.pricing.subtitle')}
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {servicePricing.map((service) => (
            <div
              key={service.id}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-btcl-primary hover:shadow-2xl"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-btcl-primary to-btcl-primaryLight opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div className="mb-5 text-center">
                {service.icon.startsWith('/') ? (
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl transition-all duration-300 group-hover:scale-110">
                    <img
                      src={service.icon}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  </div>
                ) : (
                  <div
                    className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-r ${service.color} text-3xl transition-all duration-300 group-hover:scale-110`}
                  >
                    {service.icon}
                  </div>
                )}
                <h3 className="mb-1 text-xl font-bold text-gray-900">
                  {service.name}
                </h3>
                {'slabService' in service && service.slabService ? (
                  <StartingFromPrice
                    service={service.slabService}
                    description={service.description}
                    unit={service.unit}
                  />
                ) : (
                  <>
                    <div className="mb-2 text-xs text-gray-500">
                      {service.description}
                    </div>
                    <div>
                      <span className="text-3xl font-bold text-gray-900">
                        {service.price}
                      </span>
                      <span className="text-sm text-gray-600">{service.unit}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="mb-5 space-y-2">
                {service.features.map((feature, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-btcl-primaryLight/10">
                      <svg
                        className="h-3 w-3 text-btcl-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700 leading-snug">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              {service.id === 'bulk-sms' && (
                <div className="mt-auto mb-3 flex justify-center">
                  <AggregatorTag />
                </div>
              )}
              <Link
                href={`/${locale}/pricing`}
                className={`${service.id === 'bulk-sms' ? '' : 'mt-auto '}block`}
              >
                <Button className="w-full transform rounded-lg border-2 border-btcl-primary bg-white py-2.5 px-6 text-sm font-semibold text-btcl-primary transition-all duration-300 hover:scale-105 hover:bg-btcl-primary hover:text-white">
                  {locale === 'en' ? 'View Plans' : 'প্ল্যান দেখুন'}
                </Button>
              </Link>
            </div>
          ))}
        </div>

        {/* Same condition the pricing page spells out: the talktime is a joining
            allowance, and a monthly price beside it invites the opposite reading. */}
        <p className="mt-8 text-center text-sm text-gray-500">
          {locale === 'en'
            ? '*Free Talktime is a one-time allowance, given once when the package is activated. It is not renewed with each monthly billing cycle.'
            : '*ফ্রি টকটাইম একবারই প্রদান করা হয় — প্যাকেজ চালুর সময় একবার। প্রতি মাসের বিলিং চক্রে এটি পুনরায় দেওয়া হয় না।'}
        </p>

        {/* VAT Notice */}
        <div className="mt-12 text-center">
          <div className="inline-flex items-center rounded-xl border border-yellow-200 bg-yellow-50 px-8 py-4">
            <svg
              className="mr-3 h-6 w-6 text-yellow-600"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
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
  );
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
          <p className="text-xl text-gray-600">
            {t('home.testimonials.subtitle')}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {TESTIMONIALS.map((testimonial, index) => (
            <Card
              key={index}
              className="transition-all duration-300 hover:shadow-lg"
            >
              <CardContent className="pt-6">
                <div className="mb-4 flex items-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-btcl-primary font-bold text-white">
                    {testimonial.initial}
                  </div>
                  <div className="ml-4">
                    <div className="font-semibold">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">
                      {testimonial.industry}
                    </div>
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
  );
}
