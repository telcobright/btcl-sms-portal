'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import {
  getPartnerById,
  getUsersByPartner,
  getPurchasesByPartner,
  getDocumentsByPartner,
  getServiceStatus,
  getPartnerTypeLabel,
  getCustomerPrePaidLabel,
  updatePartner,
  createUser,
  editUser,
  deleteUser,
  uploadPartnerDocument,
  deletePartnerDocument,
  Partner,
  PartnerUser,
  PurchaseHistory,
  PartnerDocument,
  ServiceStatus,
  CreateUserPayload,
} from '@/lib/api-client/admin';
import { API_BASE_URL, API_ENDPOINTS } from '@/config/api';

type TabType = 'overview' | 'users' | 'purchases' | 'subscriptions' | 'documents';

export default function PartnerDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = params.locale || 'en';
  const partnerId = Number(params.id);

  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [loading, setLoading] = useState(true);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [users, setUsers] = useState<PartnerUser[]>([]);
  const [purchases, setPurchases] = useState<PurchaseHistory[]>([]);
  const [subscriptions, setSubscriptions] = useState<PurchaseHistory[]>([]);
  const [documents, setDocuments] = useState<PartnerDocument[]>([]);
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus>({
    pbx: { active: false, purchases: [] },
    hcc: { active: false, purchases: [] },
    vbs: { active: false, purchases: [] },
  });
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);
  const [downloadingDoc, setDownloadingDoc] = useState<string | null>(null);
  const [imageViewerData, setImageViewerData] = useState<{ url: string; name: string } | null>(null);
  const [pdfViewerData, setPdfViewerData] = useState<{ url: string; name: string } | null>(null);
  const [docStatuses, setDocStatuses] = useState<Record<string, { status: string; rejectionReason: string }>>({});
  const [updatingDocStatus, setUpdatingDocStatus] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        router.push(`/${locale}/login`);
        return;
      }

      // Fetch all data in parallel
      const [partnerData, usersData, purchasesData, documentsData, serviceStatusData, docStatusesRes] =
        await Promise.all([
          getPartnerById(partnerId, authToken),
          getUsersByPartner(partnerId, authToken),
          getPurchasesByPartner(partnerId, authToken),
          getDocumentsByPartner(partnerId, authToken),
          getServiceStatus(partnerId, authToken),
          fetch(`${API_BASE_URL}${API_ENDPOINTS.partner.getDocumentStatuses}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
            body: JSON.stringify({ id: partnerId }),
          }).then((r) => r.json()).catch(() => ({})),
        ]);

      setPartner(partnerData);
      // Ensure all arrays are actually arrays
      setUsers(Array.isArray(usersData) ? usersData : []);
      setPurchases(Array.isArray(purchasesData) ? purchasesData : []);
      setDocuments(Array.isArray(documentsData) ? documentsData : []);
      setServiceStatus(serviceStatusData);
      setDocStatuses(docStatusesRes || {});

      // Derive subscriptions from serviceStatus (combine all active purchases from all services)
      const allSubscriptions = [
        ...serviceStatusData.pbx.purchases,
        ...serviceStatusData.hcc.purchases,
        ...serviceStatusData.vbs.purchases,
      ];
      setSubscriptions(allSubscriptions);
    } catch (error) {
      console.error('Failed to fetch partner data:', error);
    } finally {
      setLoading(false);
    }
  }, [partnerId, locale, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Helper function to detect file type from blob
  const detectFileType = async (blob: Blob): Promise<string> => {
    const arr = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
    const header = arr.reduce((acc, byte) => acc + byte.toString(16).padStart(2, '0'), '');

    if (header.startsWith('89504e47')) return '.png';
    if (header.startsWith('ffd8ff')) return '.jpg';
    if (header.startsWith('47494638')) return '.gif';
    if (header.startsWith('25504446')) return '.pdf';
    if (header.startsWith('52494646')) return '.webp';
    return '.pdf';
  };

  const isImageFile = (extension: string): boolean => {
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'].includes(extension.toLowerCase());
  };

  const viewDocument = async (documentType: string, documentName: string) => {
    try {
      setViewingDoc(documentType);
      const authToken = localStorage.getItem('authToken');

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.partner.getPartnerDocument}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            partnerId: partnerId,
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

      if (mimeType && mimeType.startsWith('image/')) {
        isImage = true;
        if (mimeType.includes('jpeg') || mimeType.includes('jpg')) extension = '.jpg';
        else if (mimeType.includes('png')) extension = '.png';
        else if (mimeType.includes('gif')) extension = '.gif';
        else if (mimeType.includes('webp')) extension = '.webp';
      } else if (mimeType && mimeType.includes('application/pdf')) {
        extension = '.pdf';
      } else {
        extension = await detectFileType(blob);
        isImage = isImageFile(extension);
      }

      const baseFileName = documentName.replace(/\.[^/.]+$/, '');
      const finalFileName = `${baseFileName}${extension}`;

      if (isImage || isImageFile(extension)) {
        const url = window.URL.createObjectURL(blob);
        setImageViewerData({ url, name: finalFileName });
      } else if (extension === '.pdf') {
        const pdfBlob = new Blob([blob], { type: 'application/pdf' });
        const url = window.URL.createObjectURL(pdfBlob);
        setPdfViewerData({ url, name: finalFileName });
      } else {
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

  const downloadDocument = async (documentType: string, documentName: string) => {
    try {
      setDownloadingDoc(documentType);
      const authToken = localStorage.getItem('authToken');

      const response = await fetch(
        `${API_BASE_URL}${API_ENDPOINTS.partner.getPartnerDocument}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            partnerId: partnerId,
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
        if (mimeType.includes('image/jpeg') || mimeType.includes('image/jpg')) extension = '.jpg';
        else if (mimeType.includes('image/png')) extension = '.png';
        else if (mimeType.includes('image/gif')) extension = '.gif';
        else if (mimeType.includes('image/webp')) extension = '.webp';
        else if (mimeType.includes('application/pdf')) extension = '.pdf';
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

  const updateDocStatus = async (docType: string, status: string, rejectionReason: string) => {
    try {
      setUpdatingDocStatus(docType);
      const authToken = localStorage.getItem('authToken');
      const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.partner.updateDocumentStatus}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ partnerId, documentType: docType, status, rejectionReason }),
      });
      if (res.ok) {
        setDocStatuses((prev) => ({
          ...prev,
          [docType]: { status, rejectionReason: status === 'APPROVED' ? '' : rejectionReason },
        }));
      }
    } catch (err) {
      console.error('Failed to update document status:', err);
    } finally {
      setUpdatingDocStatus(null);
    }
  };

  // Count available documents
  const availableDocumentsCount = documents.filter((d) => d.available).length;

  // Count active services
  const activeServicesCount = [
    serviceStatus.pbx.active,
    serviceStatus.hcc.active,
    serviceStatus.vbs.active,
  ].filter(Boolean).length;

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users', count: users.length },
    { id: 'purchases', label: 'Purchases', count: purchases.length },
    { id: 'subscriptions', label: 'Services', count: activeServicesCount },
    { id: 'documents', label: 'Documents', count: availableDocumentsCount },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-[#00A651] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Partner not found</h2>
        <p className="text-gray-500 mt-2">The requested partner does not exist.</p>
        <Link
          href={`/${locale}/admin/partners`}
          className="inline-flex items-center gap-2 mt-4 text-[#00A651] hover:underline"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Partners
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500">
        <Link href={`/${locale}/admin`} className="hover:text-gray-700">
          Dashboard
        </Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <Link href={`/${locale}/admin/partners`} className="hover:text-gray-700">
          Partners
        </Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 font-medium">{partner.partnerName}</span>
      </nav>

      {/* Partner Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#00A651] rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {partner.partnerName?.charAt(0).toUpperCase() || '?'}
              </span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{partner.partnerName}</h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-gray-500">ID: {partner.idPartner}</span>
                <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                  {getPartnerTypeLabel(partner.partnerType)}
                </span>
                <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  {getCustomerPrePaidLabel(partner.customerPrePaid)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#00A651] text-[#00A651]'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${
                    activeTab === tab.id ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        {activeTab === 'overview' && <OverviewTab partner={partner} onPartnerUpdate={(updated) => setPartner(updated)} />}
        {activeTab === 'users' && <UsersTab users={users} partnerId={partnerId} onRefresh={fetchData} />}
        {activeTab === 'purchases' && <PurchasesTab purchases={purchases} />}
        {activeTab === 'subscriptions' && (
          <SubscriptionsTab
            subscriptions={subscriptions}
            serviceStatus={serviceStatus}
            partnerName={partner?.partnerName || ''}
          />
        )}
        {activeTab === 'documents' && (
          <DocumentsTab
            documents={documents}
            viewDocument={viewDocument}
            downloadDocument={downloadDocument}
            viewingDoc={viewingDoc}
            downloadingDoc={downloadingDoc}
            docStatuses={docStatuses}
            onUpdateStatus={updateDocStatus}
            updatingDocStatus={updatingDocStatus}
            partnerId={partnerId}
            onRefresh={fetchData}
          />
        )}
      </div>

      {/* Image Viewer Modal */}
      {imageViewerData && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => {
            window.URL.revokeObjectURL(imageViewerData.url);
            setImageViewerData(null);
          }}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white rounded-xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-semibold text-gray-900">{imageViewerData.name}</h3>
              <button
                onClick={() => {
                  window.URL.revokeObjectURL(imageViewerData.url);
                  setImageViewerData(null);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
              <img
                src={imageViewerData.url}
                alt={imageViewerData.name}
                className="max-w-full h-auto mx-auto"
              />
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {pdfViewerData && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => {
            window.URL.revokeObjectURL(pdfViewerData.url);
            setPdfViewerData(null);
          }}
        >
          <div
            className="relative w-full max-w-5xl h-[90vh] bg-white rounded-xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b shrink-0">
              <h3 className="font-semibold text-gray-900">{pdfViewerData.name}</h3>
              <div className="flex items-center gap-2">
                <a
                  href={pdfViewerData.url}
                  download={pdfViewerData.name}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-[#00A651] hover:bg-green-50 border border-[#00A651] rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </a>
                <button
                  onClick={() => {
                    window.URL.revokeObjectURL(pdfViewerData.url);
                    setPdfViewerData(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={pdfViewerData.url}
                title={pdfViewerData.name}
                className="w-full h-full border-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Overview Tab Component with Edit functionality
function OverviewTab({ partner, onPartnerUpdate }: { partner: Partner; onPartnerUpdate: (p: Partner) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partner>({ ...partner });

  const handleCancel = () => {
    setFormData({ ...partner });
    setIsEditing(false);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const authToken = localStorage.getItem('authToken');
      if (!authToken) return;

      await updatePartner(formData, authToken);
      onPartnerUpdate(formData);
      setIsEditing(false);
      toast.success('Partner updated successfully');
    } catch {
      toast.error('Failed to update partner');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof Partner, value: string | number | null) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const editableFields: { label: string; field: keyof Partner; type?: 'text' | 'select'; options?: { value: number; label: string }[] }[] = [
    { label: 'Partner Name', field: 'partnerName' },
    { label: 'Alternate Name (Invoice)', field: 'alternateNameInvoice' },
    { label: 'Email', field: 'email' },
    { label: 'Telephone', field: 'telephone' },
    { label: 'Address 1', field: 'address1' },
    { label: 'Address 2', field: 'address2' },
    { label: 'City', field: 'city' },
    { label: 'State', field: 'state' },
    { label: 'Postal Code', field: 'postalCode' },
    { label: 'Country', field: 'country' },
    {
      label: 'Payment Type', field: 'customerPrePaid', type: 'select',
      options: [
        { value: 1, label: 'Prepaid' },
        { value: 2, label: 'Postpaid' },
      ],
    },
    { label: 'VAT Registration No', field: 'vatRegistrationNo' },
    { label: 'Invoice Address', field: 'invoiceAddress' },
  ];

  const readOnlyItems = [
    { label: 'Partner ID', value: partner.idPartner },
    { label: 'Partner Type', value: getPartnerTypeLabel(partner.partnerType) },
    { label: 'Registration Date', value: partner.date1 ? new Date(partner.date1).toLocaleDateString() : null },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Partner Information</h2>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#00A651] hover:bg-[#008040] rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#00A651] hover:bg-[#008040] rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Save Changes
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Read-only fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-2">
        {readOnlyItems.map((item) => (
          <div key={item.label} className="py-3 border-b border-gray-100">
            <p className="text-sm text-gray-500">{item.label}</p>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {item.value || <span className="text-gray-400">N/A</span>}
            </p>
          </div>
        ))}
      </div>

      {/* Editable fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {editableFields.map((item) => (
          <div key={item.field} className="py-3 border-b border-gray-100">
            <p className="text-sm text-gray-500 mb-1">{item.label}</p>
            {isEditing ? (
              item.type === 'select' ? (
                <select
                  value={(formData[item.field] as number) ?? ''}
                  onChange={(e) => handleChange(item.field, Number(e.target.value))}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent"
                >
                  {item.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={(formData[item.field] as string) ?? ''}
                  onChange={(e) => handleChange(item.field, e.target.value || null)}
                  className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent"
                />
              )
            ) : (
              <p className="text-sm font-medium text-gray-900">
                {item.type === 'select'
                  ? item.field === 'partnerType'
                    ? getPartnerTypeLabel(partner[item.field] as number)
                    : getCustomerPrePaidLabel(partner[item.field] as number)
                  : (partner[item.field] as string) || <span className="text-gray-400">N/A</span>}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// Users Tab Component with Add / Edit / Delete
interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNo: string;
  userStatus: string;
}

const EMPTY_USER_FORM: UserFormData = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phoneNo: '',
  userStatus: 'ACTIVE',
};

function UsersTab({ users, partnerId, onRefresh }: { users: PartnerUser[]; partnerId: number; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<PartnerUser | null>(null);
  const [formData, setFormData] = useState<UserFormData>(EMPTY_USER_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const openAddForm = () => {
    setEditingUser(null);
    setFormData(EMPTY_USER_FORM);
    setShowForm(true);
  };

  const openEditForm = (user: PartnerUser) => {
    setEditingUser(user);
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      password: '',
      phoneNo: user.phoneNo || '',
      userStatus: user.userStatus || 'ACTIVE',
    });
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData(EMPTY_USER_FORM);
  };

  const handleSave = async () => {
    if (!formData.firstName || !formData.email) {
      toast.error('First name and email are required');
      return;
    }
    if (!editingUser && !formData.password) {
      toast.error('Password is required for new users');
      return;
    }

    try {
      setSaving(true);
      const authToken = localStorage.getItem('authToken');
      if (!authToken) return;

      if (editingUser) {
        // Edit existing user
        const payload: any = {
          id: editingUser.id,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNo: formData.phoneNo,
          userStatus: formData.userStatus,
          idPartner: partnerId,
        };
        if (formData.password) {
          payload.password = formData.password;
        }
        await editUser(payload, authToken);
        toast.success('User updated successfully');
      } else {
        // Create new user
        const payload: CreateUserPayload = {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
          phoneNo: formData.phoneNo,
          userStatus: formData.userStatus,
          partnerId,
        };
        await createUser(payload, authToken);
        toast.success('User created successfully');
      }

      setShowForm(false);
      setEditingUser(null);
      setFormData(EMPTY_USER_FORM);
      onRefresh();
    } catch {
      toast.error(editingUser ? 'Failed to update user' : 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: PartnerUser) => {
    if (!confirm(`Are you sure you want to delete ${user.firstName} ${user.lastName}?`)) return;
    try {
      setDeletingId(user.id);
      const authToken = localStorage.getItem('authToken');
      if (!authToken) return;
      await deleteUser(user.id, authToken);
      toast.success('User deleted');
      onRefresh();
    } catch {
      toast.error('Failed to delete user');
    } finally {
      setDeletingId(null);
    }
  };

  const handleChange = (field: keyof UserFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="p-6">
      {/* Header with Add button */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Users ({users.length})</h2>
        {!showForm && (
          <button
            onClick={openAddForm}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#00A651] hover:bg-[#008040] rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </button>
        )}
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="mb-6 bg-gray-50 rounded-xl border border-gray-200 p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">
            {editingUser ? `Edit User — ${editingUser.firstName} ${editingUser.lastName}` : 'Add New User'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">First Name *</label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Last Name</label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Email *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Password {editingUser ? '(leave blank to keep current)' : '*'}
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent"
                placeholder={editingUser ? '••��•••••' : ''}
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Phone</label>
              <input
                type="text"
                value={formData.phoneNo}
                onChange={(e) => handleChange('phoneNo', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Status</label>
              <select
                value={formData.userStatus}
                onChange={(e) => handleChange('userStatus', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00A651] focus:border-transparent"
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#00A651] hover:bg-[#008040] rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Saving...
                </>
              ) : (
                editingUser ? 'Save Changes' : 'Create User'
              )}
            </button>
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      {users.length === 0 && !showForm ? (
        <div className="py-12 text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p className="text-gray-500 mt-4">No users found for this partner</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roles</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {user.firstName?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">ID: {user.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <p className="text-sm text-gray-900">{user.email}</p>
                    <p className="text-sm text-gray-500">{user.phoneNo}</p>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.userStatus === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.userStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {user.authRoles?.map((role) => (
                        <span
                          key={role.id}
                          className="inline-flex px-2 py-0.5 text-xs bg-blue-100 text-blue-800 rounded"
                        >
                          {role.name.replace('ROLE_', '')}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.createdOn ? new Date(user.createdOn).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditForm(user)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#00A651] hover:bg-green-50 border border-[#00A651] rounded-lg transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(user)}
                        disabled={deletingId === user.id}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 border border-red-300 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {deletingId === user.id ? (
                          <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Purchases Tab Component
function PurchasesTab({ purchases }: { purchases: PurchaseHistory[] }) {
  if (purchases.length === 0) {
    return (
      <div className="p-12 text-center">
        <svg className="w-12 h-12 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <p className="text-gray-500 mt-4">No purchase history found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Package</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purchase Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expire Date</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">VAT</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {purchases.map((purchase) => (
            <tr key={purchase.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <p className="text-sm font-medium text-gray-900">
                  {purchase.packageName || purchase.packageAccounts?.[0]?.name || 'N/A'}
                </p>
                <p className="text-sm text-gray-500">ID: {purchase.idPackage}</p>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {purchase.purchaseDate ? new Date(purchase.purchaseDate).toLocaleDateString() : 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {purchase.expireDate ? new Date(purchase.expireDate).toLocaleDateString() : 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                ৳{purchase.price?.toLocaleString() || 0}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                ৳{purchase.vat?.toLocaleString() || 0}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                ৳{purchase.total?.toLocaleString() || 0}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    purchase.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800'
                      : purchase.status === 'EXPIRED'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}
                >
                  {purchase.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Subscriptions Tab Component
interface SubscriptionsTabProps {
  subscriptions: PurchaseHistory[];
  serviceStatus: ServiceStatus;
  partnerName: string;
}

function SubscriptionsTab({ subscriptions, serviceStatus, partnerName }: SubscriptionsTabProps) {
  const servicePortals = [
    {
      id: 'pbx',
      name: 'Hosted PBX',
      icon: '📞',
      url: 'https://hippbx.btcliptelephony.gov.bd:5174/',
      activeColor: 'from-blue-50 to-blue-100 border-blue-200',
      activeBg: 'from-blue-500 to-blue-600',
      activeText: 'text-blue-700',
    },
    {
      id: 'hcc',
      name: 'Contact Center',
      icon: '👥',
      url: `https://hcc.btcliptelephony.gov.bd/${partnerName?.toLowerCase().replace(/\s+/g, '_') || 'user'}/#/home`,
      activeColor: 'from-purple-50 to-purple-100 border-purple-200',
      activeBg: 'from-purple-500 to-purple-600',
      activeText: 'text-purple-700',
    },
    {
      id: 'vbs',
      name: 'Voice Broadcast',
      icon: '📢',
      url: 'https://vbs.btcliptelephony.gov.bd/',
      activeColor: 'from-orange-50 to-orange-100 border-orange-200',
      activeBg: 'from-orange-500 to-orange-600',
      activeText: 'text-orange-700',
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Service Portals Section */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Service Portals
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {servicePortals.map((portal) => {
            const status = serviceStatus[portal.id as keyof ServiceStatus];
            const isActive = status?.active;

            return (
              <div
                key={portal.id}
                className={`rounded-xl p-4 border-2 ${
                  isActive
                    ? `bg-gradient-to-r ${portal.activeColor}`
                    : 'bg-gray-50 border-gray-200 border-dashed'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-3 rounded-lg ${
                      isActive ? `bg-gradient-to-br ${portal.activeBg}` : 'bg-gray-300'
                    }`}
                  >
                    <span className="text-xl">{portal.icon}</span>
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-bold ${isActive ? portal.activeText : 'text-gray-500'}`}>
                      {portal.name}
                    </h4>
                    <p className={`text-xs ${isActive ? 'text-gray-600' : 'text-gray-400'}`}>
                      {isActive ? 'Active' : 'Not Active'}
                    </p>
                  </div>
                  {isActive ? (
                    <a
                      href={portal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                    >
                      <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ) : (
                    <span className="px-2 py-1 text-xs bg-gray-200 text-gray-500 rounded-full">
                      No Package
                    </span>
                  )}
                </div>

                {/* Show active packages for this service */}
                {isActive && status.purchases.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200/50">
                    <p className="text-xs text-gray-500 mb-2">Active Packages:</p>
                    <div className="flex flex-wrap gap-1">
                      {status.purchases.slice(0, 3).map((p, idx) => (
                        <span key={idx} className="text-xs px-2 py-0.5 bg-white/80 rounded text-gray-700">
                          {p.packageName || p.packageAccounts?.[0]?.name || 'Package'}
                        </span>
                      ))}
                      {status.purchases.length > 3 && (
                        <span className="text-xs px-2 py-0.5 bg-white/80 rounded text-gray-500">
                          +{status.purchases.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* All Subscriptions */}
      {subscriptions.filter((s) => s.idPackage !== 9999).length > 0 ? (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">All Subscriptions</h3>
          <div className="overflow-x-auto border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Package</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Start</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Expires</th>
                  <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                  <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subscriptions
                  .filter((sub) => sub.idPackage !== 9999)
                  .map((sub) => (
                    <tr key={sub.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-900">
                        {sub.packageName || sub.packageAccounts?.[0]?.name || 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-gray-500">
                        {sub.purchaseDate ? new Date(sub.purchaseDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-gray-500">
                        {sub.expireDate ? new Date(sub.expireDate).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-900">৳{sub.price?.toLocaleString() || 0}</td>
                      <td className="px-4 py-2 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 text-xs rounded-full ${
                            sub.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <p>No subscription data available</p>
        </div>
      )}
    </div>
  );
}

// Documents Tab Component
const MAJOR_DOCS = new Set(['nidfront', 'nidback', 'tradelicense', 'tin']);

interface DocumentsTabProps {
  documents: PartnerDocument[];
  viewDocument: (documentType: string, documentName: string) => Promise<void>;
  downloadDocument: (documentType: string, documentName: string) => Promise<void>;
  viewingDoc: string | null;
  downloadingDoc: string | null;
  docStatuses: Record<string, { status: string; rejectionReason: string }>;
  onUpdateStatus: (docType: string, status: string, rejectionReason: string) => Promise<void>;
  updatingDocStatus: string | null;
  partnerId: number;
  onRefresh: () => void;
}

function DocumentsTab({
  documents,
  viewDocument,
  downloadDocument,
  viewingDoc,
  downloadingDoc,
  docStatuses,
  onUpdateStatus,
  updatingDocStatus,
  partnerId,
  onRefresh,
}: DocumentsTabProps) {
  const [rejectingDoc, setRejectingDoc] = useState<string | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null);
  const fileInputRefs = useState<Record<string, HTMLInputElement | null>>({})[0];

  const availableDocs = documents.filter((doc) => doc.available);
  const unavailableDocs = documents.filter((doc) => !doc.available);

  const getDocTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'nidfront':
      case 'nidback':
        return '🪪';
      case 'tradelicense':
        return '📜';
      case 'tin':
      case 'taxreturn':
        return '🧾';
      case 'photo':
        return '📷';
      case 'bin':
      case 'vat':
        return '📋';
      case 'btrc':
        return '📡';
      case 'sla':
        return '📝';
      default:
        return '📄';
    }
  };

  const getStatusBadge = (docType: string) => {
    const statusInfo = docStatuses[docType];
    const status = statusInfo?.status || 'PENDING';
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            Pending
          </span>
        );
    }
  };

  const handleApprove = async (docType: string) => {
    setRejectingDoc(null);
    await onUpdateStatus(docType, 'APPROVED', '');
  };

  const handleRejectSubmit = async (docType: string) => {
    const reason = rejectionReasons[docType] || '';
    await onUpdateStatus(docType, 'REJECTED', reason);
    setRejectingDoc(null);
  };

  const handleUpload = async (docType: string, file: File) => {
    try {
      setUploadingDoc(docType);
      const authToken = localStorage.getItem('authToken');
      if (!authToken) return;
      await uploadPartnerDocument(partnerId, docType, file, authToken);
      toast.success('Document uploaded successfully');
      onRefresh();
    } catch {
      toast.error('Failed to upload document');
    } finally {
      setUploadingDoc(null);
    }
  };

  const handleDeleteDoc = async (docType: string, docName: string) => {
    if (!confirm(`Are you sure you want to delete "${docName}"?`)) return;
    try {
      setDeletingDoc(docType);
      const authToken = localStorage.getItem('authToken');
      if (!authToken) return;
      await deletePartnerDocument(partnerId, docType, authToken);
      toast.success('Document deleted');
      onRefresh();
    } catch {
      toast.error('Failed to delete document');
    } finally {
      setDeletingDoc(null);
    }
  };

  const borderColorByStatus = (docType: string) => {
    const status = docStatuses[docType]?.status || 'PENDING';
    if (status === 'APPROVED') return 'border-green-200 bg-green-50';
    if (status === 'REJECTED') return 'border-red-200 bg-red-50';
    return 'border-yellow-200 bg-yellow-50';
  };

  return (
    <div className="p-6">
      {/* Available Documents */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Uploaded Documents ({availableDocs.length})
        </h3>
        {availableDocs.length === 0 ? (
          <p className="text-gray-500 text-sm">No documents uploaded yet</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableDocs.map((doc) => {
              const currentStatus = docStatuses[doc.type]?.status || 'PENDING';
              const rejectionReason = docStatuses[doc.type]?.rejectionReason || '';
              const isUpdating = updatingDocStatus === doc.type;
              const isRejecting = rejectingDoc === doc.type;

              return (
                <div
                  key={doc.type}
                  className={`border rounded-lg p-4 ${borderColorByStatus(doc.type)}`}
                >
                  {/* Header row */}
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{getDocTypeIcon(doc.type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                        {MAJOR_DOCS.has(doc.type) && (
                          <span className="inline-flex px-1.5 py-0.5 text-[10px] font-bold rounded bg-orange-100 text-orange-700 uppercase tracking-wide">
                            Major
                          </span>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(doc.type)}
                  </div>

                  {/* Rejection reason (when rejected) */}
                  {currentStatus === 'REJECTED' && rejectionReason && !isRejecting && (
                    <p className="text-xs text-red-600 mb-3 bg-red-100 rounded px-2 py-1">
                      <span className="font-semibold">Reason:</span> {rejectionReason}
                    </p>
                  )}

                  {/* Reject reason input form */}
                  {isRejecting && (
                    <div className="mb-3">
                      <textarea
                        className="w-full text-xs border border-red-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-red-400 resize-none"
                        rows={2}
                        placeholder="Enter rejection reason..."
                        value={rejectionReasons[doc.type] || ''}
                        onChange={(e) =>
                          setRejectionReasons((prev) => ({ ...prev, [doc.type]: e.target.value }))
                        }
                      />
                      <div className="flex gap-2 mt-1">
                        <button
                          onClick={() => handleRejectSubmit(doc.type)}
                          disabled={isUpdating}
                          className="flex-1 text-xs px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                        >
                          {isUpdating ? 'Saving...' : 'Confirm Reject'}
                        </button>
                        <button
                          onClick={() => setRejectingDoc(null)}
                          className="flex-1 text-xs px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons — Row 1: View, Download, Re-upload, Delete */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => viewDocument(doc.type, doc.name)}
                      disabled={viewingDoc === doc.type}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#00A651] hover:bg-[#008040] rounded-lg transition-colors disabled:opacity-50"
                    >
                      {viewingDoc === doc.type ? 'Loading...' : (
                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>View</>
                      )}
                    </button>
                    <button
                      onClick={() => downloadDocument(doc.type, doc.name)}
                      disabled={downloadingDoc === doc.type}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#00A651] bg-white hover:bg-green-50 border-2 border-[#00A651] rounded-lg transition-colors disabled:opacity-50"
                    >
                      {downloadingDoc === doc.type ? 'Downloading...' : (
                        <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>Download</>
                      )}
                    </button>
                    {/* Re-upload */}
                    <label
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-lg transition-colors cursor-pointer ${uploadingDoc === doc.type ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                      <input
                        type="file"
                        className="hidden"
                        accept=".pdf,.jpg,.jpeg,.png"
                        ref={(el) => { fileInputRefs[doc.type] = el; }}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUpload(doc.type, file);
                          e.target.value = '';
                        }}
                      />
                      {uploadingDoc === doc.type ? 'Uploading...' : (
                        <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>Update</>
                      )}
                    </label>
                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteDoc(doc.type, doc.name)}
                      disabled={deletingDoc === doc.type}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-red-600 bg-white hover:bg-red-50 border border-red-300 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {deletingDoc === doc.type ? 'Deleting...' : (
                        <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>Delete</>
                      )}
                    </button>
                  </div>
                  {/* Action Buttons — Row 2: Approve / Reject */}
                  <div className="flex items-center gap-2 mt-2">
                    {!isRejecting && (
                      <button
                        onClick={() => handleApprove(doc.type)}
                        disabled={isUpdating || currentStatus === 'APPROVED'}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50"
                      >
                        {isUpdating && currentStatus !== 'REJECTED' ? (
                          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                        )}
                        Approve
                      </button>
                    )}
                    {!isRejecting && (
                      <button
                        onClick={() => setRejectingDoc(doc.type)}
                        disabled={isUpdating || currentStatus === 'REJECTED'}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" /></svg>
                        Reject
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Missing Documents */}
      {unavailableDocs.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Missing Documents ({unavailableDocs.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unavailableDocs.map((doc) => (
              <div
                key={doc.type}
                className="border border-gray-200 bg-gray-50 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl grayscale">{getDocTypeIcon(doc.type)}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{doc.name}</p>
                  </div>
                  <label
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#00A651] bg-white hover:bg-green-50 border border-[#00A651] rounded-lg transition-colors cursor-pointer ${uploadingDoc === doc.type ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <input
                      type="file"
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleUpload(doc.type, file);
                        e.target.value = '';
                      }}
                    />
                    {uploadingDoc === doc.type ? 'Uploading...' : (
                      <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>Upload</>
                    )}
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
