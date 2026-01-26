'use client';

import { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import { API_ENDPOINTS, buildApiUrl } from '@/config/api';

interface DecodedToken {
  idPartner: number;
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
  state: string | null;
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

export default function CheckoutForm({
  formData,
  onFormChange,
  selectedPayment,
  onSelectPayment,
  customerPrePaid,
}: {
  formData: {
    fullName: string;
    phone: string;
    email: string;
    city: string;
    streetAddress: string;
    zipCode: string;
  };
  onFormChange: (data: any) => void;
  selectedPayment: string | null;
  onSelectPayment: (method: string) => void;
  customerPrePaid: number | null;
}) {
  const [loading, setLoading] = useState(true);
  const [dataFetched, setDataFetched] = useState(false);
  // Only show SSLcommerz when customerPrePaid is 1
  const paymentMethods = ['SSLcommerz'];

  // Fetch partner data on component mount
  useEffect(() => {
    if (dataFetched) return; // Prevent multiple API calls

    const fetchPartnerData = async () => {
      try {
        setLoading(true);
        const authToken = localStorage.getItem('authToken');

        if (!authToken) {
          console.error('No auth token found');
          setLoading(false);
          return;
        }

        const decodedToken = jwtDecode<DecodedToken>(authToken);
        const idPartner = decodedToken?.idPartner;

        if (!idPartner) {
          console.error('Partner ID not found in token');
          setLoading(false);
          return;
        }

        const response = await fetch(buildApiUrl(API_ENDPOINTS.partner.getPartner), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify({ idPartner }),
        });

        if (!response.ok) {
          throw new Error('Failed to fetch partner data');
        }

        const data: PartnerData = await response.json();

        // Auto-fill form with partner data
        onFormChange({
          fullName: data.partnerName,
          phone: data.telephone,
          email: data.email,
          city: data.city,
          streetAddress: data.address1,
          zipCode: data.postalCode,
        });

        setDataFetched(true);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching partner data:', error);
        setLoading(false);
      }
    };

    fetchPartnerData();
  }, [dataFetched, onFormChange]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    onFormChange({ ...formData, [name]: value });
  };

  if (loading) {
    return (
      <div className="space-y-8 text-btcl-gray-800">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-10 bg-gray-200 rounded"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form className="space-y-8 text-btcl-gray-800" onSubmit={(e) => e.preventDefault()}>
      {/* Contact Information */}
      <fieldset className="space-y-4">
        <legend className="block text-lg font-semibold text-btcl-primary">
          1. Contact Information
        </legend>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          <input
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            placeholder="Full Name"
            readOnly
            className="border border-btcl-gray-300 rounded-md px-4 py-2 text-btcl-gray-700 bg-gray-50 cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-btcl-primary col-span-2"
          />
          <input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone"
            readOnly
            className="border border-btcl-gray-300 rounded-md px-4 py-2 text-btcl-gray-700 bg-gray-50 cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-btcl-primary"
          />
          <input
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            readOnly
            className="border border-btcl-gray-300 rounded-md px-4 py-2 text-btcl-gray-700 bg-gray-50 cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-btcl-primary"
          />
        </div>
      </fieldset>

      {/* Address */}
      <fieldset className="space-y-4">
        <legend className="block text-lg font-semibold text-btcl-primary">2. Address</legend>
        <div className="space-y-4 mt-2">
          <input
            name="streetAddress"
            value={formData.streetAddress}
            onChange={handleChange}
            placeholder="Street Address"
            readOnly
            className="w-full border border-btcl-gray-300 rounded-md px-4 py-2 text-btcl-gray-700 bg-gray-50 cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-btcl-primary"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              name="city"
              value={formData.city}
              onChange={handleChange}
              placeholder="City"
              readOnly
              className="border border-btcl-gray-300 rounded-md px-4 py-2 text-btcl-gray-700 bg-gray-50 cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-btcl-primary"
            />
            <input
              name="zipCode"
              value={formData.zipCode}
              onChange={handleChange}
              placeholder="ZIP Code"
              readOnly
              className="border border-btcl-gray-300 rounded-md px-4 py-2 text-btcl-gray-700 bg-gray-50 cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-btcl-primary"
            />
          </div>
        </div>
      </fieldset>

      {/* Payment Methods - Only show if customerPrePaid is 1 (payment gateway required) */}
      {customerPrePaid === 1 && (
        <fieldset className="space-y-4">
          <legend className="block text-lg font-semibold text-btcl-primary">3. Payment method</legend>
          <div className="grid grid-cols-2 gap-4 mt-2">
            {paymentMethods.map((method) => {
              const isSelected = selectedPayment === method;
              return (
                <button
                  key={method}
                  type="button"
                  onClick={() => onSelectPayment(method)}
                  className={`
                    rounded-md py-2 text-center font-semibold
                    transition-colors duration-300
                    border
                    ${
                      isSelected
                        ? 'bg-btcl-primary border-btcl-primary text-white'
                        : 'bg-white border-btcl-gray-300 text-btcl-gray-700 hover:bg-btcl-primary hover:text-white'
                    }
                  `}
                  aria-pressed={isSelected}
                  aria-label={method}
                >
                  {method}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* Direct Purchase Notice - Show if customerPrePaid is 2 */}
      {customerPrePaid === 2 && (
        <fieldset className="space-y-4">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-green-800 font-medium">Postpaid Account</span>
            </div>
            <p className="text-green-700 text-sm mt-2">
              Your account is set up for postpaid billing. No payment required at checkout.
            </p>
          </div>
        </fieldset>
      )}
    </form>
  );
}
