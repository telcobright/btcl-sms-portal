'use client';

export default function OrderSummary({
                                         pkg,
                                         onCheckout,
                                         loading,
                                         serviceType = 'sms',
                                         locale = 'en',
                                     }: {
    pkg: any;
    onCheckout: () => void;
    loading: boolean;
    serviceType?: 'sms' | 'hosted-pbx' | 'contact-center' | 'voice-broadcast';
    locale?: string;
}) {
    const getServiceIcon = () => {
        switch (serviceType) {
            case 'hosted-pbx': return '☎️';
            case 'contact-center': return '🎧';
            case 'voice-broadcast': return '📢';
            default: return '📱';
        }
    };

    const getServiceName = () => {
        switch (serviceType) {
            case 'hosted-pbx': return locale === 'en' ? 'Hosted PBX' : 'হোস্টেড PBX';
            case 'contact-center': return locale === 'en' ? 'Contact Center' : 'কন্টাক্ট সেন্টার';
            case 'voice-broadcast': return locale === 'en' ? 'Voice Broadcast' : 'ভয়েস ব্রডকাস্ট';
            default: return locale === 'en' ? 'Bulk SMS' : 'বাল্ক এসএমএস';
        }
    };

    const getPackageDetails = () => {
        switch (serviceType) {
            case 'hosted-pbx':
                return `${pkg.extensions} ${locale === 'en' ? 'Extensions' : 'এক্সটেনশন'}`;
            case 'contact-center':
                return `${pkg.users} ${locale === 'en' ? 'Agents' : 'এজেন্ট'}`;
            case 'voice-broadcast':
                return `${pkg.minutes?.toLocaleString()} ${locale === 'en' ? 'Minutes' : 'মিনিট'}`;
            default:
                return `${pkg.sms?.toLocaleString()} SMS`;
        }
    };

    return (
        <div className="bg-btcl-gray-50 p-6 rounded-xl shadow-card text-btcl-gray-900">
            <h3 className="text-2xl font-semibold mb-6 text-btcl-primary">
                {locale === 'en' ? 'Order Summary' : 'অর্ডার সারাংশ'}
            </h3>
            <div className="flex items-center gap-5 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                    <span className="text-3xl">{getServiceIcon()}</span>
                </div>
                <div>
                    <p className="text-sm text-btcl-gray-600">{getServiceName()}</p>
                    <p className="font-bold text-lg">{pkg.name}</p>
                    <p className="text-sm text-btcl-gray-600">{getPackageDetails()}</p>
                </div>
            </div>

            {/* Features for Hosted PBX */}
            {serviceType === 'hosted-pbx' && pkg.features && (
                <div className="mb-6 pb-4 border-b border-btcl-gray-200">
                    <p className="text-sm font-semibold mb-2">{locale === 'en' ? 'Includes:' : 'অন্তর্ভুক্ত:'}</p>
                    <ul className="space-y-1">
                        {pkg.features.slice(0, 4).map((feature: string, index: number) => (
                            <li key={index} className="flex items-center text-xs text-btcl-gray-600">
                                <svg className="w-3 h-3 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                {feature}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                    <span>{locale === 'en' ? 'Subtotal' : 'সাবটোটাল'}</span>
                    <span>৳{pkg.price.toLocaleString()}</span>
                </div>
                {serviceType === 'hosted-pbx' && (
                    <div className="flex justify-between text-btcl-gray-600">
                        <span>{locale === 'en' ? 'Billing' : 'বিলিং'}</span>
                        <span>{locale === 'en' ? 'Monthly' : 'মাসিক'}</span>
                    </div>
                )}
                <hr className="border-btcl-gray-300" />
                <div className="flex justify-between font-bold text-lg">
                    <span>{locale === 'en' ? 'Total' : 'মোট'}</span>
                    <span className="text-btcl-primary">৳{pkg.price.toLocaleString()}</span>
                </div>
                {serviceType === 'hosted-pbx' && pkg.callCharge && (
                    <p className="text-xs text-btcl-gray-500">
                        + ৳{pkg.callCharge}/{locale === 'en' ? 'min call charge' : 'মিনিট কল চার্জ'}
                    </p>
                )}
            </div>

            <button
                onClick={onCheckout}
                disabled={loading}
                className="w-full bg-btcl-primary hover:bg-btcl-secondary text-white mt-8 py-3 rounded-xl font-semibold transition-colors duration-300 disabled:opacity-50"
                type="button"
            >
                {loading
                    ? (locale === 'en' ? 'Processing...' : 'প্রসেস হচ্ছে...')
                    : (locale === 'en' ? 'Complete Purchase →' : 'ক্রয় সম্পন্ন করুন →')}
            </button>

            <p className="text-xs text-center mt-4 text-btcl-gray-500">
                {locale === 'en' ? 'By confirming the order, I accept the ' : 'অর্ডার নিশ্চিত করে, আমি '}
                <a href="#" className="text-btcl-primary underline hover:text-btcl-secondary">
                    {locale === 'en' ? 'terms of the user agreement' : 'ব্যবহারকারী চুক্তির শর্তাবলী'}
                </a>
                {locale === 'en' ? '' : ' মেনে নিচ্ছি'}
            </p>
        </div>
    );
}
