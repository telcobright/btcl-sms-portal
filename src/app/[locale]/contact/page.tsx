import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

import {
  FAQAccordion,
  type FAQItem,
} from '@/components/contact/FAQAccordion';
import { ContactForm } from '@/components/forms/ContactForm';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/Button';

// Types
interface Office {
  name: string;
  address: string;
  phone: string;
  email: string;
  hours: string;
  type: 'primary' | 'support';
}

interface SupportChannel {
  title: string;
  description: string;
  contact: string;
  response: string;
  icon: string;
  color: string;
}

interface ContactPageProps {
  params: Promise<{
    locale: string;
  }>;
}

// Utility functions
const getLocalizedText = (
  locale: string,
  enText: string,
  bnText: string
): string => {
  return locale === 'en' ? enText : bnText;
};

// Custom hooks
const useContactData = (locale: string) => {
  const offices: Office[] = [
    {
      name: getLocalizedText(
        locale,
        'BTCL Head Office',
        'বিটিসিএল প্রধান কার্যালয়'
      ),
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
      name: getLocalizedText(locale, 'BTCL Call Center', 'বিটিসিএল কল সেন্টার'),
      address: getLocalizedText(
        locale,
        'BTCL Telephone Exchange, Sher e Bangla Nagar, Dhaka',
        'বিটিসিএল টেলিফোন এক্সচেঞ্জ, শের-ই-বাংলা নগর, ঢাকা'
      ),
      phone: '16402',
      email: '',
      hours: getLocalizedText(
        locale,
        '24/7 Support Available',
        '২৪/৭ সাপোর্ট উপলব্ধ'
      ),
      type: 'support',
    },
  ];

  const supportChannels: SupportChannel[] = [
    {
      title: getLocalizedText(locale, 'Email Support', 'ইমেইল সাপোর্ট'),
      description: getLocalizedText(
        locale,
        'Get help via email for non-urgent inquiries',
        'অজরুরি অনুসন্ধানের জন্য ইমেইলের মাধ্যমে সহায়তা পান'
      ),
      contact: 'alaapcloud@btcl.gov.bd / noc@btcl.gov.bd',
      response: getLocalizedText(
        locale,
        'Response within 24 hours',
        '২৪ ঘন্টার মধ্যে উত্তর'
      ),
      icon: '📧',
      color: 'email',
    },
    {
      title: getLocalizedText(locale, 'Mobile Support', 'মোবাইল সাপোর্ট'),
      description: getLocalizedText(
        locale,
        'Speak directly with our technical support team',
        'আমাদের প্রযুক্তিগত সহায়তা দলের সাথে সরাসরি কথা বলুন'
      ),
      contact: '+8809696996699',
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
      contact: getLocalizedText(
        locale,
        'Coming Soon on our website',
        'আমাদের ওয়েবসাইটে শীঘ্রই আসছে'
      ),
      response: getLocalizedText(locale, 'Instant response', 'তাৎক্ষণিক উত্তর'),
      icon: '💬',
      color: 'chat',
    },
  ];

  const faqs: FAQItem[] = [
    {
      question: getLocalizedText(
        locale,
        'What is Alaap Cloud?',
        'আলাপ ক্লাউড কী?'
      ),
      answer: (
        <p>
          {getLocalizedText(
            locale,
            "'Alaap Cloud' is an IP (Internet Protocol) telephony service of Bangladesh Telecommunications Company Limited (BTCL).",
            "'আলাপ ক্লাউড' হলো বাংলাদেশ টেলিকমিউনিকেশনস কোম্পানি লিমিটেড (বিটিসিএল)-এর একটি আইপি (ইন্টারনেট প্রোটোকল) টেলিফোনি সেবা।"
          )}
        </p>
      ),
    },
    {
      question: getLocalizedText(
        locale,
        'What are the Alaap Cloud services?',
        'আলাপ ক্লাউডের সেবাসমূহ কী কী?'
      ),
      answer: (
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Alaap Cloud IP PBX</li>
          <li>Alaap Cloud Voice Broadcasting service</li>
          <li>Alaap Cloud Contact Center</li>
          <li>Bulk SMS (Only for BTRC registered sms aggregators)</li>
        </ul>
      ),
    },
    {
      question: getLocalizedText(
        locale,
        'What is Alaap Cloud IP PBX?',
        'আলাপ ক্লাউড আইপি পিবিএক্স কী?'
      ),
      answer: (
        <p>
          {getLocalizedText(
            locale,
            'Hosted at BTCL, Alaap Cloud IP PBX (Internet Protocol Private Branch Exchange) is a secure and reliable office phone system which can be used within a company or organization.',
            'বিটিসিএল-এ হোস্টকৃত আলাপ ক্লাউড আইপি পিবিএক্স (ইন্টারনেট প্রোটোকল প্রাইভেট ব্রাঞ্চ এক্সচেঞ্জ) একটি নিরাপদ ও নির্ভরযোগ্য অফিস ফোন সিস্টেম, যা কোনো কোম্পানি বা প্রতিষ্ঠানের ভেতরে ব্যবহার করা যায়।'
          )}
        </p>
      ),
    },
    {
      question: getLocalizedText(
        locale,
        'How to subscribe for Alaap Cloud Services?',
        'আলাপ ক্লাউড সেবার জন্য সাবস্ক্রিপশন কীভাবে করব?'
      ),
      answer: (
        <div className="space-y-4">
          <p>To subscribe to Alaap Cloud services, there are three steps:</p>

          <div>
            <p className="font-semibold text-gray-900">a) Account Registration:</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-5">
              <li>
                Open the Webportal{' '}
                <a
                  href="https://services.btcliptelephony.gov.bd/en/register"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all text-btcl-primary underline hover:text-btcl-primaryDark"
                >
                  https://services.btcliptelephony.gov.bd/en/register
                </a>
                .
              </li>
              <li>Enter your company name, official email, and mobile number.</li>
              <li>Verify your account using the Email OTP sent to your inbox.</li>
              <li>Verify your account using the SMS OTP sent to your mobile.</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-gray-900">b) Identity Verification:</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-5">
              <li>
                Submit your National Identity (NID) details e.g. NID front part
                and NID back part of authorized officer of the organization
                (pdf, jpg) for Bangladesh NID portal authentication.
              </li>
              <li>Verify your NID.</li>
            </ul>
          </div>

          <div>
            <p className="font-semibold text-gray-900">
              c) Other Documents Submission:
            </p>
            <ul className="mt-1.5 list-disc space-y-1 pl-5">
              <li>
                Select Customer Type: Prepaid or Postpaid (Postpaid for only
                Government/Semi-government/Autonomous Organization)
              </li>
              <li>Enter address, city, postal code and country.</li>
              <li>
                Enter trade license number and upload trade license of the
                organization (pdf/jpg)
              </li>
              <li>
                Enter TIN number and upload TIN certificate of the organization
                (pdf/jpg)
              </li>
              <li>
                Enter BIN number and upload BIN certificate of the organization
                (pdf/jpg)
              </li>
              <li>Photo of the authorized officer of the organization (pdf/jpg)</li>
              <li>
                Enter last tax return date and upload last tax return document
                (pdf/jpg)
              </li>
              <li>Check BTCL&apos;s terms and conditions</li>
              <li>Enter complete registration.</li>
            </ul>
          </div>

          <p>
            You will get the username and password of the mentioned webportal
            through email. Within 03 working days you will get approval for
            purchasing services upon successful verification of your documents
            mentioned above.
          </p>
          <p>
            You are kindly requested to purchase Alaap Cloud IP PBX package when
            you have IP-phones ready for installation as the package
            subscription date will be the billing date. Alaap Cloud Voice
            Broadcasting and Contact Center services can be readily operable
            through a computer / laptop.
          </p>
        </div>
      ),
    },
    {
      question: getLocalizedText(
        locale,
        'How to purchase Alaap Cloud service package?',
        'আলাপ ক্লাউড সেবা প্যাকেজ কীভাবে কিনবো?'
      ),
      answer: (
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            Login to the webportal{' '}
            <a
              href="https://services.btcliptelephony.gov.bd/en/login"
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-btcl-primary underline hover:text-btcl-primaryDark"
            >
              https://services.btcliptelephony.gov.bd/en/login
            </a>
          </li>
          <li>Navigate to the Dashboard.</li>
          <li>
            Choose your desired product (Alaap Cloud IP PBX, Alaap Cloud Voice
            Broadcast, or Alaap Cloud Contact Center).
          </li>
          <li>Select Buy Now.</li>
          <li>Review the package details, features and monthly subscription fees.</li>
          <li>
            Buy now, checkout and pay online using SSLCommerz (bKash, Nagad,
            Visa, or Mastercard).
          </li>
        </ul>
      ),
    },
    {
      question: getLocalizedText(
        locale,
        'How to activate Alaap Cloud service package?',
        'আলাপ ক্লাউড সেবা প্যাকেজ কীভাবে সক্রিয় করব?'
      ),
      answer: (
        <ul className="list-disc space-y-1.5 pl-5">
          <li>Receive services webportal credentials via email.</li>
          <li>
            Configure your devices as per Standard Operation Manual (SOP) given
            in the webportal.
          </li>
        </ul>
      ),
    },
    {
      question: getLocalizedText(
        locale,
        'How to get assistance from BTCL for configuration and system setup?',
        'কনফিগারেশন এবং সিস্টেম সেটআপের জন্য বিটিসিএল থেকে কীভাবে সহায়তা পাব?'
      ),
      answer: (
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            Contact the nearest BTCL office.{' '}
            <a
              href="https://btcl.gov.bd/pages/static-pages/6922dd18933eb65569e137b9"
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-btcl-primary underline hover:text-btcl-primaryDark"
            >
              https://btcl.gov.bd/pages/static-pages/6922dd18933eb65569e137b9
            </a>
          </li>
          <li>
            Email:{' '}
            <a
              href="mailto:alaapcloud@btcl.gov.bd"
              className="text-btcl-primary underline hover:text-btcl-primaryDark"
            >
              alaapcloud@btcl.gov.bd
            </a>
          </li>
          <li>Hotline: 16402</li>
          <li>
            Telephone: +8809696996699, +880258311616, +880248313366,
            +880258312233
          </li>
        </ul>
      ),
    },
    {
      question: getLocalizedText(
        locale,
        'What about free minutes in Alaap Cloud IP PBX?',
        'আলাপ ক্লাউড আইপি পিবিএক্স-এ ফ্রি মিনিট সম্পর্কে কী?'
      ),
      answer: (
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            During the 1st subscription of a user, free minutes will be added to
            the account.
          </li>
        </ul>
      ),
    },
    {
      question: getLocalizedText(
        locale,
        'What is the package migration policy?',
        'প্যাকেজ মাইগ্রেশন নীতিমালা কী?'
      ),
      answer: (
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            Package migration policy is given in the following link:{' '}
            <a
              href="https://services.btcliptelephony.gov.bd/en/package-migration-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-btcl-primary underline hover:text-btcl-primaryDark"
            >
              https://services.btcliptelephony.gov.bd/en/package-migration-policy
            </a>
          </li>
        </ul>
      ),
    },
  ];

  return { offices, supportChannels, faqs };
};

// Main Component
export default async function ContactPage({ params }: ContactPageProps) {
  const { locale } = await params;
  const t = await getTranslations();
  const { offices, supportChannels, faqs } = useContactData(locale);

  return (
    <div className="min-h-screen bg-white">
      <Header />

      <HeroSection locale={locale} />
      <ContactFormSection locale={locale} supportChannels={supportChannels} />
      <OfficeLocationsFullSection offices={offices} locale={locale} />
      <FAQSection faqs={faqs} locale={locale} />

      <Footer />
    </div>
  );
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
          {/* Badge */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold text-white">
            <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
            {getLocalizedText(locale, '24/7 Support', '২৪/৭ সাপোর্ট')}
          </div>

          <h1 className="mb-4 text-4xl font-bold text-white lg:text-5xl">
            {getLocalizedText(locale, 'Contact Us', 'যোগাযোগ করুন')}
          </h1>

          <p className="mx-auto mb-8 max-w-3xl text-xl text-white">
            {getLocalizedText(
              locale,
              'Get in touch with our team for support, sales inquiries, or any questions about our services.',
              'সাপোর্ট, বিক্রয় অনুসন্ধান বা আমাদের সেবা সম্পর্কে যেকোনো প্রশ্নের জন্য আমাদের দলের সাথে যোগাযোগ করুন।'
            )}
          </p>
        </div>
      </div>
    </section>
  );
}

// Contact Form Section Component
function ContactFormSection({
  locale,
  supportChannels,
}: {
  locale: string;
  supportChannels: SupportChannel[];
}) {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2">
          {/* Contact Form */}
          <ContactForm locale={locale} />

          {/* Contact Information */}
          <div className="space-y-12">
            <SupportChannelsSection
              supportChannels={supportChannels}
              locale={locale}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ContactForm is now a client component imported from @/components/forms/ContactForm

// Support Channels Section Component
function SupportChannelsSection({
  supportChannels,
  locale,
}: {
  supportChannels: SupportChannel[];
  locale: string;
}) {
  return (
    <div>
      <div className="mb-8">
        <div className="inline-flex items-center gap-2 rounded-full bg-btcl-primaryLight/20 px-4 py-1.5 text-sm font-semibold text-btcl-primaryDark">
          <span className="h-2 w-2 animate-pulse rounded-full bg-btcl-primary" />
          {getLocalizedText(locale, 'Support Channels', 'সাপোর্ট চ্যানেল')}
        </div>
      </div>
      <h2 className="mb-3 text-3xl font-bold text-gray-900 md:text-4xl">
        {getLocalizedText(
          locale,
          'How to Reach Us',
          'আমাদের সাথে যোগাযোগের উপায়'
        )}
      </h2>
      <div className="space-y-6">
        {supportChannels.map((channel, index) => (
          <SupportChannelCard key={index} channel={channel} />
        ))}
      </div>
    </div>
  );
}

// Support Channel Card Component
function SupportChannelCard({ channel }: { channel: SupportChannel }) {
  const renderIcon = () => {
    const cls = 'h-7 w-7 text-btcl-primary';
    switch (channel.color) {
      case 'email':
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
              d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        );
      case 'phone':
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
      case 'chat':
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
              d="M21 12a8 8 0 01-11.6 7.15L4 21l1.85-5.4A8 8 0 1121 12z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-7">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-btcl-primaryLight/10">
          {renderIcon()}
        </div>
        <div className="flex-1">
          <h3 className="mb-2 text-xl font-bold text-gray-900">
            {channel.title}
          </h3>
          <p className="mb-4 text-sm leading-relaxed text-gray-600">
            {channel.description}
          </p>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-btcl-primary" />
              <span className="text-sm font-medium text-btcl-primary">
                {channel.contact}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-btcl-primary" />
              <span className="text-xs text-gray-500">{channel.response}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Office Locations Full Section Component
function OfficeLocationsFullSection({
  offices,
  locale,
}: {
  offices: Office[];
  locale: string;
}) {
  return (
    <section className="bg-gray-50 py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <div className="mb-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-btcl-primaryLight/20 px-4 py-1.5 text-sm font-semibold text-btcl-primaryDark">
              <span className="h-2 w-2 animate-pulse rounded-full bg-btcl-primary" />
              {getLocalizedText(locale, 'Office Locations', 'অফিসের অবস্থান')}
            </div>
          </div>
          <h2 className="mb-3 text-3xl font-bold text-gray-900 md:text-4xl">
            {getLocalizedText(
              locale,
              'Visit Our Offices',
              'আমাদের অফিস ভিজিট করুন'
            )}
          </h2>
          <p className="mx-auto max-w-3xl text-base text-gray-600">
            {getLocalizedText(
              locale,
              "Find us at our locations across Bangladesh. We're here to serve you better.",
              'বাংলাদেশ জুড়ে আমাদের অবস্থানে আমাদের খুঁজুন। আমরা আপনাকে আরও ভালভাবে সেবা দিতে এখানে আছি।'
            )}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
          {offices.map((office, index) => (
            <OfficeCard key={index} office={office} idx={index} />
          ))}
        </div>
      </div>
    </section>
  );
}

// Office Card Component
function OfficeCard({ office, idx }: { office: Office; idx: number }) {
  const isPrimary = office.type === 'primary';

  return (
    <div
      className={`group relative ${isPrimary ? '' : 'overflow-hidden'} rounded-2xl border bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-btcl-primary hover:shadow-2xl ${
        isPrimary
          ? 'border-2 border-btcl-primary bg-gradient-to-br from-btcl-primaryLight/10 to-white'
          : 'border-gray-200'
      }`}
    >
      {!isPrimary && (
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-btcl-primary to-btcl-primaryLight opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      )}
      <div className="mb-4 flex items-start justify-between">
        <h3 className="text-xl font-bold text-gray-900">{office.name}</h3>
        {isPrimary && (
          <span className="rounded-full bg-btcl-primary px-3 py-1 text-xs font-semibold text-white">
            PRIMARY
          </span>
        )}
      </div>
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <div className="flex h-6 w-6 items-center justify-center">
            <svg
              className="h-5 w-5 text-btcl-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <span className="text-sm text-gray-700 leading-snug">
            {office.address}
          </span>
        </div>
        {idx !== 0 && (
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center">
              <svg
                className="h-5 w-5 text-btcl-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-btcl-primary">
              {office.phone}
            </span>
          </div>
        )}
        {idx !== 1 && (
          <div className="flex items-center gap-3">
            <div className="flex h-6 w-6 items-center justify-center">
              <svg
                className="h-5 w-5 text-btcl-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <span className="text-sm font-medium text-btcl-primary">
              {office.email}
            </span>
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className="flex h-6 w-6 items-center justify-center">
            <svg
              className="h-5 w-5 text-btcl-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <span className="text-sm text-gray-700">{office.hours}</span>
        </div>
      </div>
    </div>
  );
}

// FAQ Section Component
function FAQSection({ faqs, locale }: { faqs: FAQItem[]; locale: string }) {
  return (
    <section className="bg-gray-50 py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-20 text-center">
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-btcl-primaryLight/20 px-4 py-1.5 text-sm font-semibold text-btcl-primaryDark">
              <span className="h-2 w-2 animate-pulse rounded-full bg-btcl-primary" />
              {getLocalizedText(locale, 'Help Center', 'সাহায্য কেন্দ্র')}
            </div>
          </div>
          <h2 className="mb-3 text-3xl font-bold text-gray-900 md:text-4xl">
            {getLocalizedText(
              locale,
              'Frequently Asked Questions',
              'প্রায়শই জিজ্ঞাসিত প্রশ্ন'
            )}
          </h2>
          <p className="mx-auto max-w-3xl text-base text-gray-600">
            {getLocalizedText(
              locale,
              'Click a question to see the answer.',
              'উত্তর দেখতে একটি প্রশ্নে ক্লিক করুন।'
            )}
          </p>
        </div>

        <FAQAccordion faqs={faqs} />

        <div className="mt-10 text-center">
          <p className="mb-4 text-base text-gray-600">
            {getLocalizedText(
              locale,
              "Can't find what you're looking for?",
              'আপনি যা খুঁজছেন তা খুঁজে পাচ্ছেন না?'
            )}
          </p>
          <Link href="#contact-form">
            <Button className="transform rounded-lg border-2 border-btcl-primary bg-white px-6 py-2.5 text-sm font-semibold text-btcl-primary transition-all duration-300 hover:scale-105 hover:bg-btcl-primary hover:text-white">
              {getLocalizedText(
                locale,
                'Contact Support',
                'সাপোর্টের সাথে যোগাযোগ করুন'
              )}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
