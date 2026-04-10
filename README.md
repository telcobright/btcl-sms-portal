# BTCL IP Telephony Service Portal

A modern, responsive web portal for Bangladesh Telecommunications Company Limited (BTCL) to promote and sell enterprise communication services — including Hosted PBX, Voice Broadcast, Contact Center, and Bulk SMS.

## Services

| Service | Description |
|---|---|
| ☎️ **Hosted PBX** | Cloud-based PBX with extensions, IVR, call recording (Bronze / Silver / Gold) |
| 📢 **Voice Broadcast** | Automated voice messaging with text-to-speech (Basic / Standard / Enterprise) |
| 🎧 **Contact Center** | Multi-channel contact center with ACD, social media integration (Basic) |
| 📱 **Bulk SMS** | A2P SMS with delivery reports via the SMS Portal |

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Internationalization**: next-intl (English + Bangla)
- **Authentication**: JWT-based, custom login/register
- **Payment**: SSL Commerz (unified purchase API)
- **OCR**: Tesseract.js for NID card scanning
- **Backend**: External REST APIs (`services.btcliptelephony.gov.bd`)

## Key Features

### User Registration
- Multi-step registration with NID/Passport upload
- Tesseract.js OCR auto-fills name, DOB, NID number from uploaded card
- OTP (phone + email) and NID verification (toggleable via feature flags)
- Credentials delivered to registered email on first purchase

### Pricing & Packages
- All three services displayed as scrollable sections (no tab switching)
- Quick-jump anchor links from hero banner
- Smart buttons per logged-in state:
  - **Buy Now** — new customer
  - **✓ Current Plan** — active plan (disabled)
  - **↑ Upgrade Plan** — higher tier available
  - **↓ Downgrade Plan** — lower tier available
  - **↻ Renew Plan** — expired plan

### Checkout & Payment
- SSL Commerz payment gateway for prepaid users
- Direct purchase for postpaid users (customerPrePaid = 2)
- Auto-creates partner account in the target service before purchase
- Post-purchase modal:
  - **New purchase** — "Credentials sent to your email"
  - **Renew / Upgrade / Downgrade** — plan summary with action label
  - Manual close only (no backdrop dismiss)

### Admin Panel
- Partner management with document view/download
- Subscription management
- User verification workflow

### Internationalization
- Full English / Bangla toggle
- Localized currency (BDT / ৳), phone format (+880), timezone (GMT+6)
- All UI text, errors, and toasts translated

## Feature Flags

Located in `src/config/api.ts`:

```ts
FEATURE_FLAGS = {
  OTP_VERIFICATION_ENABLED: false,   // Phone OTP during registration
  NID_VERIFICATION_ENABLED: false,   // NID API verification
  PAYMENT_ENABLED: true,             // SSL Commerz payment gateway
  POSTPAID_ENABLED: false,           // Postpaid plan visibility
}
```

## API Configuration

All API base URLs are centralised in `src/config/api.ts`:

```ts
ROOT_URL        = 'https://services.btcliptelephony.gov.bd'
PBX_BASE_URL    = 'https://vbs.btcliptelephony.gov.bd:4000/FREESWITCHREST'  // Hosted PBX
VBS_BASE_URL    = 'https://vbs.btcliptelephony.gov.bd/FREESWITCHREST'       // Voice Broadcast
HCC_BASE_URL    = 'https://hcc.btcliptelephony.gov.bd/FREESWITCHREST'       // Contact Center
```

To switch to local development, comment out the production `ROOT_URL` and uncomment `http://localhost:8001`.

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/telcobright/btcl-sms-portal.git
cd btcl-sms-portal
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Update `.env.local`:
```env
NEXT_PUBLIC_DEFAULT_LOCALE=en
NEXT_PUBLIC_SUPPORTED_LOCALES=en,bn
```

4. Start the development server:
```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── [locale]/
│   │   ├── login/
│   │   ├── register/
│   │   ├── dashboard/
│   │   ├── pricing/
│   │   ├── admin/
│   │   ├── about/
│   │   ├── services/
│   │   ├── contact/
│   │   └── page.tsx
│   └── api/
│       └── payment/
├── components/
│   ├── ui/
│   ├── layout/        # Header, Footer
│   └── checkout/      # CheckoutModal, OrderSummary, CheckoutForm
├── config/
│   └── api.ts         # All API URLs + feature flags
├── lib/
│   ├── api-client/    # partner, payment API helpers
│   ├── nid-ocr.ts     # Tesseract.js OCR engine
│   └── utils.ts
├── messages/
│   ├── en.json
│   └── bn.json
└── types/
```

## Package ID Reference

| Package | ID | Service |
|---|---|---|
| Bronze | 9132 | Hosted PBX |
| Silver | 9133 | Hosted PBX |
| Gold | 9134 | Hosted PBX |
| Basic | 9135 | Voice Broadcast |
| Standard | 9136 | Voice Broadcast |
| Enterprise | 9137 | Voice Broadcast |
| Basic | 9140 | Contact Center |

## Deployment

Deploy to Vercel or any Node.js-compatible platform. No database setup required — all data is served from the BTCL backend APIs.

```bash
npm run build
npm start
```

## Support

- **Email**: sms@btcl.gov.bd
- **Phone**: +880-2-8181234
- **Address**: BTCL Tower, Agargaon, Dhaka-1207, Bangladesh
