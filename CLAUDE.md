# BTCL Bulk SMS Service Website Requirements

## Project Overview
Build a modern, responsive website for Bangladesh Telecommunications Company Limited (BTCL) to promote and sell their bulk SMS service using Next.js 14 with App Router.

## Technical Stack
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Internationalization**: next-intl for Bangla/English translation
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **File Upload**: Uploadthing or similar
- **Payment**: SSL Commerz integration
- **Deployment**: Vercel

## Core Features

### 1. Design & Branding
- **Color Scheme**: Primary BTCL green (#00A651), secondary colors for contrast
- **Typography**: Modern, readable fonts suitable for Bangla and English
- **Bangladeshi Elements**: 
  - Incorporate subtle patterns inspired by traditional Bengali art
  - Use imagery reflecting Bangladesh's culture and telecommunications
  - Green and red accent colors reflecting the national flag
- **Layout**: Clean, corporate design with mobile-first responsive approach
- **Components**: Reusable UI components with consistent BTCL branding

### 2. Content Pages
- **Homepage**: Hero section, service overview, pricing preview, testimonials
- **About BTCL**: Company background and bulk SMS service description
- **Services**: Detailed bulk SMS features, use cases, technical specifications
- **Pricing**: Package comparison table with feature breakdown
- **Contact**: Office locations, support information, contact form

### 3. User Registration System
- **Multi-step Registration Form**:
  - Step 1: Basic information (name, email, phone, company)
  - Step 2: Document upload (Passport/NID with preview)
  - Step 3: Account verification status
- **File Upload Requirements**:
  - Accept PDF, JPG, PNG formats
  - Maximum 5MB per file
  - Image compression and validation
  - Secure file storage with unique naming
- **Form Validation**: 
  - Real-time validation with error messages
  - Bangladesh phone number format validation
  - Email verification system
- **User Dashboard**: Profile management, document status, resubmission capability

### 4. Package Purchase System
- **Package Selection Interface**:
  - Interactive pricing cards with hover effects
  - Package comparison functionality
  - Custom package builder for enterprise clients
- **SSL Commerz Integration**:
  - Secure payment gateway integration
  - Support for major Bangladesh payment methods
  - Order confirmation and receipt generation
  - Payment status tracking
- **Order Management**: Purchase history, invoice downloads, package activation status

### 5. Additional Features
- **Admin Panel**: 
  - User verification management
  - Package management
  - Order tracking and analytics
- **API Routes**: RESTful APIs for all backend operations
- **Security**: 
  - CSRF protection
  - Input sanitization
  - File upload security
  - Rate limiting for forms
- **SEO Optimization**: 
  - Meta tags, Open Graph, structured data
  - Sitemap generation
  - Bangladesh-focused keywords

## Database Schema Requirements
```prisma
// User model with registration fields
// Package model with pricing and features
// Order model with payment tracking
// Document model for file uploads
// VerificationStatus enum for approval workflow
```

## Environment Variables Needed
```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=
SSLCOMMERZ_STORE_ID=
SSLCOMMERZ_STORE_PASSWORD=
SSLCOMMERZ_IS_LIVE=false
NEXT_PUBLIC_DEFAULT_LOCALE=en
NEXT_PUBLIC_SUPPORTED_LOCALES=en,bn
```

## File Structure
```
src/
├── app/
│   ├── [locale]/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── dashboard/
│   │   ├── packages/
│   │   ├── payment/
│   │   └── page.tsx
│   └── api/
├── components/
│   ├── ui/
│   ├── forms/
│   ├── layout/
│   └── LanguageToggle.tsx
├── lib/
│   ├── auth.ts
│   ├── db.ts
│   ├── utils.ts
│   ├── sslcommerz.ts
│   └── i18n.ts
├── messages/
│   ├── en.json
│   └── bn.json
└── types/
```

## Deployment Requirements
- **Environment**: Production-ready Vercel deployment
- **Domain**: Custom domain setup capability
- **SSL**: HTTPS enabled with proper certificates
- **Performance**: Lighthouse score >90 for all metrics
- **Monitoring**: Error tracking and analytics integration

### 6. Language Selection System
- **Multi-language Support**: 
  - Language toggle button in header (Bangla/English)
  - Persistent language preference using cookies/localStorage
  - Dynamic content switching without page reload
  - Right-to-left text support for Bangla where needed
- **Internationalization (i18n)**:
  - Use next-intl or react-i18next for translation management
  - JSON translation files for both languages
  - Dynamic routing: `/en/` and `/bn/` URL structure
  - Language-specific SEO meta tags and hreflang attributes
- **Content Requirements**:
  - All UI text, buttons, and labels in both languages
  - Error messages and validation text translated
  - Email templates in user's preferred language
  - Admin panel with language selection for customer communication

## Bangladesh-Specific Considerations
- **Language Support**: Complete Bangla and English internationalization
- **Mobile Numbers**: +880 format validation
- **Business Hours**: Bangladesh timezone (GMT+6)
- **Currency**: Bangladeshi Taka (BDT) formatting
- **Local Payment Methods**: Mobile banking (bKash, Nagad, Rocket) via SSL Commerz

## Success Criteria
- Fast loading times (<3s initial load)
- Mobile-responsive design (works on all device sizes)
- Successful SSL Commerz payment processing
- Secure file upload and verification workflow
- Professional, trustworthy appearance suitable for enterprise clients
- SEO optimized for Bangladesh telecommunications market