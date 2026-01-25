'use client';

import { Header } from '@/components/layout/Header';
import {
  Check,
  CheckCircle,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Maximize2,
  Package,
  RotateCw,
  X,
  XCircle,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { API_ENDPOINTS, buildApiUrl, BULK_SMS_PORTAL_URL } from '@/config/api';

// Mock packages data
const packages = [
  {
    id: 'small',
    name: 'Small Business',
    sms: 20000,
    rate: 0.32,
    validity: 30,
    features: [
      'Basic API Access',
      'Email Support',
      'Standard Delivery',
      'Basic Reports',
      'Single Sender ID',
    ],
  },
  {
    id: 'medium',
    name: 'Medium Business',
    sms: 50000,
    rate: 0.3,
    validity: 60,
    features: [
      'Advanced API',
      'Priority Support',
      'Fast Delivery',
      'Custom Sender ID',
      'Detailed Analytics',
      'Multiple Projects',
    ],
  },
  {
    id: 'large',
    name: 'Large Business',
    sms: 100000,
    rate: 0.28,
    validity: 90,
    features: [
      'Premium API',
      '24/7 Phone Support',
      'Instant Delivery',
      'Multiple Sender IDs',
      'Advanced Analytics',
      'Dedicated Manager',
      'Priority Routing',
    ],
  },
];

interface PartnerExtra {
  partnerId: number;
  address1: string;
  address2?: string;
  address3?: string;
  address4?: string;
  city: string;
  state: string;
  postalCode: string;
  nid: string;
  tradeLicenseNumber: string;
  tin: string;
  taxReturnDate: string;
  countryCode: string;
  tinCertificateAvailable: boolean;
  nidFrontAvailable: boolean;
  nidBackAvailable: boolean;
  vatDocAvailable: boolean;
  tradeLicenseAvailable: boolean;
  photoAvailable: boolean;
  binCertificateAvailable: boolean;
  slaAvailable: boolean;
  btrcRegistrationAvailable: boolean;
  lastTaxReturnAvailable: boolean;
  uploadedBy: string;
  uploadedAt: string;
}

interface DecodedToken {
  idPartner: number;
  email?: string;
  [key: string]: any;
}

interface PartnerData {
  idPartner: number;
  partnerName: string;
  alternateNameInvoice: string;
  alternateNameOther: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  telephone: string;
  email: string;
  customerPrePaid: number;
  partnerType: number;
  date1: string;
  callSrcId: number;
  defaultCurrency: number;
  invoiceAddress: string;
  vatRegistrationNo: string;
  paymentAdvice: string | null;
  userPassword: string | null;
}

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  partnerId: number;
}

interface PackageAccount {
  id: number | null;
  idPackagePurchase: number | null;
  name: string;
  lastAmount: number;
  balanceBefore: number;
  balanceAfter: number;
  uom: string;
  packageId: number;
  quantity: number;
  selected: boolean;
}

interface PurchaseForPartner {
  purchaseDate: string | null;
  expireDate: string | null;
  packageAccounts: PackageAccount[];
}

interface PurchaseHistory {
  id: number;
  idPackage: number;
  idPartner: number;
  packageName: string;
  partnerName: string;
  purchaseDate: string;
  expireDate: string;
  price: number;
  vat: number;
  ait: number;
  status: string;
}

interface ActivePackageDetails {
  packageName: string | null;
  unit: string;
  purchased: number | null;
  used: number | null;
  remaining: number | null;
  purchaseDate: string | null;
  expireDate: string | null;
}

// Image Viewer Modal Component
const ImageViewerModal = ({
  imageUrl,
  imageName,
  onClose,
}: {
  imageUrl: string;
  imageName: string;
  onClose: () => void;
}) => {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.25, 0.5));
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/80 to-transparent p-6 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h3 className="text-white text-lg font-semibold">{imageName}</h3>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-4">
          <button
            onClick={handleZoomOut}
            className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-lg transition-all backdrop-blur-sm"
            title="Zoom Out"
          >
            <ZoomOut className="w-5 h-5" />
          </button>

          <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg text-white font-medium">
            {Math.round(zoom * 100)}%
          </div>

          <button
            onClick={handleZoomIn}
            className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-lg transition-all backdrop-blur-sm"
            title="Zoom In"
          >
            <ZoomIn className="w-5 h-5" />
          </button>

          <div className="w-px h-8 bg-white/30 mx-2" />

          <button
            onClick={handleRotate}
            className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-lg transition-all backdrop-blur-sm"
            title="Rotate"
          >
            <RotateCw className="w-5 h-5" />
          </button>

          <button
            onClick={handleReset}
            className="bg-white/20 hover:bg-white/30 text-white p-3 rounded-lg transition-all backdrop-blur-sm"
            title="Reset"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Image Container */}
      <div
        className="flex items-center justify-center w-full h-full p-20 cursor-move"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <img
          src={imageUrl}
          alt={imageName}
          className="max-w-full max-h-full object-contain transition-transform duration-300 ease-out"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
          }}
          draggable={false}
        />
      </div>
    </div>
  );
};

export default function Dashboard() {
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [partnerExtra, setPartnerExtra] = useState<PartnerExtra | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState('active');
  const [currentPackage, setCurrentPackage] = useState(packages[1]);
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);
  const [purchaseForPartner, setPurchaseForPartner] =
    useState<PurchaseForPartner | null>(null);
  const [allPackages, setAllPackages] = useState<string[]>([]);
  const [imageViewerData, setImageViewerData] = useState<{
    url: string;
    name: string;
  } | null>(null);
  const [partnerID, setPartnerID] = useState<string | null>(null);
  const [purchaseHistory, setPurchaseHistory] = useState<PurchaseHistory[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null);

  // Check if customer is prepaid (1 = prepaid, 2 = postpaid)
  const isPrepaid = partnerData?.customerPrePaid === 1;
  const paymentType = isPrepaid ? 'Prepaid' : 'Postpaid';

  // Calculate invoice due date (1st of next month for postpaid)
  const getInvoiceDueDate = (purchaseDate: string | null): Date | null => {
    if (isPrepaid) return null;
    const date = purchaseDate ? new Date(purchaseDate) : new Date();
    const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    return nextMonth;
  };

  console.log('purchaseForPartner', purchaseForPartner);

  useEffect(() => {
    // Access localStorage only on client side
    const authToken = localStorage.getItem('authToken');

    if (authToken) {
      try {
        const decodedToken = jwtDecode<DecodedToken>(authToken);
        const idPartner = decodedToken?.idPartner;

        if (idPartner) {
          setPartnerID(String(idPartner));
          fetchUserData(idPartner);
          fetchPurchaseForPartner(idPartner);
          fetchPurchaseHistory(idPartner);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        setError('Invalid authentication token');
        setLoading(false);
      }
    } else {
      setError('No authentication token found');
      setLoading(false);
    }
  }, []);

  const fetchUserData = async (idPartner: number) => {
    try {
      setLoading(true);
      setError(null);

      const authToken = localStorage.getItem('authToken');
      const password = localStorage.getItem('userPassword') || '********';

      // Fetch partner details from API
      const response = await fetch(buildApiUrl(API_ENDPOINTS.partner.getPartner), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ idPartner }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch partner details');
      }

      const fetchedPartnerData: PartnerData = await response.json();
      setPartnerData(fetchedPartnerData);

      // Map API response to UserData
      const basicUserData: UserData = {
        firstName: fetchedPartnerData.partnerName || '',
        lastName: '',
        email: fetchedPartnerData.email || '',
        phone: fetchedPartnerData.telephone || '',
        password: password,
        partnerId: fetchedPartnerData.idPartner,
      };

      setUserData(basicUserData);

      // Fetch additional partner extra information
      await fetchPartnerExtra(idPartner);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPartnerExtra = async (partnerId: number) => {
    try {
      const authToken = localStorage.getItem('authToken');

      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.partner.getPartnerExtra),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ id: partnerId }),
        }
      );

      if (!response.ok) {
        console.warn('Partner extra API returned non-OK status:', response.status);
        return;
      }

      const data: PartnerExtra = await response.json();
      setPartnerExtra(data);
    } catch (err) {
      console.warn('Error fetching partner extra (non-critical):', err);
    }
  };

  const fetchPurchaseForPartner = async (partnerId: number) => {
    try {
      const authToken = localStorage.getItem('authToken');

      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.package.getPurchaseForPartner),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ idPartner: partnerId }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch partner data');
      }

      const data = await response.json();

      if (Array.isArray(data) && data.length > 0) {
        const firstItem = data[0];
        setPurchaseForPartner({
          packageAccounts: firstItem.packageAccounts || [],
          purchaseDate: firstItem.purchaseDate ?? null,
          expireDate: firstItem.expireDate ?? null,
        });

        // Extract all unique package names from all items
        const packageNames: string[] = [];
        data.forEach((item: any) => {
          if (item.packageAccounts && Array.isArray(item.packageAccounts)) {
            item.packageAccounts.forEach((account: any) => {
              if (account.name && !packageNames.includes(account.name)) {
                packageNames.push(account.name);
              }
            });
          }
        });
        setAllPackages(packageNames);
      } else {
        setPurchaseForPartner({
          packageAccounts: [],
          purchaseDate: null,
          expireDate: null,
        });
        setAllPackages([]);
      }
    } catch (err) {
      console.error('Error fetching partner extra:', err);
    }
  };

  const fetchPurchaseHistory = async (partnerId: number) => {
    try {
      setLoadingInvoices(true);
      const authToken = localStorage.getItem('authToken');

      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.package.getAllPurchasePartnerWise),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            page: 0,
            size: 20,
            idPartner: partnerId
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch purchase history');
      }

      const data = await response.json();
      const purchaseList = Array.isArray(data) ? data : (data.content || data.data || data.purchases || data.list || []);
      setPurchaseHistory(purchaseList);
    } catch (err) {
      console.error('Error fetching purchase history:', err);
    } finally {
      setLoadingInvoices(false);
    }
  };

  // Generate and download invoice as PDF
  const handleDownloadInvoice = (purchase: PurchaseHistory) => {
    const invoiceId = `INV-${purchase.id || '00000'}`;
    const pkgName = purchase.packageName || 'Package';
    const partnerName = purchase.partnerName || 'Customer';
    const purchaseDate = purchase.purchaseDate;
    const expireDate = purchase.expireDate;
    const amount = purchase.price || 0;
    const vat = purchase.vat || 0;
    const ait = purchase.ait || 0;
    const total = amount + vat + ait;
    const status = purchase.status || 'ACTIVE';
    const invoiceDueDate = getInvoiceDueDate(purchaseDate);

    const formatDate = (dateStr: string | null) => {
      if (!dateStr) return '-';
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    };

    const formatDateObj = (date: Date | null) => {
      if (!date) return '-';
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      });
    };

    // Create invoice HTML
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice ${invoiceId}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 20px; }
          .invoice { max-width: 800px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #067a3e, #045a2e); color: white; padding: 30px; }
          .header h1 { font-size: 28px; margin-bottom: 5px; }
          .header p { opacity: 0.9; }
          .company-info { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 20px; }
          .company-info div { font-size: 14px; }
          .content { padding: 30px; }
          .invoice-meta { display: flex; justify-content: space-between; margin-bottom: 15px; padding-bottom: 12px; border-bottom: 2px solid #f0f0f0; }
          .invoice-meta h2 { color: #067a3e; font-size: 20px; margin-bottom: 2px; }
          .invoice-meta .details { text-align: right; }
          .invoice-meta .details p { margin: 2px 0; color: #666; font-size: 13px; }
          .invoice-meta .details strong { color: #333; }
          .bill-to { margin-bottom: 15px; }
          .bill-to h3 { color: #333; margin-bottom: 5px; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
          .bill-to p { color: #666; }
          .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          .items-table th { background: #f8f9fa; padding: 15px; text-align: left; font-weight: 600; color: #333; border-bottom: 2px solid #e0e0e0; }
          .items-table td { padding: 15px; border-bottom: 1px solid #f0f0f0; color: #555; }
          .items-table .amount { text-align: right; }
          .totals { margin-left: auto; width: 300px; }
          .totals .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0; }
          .totals .row.total { border-bottom: none; border-top: 2px solid #067a3e; margin-top: 10px; padding-top: 15px; font-size: 18px; font-weight: bold; color: #067a3e; }
          .status { display: inline-block; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; }
          .status.paid { background: #d4edda; color: #155724; }
          .status.pending { background: #fff3cd; color: #856404; }
          .status.active { background: #d4edda; color: #155724; }
          .status.expired { background: #f8d7da; color: #721c24; }
          .payment-type { display: inline-block; padding: 6px 12px; border-radius: 15px; font-size: 11px; font-weight: 600; margin-left: 10px; }
          .payment-type.prepaid { background: #dbeafe; color: #1e40af; }
          .payment-type.postpaid { background: #f3e8ff; color: #7c3aed; }
          .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #666; font-size: 12px; }
          .footer p { margin: 5px 0; }
          @media print {
            body { background: white; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; }
            .invoice { box-shadow: none; }
            .header { background: linear-gradient(135deg, #067a3e, #045a2e) !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .status { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .items-table th { background: #f8f9fa !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .footer { background: #f8f9fa !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .payment-type { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          }
        </style>
      </head>
      <body>
        <div class="invoice">
          <div class="header">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px;">
              <img src="${window.location.origin}/btcllogo.png" alt="BTCL Logo" style="height: 60px; width: auto;" onerror="this.style.display='none'" />
              <div style="text-align: right;">
                <h1 style="margin: 0;">BTCL SMS Portal</h1>
                <p style="margin: 0;">Bangladesh Telecommunications Company Limited</p>
              </div>
            </div>
            <div class="company-info">
              <div>
                <p>Telesales Building, 37/E, Eskaton Garden</p>
                <p>Dhaka-1000, Bangladesh</p>
                <p>Phone: +880-2-4831115000</p>
              </div>
              <div style="text-align: right;">
                <p>Email: mdoffice@btcl.gov.bd</p>
                <p>Website: www.btcl.gov.bd</p>
              </div>
            </div>
          </div>

          <div class="content">
            <div class="invoice-meta">
              <div>
                <h2>INVOICE <span class="payment-type ${isPrepaid ? 'prepaid' : 'postpaid'}">${paymentType}</span></h2>
                <p style="color: #067a3e; font-weight: 600; font-size: 18px;">${invoiceId}</p>
              </div>
              <div class="details">
                <p><strong>Invoice Date:</strong> ${formatDate(purchaseDate)}</p>
                <p><strong>Package Expire Date:</strong> ${formatDate(expireDate)}</p>
                ${!isPrepaid ? `<p><strong>Invoice Due Date:</strong> ${formatDateObj(invoiceDueDate)}</p>` : ''}
              </div>
            </div>

            <div class="bill-to">
              <h3>Bill To</h3>
              <p><strong>${partnerName}</strong></p>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Purchase Date</th>
                  <th>Package Expire Date</th>
                  ${!isPrepaid ? '<th>Invoice Due Date</th>' : ''}
                  <th>Status</th>
                  <th class="amount">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>${pkgName}</strong><br>
                    <span style="color: #888; font-size: 13px;">SMS Package Subscription</span>
                  </td>
                  <td>${formatDate(purchaseDate)}</td>
                  <td>${formatDate(expireDate)}</td>
                  ${!isPrepaid ? `<td>${formatDateObj(invoiceDueDate)}</td>` : ''}
                  <td><span class="status ${status.toLowerCase()}">${status}</span></td>
                  <td class="amount">৳${amount.toLocaleString()}</td>
                </tr>
              </tbody>
            </table>

            <div class="totals">
              <div class="row">
                <span>Subtotal</span>
                <span>৳${amount.toLocaleString()}</span>
              </div>
              ${vat > 0 ? `<div class="row"><span>VAT</span><span>৳${vat.toLocaleString()}</span></div>` : ''}
              ${ait > 0 ? `<div class="row"><span>AIT</span><span>৳${ait.toLocaleString()}</span></div>` : ''}
              <div class="row total">
                <span>Total</span>
                <span>৳${total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div class="footer">
            <p><strong>Thank you for choosing BTCL SMS Portal!</strong></p>
            <p>For any queries, please contact our support team at mdoffice@btcl.gov.bd</p>
            <p style="margin-top: 10px; color: #999;">This is a computer-generated invoice and does not require a signature.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Open in new window for printing/saving as PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(invoiceHTML);
      printWindow.document.close();
      printWindow.focus();

      // Auto-trigger print dialog after a short delay
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
  };

  const activePackageInfo = (
    packageData: PurchaseForPartner | null
  ): ActivePackageDetails => {
    if (
      !packageData ||
      !packageData.packageAccounts ||
      packageData.packageAccounts.length === 0
    ) {
      return {
        packageName: null,
        unit: 'SMS',
        purchased: null,
        used: null,
        remaining: null,
        purchaseDate: null,
        expireDate: null,
      };
    }

    const activePackageAccount = packageData.packageAccounts[0];
    const unit = activePackageAccount?.uom === 'OTH_ea' ? 'SMS' : activePackageAccount?.uom || 'SMS';

    return {
      packageName: activePackageAccount?.name ?? null,
      unit: unit,
      purchased: activePackageAccount?.quantity ?? null,
      used: activePackageAccount
        ? activePackageAccount.quantity - activePackageAccount.balanceAfter
        : null,
      remaining: activePackageAccount?.balanceAfter ?? null,
      purchaseDate: packageData.purchaseDate ?? null,
      expireDate: packageData.expireDate ?? null,
    };
  };

  const detectFileType = async (blob: Blob): Promise<string> => {
    const buffer = await blob.slice(0, 12).arrayBuffer();
    const bytes = new Uint8Array(buffer);

    if (
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46
    ) {
      return '.pdf';
    }

    if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return '.jpg';
    }

    if (
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47
    ) {
      return '.png';
    }

    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) {
      return '.gif';
    }

    if (
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return '.webp';
    }

    return '.bin';
  };

  const isImageFile = (extension: string): boolean => {
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'].includes(
      extension.toLowerCase()
    );
  };

  const viewDocument = async (documentType: string, documentName: string) => {
    if (!partnerID) return;

    try {
      setViewingDoc(documentType);
      const authToken = localStorage.getItem('authToken');

      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.partner.getPartnerDocument),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            partnerId: +partnerID,
            documentType: documentType,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to load document');
      }

      const blob = await response.blob();
      const mimeType = blob.type;

      let extension = '.pdf';
      let isImage = false;

      // Check if it's an image based on mime type
      if (mimeType && mimeType.startsWith('image/')) {
        isImage = true;
        if (mimeType.includes('jpeg') || mimeType.includes('jpg')) {
          extension = '.jpg';
        } else if (mimeType.includes('png')) {
          extension = '.png';
        } else if (mimeType.includes('gif')) {
          extension = '.gif';
        } else if (mimeType.includes('webp')) {
          extension = '.webp';
        } else if (mimeType.includes('bmp')) {
          extension = '.bmp';
        } else if (mimeType.includes('svg')) {
          extension = '.svg';
        }
      } else if (mimeType && mimeType.includes('application/pdf')) {
        extension = '.pdf';
      } else if (!mimeType || mimeType === 'application/octet-stream') {
        // Fallback to file type detection
        extension = await detectFileType(blob);
        isImage = isImageFile(extension);
      }

      const baseFileName = documentName.replace(/\.[^/.]+$/, '');
      const finalFileName = `${baseFileName}${extension}`;

      if (isImage || isImageFile(extension)) {
        // For all image types, show in the modal viewer
        const url = window.URL.createObjectURL(blob);
        setImageViewerData({ url, name: finalFileName });
      } else if (extension === '.pdf') {
        // For PDFs, create a proper blob with PDF mime type and open in new tab
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(pdfBlob);
        const newWindow = window.open(url, '_blank');

        // Clean up the URL after the new window loads or after a delay
        if (newWindow) {
          newWindow.onload = () => {
            setTimeout(() => {
              window.URL.revokeObjectURL(url);
            }, 1000);
          };
        } else {
          // Fallback if popup is blocked
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
          }, 5000);
        }
      } else {
        // For other file types, trigger download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = finalFileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Error viewing document:', err);
      alert('Failed to load document. Please try again.');
    } finally {
      setViewingDoc(null);
    }
  };

  const downloadDocument = async (
    documentType: string,
    documentName: string
  ) => {
    if (!partnerID) return;

    try {
      setDownloadingDoc(documentType);
      const authToken = localStorage.getItem('authToken');

      const response = await fetch(
        buildApiUrl(API_ENDPOINTS.partner.getPartnerDocument),
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            partnerId: +partnerID,
            documentType: documentType,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download document');
      }

      const blob = await response.blob();
      const mimeType = blob.type;

      let extension = '.pdf';

      if (mimeType && mimeType !== 'application/octet-stream') {
        if (mimeType.includes('image/jpeg') || mimeType.includes('image/jpg')) {
          extension = '.jpg';
        } else if (mimeType.includes('image/png')) {
          extension = '.png';
        } else if (mimeType.includes('image/gif')) {
          extension = '.gif';
        } else if (mimeType.includes('image/webp')) {
          extension = '.webp';
        } else if (mimeType.includes('application/pdf')) {
          extension = '.pdf';
        }
      } else {
        extension = await detectFileType(blob);
      }

      const baseFileName = documentName.replace(/\.[^/.]+$/, '');
      const finalFileName = `${baseFileName}${extension}`;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = finalFileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading document:', err);
      alert('Failed to download document. Please try again.');
    } finally {
      setDownloadingDoc(null);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-[#067a3e]
 mx-auto mb-4" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Default user data when not loaded
  const displayUserData: UserData = userData || {
    firstName: 'User',
    lastName: '',
    email: 'N/A',
    phone: 'N/A',
    password: '********',
    partnerId: 0,
  };

  const documents = [
    {
      type: 'tradelicense',
      name: 'Trade License',
      available: partnerExtra?.tradeLicenseAvailable,
    },
    {
      type: 'tin',
      name: 'TIN Certificate',
      available: partnerExtra?.tinCertificateAvailable,
    },
    {
      type: 'taxreturn',
      name: 'Tax Return',
      available: partnerExtra?.lastTaxReturnAvailable,
    },
    {
      type: 'nidfront',
      name: 'NID Front Side',
      available: partnerExtra?.nidFrontAvailable,
    },
    {
      type: 'nidback',
      name: 'NID Back Side',
      available: partnerExtra?.nidBackAvailable,
    },
    {
      type: 'bin',
      name: 'BIN Certificate',
      available: partnerExtra?.binCertificateAvailable,
    },
    {
      type: 'vat',
      name: 'VAT Document',
      available: partnerExtra?.vatDocAvailable,
    },
    {
      type: 'btrc',
      name: 'BTRC Registration',
      available: partnerExtra?.btrcRegistrationAvailable,
    },
    { type: 'photo', name: 'Photo', available: partnerExtra?.photoAvailable },
    {
      type: 'sla',
      name: 'SLA Document',
      available: partnerExtra?.slaAvailable,
    },
  ];

  const packageDetails = activePackageInfo(purchaseForPartner);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-green-50/30">
      <Header />

      {/* Image Viewer Modal */}
      {imageViewerData && (
        <ImageViewerModal
          imageUrl={imageViewerData.url}
          imageName={imageViewerData.name}
          onClose={() => {
            if (imageViewerData.url) {
              window.URL.revokeObjectURL(imageViewerData.url);
            }
            setImageViewerData(null);
          }}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold bg-gradient-to-r from-[#067a3e] to-green-700 bg-clip-text text-transparent mb-2">
            Welcome back, {displayUserData.firstName} {displayUserData.lastName}!
          </h2>
          <p className="text-gray-700">
            Here's an overview of your account
          </p>
        </div>

        {/* Account Status & Current Package */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-lg border border-green-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Account Status
              </h3>
              {accountStatus === 'active' ? (
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle className="w-6 h-6 text-[#067a3e]" />
                </div>
              ) : (
                <div className="bg-red-100 p-2 rounded-full">
                  <XCircle className="w-6 h-6 text-red-500" />
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div
                className={`px-5 py-2.5 rounded-full text-sm font-bold shadow-sm ${
                  accountStatus === 'active'
                    ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-[#067a3e] border border-green-200'
                    : 'bg-gradient-to-r from-red-100 to-orange-100 text-red-700 border border-red-200'
                }`}
              >
                {accountStatus === 'active' ? 'Active' : 'Inactive'}
              </div>
            </div>
            <p className="text-gray-600 text-sm mt-4">
              {accountStatus === 'active'
                ? 'Your account is active and ready to use'
                : 'Please contact support to activate your account'}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-green-100 p-6 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Current Packages</h3>
              <div className="bg-gradient-to-br from-[#067a3e] to-green-600 p-2 rounded-full">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
            {allPackages.length > 0 ? (
              <div className="space-y-2">
                {allPackages.map((pkgName, index) => (
                  <div key={index} className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                    <span className="text-[#067a3e] font-bold">Package:</span>
                    <span className="font-bold text-[#067a3e] text-lg">
                      {pkgName}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No active package found</p>
            )}
          </div>
        </div>

        {/* API Credentials */}
        <div className="bg-white rounded-xl shadow-lg border border-green-100 p-6 mb-8 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-[#067a3e] to-green-600 p-2 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Portal Credentials
            </h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Username (Email)
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-50 to-green-50/30 border-2 border-gray-200 rounded-lg font-mono text-sm text-gray-900 hover:border-green-300 transition-colors">
                  {displayUserData.email}
                </div>
                <button
                  onClick={() => copyToClipboard(displayUserData.email, 'email')}
                  className="p-3 hover:bg-green-50 border-2 border-transparent hover:border-green-300 rounded-lg transition-all flex-shrink-0"
                >
                  {copiedField === 'email' ? (
                    <Check className="w-5 h-5 text-[#067a3e]" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-4 py-3 bg-gradient-to-r from-gray-50 to-green-50/30 border-2 border-gray-200 rounded-lg font-mono text-sm text-gray-900 hover:border-green-300 transition-colors">
                  {showPassword ? displayUserData.password : '••••••••••••'}
                </div>
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-3 hover:bg-green-50 border-2 border-transparent hover:border-green-300 rounded-lg transition-all flex-shrink-0"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-600" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-600" />
                  )}
                </button>
                <button
                  onClick={() => copyToClipboard(displayUserData.password, 'password')}
                  className="p-3 hover:bg-green-50 border-2 border-transparent hover:border-green-300 rounded-lg transition-all flex-shrink-0"
                >
                  {copiedField === 'password' ? (
                    <Check className="w-5 h-5 text-[#067a3e]" />
                  ) : (
                    <Copy className="w-5 h-5 text-gray-600" />
                  )}
                </button>
              </div>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg p-4 mt-4">
              <div className="flex">
                <svg
                  className="h-5 w-5 text-[#067a3e] flex-shrink-0 mt-0.5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
                <p className="ml-3 text-sm text-[#067a3e] font-medium">
                  Keep your credentials secure. Never share your password with
                  anyone.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="bg-white rounded-xl shadow-lg border border-green-100 p-6 mb-8 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-[#067a3e] to-green-600 p-2 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">
              Personal Information
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-4 rounded-lg bg-gradient-to-r from-gray-50 to-green-50/20 border border-gray-200 hover:border-green-300 transition-colors">
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Full Name
              </label>
              <p className="text-gray-900 font-bold">
                {displayUserData.firstName} {displayUserData.lastName}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-r from-gray-50 to-green-50/20 border border-gray-200 hover:border-green-300 transition-colors">
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Phone Number
              </label>
              <p className="text-gray-900 font-bold">{displayUserData.phone}</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-r from-gray-50 to-green-50/20 border border-gray-200 hover:border-green-300 transition-colors">
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                Email Address
              </label>
              <p className="text-gray-900 font-bold">{displayUserData.email}</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-r from-gray-50 to-green-50/20 border border-gray-200 hover:border-green-300 transition-colors">
              <label className="block text-sm font-semibold text-gray-600 mb-2">
                NID Number
              </label>
              <p className="text-gray-900 font-bold">
                {partnerExtra?.nid || 'N/A'}
              </p>
            </div>
          </div>
        </div>

        {/* Address Information */}
        {partnerExtra && (
          <div className="bg-white rounded-xl shadow-lg border border-green-100 p-6 mb-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-[#067a3e] to-green-600 p-2 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Address Information
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 rounded-lg bg-gradient-to-r from-gray-50 to-green-50/20 border border-gray-200 hover:border-green-300 transition-colors">
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Address
                </label>
                <p className="text-gray-900 font-bold">{partnerExtra.address1}</p>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-r from-gray-50 to-green-50/20 border border-gray-200 hover:border-green-300 transition-colors">
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  City
                </label>
                <p className="text-gray-900 font-bold">{partnerExtra.city}</p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-r from-gray-50 to-green-50/20 border border-gray-200 hover:border-green-300 transition-colors">
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Postal Code
                </label>
                <p className="text-gray-900 font-bold">{partnerExtra.postalCode}</p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-r from-gray-50 to-green-50/20 border border-gray-200 hover:border-green-300 transition-colors">
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Country
                </label>
                <p className="text-gray-900 font-bold">
                  {partnerExtra.countryCode === 'BD'
                    ? 'Bangladesh'
                    : partnerExtra.countryCode}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Business Information */}
        {partnerExtra && (
          <div className="bg-white rounded-xl shadow-lg border border-green-100 p-6 mb-8 hover:shadow-xl transition-shadow">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-gradient-to-br from-[#067a3e] to-green-600 p-2 rounded-lg">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                Business Information
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="p-4 rounded-lg bg-gradient-to-r from-gray-50 to-green-50/20 border border-gray-200 hover:border-green-300 transition-colors">
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Trade License Number
                </label>
                <p className="text-gray-900 font-bold">
                  {partnerExtra.tradeLicenseNumber}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-r from-gray-50 to-green-50/20 border border-gray-200 hover:border-green-300 transition-colors">
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  TIN Number
                </label>
                <p className="text-gray-900 font-bold">{partnerExtra.tin}</p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-r from-gray-50 to-green-50/20 border border-gray-200 hover:border-green-300 transition-colors">
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Tax Return Date
                </label>
                <p className="text-gray-900 font-bold">
                  {new Date(partnerExtra.taxReturnDate).toLocaleDateString(
                    'en-US',
                    {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    }
                  )}
                </p>
              </div>
              <div className="p-4 rounded-lg bg-gradient-to-r from-gray-50 to-green-50/20 border border-gray-200 hover:border-green-300 transition-colors">
                <label className="block text-sm font-semibold text-gray-600 mb-2">
                  Uploaded By
                </label>
                <p className="text-gray-900 font-bold">
                  {partnerExtra.uploadedBy}
                </p>
              </div>
            </div>

            {/* Uploaded Documents */}
            <div className="border-t pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-1">
                    Uploaded Documents
                  </h4>
                  <p className="text-sm text-gray-500">
                    View and download your submitted documents
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#067a3e] bg-white hover:bg-green-50 border-2 border-[#067a3e] rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed">
                  <span className="text-xs font-semibold text-[#067a3e]">
                    {documents?.filter((doc) => doc.available).length} Documents
                  </span>
                </div>
              </div>

              {/* Table View */}
              <div className="bg-white border-2 border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-[#067a3e] uppercase tracking-wider">
                          Document Name
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-[#067a3e] uppercase tracking-wider">
                          Type
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-[#067a3e] uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-[#067a3e] uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {documents?.map((doc, index) => (
                        <tr
                          key={doc.type}
                          className="hover:bg-gradient-to-r hover:from-green-50/80 hover:to-green-50/40 transition-all duration-200 group"
                        >
                          {/* Document Name */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-11 w-11 bg-gradient-to-br from-[#067a3e] to-green-600 rounded-lg flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                                {/* Trade License Icon - Building */}
                                {doc.type === 'tradelicense' && (
                                  <svg
                                    className="w-5 h-5 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                    />
                                  </svg>
                                )}
                                {/* TIN Certificate Icon - Document with lines */}
                                {doc.type === 'tin' && (
                                  <svg
                                    className="w-5 h-5 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                    />
                                  </svg>
                                )}
                                {/* Tax Return Icon - Calculator */}
                                {doc.type === 'taxreturn' && (
                                  <svg
                                    className="w-5 h-5 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                                    />
                                  </svg>
                                )}
                                {/* NID Front/Back Icons - ID Card */}
                                {(doc.type === 'nidfront' || doc.type === 'nidback') && (
                                  <svg
                                    className="w-5 h-5 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                                    />
                                  </svg>
                                )}
                                {/* BIN Certificate Icon - Clipboard with list */}
                                {doc.type === 'bin' && (
                                  <svg
                                    className="w-5 h-5 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                                    />
                                  </svg>
                                )}
                                {/* VAT Document Icon - Currency/Money */}
                                {doc.type === 'vat' && (
                                  <svg
                                    className="w-5 h-5 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                                    />
                                  </svg>
                                )}
                                {/* BTRC Registration Icon - Broadcast/Signal */}
                                {doc.type === 'btrc' && (
                                  <svg
                                    className="w-5 h-5 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0"
                                    />
                                  </svg>
                                )}
                                {/* Photo Icon - Camera/Image */}
                                {doc.type === 'photo' && (
                                  <svg
                                    className="w-5 h-5 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                )}
                                {/* SLA Document Icon - Shield with check */}
                                {doc.type === 'sla' && (
                                  <svg
                                    className="w-5 h-5 text-white"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                    />
                                  </svg>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-semibold text-gray-900 group-hover:text-[#067a3e] transition-colors">
                                  {doc.name}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Type */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                              {doc.type.toUpperCase()}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            {doc.available ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-green-100 to-emerald-100 text-[#067a3e] border border-green-200 shadow-sm">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Verified
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-red-100 to-orange-100 text-red-600 border border-red-200 shadow-sm">
                                <XCircle className="w-3.5 h-3.5" />
                                Unverified
                              </span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-6 py-4 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() =>
                                  doc.available && viewDocument(doc.type, `${doc.name}`)
                                }
                                disabled={!doc.available || viewingDoc === doc.type}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#067a3e] to-green-600 hover:from-[#055a2e] hover:to-green-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
                                title={doc.available ? "View Document" : "Document not available"}
                              >
                                {viewingDoc === doc.type ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Loading
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-3.5 h-3.5" />
                                    View
                                  </>
                                )}
                              </button>

                              <button
                                onClick={() =>
                                  doc.available && downloadDocument(doc.type, `${doc.name}`)
                                }
                                disabled={!doc.available || downloadingDoc === doc.type}
                                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-[#067a3e] bg-white hover:bg-green-50 border-2 border-[#067a3e] rounded-lg transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:border-gray-400 disabled:text-gray-400"
                                title={doc.available ? "Download Document" : "Document not available"}
                              >
                                {downloadingDoc === doc.type ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Downloading
                                  </>
                                ) : (
                                  <>
                                    <Download className="w-3.5 h-3.5" />
                                    Download
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Invoice History */}
        <div className="bg-white rounded-xl shadow-lg border border-green-100 p-6 mb-8 hover:shadow-xl transition-shadow">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-gradient-to-br from-[#067a3e] to-green-600 p-2 rounded-lg">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900">Invoice History</h3>
          </div>

          {loadingInvoices ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#067a3e] animate-spin" />
            </div>
          ) : purchaseHistory && purchaseHistory.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[#067a3e] uppercase tracking-wider">Invoice ID</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[#067a3e] uppercase tracking-wider">Package</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[#067a3e] uppercase tracking-wider">Customer Type</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[#067a3e] uppercase tracking-wider">Purchase Date</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[#067a3e] uppercase tracking-wider">Package Expire Date</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[#067a3e] uppercase tracking-wider">Invoice Due Date</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-[#067a3e] uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-[#067a3e] uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-center text-xs font-bold text-[#067a3e] uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {purchaseHistory.map((purchase, index) => {
                    const invoiceId = `INV-${purchase.id || (index + 1).toString().padStart(5, '0')}`;
                    const pkgName = purchase.packageName || 'Package';
                    const purchaseDate = purchase.purchaseDate;
                    const expireDate = purchase.expireDate;
                    const amount = purchase.price || 0;
                    const vat = purchase.vat || 0;
                    const total = amount + vat;
                    const status = purchase.status || 'ACTIVE';
                    const invoiceDueDate = getInvoiceDueDate(purchaseDate);

                    return (
                      <tr key={purchase.id || index} className="hover:bg-gradient-to-r hover:from-green-50/80 hover:to-green-50/40 transition-all duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm font-mono font-medium text-[#067a3e]">{invoiceId}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-800">{pkgName}</p>
                            {purchase.partnerName && (
                              <p className="text-xs text-gray-500">{purchase.partnerName}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                            isPrepaid
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }`}>
                            {paymentType}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700">
                            {purchaseDate ? new Date(purchaseDate).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            }) : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700">
                            {expireDate ? new Date(expireDate).toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            }) : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-700">
                            {invoiceDueDate ? invoiceDueDate.toLocaleDateString('en-GB', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric'
                            }) : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-semibold text-gray-800">৳{total.toLocaleString()}</p>
                            {vat > 0 && (
                              <p className="text-xs text-gray-500">incl. VAT ৳{vat.toLocaleString()}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <span
                            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${
                              status === 'ACTIVE' || status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : status === 'EXPIRED' || status === 'expired'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <button
                            onClick={() => handleDownloadInvoice(purchase)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-gradient-to-r from-[#067a3e] to-green-600 hover:from-[#055a2e] hover:to-green-700 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md"
                            title="Download Invoice"
                          >
                            <Download className="w-4 h-4" />
                            Download
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-lg font-medium mb-2">No invoices found</p>
              <p className="text-sm">Your purchase history will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
