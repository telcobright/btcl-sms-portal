import { NextRequest, NextResponse } from 'next/server';

interface ContactFormData {
  name: string;
  company?: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const SUBJECT_LABELS: Record<string, string> = {
  sales: 'Sales Inquiry',
  support: 'Technical Support',
  billing: 'Billing Question',
  partnership: 'Partnership',
  other: 'Other',
};

const EMAIL_API_URL = 'https://services.btcliptelephony.gov.bd/FREESWITCHREST/api/v1/email/send';

export async function POST(request: NextRequest) {
  try {
    const body: ContactFormData = await request.json();
    const { name, company, email, phone, subject, message } = body;

    if (!name || !email || !phone || !subject || !message) {
      return NextResponse.json(
        { error: 'All required fields must be filled' },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    const subjectLabel = SUBJECT_LABELS[subject] || subject;

    const htmlBody = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #0D529E, #1F3C71); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Alaap Cloud - New Contact Message</h1>
    <p style="color: rgba(255,255,255,0.8); margin: 5px 0 0;">BTCL Bulk SMS Service</p>
  </div>
  <div style="background: #f8f9fa; padding: 30px; border: 1px solid #e9ecef;">
    <h2 style="color: #0D529E; margin-top: 0;">Message Details</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #dee2e6; font-weight: bold; width: 140px; color: #495057;">Name:</td>
        <td style="padding: 10px; border-bottom: 1px solid #dee2e6; color: #212529;">${escapeHtml(name)}</td>
      </tr>
      ${company ? `<tr>
        <td style="padding: 10px; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Company:</td>
        <td style="padding: 10px; border-bottom: 1px solid #dee2e6; color: #212529;">${escapeHtml(company)}</td>
      </tr>` : ''}
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Email:</td>
        <td style="padding: 10px; border-bottom: 1px solid #dee2e6; color: #212529;">${escapeHtml(email)}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Phone:</td>
        <td style="padding: 10px; border-bottom: 1px solid #dee2e6; color: #212529;">${escapeHtml(phone)}</td>
      </tr>
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #dee2e6; font-weight: bold; color: #495057;">Subject:</td>
        <td style="padding: 10px; border-bottom: 1px solid #dee2e6; color: #212529;">${escapeHtml(subjectLabel)}</td>
      </tr>
    </table>
    <div style="margin-top: 20px; padding: 20px; background: white; border-radius: 8px; border-left: 4px solid #0D529E;">
      <h3 style="color: #0D529E; margin-top: 0;">Message:</h3>
      <p style="color: #212529; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(message)}</p>
    </div>
  </div>
  <div style="background: #1F3C71; padding: 20px; border-radius: 0 0 10px 10px; text-align: center;">
    <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 12px;">
      Reply to: ${escapeHtml(email)} | Phone: ${escapeHtml(phone)}
    </p>
  </div>
</div>`;

    const emailPayload = {
      to: 'alaapcloud@btcl.gov.bd',
      subject: `[Alaap Cloud Contact] ${subjectLabel} - ${name}`,
      body: htmlBody,
      isHtml: true,
    };

    const authHeader = request.headers.get('Authorization') || '';

    const response = await fetch(EMAIL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
      },
      body: JSON.stringify(emailPayload),
    });

    if (!response.ok) {
      console.error('Email API error:', response.status, await response.text());
      return NextResponse.json(
        { error: 'Failed to send message. Please try again later.' },
        { status: 500 }
      );
    }

    const result = await response.json();

    if (!result.success) {
      return NextResponse.json(
        { error: 'Failed to send message. Please try again later.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'Failed to send message. Please try again later.' },
      { status: 500 }
    );
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
