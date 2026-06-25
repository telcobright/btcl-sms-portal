import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

import { FAQAccordion } from '@/components/contact/FAQAccordion';
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

interface FAQ {
  question: string;
  answer: string;
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

  const faqs: FAQ[] = [
    {
      question: getLocalizedText(
        locale,
        'What is Alaap Cloud?',
        'আলাপ ক্লাউড কী?'
      ),
      answer: getLocalizedText(
        locale,
        "'Alaap Cloud' is a corporate IP (Internet Protocol) telephony based modern services of Bangladesh Telecommunications Company Limited (BTCL).",
        "'আলাপ ক্লাউড' হলো বাংলাদেশ টেলিকমিউনিকেশনস কোম্পানি লিমিটেড (বিটিসিএল)-এর কর্পোরেট আইপি (ইন্টারনেট প্রোটোকল) টেলিফোনি ভিত্তিক একটি আধুনিক সেবা।"
      ),
    },
    {
      question: getLocalizedText(
        locale,
        'What are the Alaap Cloud Services?',
        'আলাপ ক্লাউডের সেবাসমূহ কী কী?'
      ),
      answer: getLocalizedText(
        locale,
        'a) Alaap Cloud IP PBX\nb) Alaap Cloud Voice Broadcasting service\nc) Alaap Cloud Contact Center\nd) Bulk SMS (Only for BTRC registered SMS Aggregators)',
        'ক) আলাপ ক্লাউড IP PBX\nখ) আলাপ ক্লাউড ভয়েস ব্রডকাস্টিং সেবা\nগ) আলাপ ক্লাউড কন্টাক্ট সেন্টার\nঘ) বাল্ক SMS (শুধুমাত্র BTRC নিবন্ধিত SMS Aggregator-দের জন্য)'
      ),
    },
    {
      question: getLocalizedText(
        locale,
        'What are the number series of Alaap Cloud Services?',
        'আলাপ ক্লাউড সেবার নম্বর সিরিজ কী কী?'
      ),
      answer: getLocalizedText(
        locale,
        'BTCL has +8809696 and +8809697 number series under IPTSP license of BTRC. The subscriber of Alaap Cloud Services will get available numbers from the +8809696 or +8809697 series.',
        'BTRC-এর IPTSP লাইসেন্সের আওতায় বিটিসিএলের +8809696 এবং +8809697 নম্বর সিরিজ রয়েছে। আলাপ ক্লাউড সেবার গ্রাহকরা +8809696 অথবা +8809697 সিরিজ থেকে উপলব্ধ নম্বর পাবেন।'
      ),
    },
    {
      question: getLocalizedText(
        locale,
        'What is Alaap Cloud IP PBX?',
        'আলাপ ক্লাউড IP PBX কী?'
      ),
      answer: getLocalizedText(
        locale,
        "Hosted at BTCL, Alaap Cloud IP PBX (Internet Protocol Private Branch Exchange) is a secure and reliable telecom switch that typically answers and routes voice calls within an company/organization or business environment using internet-based protocols rather than traditional analog lines.\n\nUnlike conventional on-premise hardware, this cloud-native solution eliminates the need for expensive physical equipment, maintenance, and complex wiring. It functions as a centralized hub where incoming calls are greeted by automated systems or interactive voice response (IVR) menus and then intelligently directed to the appropriate extension, department, or mobile application.\n\nBy leveraging BTCL's robust infrastructure, the Alaap Cloud IP PBX ensures high-definition voice quality and seamless connectivity across multiple geographical locations within Bangladesh.\n\nThis system facilitates employees to stay connected using hardware IP phones. It also provides administrative control through a user-friendly web interface, enabling businesses to manage call logs and recording, set up ring groups, configure call forwarding, schedule call conference, save voicemail, boss-secretary pairing and monitor real-time communications without requiring specialized technical expertise. This scalability makes it an ideal choice for startups and large enterprises alike, seeking to modernize their communication framework while significantly reducing operational costs.",
        'বিটিসিএলে হোস্টকৃত আলাপ ক্লাউড IP PBX (Internet Protocol Private Branch Exchange) একটি নিরাপদ ও নির্ভরযোগ্য টেলিকম সুইচ, যা প্রচলিত অ্যানালগ লাইনের পরিবর্তে ইন্টারনেট-ভিত্তিক প্রোটোকল ব্যবহার করে কোনো প্রতিষ্ঠান বা ব্যবসায়িক পরিবেশের ভিতরে ভয়েস কল গ্রহণ ও রাউট করে।\n\nপ্রচলিত অন-প্রিমিস হার্ডওয়্যারের বিপরীতে, এই ক্লাউড-নেটিভ সমাধান ব্যয়বহুল যন্ত্রপাতি, রক্ষণাবেক্ষণ এবং জটিল ওয়্যারিংয়ের প্রয়োজনীয়তা দূর করে। এটি একটি কেন্দ্রীভূত হাব হিসেবে কাজ করে, যেখানে ইনকামিং কলগুলো স্বয়ংক্রিয় সিস্টেম বা IVR মেনু দ্বারা গ্রহণ করা হয় এবং বুদ্ধিমত্তার সাথে যথাযথ এক্সটেনশন, বিভাগ বা মোবাইল অ্যাপ্লিকেশনে পাঠানো হয়।\n\nবিটিসিএলের শক্তিশালী অবকাঠামো ব্যবহার করে আলাপ ক্লাউড IP PBX বাংলাদেশ জুড়ে একাধিক ভৌগোলিক অবস্থানে উচ্চমানের ভয়েস কোয়ালিটি ও নির্বিঘ্ন সংযোগ নিশ্চিত করে।\n\nএই সিস্টেম কর্মচারীদের IP ফোনের মাধ্যমে সংযুক্ত থাকতে সাহায্য করে। এটি একটি ব্যবহারবান্ধব ওয়েব ইন্টারফেসের মাধ্যমে প্রশাসনিক নিয়ন্ত্রণ প্রদান করে, যা কল লগ ও রেকর্ডিং পরিচালনা, রিং গ্রুপ তৈরি, কল ফরোয়ার্ডিং কনফিগারেশন, কল কনফারেন্স নির্ধারণ, ভয়েসমেইল সংরক্ষণ, বস-সেক্রেটারি পেয়ারিং এবং রিয়েল-টাইম যোগাযোগ পর্যবেক্ষণে সক্ষম করে—কোনো বিশেষায়িত প্রযুক্তিগত দক্ষতা ছাড়াই। এই স্কেলেবিলিটি একে স্টার্টআপ ও বৃহৎ এন্টারপ্রাইজ উভয়ের জন্যই আদর্শ পছন্দে পরিণত করেছে।'
      ),
    },
    {
      question: getLocalizedText(
        locale,
        'How to subscribe for Alaap Cloud Services?',
        'আলাপ ক্লাউড সেবায় কীভাবে সাবস্ক্রাইব করবেন?'
      ),
      answer: getLocalizedText(
        locale,
        'To subscribe to Alaap Cloud services, there are three steps:\n\na) Account Registration:\n• Open the Webportal https://services.btcliptelephony.gov.bd/en/register\n• Enter your company name, official email, and mobile number.\n• Verify your account using the Email OTP sent to your inbox.\n• Verify your account using the SMS OTP sent to your mobile.\n\nb) Identity Verification:\n• Submit your National Identity (NID) details e.g. NID front part and NID back part of authorized officer of the organization (pdf, jpg) for Bangladesh NID portal authentication.\n• Verify your NID.\n\nc) Other Documents Submission:\n• Select Customer Type: Prepaid or Postpaid (Postpaid for only Government/Semi-government/Autonomous Organization)\n• Enter address, city, postal code and country.\n• Enter trade license number and upload trade license of the organization (pdf/jpg)\n• Enter TIN number and upload TIN certificate of the organization (pdf/jpg)\n• Enter BIN number and upload BIN certificate of the organization (pdf/jpg)\n• Photo of the authorized officer of the organization (pdf/jpg)\n• Enter last tax return date and upload last tax return document (pdf/jpg)\n• Check BTCL\'s terms and conditions\n• Enter complete registration.\n\nYou will get the username and password of the mentioned webportal through email. Within 03 working days you will get approval for purchasing services upon successful verification of your documents mentioned above.\n\nYou are kindly requested to purchase Alaap Cloud IP PBX package when you have IP-phones ready for installation as the package subscription date will be the billing date. Alaap Cloud Voice Broadcasting and Contact Center services can be readily operable through a computer / laptop.',
        'আলাপ ক্লাউড সেবায় সাবস্ক্রাইব করতে তিনটি ধাপ রয়েছে:\n\nক) অ্যাকাউন্ট রেজিস্ট্রেশন:\n• ওয়েবপোর্টালটি খুলুন https://services.btcliptelephony.gov.bd/en/register\n• আপনার কোম্পানির নাম, অফিসিয়াল ইমেইল এবং মোবাইল নম্বর দিন।\n• ইনবক্সে পাঠানো Email OTP দিয়ে অ্যাকাউন্ট যাচাই করুন।\n• মোবাইলে পাঠানো SMS OTP দিয়ে অ্যাকাউন্ট যাচাই করুন।\n\nখ) পরিচয় যাচাই:\n• প্রতিষ্ঠানের অনুমোদিত কর্মকর্তার জাতীয় পরিচয়পত্রের (NID) সামনের ও পেছনের অংশ (pdf, jpg) জমা দিন বাংলাদেশ NID পোর্টালে যাচাইয়ের জন্য।\n• আপনার NID যাচাই করুন।\n\nগ) অন্যান্য ডকুমেন্ট জমাদান:\n• কাস্টমার টাইপ নির্বাচন করুন: Prepaid অথবা Postpaid (Postpaid শুধু সরকারি/আধা-সরকারি/স্বায়ত্তশাসিত প্রতিষ্ঠানের জন্য)\n• ঠিকানা, শহর, পোস্টাল কোড এবং দেশ লিখুন।\n• ট্রেড লাইসেন্স নম্বর দিন এবং প্রতিষ্ঠানের ট্রেড লাইসেন্স আপলোড করুন (pdf/jpg)\n• TIN নম্বর দিন এবং প্রতিষ্ঠানের TIN সার্টিফিকেট আপলোড করুন (pdf/jpg)\n• BIN নম্বর দিন এবং প্রতিষ্ঠানের BIN সার্টিফিকেট আপলোড করুন (pdf/jpg)\n• প্রতিষ্ঠানের অনুমোদিত কর্মকর্তার ছবি আপলোড করুন (pdf/jpg)\n• সর্বশেষ ট্যাক্স রিটার্ন তারিখ দিন এবং রিটার্ন ডকুমেন্ট আপলোড করুন (pdf/jpg)\n• বিটিসিএলের শর্তাবলী চেক করুন।\n• রেজিস্ট্রেশন সম্পন্ন করুন।\n\nউল্লিখিত ওয়েবপোর্টালের ইউজারনেম এবং পাসওয়ার্ড আপনি ইমেইলে পাবেন। উপরোক্ত ডকুমেন্ট সফলভাবে যাচাই হলে ০৩ কার্যদিবসের মধ্যে আপনি সেবা ক্রয়ের অনুমোদন পাবেন।\n\nযেহেতু প্যাকেজ সাবস্ক্রিপশনের তারিখটিই বিলিং তারিখ হিসেবে গণ্য হবে, তাই আপনার IP-ফোন ইনস্টলেশনের জন্য প্রস্তুত হলে আলাপ ক্লাউড IP PBX প্যাকেজ ক্রয়ের অনুরোধ করা হলো। আলাপ ক্লাউড ভয়েস ব্রডকাস্টিং ও কন্টাক্ট সেন্টার সেবা কম্পিউটার/ল্যাপটপের মাধ্যমে সরাসরি ব্যবহার করা যাবে।'
      ),
    },
    {
      question: getLocalizedText(
        locale,
        'How to purchase Alaap Cloud service package?',
        'আলাপ ক্লাউড সেবা প্যাকেজ কীভাবে ক্রয় করবেন?'
      ),
      answer: getLocalizedText(
        locale,
        '• Login to the webportal https://services.btcliptelephony.gov.bd/en/login\n• Navigate to the Dashboard.\n• Choose your desired product (Alaap Cloud IP PBX, Alaap Cloud Voice Broadcast, or Alaap Cloud Contact Center).\n• Select Buy Now.\n• Review the package details, features and monthly subscription fees.\n• Buy now, checkout and pay online using SSLCommerz (bKash, Nagad, Visa, or Mastercard).',
        '• ওয়েবপোর্টালে লগইন করুন https://services.btcliptelephony.gov.bd/en/login\n• ড্যাশবোর্ডে যান।\n• আপনার পছন্দের পণ্য বেছে নিন (আলাপ ক্লাউড IP PBX, আলাপ ক্লাউড ভয়েস ব্রডকাস্ট, অথবা আলাপ ক্লাউড কন্টাক্ট সেন্টার)।\n• Buy Now নির্বাচন করুন।\n• প্যাকেজের বিবরণ, ফিচার এবং মাসিক সাবস্ক্রিপশন ফি পর্যালোচনা করুন।\n• Buy Now চাপুন, চেকআউট করুন এবং SSLCommerz (বিকাশ, নগদ, Visa অথবা Mastercard) ব্যবহার করে অনলাইনে পেমেন্ট করুন।'
      ),
    },
    {
      question: getLocalizedText(
        locale,
        'How to activate Alaap Cloud service package?',
        'আলাপ ক্লাউড সেবা প্যাকেজ কীভাবে সক্রিয় করবেন?'
      ),
      answer: getLocalizedText(
        locale,
        '• Receive services webportal credentials via email.\n• Configure your devices as per Standard Operation Manual (SOP) given in the webportal.',
        '• সেবার ওয়েবপোর্টালের ক্রিডেনশিয়াল ইমেইলে গ্রহণ করুন।\n• ওয়েবপোর্টালে প্রদত্ত Standard Operation Manual (SOP) অনুযায়ী আপনার ডিভাইস কনফিগার করুন।'
      ),
    },
    {
      question: getLocalizedText(
        locale,
        'How to get assistance from BTCL for configuration and system setup?',
        'কনফিগারেশন ও সিস্টেম সেটআপের জন্য বিটিসিএল থেকে সহায়তা কীভাবে পাবেন?'
      ),
      answer: getLocalizedText(
        locale,
        '• Contact the nearest BTCL office. https://btcl.gov.bd/pages/static-pages/6922dd18933eb65569e137b9\n• Email: alaapcloud@btcl.gov.bd\n• Hotline: 16402\n• Telephone: +8809696996699, +880258311616, +880248313366, +880258312233',
        '• নিকটস্থ বিটিসিএল অফিসে যোগাযোগ করুন। https://btcl.gov.bd/pages/static-pages/6922dd18933eb65569e137b9\n• ইমেইল: alaapcloud@btcl.gov.bd\n• হটলাইন: 16402\n• টেলিফোন: +8809696996699, +880258311616, +880248313366, +880258312233'
      ),
    },
    {
      question: getLocalizedText(
        locale,
        'What about free minutes in Alaap Cloud IP PBX?',
        'আলাপ ক্লাউড IP PBX-এ ফ্রি মিনিটের বিষয়ে কী?'
      ),
      answer: getLocalizedText(
        locale,
        '• During the 1st subscription of a user, free minutes will be added to the account.',
        '• ব্যবহারকারীর প্রথম সাবস্ক্রিপশনের সময় অ্যাকাউন্টে ফ্রি মিনিট যোগ করা হবে।'
      ),
    },
    {
      question: getLocalizedText(
        locale,
        'What is the package migration policy?',
        'প্যাকেজ মাইগ্রেশন পলিসি কী?'
      ),
      answer: getLocalizedText(
        locale,
        '• Package migration policy is given in the following link:\nhttps://services.btcliptelephony.gov.bd/en/package-migration-policy',
        '• প্যাকেজ মাইগ্রেশন পলিসি নিম্নলিখিত লিংকে দেওয়া আছে:\nhttps://services.btcliptelephony.gov.bd/en/package-migration-policy'
      ),
    },
    {
      question: getLocalizedText(
        locale,
        'Is there any IP restrictions for using Alaap Cloud services?',
        'আলাপ ক্লাউড সেবা ব্যবহারে কি কোনো IP সীমাবদ্ধতা রয়েছে?'
      ),
      answer: getLocalizedText(
        locale,
        "• Yes, after successful package subscription you need to share your ISP internet IP and mobile number to the following email: alaapcloud@btcl.gov.bd\n• BTCL's authorize engineer will check and allow the IP in BTCL's network.",
        '• হ্যাঁ, সফলভাবে প্যাকেজ সাবস্ক্রিপশনের পর আপনার ISP ইন্টারনেট IP এবং মোবাইল নম্বর নিম্নলিখিত ইমেইলে পাঠাতে হবে: alaapcloud@btcl.gov.bd\n• বিটিসিএলের অনুমোদিত প্রকৌশলী যাচাই করে বিটিসিএল নেটওয়ার্কে IP-টি অনুমোদন করবেন।'
      ),
    },
    {
      question: getLocalizedText(
        locale,
        'What is Alaap Cloud Voice Broadcasting Service?',
        'আলাপ ক্লাউড ভয়েস ব্রডকাস্টিং সেবা কী?'
      ),
      answer: getLocalizedText(
        locale,
        'Voice Broadcasting is a calling service that allows organizations to send pre-recorded audio messages to thousands of SIM-based mobile users simultaneously. The service is available through both a Web GUI portal and API integration for efficient campaign management and message delivery. It is a communication tool that designed for instant, mass-scale audio outreach.',
        'ভয়েস ব্রডকাস্টিং একটি কলিং সেবা, যার মাধ্যমে প্রতিষ্ঠানগুলো হাজার হাজার SIM-ভিত্তিক মোবাইল ব্যবহারকারীকে একসঙ্গে পূর্ব-রেকর্ডকৃত অডিও বার্তা পাঠাতে পারে। কার্যকর ক্যাম্পেইন ব্যবস্থাপনা ও বার্তা ডেলিভারির জন্য সেবাটি Web GUI পোর্টাল ও API ইন্টিগ্রেশন উভয় উপায়ে উপলব্ধ। এটি তাৎক্ষণিক, ব্যাপক স্কেলে অডিও যোগাযোগের জন্য ডিজাইন করা একটি যোগাযোগ টুল।'
      ),
    },
    {
      question: getLocalizedText(
        locale,
        'Is vetting necessary before broadcast campaign?',
        'ব্রডকাস্ট ক্যাম্পেইনের আগে কি ভেটিং প্রয়োজন?'
      ),
      answer: getLocalizedText(
        locale,
        "Yes, BTCL's concerned division will check if a broadcast contains content that is deemed harmful, defamatory, or inciteful against the government, state institutions, or national security. BTCL follows all the regulatory frameworks imposed by BTRC.",
        'হ্যাঁ, বিটিসিএলের সংশ্লিষ্ট বিভাগ যাচাই করে দেখবে কোনো ব্রডকাস্টে এমন কনটেন্ট আছে কিনা যা সরকার, রাষ্ট্রীয় প্রতিষ্ঠান বা জাতীয় নিরাপত্তার বিরুদ্ধে ক্ষতিকর, মানহানিকর বা উসকানিমূলক বলে বিবেচিত হতে পারে। বিটিসিএল BTRC কর্তৃক আরোপিত সকল নিয়ন্ত্রক কাঠামো অনুসরণ করে।'
      ),
    },
    {
      question: getLocalizedText(
        locale,
        'What are terms and conditions & privacy policy of subscriber information?',
        'গ্রাহক তথ্যের শর্তাবলী ও গোপনীয়তা নীতি কী?'
      ),
      answer: getLocalizedText(
        locale,
        'We kindly request that you carefully review the Terms and Privacy Policy available at the following link:\nhttps://services.btcliptelephony.gov.bd/en/terms-and-privacy\nThank you for your attention and cooperation.',
        'নিম্নলিখিত লিংকে উপলব্ধ Terms ও Privacy Policy অনুগ্রহ করে যত্ন সহকারে পর্যালোচনা করার জন্য অনুরোধ করা হলো:\nhttps://services.btcliptelephony.gov.bd/en/terms-and-privacy\nআপনার মনোযোগ ও সহযোগিতার জন্য ধন্যবাদ।'
      ),
    },
    {
      question: getLocalizedText(
        locale,
        'What is Alaap Cloud Contact Center?',
        'আলাপ ক্লাউড কন্টাক্ট সেন্টার কী?'
      ),
      answer: getLocalizedText(
        locale,
        'Alaap Cloud Contact Center is a central, internet-based customer service platform that handles all incoming and outgoing communications. Because the entire system lives online, agents can get started instantly from anywhere (within Bangladesh) using just a computer, a headset, and an internet connection-eliminating the need for expensive, on-premise hardware or traditional phone lines.\n\nIt unifies multiple communication channels - voice calls, SMS, email, and social media - into a single interface for agents. It tracks sales and service pipelines using built-in accounts, contacts, leads, opportunities, and cases modules. It utilizes automated predictive dialer alongside email templates, survey tools, and targeted call lists for outbound campaigning. It features interactive voice response (IVR) flows, custom time conditions, and direct inward dialing (DID) rules for inbound call routing. The system also provides facilities to monitors live queues, tracks agent KPIs, views call histories, and records audio logs.',
        'আলাপ ক্লাউড কন্টাক্ট সেন্টার একটি কেন্দ্রীয়, ইন্টারনেট-ভিত্তিক কাস্টমার সার্ভিস প্ল্যাটফর্ম, যা সকল ইনকামিং ও আউটগোয়িং যোগাযোগ পরিচালনা করে। যেহেতু পুরো সিস্টেমটি অনলাইনে চলে, এজেন্টরা শুধুমাত্র একটি কম্পিউটার, হেডসেট এবং ইন্টারনেট সংযোগ ব্যবহার করে বাংলাদেশের যেকোনো জায়গা থেকে তাৎক্ষণিকভাবে কাজ শুরু করতে পারেন—ব্যয়বহুল অন-প্রিমিস হার্ডওয়্যার বা প্রচলিত ফোন লাইনের প্রয়োজন ছাড়াই।\n\nএটি একাধিক যোগাযোগ চ্যানেল—ভয়েস কল, SMS, ইমেইল এবং সোশ্যাল মিডিয়া—একটি একক ইন্টারফেসে একীভূত করে। বিল্ট-ইন accounts, contacts, leads, opportunities এবং cases মডিউল ব্যবহার করে এটি বিক্রয় ও সেবা পাইপলাইন ট্র্যাক করে। আউটবাউন্ড ক্যাম্পেইনের জন্য এটি স্বয়ংক্রিয় predictive dialer-এর পাশাপাশি ইমেইল টেমপ্লেট, সার্ভে টুল এবং টার্গেটেড কল লিস্ট ব্যবহার করে। ইনবাউন্ড কল রাউটিংয়ের জন্য এটি IVR ফ্লো, কাস্টম টাইম কন্ডিশন এবং DID রুল প্রদান করে। সিস্টেমটি লাইভ কিউ মনিটরিং, এজেন্ট KPI ট্র্যাকিং, কল ইতিহাস দেখা এবং অডিও লগ রেকর্ডিংয়ের সুবিধা প্রদান করে।'
      ),
    },
    {
      question: getLocalizedText(
        locale,
        'What are the basic configuration steps of Alaap Cloud IP PBX?',
        'আলাপ ক্লাউড IP PBX-এর মৌলিক কনফিগারেশন ধাপগুলো কী কী?'
      ),
      answer: getLocalizedText(
        locale,
        "After successful login to services webportal (https://hippbx.btcliptelephony.gov.bd:5174/dashboard),\n\na) Create an Extension\nb) Set up IP-Phone with username, password, domain name and proxy of Extension.\nc) Choose a MyDID number from available numbers' pool.\nd) Enter inbound routes to an Extension.\ne) Create ring group if required.\n\nAnd you need to follow SOP given in the web-portal for many other features' configuration.\n\nIf you need assistance from BTCL or vendor's engineer, please feel free to send email to alaapcloud@btcl.gov.bd or IP-Telephone: +8809696-996699 (office time)",
        'সেবার ওয়েবপোর্টালে (https://hippbx.btcliptelephony.gov.bd:5174/dashboard) সফলভাবে লগইন করার পর,\n\nক) একটি Extension তৈরি করুন\nখ) Extension-এর username, password, domain name এবং proxy দিয়ে IP-ফোন সেটআপ করুন।\nগ) উপলব্ধ নম্বর পুল থেকে একটি MyDID নম্বর বেছে নিন।\nঘ) একটি Extension-এ ইনবাউন্ড রুট প্রবেশ করান।\nঙ) প্রয়োজনে ring group তৈরি করুন।\n\nএছাড়া অন্যান্য ফিচার কনফিগারেশনের জন্য ওয়েবপোর্টালে প্রদত্ত SOP অনুসরণ করুন।\n\nবিটিসিএল বা ভেন্ডর প্রকৌশলীর সহায়তা প্রয়োজন হলে নির্দ্বিধায় ইমেইল করুন alaapcloud@btcl.gov.bd অথবা IP-Telephone: +8809696-996699 (অফিস সময়)।'
      ),
    },
    {
      question: getLocalizedText(
        locale,
        'What are the basic configuration steps of Alaap Cloud Voice Broadcasting Service?',
        'আলাপ ক্লাউড ভয়েস ব্রডকাস্টিং সেবার মৌলিক কনফিগারেশন ধাপগুলো কী কী?'
      ),
      answer: getLocalizedText(
        locale,
        "After successful login to services webportal (https://vbs.btcliptelephony.gov.bd/),\n\na) Add a senderID Number from the available numbers' pool.\nb) Add a policy from policy management menu.\nc) Create a Broadcast campaign under Voice Broadcast task menu.\nd) Set up campaign by giving a name, set a caller id from list, set a policy from list.\ne) Upload pre-recorded audio file and recipients' mobile number list.\nf) Create campaign and enable it.\n\nAnd you need to contact admin or email to alaapcloud@btcl.gov.bd for API based voice broadcasting facilities.\n\nIf you need assistance from BTCL or vendor's engineer, please feel free to send email to alaapcloud@btcl.gov.bd or IP-Telephone: +8809696-996699 (office time)",
        'সেবার ওয়েবপোর্টালে (https://vbs.btcliptelephony.gov.bd/) সফলভাবে লগইন করার পর,\n\nক) উপলব্ধ নম্বর পুল থেকে একটি senderID নম্বর যোগ করুন।\nখ) Policy Management মেনু থেকে একটি policy যোগ করুন।\nগ) Voice Broadcast task মেনুর অধীনে একটি Broadcast ক্যাম্পেইন তৈরি করুন।\nঘ) একটি নাম দিয়ে ক্যাম্পেইন সেটআপ করুন, তালিকা থেকে caller id ও policy নির্ধারণ করুন।\nঙ) পূর্ব-রেকর্ডকৃত অডিও ফাইল এবং প্রাপকদের মোবাইল নম্বর তালিকা আপলোড করুন।\nচ) ক্যাম্পেইন তৈরি করুন এবং সক্রিয় করুন।\n\nAPI-ভিত্তিক ভয়েস ব্রডকাস্টিং সুবিধার জন্য অ্যাডমিনের সাথে যোগাযোগ করুন অথবা ইমেইল করুন alaapcloud@btcl.gov.bd।\n\nবিটিসিএল বা ভেন্ডর প্রকৌশলীর সহায়তা প্রয়োজন হলে নির্দ্বিধায় ইমেইল করুন alaapcloud@btcl.gov.bd অথবা IP-Telephone: +8809696-996699 (অফিস সময়)।'
      ),
    },
    {
      question: getLocalizedText(
        locale,
        'What are the basic configuration steps of Alaap Cloud Contact Center?',
        'আলাপ ক্লাউড কন্টাক্ট সেন্টারের মৌলিক কনফিগারেশন ধাপগুলো কী কী?'
      ),
      answer: getLocalizedText(
        locale,
        "After successful login to services webportal (https://hcc.btcliptelephony.gov.bd/#/Login),\n\na) Navigate to Admin menu\nb) Create a new user from user management menu\nc) Choose a number from MyDID menu.\nd) Add the above number in the Agent DID Mgmt menu.\ne) Login as agent in the same web-portal.\nf) Add a Headphone with Computer or use laptop which has built-in mic and speaker.\n\nAnd you need to follow SOP given in the web-portal for many other features' configuration.\n\nAll configurations are 1st time only. It has lots of business logic to provide better customer support.\n\nIf you need assistance from BTCL or vendor's engineer, please feel free to send email to alaapcloud@btcl.gov.bd or IP-Telephone: +8809696-996699 (office time)",
        'সেবার ওয়েবপোর্টালে (https://hcc.btcliptelephony.gov.bd/#/Login) সফলভাবে লগইন করার পর,\n\nক) Admin মেনুতে যান\nখ) User Management মেনু থেকে নতুন user তৈরি করুন\nগ) MyDID মেনু থেকে একটি নম্বর বেছে নিন।\nঘ) Agent DID Mgmt মেনুতে উপরের নম্বরটি যোগ করুন।\nঙ) একই ওয়েবপোর্টালে agent হিসেবে লগইন করুন।\nচ) কম্পিউটারের সাথে একটি Headphone যোগ করুন অথবা বিল্ট-ইন মাইক ও স্পিকার আছে এমন ল্যাপটপ ব্যবহার করুন।\n\nএছাড়া অন্যান্য ফিচার কনফিগারেশনের জন্য ওয়েবপোর্টালে প্রদত্ত SOP অনুসরণ করুন।\n\nসকল কনফিগারেশন শুধুমাত্র প্রথমবারের জন্য। উন্নত কাস্টমার সাপোর্ট প্রদানের জন্য এতে অনেক বিজনেস লজিক রয়েছে।\n\nবিটিসিএল বা ভেন্ডর প্রকৌশলীর সহায়তা প্রয়োজন হলে নির্দ্বিধায় ইমেইল করুন alaapcloud@btcl.gov.bd অথবা IP-Telephone: +8809696-996699 (অফিস সময়)।'
      ),
    },
    {
      question: getLocalizedText(
        locale,
        'How quickly can I get started?',
        'আমি কত তাড়াতাড়ি শুরু করতে পারি?'
      ),
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
function FAQSection({ faqs, locale }: { faqs: FAQ[]; locale: string }) {
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
              'Quick answers to common questions',
              'সাধারণ প্রশ্নের দ্রুত উত্তর'
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

