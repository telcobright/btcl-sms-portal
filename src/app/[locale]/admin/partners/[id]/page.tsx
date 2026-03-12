'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getPartnerById,
  getUsersByPartner,
  getPurchasesByPartner,
  getSubscriptionsByPartner,
  getDocumentsByPartner,
  getPartnerTypeLabel,
  getCustomerPrePaidLabel,
  Partner,
  PartnerUser,
  PurchaseHistory,
  PartnerDocument,
} from '@/lib/api-client/admin';

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

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        router.push(`/${locale}/login`);
        return;
      }

      // Fetch all data in parallel
      const [partnerData, usersData, purchasesData, subscriptionsData, documentsData] =
        await Promise.all([
          getPartnerById(partnerId, authToken),
          getUsersByPartner(partnerId, authToken),
          getPurchasesByPartner(partnerId, authToken),
          getSubscriptionsByPartner(partnerId, authToken),
          getDocumentsByPartner(partnerId, authToken),
        ]);

      setPartner(partnerData);
      // Ensure all arrays are actually arrays
      setUsers(Array.isArray(usersData) ? usersData : []);
      setPurchases(Array.isArray(purchasesData) ? purchasesData : []);
      setSubscriptions(Array.isArray(subscriptionsData) ? subscriptionsData : []);
      setDocuments(Array.isArray(documentsData) ? documentsData : []);
    } catch (error) {
      console.error('Failed to fetch partner data:', error);
    } finally {
      setLoading(false);
    }
  }, [partnerId, locale, router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const tabs: { id: TabType; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'users', label: 'Users', count: users.length },
    { id: 'purchases', label: 'Purchases', count: purchases.length },
    { id: 'subscriptions', label: 'Subscriptions', count: subscriptions.length },
    { id: 'documents', label: 'Documents', count: documents.length },
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
        {activeTab === 'overview' && <OverviewTab partner={partner} />}
        {activeTab === 'users' && <UsersTab users={users} />}
        {activeTab === 'purchases' && <PurchasesTab purchases={purchases} />}
        {activeTab === 'subscriptions' && <SubscriptionsTab subscriptions={subscriptions} />}
        {activeTab === 'documents' && <DocumentsTab documents={documents} />}
      </div>
    </div>
  );
}

// Overview Tab Component
function OverviewTab({ partner }: { partner: Partner }) {
  const infoItems = [
    { label: 'Partner ID', value: partner.idPartner },
    { label: 'Partner Name', value: partner.partnerName },
    { label: 'Alternate Name (Invoice)', value: partner.alternateNameInvoice },
    { label: 'Email', value: partner.email },
    { label: 'Telephone', value: partner.telephone },
    { label: 'Address', value: [partner.address1, partner.address2].filter(Boolean).join(', ') },
    { label: 'City', value: partner.city },
    { label: 'State', value: partner.state },
    { label: 'Postal Code', value: partner.postalCode },
    { label: 'Country', value: partner.country },
    { label: 'Partner Type', value: getPartnerTypeLabel(partner.partnerType) },
    { label: 'Payment Type', value: getCustomerPrePaidLabel(partner.customerPrePaid) },
    { label: 'VAT Registration No', value: partner.vatRegistrationNo },
    { label: 'Invoice Address', value: partner.invoiceAddress },
    { label: 'Registration Date', value: partner.date1 ? new Date(partner.date1).toLocaleDateString() : null },
  ];

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Partner Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {infoItems.map((item) => (
          <div key={item.label} className="py-3 border-b border-gray-100">
            <p className="text-sm text-gray-500">{item.label}</p>
            <p className="text-sm font-medium text-gray-900 mt-1">
              {item.value || <span className="text-gray-400">N/A</span>}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Users Tab Component
function UsersTab({ users }: { users: PartnerUser[] }) {
  if (users.length === 0) {
    return (
      <div className="p-12 text-center">
        <svg className="w-12 h-12 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <p className="text-gray-500 mt-4">No users found for this partner</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roles</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
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
            </tr>
          ))}
        </tbody>
      </table>
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
                <p className="text-sm font-medium text-gray-900">{purchase.packageName}</p>
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
function SubscriptionsTab({ subscriptions }: { subscriptions: PurchaseHistory[] }) {
  if (subscriptions.length === 0) {
    return (
      <div className="p-12 text-center">
        <svg className="w-12 h-12 text-gray-300 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
        <p className="text-gray-500 mt-4">No active subscriptions found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Package</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Expire Date</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Auto Renewal</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {subscriptions.map((sub) => (
            <tr key={sub.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <p className="text-sm font-medium text-gray-900">{sub.packageName}</p>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {sub.purchaseDate ? new Date(sub.purchaseDate).toLocaleDateString() : 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {sub.expireDate ? new Date(sub.expireDate).toLocaleDateString() : 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    sub.autoRenewalStatus ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {sub.autoRenewalStatus ? 'Enabled' : 'Disabled'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
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
  );
}

// Documents Tab Component
function DocumentsTab({ documents }: { documents: PartnerDocument[] }) {
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableDocs.map((doc) => (
              <div
                key={doc.type}
                className="border border-green-200 bg-green-50 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getDocTypeIcon(doc.type)}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                  </div>
                  <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                    Uploaded
                  </span>
                </div>
              </div>
            ))}
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
                className="border border-gray-200 bg-gray-50 rounded-lg p-4 opacity-60"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl grayscale">{getDocTypeIcon(doc.type)}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600">{doc.name}</p>
                  </div>
                  <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-gray-200 text-gray-600">
                    Not Uploaded
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
