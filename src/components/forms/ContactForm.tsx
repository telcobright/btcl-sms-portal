'use client';

import { useState, FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/Card';
import { ROOT_URL } from '@/config/api';

const FORM_SUBJECTS = [
  { key: 'sales', icon: '💼' },
  { key: 'support', icon: '🔧' },
  { key: 'billing', icon: '💰' },
  { key: 'partnership', icon: '🤝' },
  { key: 'other', icon: '📋' },
] as const;

const SUBJECT_TEXT: Record<string, { en: string; bn: string }> = {
  sales: { en: 'Sales Inquiry', bn: 'বিক্রয় অনুসন্ধান' },
  support: { en: 'Technical Support', bn: 'প্রযুক্তিগত সহায়তা' },
  billing: { en: 'Billing Question', bn: 'বিলিং প্রশ্ন' },
  partnership: { en: 'Partnership', bn: 'অংশীদারিত্ব' },
  other: { en: 'Other', bn: 'অন্যান্য' },
};

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function buildEmailHtml(name: string, company: string, email: string, phone: string, subject: string, message: string) {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;background:#f4f5f7;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#0D529E,#1F3C71);padding:32px 40px;text-align:center;">
  <img src="https://services.btcliptelephony.gov.bd/btcllogo.png" alt="BTCL" width="80" style="margin-bottom:12px;border-radius:8px;" />
  <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;">New Contact Message</h1>
  <p style="color:rgba(255,255,255,0.8);margin:6px 0 0;font-size:14px;">Alaap Cloud — BTCL Bulk SMS Service</p>
</td></tr>

<!-- Subject Badge -->
<tr><td style="padding:24px 40px 0;">
  <table cellpadding="0" cellspacing="0"><tr>
    <td style="background:#EBF3FE;color:#0D529E;font-size:13px;font-weight:600;padding:6px 16px;border-radius:20px;">
      ${esc(subject)}
    </td>
  </tr></table>
</td></tr>

<!-- Contact Details -->
<tr><td style="padding:20px 40px 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e9ecef;border-radius:8px;overflow:hidden;">
    <tr style="background:#f8f9fa;">
      <td style="padding:12px 16px;font-size:13px;color:#6c757d;font-weight:600;width:120px;border-bottom:1px solid #e9ecef;">Name</td>
      <td style="padding:12px 16px;font-size:14px;color:#212529;border-bottom:1px solid #e9ecef;">${esc(name)}</td>
    </tr>
    ${company ? `<tr>
      <td style="padding:12px 16px;font-size:13px;color:#6c757d;font-weight:600;border-bottom:1px solid #e9ecef;">Company</td>
      <td style="padding:12px 16px;font-size:14px;color:#212529;border-bottom:1px solid #e9ecef;">${esc(company)}</td>
    </tr>` : ''}
    <tr${company ? '' : ' style="background:#f8f9fa;"'}>
      <td style="padding:12px 16px;font-size:13px;color:#6c757d;font-weight:600;border-bottom:1px solid #e9ecef;">Email</td>
      <td style="padding:12px 16px;font-size:14px;border-bottom:1px solid #e9ecef;"><a href="mailto:${esc(email)}" style="color:#0D529E;text-decoration:none;">${esc(email)}</a></td>
    </tr>
    <tr${company ? ' style="background:#f8f9fa;"' : ''}>
      <td style="padding:12px 16px;font-size:13px;color:#6c757d;font-weight:600;">Phone</td>
      <td style="padding:12px 16px;font-size:14px;color:#212529;"><a href="tel:${esc(phone)}" style="color:#0D529E;text-decoration:none;">${esc(phone)}</a></td>
    </tr>
  </table>
</td></tr>

<!-- Message -->
<tr><td style="padding:20px 40px;">
  <p style="font-size:13px;color:#6c757d;font-weight:600;margin:0 0 8px;">Message</p>
  <div style="background:#f8f9fa;border-left:4px solid #0D529E;border-radius:0 8px 8px 0;padding:16px 20px;">
    <p style="margin:0;font-size:14px;color:#212529;line-height:1.7;white-space:pre-wrap;">${esc(message)}</p>
  </div>
</td></tr>

<!-- Reply Button -->
<tr><td style="padding:0 40px 28px;" align="center">
  <a href="mailto:${esc(email)}?subject=Re: ${esc(subject)}" style="display:inline-block;background:#0D529E;color:#ffffff;font-size:14px;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;">
    Reply to ${esc(name)}
  </a>
</td></tr>

<!-- Footer -->
<tr><td style="background:#1F3C71;padding:20px 40px;text-align:center;">
  <p style="color:rgba(255,255,255,0.6);margin:0;font-size:12px;">This message was sent from the contact form at <a href="https://services.btcliptelephony.gov.bd" style="color:rgba(255,255,255,0.8);text-decoration:none;">alaapcloud.btcl.gov.bd</a></p>
  <p style="color:rgba(255,255,255,0.4);margin:8px 0 0;font-size:11px;">Bangladesh Telecommunications Company Limited</p>
</td></tr>

</table>
</td></tr>
</table>
</body></html>`;
}

interface ContactFormProps {
  locale: string;
}

export function ContactForm({ locale }: ContactFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const t = (en: string, bn: string) => (locale === 'en' ? en : bn);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone || !formData.subject || !formData.message) {
      setStatus('error');
      setErrorMsg(t('Please fill in all required fields.', 'অনুগ্রহ করে সকল প্রয়োজনীয় ক্ষেত্র পূরণ করুন।'));
      return;
    }

    setSending(true);
    setStatus('idle');
    setErrorMsg('');

    try {
      const subjectLabel = SUBJECT_TEXT[formData.subject]?.en || formData.subject;

      const res = await fetch(`${ROOT_URL}/FREESWITCHREST/api/v1/email/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: 'alaapcloud@btcl.gov.bd',
          subject: `[Alaap Cloud Contact] ${subjectLabel} - ${formData.name}`,
          body: buildEmailHtml(formData.name, formData.company, formData.email, formData.phone, subjectLabel, formData.message),
          isHtml: true,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('success');
        setFormData({ name: '', company: '', email: '', phone: '', subject: '', message: '' });
      } else {
        setStatus('error');
        setErrorMsg(t('Failed to send message. Please try again later.', 'বার্তা পাঠাতে ব্যর্থ। পরে আবার চেষ্টা করুন।'));
      }
    } catch {
      setStatus('error');
      setErrorMsg(t('Network error. Please try again.', 'নেটওয়ার্ক ত্রুটি। আবার চেষ্টা করুন।'));
    } finally {
      setSending(false);
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader className="pb-6">
        <div className="mb-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-btcl-primaryLight/20 px-4 py-2 text-sm font-semibold text-btcl-primaryDark">
            <span className="h-2 w-2 rounded-full bg-btcl-primary" />
            {t('Get in Touch', 'যোগাযোগ করুন')}
          </span>
        </div>
        <CardTitle className="text-3xl">
          {t('Send us a Message', 'আমাদের একটি বার্তা পাঠান')}
        </CardTitle>
        <CardDescription className="text-lg">
          {t(
            "Fill out the form below and we'll get back to you as soon as possible.",
            'নিচের ফর্মটি পূরণ করুন এবং আমরা যত তাড়াতাড়ি সম্ভব আপনার কাছে ফিরে আসব।'
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status === 'success' && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-green-800">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="font-semibold">
                {t('Message sent successfully!', 'বার্তা সফলভাবে পাঠানো হয়েছে!')}
              </span>
            </div>
            <p className="mt-1 text-sm">
              {t("We'll get back to you at your email address shortly.", 'আমরা শীঘ্রই আপনার ইমেইলে যোগাযোগ করব।')}
            </p>
          </div>
        )}

        {status === 'error' && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span className="font-semibold">{errorMsg}</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t('Full Name', 'পূর্ণ নাম')} *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-btcl-primary focus:outline-none focus:ring-2 focus:ring-btcl-primary/20"
                placeholder={t('Enter your full name', 'আপনার পূর্ণ নাম লিখুন')}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t('Company', 'কোম্পানি')}
              </label>
              <input
                type="text"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-btcl-primary focus:outline-none focus:ring-2 focus:ring-btcl-primary/20"
                placeholder={t('Company name (optional)', 'কোম্পানির নাম (ঐচ্ছিক)')}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t('Email Address', 'ইমেইল ঠিকানা')} *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-btcl-primary focus:outline-none focus:ring-2 focus:ring-btcl-primary/20"
                placeholder="your@email.com"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                {t('Mobile Number', 'মোবাইল নম্বর')} *
              </label>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-btcl-primary focus:outline-none focus:ring-2 focus:ring-btcl-primary/20"
                placeholder="+880-1XXXXXXXXX"
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {t('Subject', 'বিষয়')} *
            </label>
            <select
              required
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-btcl-primary focus:outline-none focus:ring-2 focus:ring-btcl-primary/20"
            >
              <option value="">
                {t('Select a subject', 'একটি বিষয় নির্বাচন করুন')}
              </option>
              {FORM_SUBJECTS.map((subject) => (
                <option key={subject.key} value={subject.key}>
                  {subject.icon} {SUBJECT_TEXT[subject.key]?.[locale as 'en' | 'bn'] ?? ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              {t('Message', 'বার্তা')} *
            </label>
            <textarea
              required
              rows={6}
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-btcl-primary focus:outline-none focus:ring-2 focus:ring-btcl-primary/20"
              placeholder={t('Tell us how we can help you...', 'আমরা আপনাকে কীভাবে সাহায্য করতে পারি তা বলুন...')}
            />
          </div>

          <Button
            type="submit"
            disabled={sending}
            className="w-full transform rounded-xl bg-gradient-to-r from-btcl-primary to-btcl-primary py-4 text-lg font-semibold transition-all duration-300 hover:scale-105 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
          >
            {sending ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t('Sending...', 'পাঠানো হচ্ছে...')}
              </span>
            ) : (
              t('Send Message', 'বার্তা পাঠান')
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
