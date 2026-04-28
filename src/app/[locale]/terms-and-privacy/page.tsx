'use client'

import React from 'react'
import { useLocale } from 'next-intl'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

// TODO: add Bangla translations for the 28 clauses; English text is used for both locales until reviewed legal copy is available.
const clauses: { id: number; en: string; bn: string }[] = [
  {
    id: 1,
    en: 'BTCL always strives to render the best possible services.',
    bn: 'BTCL always strives to render the best possible services.',
  },
  {
    id: 2,
    en: 'BTCL shall provide the IPTSP services in accordance with the following terms and conditions as set forth by the Bangladesh Telecommunications Regulatory Commission (BTRC) and by other proper government organizations.',
    bn: 'BTCL shall provide the IPTSP services in accordance with the following terms and conditions as set forth by the Bangladesh Telecommunications Regulatory Commission (BTRC) and by other proper government organizations.',
  },
  {
    id: 3,
    en: 'BTCL will have the right to discontinue the IPTSP services if any of the terms and conditions set in this prevailing Agreement such as non-payment of accounts, bypass of networks, reselling of services, using the service for purposes outside of the service agreement and other similar activities.',
    bn: 'BTCL will have the right to discontinue the IPTSP services if any of the terms and conditions set in this prevailing Agreement such as non-payment of accounts, bypass of networks, reselling of services, using the service for purposes outside of the service agreement and other similar activities.',
  },
  {
    id: 4,
    en: 'BTCL does not commit itself to make services available in any specific area in Bangladesh or abroad within certain dates. Even though BTCL shall strive to offer the best service quality, the quality, reliability and availability of service is not guaranteed as the same are dependent on various technical, physical, topographical, atmospheric, environmental, regulatory, legal, and such other factors. BTCL shall not be liable or responsible for any defect/deficiency in the same and for any direct, incidental or consequential loss arising therefrom. In addition, BTCL is entitled to, without any liability, refuse, limit, suspend, disable, delete, vary and/or interrupt service or any part thereof, for one or more users, at any time, in its sole discretion, without notice and assigning any reason.',
    bn: 'BTCL does not commit itself to make services available in any specific area in Bangladesh or abroad within certain dates. Even though BTCL shall strive to offer the best service quality, the quality, reliability and availability of service is not guaranteed as the same are dependent on various technical, physical, topographical, atmospheric, environmental, regulatory, legal, and such other factors. BTCL shall not be liable or responsible for any defect/deficiency in the same and for any direct, incidental or consequential loss arising therefrom. In addition, BTCL is entitled to, without any liability, refuse, limit, suspend, disable, delete, vary and/or interrupt service or any part thereof, for one or more users, at any time, in its sole discretion, without notice and assigning any reason.',
  },
  {
    id: 5,
    en: 'BTCL shall have the right to temporarily suspend the services in whole or in parts of its network for repair, maintenance or circumstances beyond BTCL’s control.',
    bn: 'BTCL shall have the right to temporarily suspend the services in whole or in parts of its network for repair, maintenance or circumstances beyond BTCL’s control.',
  },
  {
    id: 6,
    en: 'Notwithstanding anything contained herein, BTCL reserves the right to change, vary, add, substitute or withdraw the Web services or any other services. BTCL will also have the right to change/increase/reduce the tariff charges, prices, validity period, product/service feature and any other offers etc. at any time in its sole discretion for any reason subject to official notification of such offers prior to giving effect to such changes.',
    bn: 'Notwithstanding anything contained herein, BTCL reserves the right to change, vary, add, substitute or withdraw the Web services or any other services. BTCL will also have the right to change/increase/reduce the tariff charges, prices, validity period, product/service feature and any other offers etc. at any time in its sole discretion for any reason subject to official notification of such offers prior to giving effect to such changes.',
  },
  {
    id: 7,
    en: 'BTCL shall have the right to disconnect, suspend or bar the services for any violation of any law of the land or giving false information on the user registration form and/or for changes in the given information, which is not informed to BTCL.',
    bn: 'BTCL shall have the right to disconnect, suspend or bar the services for any violation of any law of the land or giving false information on the user registration form and/or for changes in the given information, which is not informed to BTCL.',
  },
  {
    id: 8,
    en: 'BTCL shall have the right to scrutinize or procure any relevant document(s) possessed by the potential subscribers or existing subscribers which may be required by BTCL.',
    bn: 'BTCL shall have the right to scrutinize or procure any relevant document(s) possessed by the potential subscribers or existing subscribers which may be required by BTCL.',
  },
  {
    id: 9,
    en: 'The decision of BTCL shall be final in respect of this Subscription Agreement, if any interpretation of the Terms and Conditions is required.',
    bn: 'The decision of BTCL shall be final in respect of this Subscription Agreement, if any interpretation of the Terms and Conditions is required.',
  },
  {
    id: 10,
    en: 'Any bona-fide errors made by BTCL may be corrected without customers’ prior permission.',
    bn: 'Any bona-fide errors made by BTCL may be corrected without customers’ prior permission.',
  },
  {
    id: 11,
    en: 'BTCL is not responsible for any errors resulting from fraud perpetrated by any third party. Responsibilities of BTCL are explicitly stated in this agreement and BTCL takes no other responsibilities besides these.',
    bn: 'BTCL is not responsible for any errors resulting from fraud perpetrated by any third party. Responsibilities of BTCL are explicitly stated in this agreement and BTCL takes no other responsibilities besides these.',
  },
  {
    id: 12,
    en: 'Subscribers cannot carry out any sort of advertisement & promotional activities of the said service without prior written approval from concerned BTCL authority.',
    bn: 'Subscribers cannot carry out any sort of advertisement & promotional activities of the said service without prior written approval from concerned BTCL authority.',
  },
  {
    id: 13,
    en: 'Notwithstanding anything contained in this contract, any information brochure, notification or any other matter which will be published by BTCL regarding its Services, Service Price, Billing policy and Credit policy shall be included as the terms and conditions of this contract and both BTCL and its Subscriber shall be under obligation of the same.',
    bn: 'Notwithstanding anything contained in this contract, any information brochure, notification or any other matter which will be published by BTCL regarding its Services, Service Price, Billing policy and Credit policy shall be included as the terms and conditions of this contract and both BTCL and its Subscriber shall be under obligation of the same.',
  },
  {
    id: 14,
    en: 'Any of BTCL’s obligations under this general terms and conditions shall be interrupted or delayed by force majeure or Act of Almighty, including but not limited to acts of war, riot, civil commotion, act of State, strikes, fire, earthquake, flood or by occurrence of any other event beyond the reasonable control of BTCL, then BTCL shall be excused from such performance only for such period of time as is reasonably necessary after such occurrence has abated for the effects thereof to have dissipated.',
    bn: 'Any of BTCL’s obligations under this general terms and conditions shall be interrupted or delayed by force majeure or Act of Almighty, including but not limited to acts of war, riot, civil commotion, act of State, strikes, fire, earthquake, flood or by occurrence of any other event beyond the reasonable control of BTCL, then BTCL shall be excused from such performance only for such period of time as is reasonably necessary after such occurrence has abated for the effects thereof to have dissipated.',
  },
  {
    id: 15,
    en: 'The Subscriber cannot use the service(s) for any unlawful or abusive purpose, or for sending obscene, indecent, threatening, harassing, unsolicited message or messages adversely affecting/infringing upon national, social or economic interest, not create any damage or risk to BTCL or its network and/or other Subscribers. Under such circumstances BTCL shall have the right to discontinue the service.',
    bn: 'The Subscriber cannot use the service(s) for any unlawful or abusive purpose, or for sending obscene, indecent, threatening, harassing, unsolicited message or messages adversely affecting/infringing upon national, social or economic interest, not create any damage or risk to BTCL or its network and/or other Subscribers. Under such circumstances BTCL shall have the right to discontinue the service.',
  },
  {
    id: 16,
    en: 'For any Telecom offence, crime, trial, punishment, and relevant telecom matters in Bangladesh Telecommunications Act-2001 (Act No. 18 of 2001) and the Rules, Regulations and guidelines framed thereunder shall be applicable and binding upon the subscribers/users.',
    bn: 'For any Telecom offence, crime, trial, punishment, and relevant telecom matters in Bangladesh Telecommunications Act-2001 (Act No. 18 of 2001) and the Rules, Regulations and guidelines framed thereunder shall be applicable and binding upon the subscribers/users.',
  },
  {
    id: 17,
    en: 'BTCL shall have no liability to the subscriber for any loss, damages, cost, expenses or other claims, either direct or indirect in nature, arising from any materials, equipments, instruments supplied by the subscriber which are incompatible, incorrect, inaccurate, illegible, out of sequence or in the wrong form, or arising from the late arrival or non-arrival. BTCL will not commit with regard to the quality of its services as it is dependent on the Subscriber’s broadband subscription and should not be liable for any claim arising in the Subscriber’s inability to use its services. For service interruption however, BTCL will give its best effort to resolve service interruption to the benefit of its Subscriber.',
    bn: 'BTCL shall have no liability to the subscriber for any loss, damages, cost, expenses or other claims, either direct or indirect in nature, arising from any materials, equipments, instruments supplied by the subscriber which are incompatible, incorrect, inaccurate, illegible, out of sequence or in the wrong form, or arising from the late arrival or non-arrival. BTCL will not commit with regard to the quality of its services as it is dependent on the Subscriber’s broadband subscription and should not be liable for any claim arising in the Subscriber’s inability to use its services. For service interruption however, BTCL will give its best effort to resolve service interruption to the benefit of its Subscriber.',
  },
  {
    id: 18,
    en: 'BTCL shall have the sole discretion to amend, alter, change, terminate, cancel, add any terms and conditions stipulated in this Agreement at any time without giving any notice.',
    bn: 'BTCL shall have the sole discretion to amend, alter, change, terminate, cancel, add any terms and conditions stipulated in this Agreement at any time without giving any notice.',
  },
  {
    id: 19,
    en: 'To avail BTCL’s IPTSP services, subscribers must have necessary equipment to use the Internet and have access to the Internet. The Subscriber must have the minimum requirement of at least 10Mbps of Internet connection for the service to run.',
    bn: 'To avail BTCL’s IPTSP services, subscribers must have necessary equipment to use the Internet and have access to the Internet. The Subscriber must have the minimum requirement of at least 10Mbps of Internet connection for the service to run.',
  },
  {
    id: 20,
    en: 'BTCL does not guarantee that its subscribers can register his/her service, using the internet from other ISP’s/Telecom operators.',
    bn: 'BTCL does not guarantee that its subscribers can register his/her service, using the internet from other ISP’s/Telecom operators.',
  },
  {
    id: 21,
    en: 'The Subscriber shall assume all taxes including Value Added Tax / Overseas Communication Tax and/or other charges imposed by the government of the People’s Republic of Bangladesh or its appropriate agencies incidental to any of BTCL’s services.',
    bn: 'The Subscriber shall assume all taxes including Value Added Tax / Overseas Communication Tax and/or other charges imposed by the government of the People’s Republic of Bangladesh or its appropriate agencies incidental to any of BTCL’s services.',
  },
  {
    id: 22,
    en: 'BTCL shall have the right to use/recycle/re-sell any IP phone number corresponding to a permanently deleted Pre-paid account/number.',
    bn: 'BTCL shall have the right to use/recycle/re-sell any IP phone number corresponding to a permanently deleted Pre-paid account/number.',
  },
  {
    id: 23,
    en: 'BTCL shall have the right to suspend/disable the service due to 180 days’ inactivity.',
    bn: 'BTCL shall have the right to suspend/disable the service due to 180 days’ inactivity.',
  },
  {
    id: 24,
    en: 'The different state in the life cycle of a Pre-Paid subscriber’s account will be known as idle, inactive, disabled, suspended, permanently disconnected and permanently deleted. The time span between the suspended state and the permanently disconnected state will not exceed 180 days under any circumstance. BTCL has the sole right to determine the current state of a Pre-Paid subscriber’s account anytime during the life cycle of a Pre-Paid account.',
    bn: 'The different state in the life cycle of a Pre-Paid subscriber’s account will be known as idle, inactive, disabled, suspended, permanently disconnected and permanently deleted. The time span between the suspended state and the permanently disconnected state will not exceed 180 days under any circumstance. BTCL has the sole right to determine the current state of a Pre-Paid subscriber’s account anytime during the life cycle of a Pre-Paid account.',
  },
  {
    id: 25,
    en: 'If the account is not recharged within 180 days after a subscriber’s account has been suspended then the account will be permanently retired/deleted from the Pre-Paid system & he/she will no longer be considered as Pre-Paid subscriber. A subscriber will not be able to claim his/her old account or number after permanent deletion of a Pre-paid account.',
    bn: 'If the account is not recharged within 180 days after a subscriber’s account has been suspended then the account will be permanently retired/deleted from the Pre-Paid system & he/she will no longer be considered as Pre-Paid subscriber. A subscriber will not be able to claim his/her old account or number after permanent deletion of a Pre-paid account.',
  },
  {
    id: 26,
    en: 'BTCL does not take the responsibility for possible disturbance or congestion in other networks encountered in calling subscribers of those other networks.',
    bn: 'BTCL does not take the responsibility for possible disturbance or congestion in other networks encountered in calling subscribers of those other networks.',
  },
  {
    id: 27,
    en: 'Subscriber may obtain call details of his/her IP phone as per BTCL policy which may be revised from time to time. BTCL shall have the right to provide with any information and details of the subscriber to the law enforcing agencies as and when required by the law of the land.',
    bn: 'Subscriber may obtain call details of his/her IP phone as per BTCL policy which may be revised from time to time. BTCL shall have the right to provide with any information and details of the subscriber to the law enforcing agencies as and when required by the law of the land.',
  },
  {
    id: 28,
    en: 'When the requested IPTSP services will be provisioned, BTCL does not guarantee that, recorded voice message (SMS) will be delivered on time (as scheduled) due to the service downtime/connectivity/Mobile Operator’s Network issues/ other issues that might affect the performance of this service and BTCL shall not be responsible for any delay in broadcasting the recorded voice message/SMS.',
    bn: 'When the requested IPTSP services will be provisioned, BTCL does not guarantee that, recorded voice message (SMS) will be delivered on time (as scheduled) due to the service downtime/connectivity/Mobile Operator’s Network issues/ other issues that might affect the performance of this service and BTCL shall not be responsible for any delay in broadcasting the recorded voice message/SMS.',
  },
]

const TermsAndPrivacyPage = () => {
  const locale = useLocale()
  const isEn = locale === 'en'

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gray-50">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-btcl-secondary via-btcl-secondary to-btcl-primary py-20">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-btcl-primary/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-btcl-accent/10 rounded-full blur-3xl" />
          </div>
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <span className="inline-flex items-center rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm mb-6">
              {isEn ? 'Legal' : 'আইনি'}
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {isEn ? 'Terms of Service & Privacy Policy' : 'সেবার শর্তাবলী এবং গোপনীয়তা নীতি'}
            </h1>
            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              {isEn
                ? "General Terms and Conditions for availing BTCL's IPTSP Services."
                : 'বিটিসিএল-এর IPTSP সেবা গ্রহণের সাধারণ শর্তাবলী।'}
            </p>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">

          {/* Intro */}
          <section className="bg-white rounded-2xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {isEn ? 'Overview' : 'সংক্ষিপ্ত বিবরণ'}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {isEn
                ? 'By registering for or using any of BTCL’s IPTSP services — including Hosted IP PBX, Contact Center, and Voice Broadcast — the subscriber acknowledges and agrees to the General Terms and Conditions set out below. These terms govern service availability, billing, account lifecycle, lawful use, and the handling of subscriber information by BTCL.'
                : 'BTCL-এর IPTSP সেবাসমূহ — হোস্টেড আইপি পিবিএক্স, কন্টাক্ট সেন্টার এবং ভয়েস ব্রডকাস্ট — এর জন্য নিবন্ধন বা ব্যবহারের মাধ্যমে গ্রাহক নিচে উল্লিখিত সাধারণ শর্তাবলী মেনে চলতে সম্মত হন। এই শর্তাবলী সেবার প্রাপ্যতা, বিলিং, অ্যাকাউন্টের জীবনচক্র, বৈধ ব্যবহার এবং BTCL কর্তৃক গ্রাহক তথ্য পরিচালনা সংক্রান্ত বিষয়াদি নিয়ন্ত্রণ করে।'}
            </p>
          </section>

          {/* Heading for clauses */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {isEn ? 'General Terms and Conditions' : 'সাধারণ শর্তাবলী'}
            </h2>
            <p className="text-gray-600">
              {isEn
                ? 'Please read each clause carefully before using BTCL’s IPTSP services.'
                : 'BTCL-এর IPTSP সেবা ব্যবহারের পূর্বে অনুগ্রহ করে প্রতিটি ধারা মনোযোগ সহকারে পড়ুন।'}
            </p>
          </section>

          {/* Clauses 1-28 */}
          <section className="space-y-4">
            {clauses.map((clause) => (
              <div
                key={clause.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start space-x-4">
                  <span className="flex-shrink-0 w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-btcl-primary font-bold">
                    {clause.id}
                  </span>
                  <p className="text-gray-700 leading-relaxed">
                    {isEn ? clause.en : clause.bn}
                  </p>
                </div>
              </div>
            ))}
          </section>

          {/* Privacy & Data Use Note */}
          <section className="bg-white rounded-2xl border border-gray-200 p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              {isEn ? 'Privacy & Subscriber Information' : 'গোপনীয়তা ও গ্রাহক তথ্য'}
            </h2>
            <p className="text-gray-600 leading-relaxed">
              {isEn
                ? 'Subscriber information collected during registration and service use is held by BTCL for service provisioning, billing, support, and statutory reporting. As stated in clauses 8 and 27, BTCL may scrutinize relevant documents and may disclose subscriber information to law enforcement agencies when required by the law of the land. Call detail records may be obtained by the subscriber as per BTCL policy in force from time to time.'
                : 'নিবন্ধন ও সেবা ব্যবহারকালে সংগৃহীত গ্রাহকের তথ্য BTCL সেবা প্রদান, বিলিং, সাপোর্ট এবং আইনি প্রতিবেদনের উদ্দেশ্যে সংরক্ষণ করে। ধারা ৮ ও ২৭-এ উল্লিখিত হিসাবে, BTCL প্রয়োজনে প্রাসঙ্গিক দলিল যাচাই করতে পারে এবং দেশের আইন অনুযায়ী আইন প্রয়োগকারী সংস্থার নিকট গ্রাহক তথ্য প্রকাশ করতে পারে। সময়ে সময়ে প্রযোজ্য BTCL নীতিমালা অনুযায়ী গ্রাহক তাঁর কল ডিটেইল রেকর্ড সংগ্রহ করতে পারবেন।'}
            </p>
          </section>

          {/* Contact for Questions */}
          <section className="text-center bg-gradient-to-r from-btcl-primary/5 to-btcl-accent/5 rounded-2xl border border-btcl-primary/20 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {isEn ? 'Have Questions?' : 'প্রশ্ন আছে?'}
            </h2>
            <p className="text-gray-600 mb-4">
              {isEn
                ? 'Contact our support team for any questions regarding these terms or your subscriber privacy.'
                : 'এই শর্তাবলী বা আপনার গ্রাহক গোপনীয়তা সম্পর্কিত যেকোনো প্রশ্নের জন্য আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করুন।'}
            </p>
            <div className="flex justify-center space-x-3">
              <a
                href="mailto:mdoffice@btcl.gov.bd"
                className="inline-flex items-center px-5 py-2.5 bg-btcl-primary text-white text-sm font-medium rounded-lg hover:bg-btcl-secondary transition-colors"
              >
                {isEn ? 'Email Support' : 'ইমেইল সাপোর্ট'}
              </a>
              <a
                href="tel:+88024831115000"
                className="inline-flex items-center px-5 py-2.5 bg-white text-gray-700 text-sm font-medium rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              >
                {isEn ? 'Call Us' : 'কল করুন'}
              </a>
            </div>
          </section>

        </div>
      </main>
      <Footer />
    </>
  )
}

export default TermsAndPrivacyPage
