# Payment Success Flow Documentation

## Overview

This document describes the payment success flow for **Hosted PBX** and **Voice Broadcasting** services in the BTCL SMS Portal.

---

## Hosted PBX - Payment Success Flow

### Flow Diagram

```
User selects Hosted PBX package
        ↓
User clicks "Complete Purchase"
        ↓
CheckoutModal stores provision data in sessionStorage:
  - serviceType: 'hosted-pbx'
  - partnerId
  - email
  - packageId
  - packageIdInt
  - packageName
  - price
        ↓
Payment gateway (SSLCommerz) is initiated
        ↓
User completes payment on SSLCommerz
        ↓
SSLCommerz POSTs to /pg/success
        ↓
Middleware intercepts POST and redirects to GET /pg/success
        ↓
/pg/success page reads sessionStorage
        ↓
Displays Hosted PBX Success Page with:
  - Congratulations message
  - User email
  - Default password: 11111111
  - Link to PBX Portal: https://hippbx.btcliptelephony.gov.bd:5174/
  - Dashboard button
        ↓
sessionStorage is cleared
```

### Data Stored in sessionStorage

```json
{
  "serviceType": "hosted-pbx",
  "partnerId": 12345,
  "email": "user@example.com",
  "packageId": "bronze",
  "packageIdInt": 9132,
  "packageName": "Bronze",
  "price": 12
}
```

### Package IDs

| Package | Package ID |
|---------|-----------|
| Bronze  | 9132      |
| Silver  | 9133      |
| Gold    | 9134      |

### Success Page Display

- **Title**: "Congratulations!"
- **Subtitle**: "Your Hosted PBX is ready!"
- **Credentials**:
  - Email: User's registered email
  - Password: `11111111`
- **Portal Link**: https://hippbx.btcliptelephony.gov.bd:5174/
- **Note**: "Please change your password after first login."

---

## Voice Broadcasting - Payment Success Flow

### Flow Diagram

```
User selects Voice Broadcast package
        ↓
User clicks "Complete Purchase"
        ↓
CheckoutModal stores provision data in sessionStorage:
  - serviceType: 'voice-broadcast'
  - partnerId
  - email
  - packageId
  - packageIdInt
  - packageName
  - price
        ↓
Payment gateway (SSLCommerz) is initiated
        ↓
User completes payment on SSLCommerz
        ↓
SSLCommerz POSTs to /pg/success
        ↓
Middleware intercepts POST and redirects to GET /pg/success
        ↓
/pg/success page reads sessionStorage
        ↓
Displays Voice Broadcast Success Page with:
  - Congratulations message
  - User email
  - Default password: 11111111
  - Link to VBS Portal: https://vbs.btcliptelephony.gov.bd/
  - Dashboard button
        ↓
sessionStorage is cleared
```

### Data Stored in sessionStorage

```json
{
  "serviceType": "voice-broadcast",
  "partnerId": 12345,
  "email": "user@example.com",
  "packageId": "basic",
  "packageIdInt": 9135,
  "packageName": "Basic",
  "price": 500
}
```

### Package IDs

| Package    | Package ID |
|------------|-----------|
| Basic      | 9135      |
| Standard   | 9136      |
| Enterprise | 9137      |

### Success Page Display

- **Title**: "Congratulations!"
- **Subtitle**: "Your Voice Broadcast is ready!"
- **Credentials**:
  - Email: User's registered email
  - Password: `11111111`
- **Portal Link**: https://vbs.btcliptelephony.gov.bd/
- **Note**: "Please change your password after first login."

---

## Technical Details

### Files Involved

| File | Purpose |
|------|---------|
| `src/components/checkout/CheckoutModal.tsx` | Stores provision data in sessionStorage before payment |
| `src/middleware.ts` | Intercepts POST from payment gateway, redirects to GET |
| `src/app/pg/success/page.tsx` | Displays success page based on serviceType |

### sessionStorage Key

```
pendingServiceProvision
```

### Middleware POST Handling

The middleware in `src/middleware.ts` intercepts POST requests to `/pg/success` from the payment gateway and converts them to GET requests with query parameters:

```typescript
if (pathname === '/pg/success' && request.method === 'POST') {
    const formData = await request.formData();
    const params = new URLSearchParams();
    // Extract tran_id, amount, status
    return NextResponse.redirect(`/pg/success?${params}`, { status: 303 });
}
```

### Success Page Logic

```typescript
useEffect(() => {
    const pendingData = sessionStorage.getItem('pendingServiceProvision');
    if (pendingData) {
        const provision = JSON.parse(pendingData);
        setServiceType(provision.serviceType);
        setUserEmail(provision.email);
        sessionStorage.removeItem('pendingServiceProvision');
    }
}, []);

// Render based on serviceType:
// - 'hosted-pbx' → PBX Success Page
// - 'voice-broadcast' → VBS Success Page
// - null/other → Default Success Page
```

---

## API Endpoints (For Backend Reference)

These APIs are NOT called from the frontend success page. They should be called by the backend payment callback handler if needed.

### Hosted PBX Provisioning APIs

1. **Get Partner Details**
   - Endpoint: `POST /api/v1/partner/get-partner`
   - Payload: `{ idPartner: number }`

2. **Create Domain**
   - Endpoint: `POST /FREESWITCHREST/api/v1/domains/create`
   - Payload: `{ domainName, enabled, description }`

3. **Create Gateway**
   - Endpoint: `POST /api/v1/gateways/create`
   - Payload: `{ domainUuid, gateway, proxy, fromDomain, profile, context, register, callerIdInFrom, enabled, action }`

4. **Create Route**
   - Endpoint: `POST /api/v1/route`
   - Payload: `{ routeName, description, field5, zone, nationalOrInternational, field4, switchId, idPartner, metaData }`

5. **Get User By Email**
   - Endpoint: `POST /api/v1/user/get-user-by-email`
   - Payload: `{ email }`

6. **Edit User**
   - Endpoint: `POST /api/v1/user/edit-user`
   - Payload: `{ id, pbxUuid }`

7. **Purchase Package**
   - Endpoint: `POST /FREESWITCHREST/api/v1/partner-packages/purchase-package`
   - Payload: Package purchase details with VAT calculation

### Voice Broadcasting Purchase API

1. **Purchase Package**
   - Endpoint: `POST /FREESWITCHREST/api/v1/partner-packages/purchase-package`
   - Base URL: `https://vbs.btcliptelephony.gov.bd/FREESWITCHREST`
   - Payload: Package purchase details with VAT calculation

---

## Portal URLs

| Service | Portal URL |
|---------|-----------|
| Hosted PBX | https://hippbx.btcliptelephony.gov.bd:5174/ |
| Voice Broadcast | https://vbs.btcliptelephony.gov.bd/ |

---

## Default Credentials

| Field | Value |
|-------|-------|
| Email | User's registered email |
| Password | `11111111` |

**Important**: Users should change their password after first login for security.
