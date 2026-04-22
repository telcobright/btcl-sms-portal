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

/* ─── Spinner ─── */
const Spinner = ({ className = 'w-4 h-4' }: { className?: string }) => (
  <svg className={`${className} animate-spin`} fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
  </svg>
);

/* ─── Shared button styles ─── */
const btn = {
  primary: 'px-4 py-2 text-sm font-medium text-white bg-[#00A651] hover:bg-[#004D28] rounded-md transition-colors disabled:opacity-50',
  secondary: 'px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors',
  outline: 'px-3 py-1.5 text-xs font-medium border rounded-md transition-colors disabled:opacity-50',
};

/* ═══════════════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════════════ */
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
      if (!authToken) { router.push(`/${locale}/login`); return; }

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
      setUsers(Array.isArray(usersData) ? usersData : []);
      setPurchases(Array.isArray(purchasesData) ? purchasesData : []);
      setDocuments(Array.isArray(documentsData) ? documentsData : []);
      setServiceStatus(serviceStatusData);
      setDocStatuses(docStatusesRes || {});
      setSubscriptions([
        ...serviceStatusData.pbx.purchases,
        ...serviceStatusData.hcc.purchases,
        ...serviceStatusData.vbs.purchases,
      ]);
    } catch (error) {
      console.error('Failed to fetch partner data:', error);
    } finally {
      setLoading(false);
    }
  }, [partnerId, locale, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  /* ── Document helpers ── */
  const detectFileType = async (blob: Blob): Promise<string> => {
    const arr = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
    const h = arr.reduce((a, b) => a + b.toString(16).padStart(2, '0'), '');
    if (h.startsWith('89504e47')) return '.png';
    if (h.startsWith('ffd8ff')) return '.jpg';
    if (h.startsWith('25504446')) return '.pdf';
    return '.pdf';
  };

  const isImageExt = (ext: string) => ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext.toLowerCase());

  const openBlob = async (blob: Blob, documentName: string) => {
    const mime = blob.type;
    let ext = '.pdf';
    let isImg = false;
    if (mime?.startsWith('image/')) { isImg = true; ext = mime.includes('png') ? '.png' : '.jpg'; }
    else if (mime?.includes('pdf')) { ext = '.pdf'; }
    else { ext = await detectFileType(blob); isImg = isImageExt(ext); }

    const name = documentName.replace(/\.[^/.]+$/, '') + ext;
    const url = window.URL.createObjectURL(isImg ? blob : new Blob([blob], { type: 'application/pdf' }));

    if (isImg) setImageViewerData({ url, name });
    else if (ext === '.pdf') setPdfViewerData({ url, name });
    else { const a = document.createElement('a'); a.href = url; a.download = name; a.click(); window.URL.revokeObjectURL(url); }
  };

  const fetchDoc = async (documentType: string) => {
    const authToken = localStorage.getItem('authToken');
    const res = await fetch(`${API_BASE_URL}${API_ENDPOINTS.partner.getPartnerDocument}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ partnerId, documentType }),
    });
    if (!res.ok) throw new Error('Failed to load document');
    return res.blob();
  };

  const viewDocument = async (documentType: string, documentName: string) => {
    try { setViewingDoc(documentType); await openBlob(await fetchDoc(documentType), documentName); }
    catch { toast.error('Failed to load document'); }
    finally { setViewingDoc(null); }
  };

  const downloadDocument = async (documentType: string, documentName: string) => {
    try {
      setDownloadingDoc(documentType);
      const blob = await fetchDoc(documentType);
      const ext = await detectFileType(blob);
      const name = documentName.replace(/\.[^/.]+$/, '') + ext;
      const a = document.createElement('a'); a.href = window.URL.createObjectURL(blob); a.download = name; a.click();
      window.URL.revokeObjectURL(a.href);
    } catch { toast.error('Failed to download'); }
    finally { setDownloadingDoc(null); }
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
      if (res.ok) setDocStatuses((p) => ({ ...p, [docType]: { status, rejectionReason: status === 'APPROVED' ? '' : rejectionReason } }));
    } catch { /* silent */ }
    finally { setUpdatingDocStatus(null); }
  };

  const availableDocumentsCount = documents.filter((d) => d.available).length;
  const activeServicesCount = [serviceStatus.pbx.active, serviceStatus.hcc.active, serviceStatus.vbs.active].filter(Boolean).length;

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users', count: users.length },
    { id: 'purchases', label: 'Purchases', count: purchases.length },
    { id: 'subscriptions', label: 'Services', count: activeServicesCount },
    { id: 'documents', label: 'Documents', count: availableDocumentsCount },
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner className="w-8 h-8 text-[#00A651]" />
    </div>
  );

  if (!partner) return (
    <div className="text-center py-16">
      <p className="text-gray-500">Partner not found.</p>
      <Link href={`/${locale}/admin/partners`} className="text-[#00A651] hover:underline text-sm mt-2 inline-block">Back to Partners</Link>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-gray-400">
        <Link href={`/${locale}/admin`} className="hover:text-[#00A651]">Dashboard</Link>
        <span>/</span>
        <Link href={`/${locale}/admin/partners`} className="hover:text-[#00A651]">Partners</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{partner.partnerName}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#00A651] rounded-lg flex items-center justify-center text-white text-lg font-bold">
            {partner.partnerName?.charAt(0).toUpperCase() || '?'}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{partner.partnerName}</h1>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
              <span>#{partner.idPartner}</span>
              <span className="px-1.5 py-0.5 rounded bg-green-50 text-[#00A651] font-medium">{getPartnerTypeLabel(partner.partnerType)}</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 font-medium">{getCustomerPrePaidLabel(partner.customerPrePaid)}</span>
            </div>
          </div>
        </div>
        <button onClick={fetchData} className={btn.secondary} title="Refresh">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-[#00A651] text-[#00A651]'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-green-50 text-[#00A651]' : 'bg-gray-100 text-gray-500'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg border border-gray-200">
        {activeTab === 'overview' && <OverviewTab partner={partner} onPartnerUpdate={(p) => setPartner(p)} />}
        {activeTab === 'users' && <UsersTab users={users} partnerId={partnerId} onRefresh={fetchData} />}
        {activeTab === 'purchases' && <PurchasesTab purchases={purchases} />}
        {activeTab === 'subscriptions' && <SubscriptionsTab subscriptions={subscriptions} serviceStatus={serviceStatus} partnerName={partner.partnerName || ''} />}
        {activeTab === 'documents' && (
          <DocumentsTab documents={documents} viewDocument={viewDocument} downloadDocument={downloadDocument}
            viewingDoc={viewingDoc} downloadingDoc={downloadingDoc} docStatuses={docStatuses}
            onUpdateStatus={updateDocStatus} updatingDocStatus={updatingDocStatus}
            partnerId={partnerId} onRefresh={fetchData} />
        )}
      </div>

      {/* Image Viewer Modal */}
      {imageViewerData && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => { window.URL.revokeObjectURL(imageViewerData.url); setImageViewerData(null); }}>
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <span className="text-sm font-medium text-gray-700">{imageViewerData.name}</span>
              <button onClick={() => { window.URL.revokeObjectURL(imageViewerData.url); setImageViewerData(null); }} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 overflow-auto max-h-[calc(90vh-60px)]">
              <img src={imageViewerData.url} alt={imageViewerData.name} className="max-w-full h-auto mx-auto" />
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {pdfViewerData && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => { window.URL.revokeObjectURL(pdfViewerData.url); setPdfViewerData(null); }}>
          <div className="relative w-full max-w-5xl h-[90vh] bg-white rounded-lg overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
              <span className="text-sm font-medium text-gray-700">{pdfViewerData.name}</span>
              <div className="flex items-center gap-2">
                <a href={pdfViewerData.url} download={pdfViewerData.name} className="text-xs text-[#00A651] hover:underline">Download</a>
                <button onClick={() => { window.URL.revokeObjectURL(pdfViewerData.url); setPdfViewerData(null); }} className="text-gray-400 hover:text-gray-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe src={pdfViewerData.url} title={pdfViewerData.name} className="w-full h-full border-0" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Overview Tab
   ═══════════════════════════════════════════════════════════════════ */
function OverviewTab({ partner, onPartnerUpdate }: { partner: Partner; onPartnerUpdate: (p: Partner) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partner>({ ...partner });

  const handleSave = async () => {
    try {
      setSaving(true);
      const authToken = localStorage.getItem('authToken');
      if (!authToken) return;
      await updatePartner(formData, authToken);
      onPartnerUpdate(formData);
      setIsEditing(false);
      toast.success('Partner updated');
    } catch { toast.error('Failed to update partner'); }
    finally { setSaving(false); }
  };

  const handleChange = (field: keyof Partner, value: string | number | null) => {
    setFormData((p) => ({ ...p, [field]: value }));
  };

  const fields: { label: string; field: keyof Partner; type?: 'select'; options?: { value: number; label: string }[] }[] = [
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
    { label: 'Payment Type', field: 'customerPrePaid', type: 'select', options: [{ value: 1, label: 'Prepaid' }, { value: 2, label: 'Postpaid' }] },
    { label: 'VAT Registration No', field: 'vatRegistrationNo' },
    { label: 'Invoice Address', field: 'invoiceAddress' },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-base font-semibold text-gray-900">Partner Information</h2>
        {!isEditing ? (
          <button onClick={() => setIsEditing(true)} className={`${btn.outline} text-[#00A651] border-[#00A651] hover:bg-green-50`}>Edit</button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => { setFormData({ ...partner }); setIsEditing(false); }} className={btn.secondary}>Cancel</button>
            <button onClick={handleSave} disabled={saving} className={btn.primary}>
              {saving ? <Spinner /> : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Read-only */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-x-8 gap-y-1 mb-4 pb-4 border-b border-gray-100">
        {[
          { label: 'Partner ID', value: partner.idPartner },
          { label: 'Partner Type', value: getPartnerTypeLabel(partner.partnerType) },
          { label: 'Registration Date', value: partner.date1 ? new Date(partner.date1).toLocaleDateString() : 'N/A' },
        ].map((item) => (
          <div key={item.label} className="py-2">
            <p className="text-xs text-gray-400 uppercase tracking-wide">{item.label}</p>
            <p className="text-sm text-gray-900 mt-0.5">{item.value}</p>
          </div>
        ))}
      </div>

      {/* Editable */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
        {fields.map((f) => (
          <div key={f.field} className="py-2">
            <p className="text-xs text-gray-400 uppercase tracking-wide">{f.label}</p>
            {isEditing ? (
              f.type === 'select' ? (
                <select value={(formData[f.field] as number) ?? ''} onChange={(e) => handleChange(f.field, Number(e.target.value))}
                  className="mt-1 w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-[#00A651] focus:border-[#00A651] outline-none">
                  {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <input type="text" value={(formData[f.field] as string) ?? ''} onChange={(e) => handleChange(f.field, e.target.value || null)}
                  className="mt-1 w-full px-3 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-[#00A651] focus:border-[#00A651] outline-none" />
              )
            ) : (
              <p className="text-sm text-gray-900 mt-0.5">
                {f.type === 'select' ? getCustomerPrePaidLabel(partner[f.field] as number) : (partner[f.field] as string) || <span className="text-gray-300">--</span>}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Users Tab
   ═══════════════════════════════════════════════════════════════════ */
interface UserFormData { firstName: string; lastName: string; email: string; password: string; phoneNo: string; userStatus: string; }
const EMPTY_USER: UserFormData = { firstName: '', lastName: '', email: '', password: '', phoneNo: '', userStatus: 'ACTIVE' };

function UsersTab({ users, partnerId, onRefresh }: { users: PartnerUser[]; partnerId: number; onRefresh: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<PartnerUser | null>(null);
  const [form, setForm] = useState<UserFormData>(EMPTY_USER);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const openAdd = () => { setEditingUser(null); setForm(EMPTY_USER); setShowForm(true); };
  const openEdit = (u: PartnerUser) => { setEditingUser(u); setForm({ firstName: u.firstName || '', lastName: u.lastName || '', email: u.email || '', password: '', phoneNo: u.phoneNo || '', userStatus: u.userStatus || 'ACTIVE' }); setShowForm(true); };
  const close = () => { setShowForm(false); setEditingUser(null); };

  const handleSave = async () => {
    if (!form.firstName || !form.email) { toast.error('First name and email are required'); return; }
    if (!editingUser && !form.password) { toast.error('Password is required'); return; }
    try {
      setSaving(true);
      const authToken = localStorage.getItem('authToken');
      if (!authToken) return;
      if (editingUser) {
        const payload: any = { id: editingUser.id, firstName: form.firstName, lastName: form.lastName, email: form.email, phoneNo: form.phoneNo, userStatus: form.userStatus, idPartner: partnerId };
        if (form.password) payload.password = form.password;
        await editUser(payload, authToken);
        toast.success('User updated');
      } else {
        await createUser({ ...form, partnerId } as CreateUserPayload, authToken);
        toast.success('User created');
      }
      close(); onRefresh();
    } catch { toast.error('Operation failed'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (u: PartnerUser) => {
    if (!confirm(`Delete ${u.firstName} ${u.lastName}?`)) return;
    try { setDeletingId(u.id); const t = localStorage.getItem('authToken'); if (t) { await deleteUser(u.id, t); toast.success('Deleted'); onRefresh(); } }
    catch { toast.error('Delete failed'); }
    finally { setDeletingId(null); }
  };

  const inputCls = 'w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-[#00A651] focus:border-[#00A651] outline-none';

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-900">Users</h2>
        {!showForm && <button onClick={openAdd} className={btn.primary}>+ Add User</button>}
      </div>

      {showForm && (
        <div className="mb-6 p-5 border border-gray-200 rounded-lg bg-gray-50/50">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">{editingUser ? 'Edit User' : 'New User'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className="text-xs text-gray-500">First Name *</label><input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} className={inputCls} /></div>
            <div><label className="text-xs text-gray-500">Last Name</label><input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} className={inputCls} /></div>
            <div><label className="text-xs text-gray-500">Email *</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputCls} /></div>
            <div><label className="text-xs text-gray-500">Password {editingUser ? '(optional)' : '*'}</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputCls} /></div>
            <div><label className="text-xs text-gray-500">Phone</label><input value={form.phoneNo} onChange={(e) => setForm({ ...form, phoneNo: e.target.value })} className={inputCls} /></div>
            <div><label className="text-xs text-gray-500">Status</label><select value={form.userStatus} onChange={(e) => setForm({ ...form, userStatus: e.target.value })} className={inputCls}><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleSave} disabled={saving} className={btn.primary}>{saving ? <Spinner /> : editingUser ? 'Save' : 'Create'}</button>
            <button onClick={close} className={btn.secondary}>Cancel</button>
          </div>
        </div>
      )}

      {users.length === 0 ? (
        <p className="text-center text-gray-400 py-12 text-sm">No users found</p>
      ) : (
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 text-xs text-gray-400 uppercase">
              <th className="text-left px-6 py-2 font-medium">User</th>
              <th className="text-left px-6 py-2 font-medium">Contact</th>
              <th className="text-left px-6 py-2 font-medium">Status</th>
              <th className="text-left px-6 py-2 font-medium">Roles</th>
              <th className="text-right px-6 py-2 font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                  <td className="px-6 py-3">
                    <p className="font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-gray-400">#{u.id}</p>
                  </td>
                  <td className="px-6 py-3">
                    <p className="text-gray-700">{u.email}</p>
                    <p className="text-xs text-gray-400">{u.phoneNo}</p>
                  </td>
                  <td className="px-6 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${u.userStatus === 'ACTIVE' ? 'bg-green-50 text-[#00A651]' : 'bg-red-50 text-red-600'}`}>{u.userStatus}</span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex flex-wrap gap-1">{u.authRoles?.map((r) => <span key={r.id} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded">{r.name.replace('ROLE_', '')}</span>)}</div>
                  </td>
                  <td className="px-6 py-3 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(u)} className="text-xs text-[#00A651] hover:underline mr-3">Edit</button>
                    <button onClick={() => handleDelete(u)} disabled={deletingId === u.id} className="text-xs text-red-500 hover:underline disabled:opacity-50">
                      {deletingId === u.id ? 'Deleting...' : 'Delete'}
                    </button>
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

/* ═══════════════════════════════════════════════════════════════════
   Purchases Tab
   ═══════════════════════════════════════════════════════════════════ */
function PurchasesTab({ purchases }: { purchases: PurchaseHistory[] }) {
  if (purchases.length === 0) return <p className="text-center text-gray-400 py-12 text-sm">No purchase history</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead><tr className="border-b border-gray-100 text-xs text-gray-400 uppercase">
          <th className="text-left px-6 py-2 font-medium">Package</th>
          <th className="text-left px-6 py-2 font-medium">Purchased</th>
          <th className="text-left px-6 py-2 font-medium">Expires</th>
          <th className="text-right px-6 py-2 font-medium">Price</th>
          <th className="text-right px-6 py-2 font-medium">Total</th>
          <th className="text-left px-6 py-2 font-medium">Status</th>
        </tr></thead>
        <tbody>
          {purchases.map((p) => (
            <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50/50">
              <td className="px-6 py-3 font-medium text-gray-900">{p.packageName || p.packageAccounts?.[0]?.name || 'N/A'}</td>
              <td className="px-6 py-3 text-gray-500">{p.purchaseDate ? new Date(p.purchaseDate).toLocaleDateString() : '--'}</td>
              <td className="px-6 py-3 text-gray-500">{p.expireDate ? new Date(p.expireDate).toLocaleDateString() : '--'}</td>
              <td className="px-6 py-3 text-right text-gray-700">৳{p.price?.toLocaleString() || 0}</td>
              <td className="px-6 py-3 text-right font-medium text-gray-900">৳{p.total?.toLocaleString() || 0}</td>
              <td className="px-6 py-3">
                <span className={`text-xs font-medium px-2 py-0.5 rounded ${p.status === 'ACTIVE' ? 'bg-green-50 text-[#00A651]' : p.status === 'EXPIRED' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-700'}`}>{p.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Services / Subscriptions Tab
   ═══════════════════════════════════════════════════════════════════ */
function SubscriptionsTab({ subscriptions, serviceStatus, partnerName }: { subscriptions: PurchaseHistory[]; serviceStatus: ServiceStatus; partnerName: string }) {
  const services = [
    { id: 'pbx' as const, name: 'Hosted PBX', url: 'https://hippbx.btcliptelephony.gov.bd:5174/' },
    { id: 'hcc' as const, name: 'Contact Center', url: `https://hcc.btcliptelephony.gov.bd/${partnerName?.toLowerCase().replace(/\s+/g, '_') || 'user'}/#/home` },
    { id: 'vbs' as const, name: 'Voice Broadcast', url: 'https://vbs.btcliptelephony.gov.bd/' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {services.map((s) => {
          const active = serviceStatus[s.id]?.active;
          return (
            <div key={s.id} className={`p-4 rounded-lg border ${active ? 'border-[#00A651]/30 bg-green-50/30' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className={`text-sm font-semibold ${active ? 'text-[#00A651]' : 'text-gray-400'}`}>{s.name}</p>
                  <p className={`text-xs mt-0.5 ${active ? 'text-gray-600' : 'text-gray-400'}`}>{active ? 'Active' : 'Not Active'}</p>
                </div>
                {active ? (
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#00A651] hover:underline">Open</a>
                ) : (
                  <span className="text-xs text-gray-300">--</span>
                )}
              </div>
              {active && serviceStatus[s.id].purchases.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200/50 flex flex-wrap gap-1">
                  {serviceStatus[s.id].purchases.slice(0, 3).map((p, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 bg-white rounded text-gray-600 border border-gray-100">{p.packageName || 'Package'}</span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {subscriptions.filter((s) => s.idPackage !== 9999).length > 0 && (
        <div className="overflow-x-auto border border-gray-100 rounded-lg">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-gray-100 text-xs text-gray-400 uppercase">
              <th className="text-left px-4 py-2 font-medium">Package</th>
              <th className="text-left px-4 py-2 font-medium">Start</th>
              <th className="text-left px-4 py-2 font-medium">Expires</th>
              <th className="text-right px-4 py-2 font-medium">Price</th>
              <th className="text-center px-4 py-2 font-medium">Status</th>
            </tr></thead>
            <tbody>{subscriptions.filter((s) => s.idPackage !== 9999).map((s) => (
              <tr key={s.id} className="border-b border-gray-50">
                <td className="px-4 py-2 font-medium text-gray-900">{s.packageName || s.packageAccounts?.[0]?.name || 'N/A'}</td>
                <td className="px-4 py-2 text-gray-500">{s.purchaseDate ? new Date(s.purchaseDate).toLocaleDateString() : '--'}</td>
                <td className="px-4 py-2 text-gray-500">{s.expireDate ? new Date(s.expireDate).toLocaleDateString() : '--'}</td>
                <td className="px-4 py-2 text-right text-gray-700">৳{s.price?.toLocaleString() || 0}</td>
                <td className="px-4 py-2 text-center"><span className={`text-xs px-2 py-0.5 rounded ${s.status === 'ACTIVE' ? 'bg-green-50 text-[#00A651]' : 'bg-red-50 text-red-600'}`}>{s.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Documents Tab
   ═══════════════════════════════════════════════════════════════════ */
const MAJOR_DOCS = new Set(['nidfront', 'nidback', 'tradelicense', 'tin']);

function DocumentsTab({
  documents, viewDocument, downloadDocument, viewingDoc, downloadingDoc,
  docStatuses, onUpdateStatus, updatingDocStatus, partnerId, onRefresh,
}: {
  documents: PartnerDocument[]; viewDocument: (t: string, n: string) => Promise<void>;
  downloadDocument: (t: string, n: string) => Promise<void>; viewingDoc: string | null;
  downloadingDoc: string | null; docStatuses: Record<string, { status: string; rejectionReason: string }>;
  onUpdateStatus: (t: string, s: string, r: string) => Promise<void>; updatingDocStatus: string | null;
  partnerId: number; onRefresh: () => void;
}) {
  const [rejectingDoc, setRejectingDoc] = useState<string | null>(null);
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});
  const [uploadingDoc, setUploadingDoc] = useState<string | null>(null);
  const [deletingDoc, setDeletingDoc] = useState<string | null>(null);

  const available = documents.filter((d) => d.available);
  const missing = documents.filter((d) => !d.available);

  const handleUpload = async (docType: string, file: File) => {
    try { setUploadingDoc(docType); const t = localStorage.getItem('authToken'); if (t) { await uploadPartnerDocument(partnerId, docType, file, t); toast.success('Uploaded'); onRefresh(); } }
    catch { toast.error('Upload failed'); }
    finally { setUploadingDoc(null); }
  };

  const handleDeleteDoc = async (docType: string, docName: string) => {
    if (!confirm(`Delete "${docName}"?`)) return;
    try { setDeletingDoc(docType); const t = localStorage.getItem('authToken'); if (t) { await deletePartnerDocument(partnerId, docType, t); toast.success('Deleted'); onRefresh(); } }
    catch { toast.error('Delete failed'); }
    finally { setDeletingDoc(null); }
  };

  const statusColor = (s: string) => s === 'APPROVED' ? 'bg-green-50 text-[#00A651]' : s === 'REJECTED' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-700';

  return (
    <div className="p-6 space-y-6">
      {/* Uploaded Documents */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Uploaded ({available.length})</h3>
        {available.length === 0 ? (
          <p className="text-sm text-gray-400">No documents uploaded</p>
        ) : (
          <div className="space-y-3">
            {available.map((doc) => {
              const status = docStatuses[doc.type]?.status || 'PENDING';
              const reason = docStatuses[doc.type]?.rejectionReason || '';
              const isUpdating = updatingDocStatus === doc.type;
              const isRejecting = rejectingDoc === doc.type;

              return (
                <div key={doc.type} className="flex items-start gap-4 p-4 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                      {MAJOR_DOCS.has(doc.type) && <span className="text-[10px] font-bold uppercase tracking-wide text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">Required</span>}
                      <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${statusColor(status)}`}>{status}</span>
                    </div>
                    {status === 'REJECTED' && reason && !isRejecting && (
                      <p className="text-xs text-red-500 mt-1">Rejected: {reason}</p>
                    )}

                    {/* Reject form */}
                    {isRejecting && (
                      <div className="mt-2 flex gap-2 items-start">
                        <input type="text" placeholder="Rejection reason..." value={rejectionReasons[doc.type] || ''} onChange={(e) => setRejectionReasons((p) => ({ ...p, [doc.type]: e.target.value }))}
                          className="flex-1 px-3 py-1.5 text-xs border border-gray-200 rounded-md outline-none focus:border-red-300" />
                        <button onClick={async () => { await onUpdateStatus(doc.type, 'REJECTED', rejectionReasons[doc.type] || ''); setRejectingDoc(null); }} disabled={isUpdating}
                          className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 disabled:opacity-50">Confirm</button>
                        <button onClick={() => setRejectingDoc(null)} className="text-xs px-3 py-1.5 text-gray-500 hover:text-gray-700">Cancel</button>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 text-xs shrink-0">
                    <button onClick={() => viewDocument(doc.type, doc.name)} disabled={viewingDoc === doc.type} className="text-[#00A651] hover:underline disabled:opacity-50">
                      {viewingDoc === doc.type ? 'Loading...' : 'View'}
                    </button>
                    <button onClick={() => downloadDocument(doc.type, doc.name)} disabled={downloadingDoc === doc.type} className="text-gray-500 hover:underline disabled:opacity-50">
                      {downloadingDoc === doc.type ? '...' : 'Download'}
                    </button>
                    <label className={`text-amber-600 hover:underline cursor-pointer ${uploadingDoc === doc.type ? 'opacity-50 pointer-events-none' : ''}`}>
                      <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(doc.type, f); e.target.value = ''; }} />
                      {uploadingDoc === doc.type ? 'Uploading...' : 'Replace'}
                    </label>
                    <button onClick={() => handleDeleteDoc(doc.type, doc.name)} disabled={deletingDoc === doc.type} className="text-red-500 hover:underline disabled:opacity-50">
                      {deletingDoc === doc.type ? '...' : 'Delete'}
                    </button>
                    <span className="text-gray-200">|</span>
                    {!isRejecting && (
                      <>
                        <button onClick={async () => { setRejectingDoc(null); await onUpdateStatus(doc.type, 'APPROVED', ''); }} disabled={isUpdating || status === 'APPROVED'} className="text-blue-600 hover:underline disabled:opacity-30">Approve</button>
                        <button onClick={() => setRejectingDoc(doc.type)} disabled={isUpdating || status === 'REJECTED'} className="text-red-500 hover:underline disabled:opacity-30">Reject</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Missing Documents */}
      {missing.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Missing ({missing.length})</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {missing.map((doc) => (
              <div key={doc.type} className="flex items-center justify-between p-3 border border-dashed border-gray-200 rounded-lg">
                <span className="text-sm text-gray-400">{doc.name}</span>
                <label className={`text-xs text-[#00A651] hover:underline cursor-pointer ${uploadingDoc === doc.type ? 'opacity-50 pointer-events-none' : ''}`}>
                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(doc.type, f); e.target.value = ''; }} />
                  {uploadingDoc === doc.type ? 'Uploading...' : 'Upload'}
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
