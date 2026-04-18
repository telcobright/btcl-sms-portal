'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { jwtDecode } from 'jwt-decode'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { API_BASE_URL, API_ENDPOINTS } from '@/config/api'
import { getAuthToken } from '@/lib/api-client/auth'

// ─── types ────────────────────────────────────────────────────────────────────

interface DecodedToken {
    sub?: string
    email?: string
    idPartner?: number
    roles?: { name: string }[]
    [key: string]: any
}

type SecurityStep = 'form' | 'otp'

// ─── helpers ──────────────────────────────────────────────────────────────────

function getEmailFromToken(): string {
    try {
        const token = getAuthToken()
        if (!token) return ''
        const decoded = jwtDecode<DecodedToken>(token)
        return decoded.sub || decoded.email || ''
    } catch {
        return ''
    }
}

function getUserInfo() {
    if (typeof window === 'undefined') return { firstName: '', lastName: '', email: '', partnerId: '' }
    return {
        firstName: localStorage.getItem('firstName') || '',
        lastName:  localStorage.getItem('lastName')  || '',
        email:     getEmailFromToken(),
        partnerId: localStorage.getItem('partnerId') || '',
    }
}

function getInitials(firstName: string, lastName: string, email: string): string {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase()
    if (firstName) return firstName[0].toUpperCase()
    if (email) return email[0].toUpperCase()
    return 'U'
}

// ─── icon helpers (inline SVG to avoid extra deps) ────────────────────────────

const LockIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
)
const EyeIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
)
const EyeOffIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
)
const CheckIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
)
const AlertIcon = () => (
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
)
const SpinnerIcon = () => (
    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
)
const MailIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
)

// ─── password field ───────────────────────────────────────────────────────────

function PasswordField({
    id, label, value, show, onChange, onToggle, placeholder
}: {
    id: string; label: string; value: string; show: boolean
    onChange: (v: string) => void; onToggle: () => void; placeholder?: string
}) {
    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
                {label}
            </label>
            <div className="relative">
                <input
                    id={id}
                    type={show ? 'text' : 'password'}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-btcl-primary focus:border-btcl-primary"
                />
                <button type="button" onClick={onToggle}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {show ? <EyeOffIcon /> : <EyeIcon />}
                </button>
            </div>
        </div>
    )
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
    const params = useParams()
    const locale = params.locale as string

    const [userInfo, setUserInfo] = useState({ firstName: '', lastName: '', email: '', partnerId: '' })

    const [securityStep, setSecurityStep] = useState<SecurityStep>('form')
    const [newPassword, setNewPassword]       = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showNew, setShowNew]               = useState(false)
    const [showConfirm, setShowConfirm]       = useState(false)
    const [otp, setOtp]                       = useState('')
    const [isSendingOtp, setIsSendingOtp]     = useState(false)
    const [isChanging, setIsChanging]         = useState(false)
    const [resendCooldown, setResendCooldown] = useState(0)
    const [pwError, setPwError]               = useState('')
    const [pwSuccess, setPwSuccess]           = useState('')

    useEffect(() => { setUserInfo(getUserInfo()) }, [])

    const startCooldown = (seconds: number) => {
        setResendCooldown(seconds)
        const iv = setInterval(() => {
            setResendCooldown(p => { if (p <= 1) { clearInterval(iv); return 0 } return p - 1 })
        }, 1000)
    }

    const handleSendOtp = async () => {
        setPwError('')
        if (!newPassword)              { setPwError('Please enter a new password'); return }
        if (newPassword.length < 8)    { setPwError('Password must be at least 8 characters'); return }
        if (newPassword !== confirmPassword) { setPwError('Passwords do not match'); return }

        const email = getEmailFromToken()
        if (!email) { setPwError('Could not read your session. Please log in again.'); return }

        setIsSendingOtp(true)
        try {
            const { data } = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.sendResetOtp}`, { email })
            if (data.success) {
                setSecurityStep('otp')
                startCooldown(data.retryAfterSeconds || 60)
                toast.success('Verification code sent to your email')
            } else {
                setPwError(data.message || 'Failed to send verification code')
            }
        } catch (err: any) {
            setPwError(err.response?.data?.message || 'Failed to send verification code')
        } finally {
            setIsSendingOtp(false)
        }
    }

    const handleResendOtp = async () => {
        if (resendCooldown > 0) return
        const email = getEmailFromToken()
        if (!email) return
        setIsSendingOtp(true)
        try {
            const { data } = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.sendResetOtp}`, { email })
            startCooldown(data.retryAfterSeconds || 60)
            toast.success('New code sent')
        } catch { /* ignore */ }
        finally { setIsSendingOtp(false) }
    }

    const handleChangePassword = async () => {
        setPwError('')
        if (!otp.trim()) { setPwError('Please enter the verification code'); return }

        const email = getEmailFromToken()
        if (!email) { setPwError('Could not read your session. Please log in again.'); return }

        setIsChanging(true)
        try {
            const { data } = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.passwordReset}`, {
                email, otp: otp.trim(), newPassword,
            })
            if (data.success) {
                setPwSuccess('Password changed successfully!')
                setNewPassword(''); setConfirmPassword(''); setOtp('')
                setSecurityStep('form')
                toast.success('Password changed successfully!')
                setTimeout(() => setPwSuccess(''), 6000)
            } else {
                setPwError(data.message || 'Failed to change password')
            }
        } catch (err: any) {
            setPwError(err.response?.data?.message || 'Failed to change password')
        } finally {
            setIsChanging(false)
        }
    }

    const initials = getInitials(userInfo.firstName, userInfo.lastName, userInfo.email)
    const fullName = [userInfo.firstName, userInfo.lastName].filter(Boolean).join(' ') || 'My Account'

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">

                {/* ── Page title ── */}
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Manage your security preferences</p>
                    </div>
                    <Link href={`/${locale}/dashboard`}
                        className="text-sm text-gray-500 hover:text-btcl-primary transition-colors">
                        ← Dashboard
                    </Link>
                </div>

                {/* ── Profile banner ── */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-5 flex items-center gap-5">
                    <div className="w-16 h-16 rounded-full bg-btcl-primary flex items-center justify-center
                                    text-white text-2xl font-bold flex-shrink-0 shadow-sm">
                        {initials}
                    </div>
                    <div className="min-w-0">
                        <p className="text-lg font-semibold text-gray-900 truncate">{fullName}</p>
                        <p className="text-sm text-gray-500 truncate">{userInfo.email || '—'}</p>
                        {userInfo.partnerId && (
                            <span className="inline-block mt-1.5 px-2 py-0.5 bg-btcl-primary/10
                                             text-btcl-primary text-xs font-medium rounded-full">
                                Partner ID: {userInfo.partnerId}
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Security card ── */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">

                    {/* Card header */}
                    <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
                        <div className="w-8 h-8 rounded-lg bg-btcl-primary/10 flex items-center justify-center text-btcl-primary">
                            <LockIcon />
                        </div>
                        <div>
                            <p className="font-semibold text-gray-900 text-sm">Change Password</p>
                            <p className="text-xs text-gray-500">
                                {securityStep === 'form'
                                    ? 'Set a new password — we\'ll verify via a code sent to your email'
                                    : `Enter the 6-digit code sent to ${userInfo.email}`}
                            </p>
                        </div>
                    </div>

                    <div className="px-6 py-6">

                        {/* Alerts */}
                        {pwError && (
                            <div className="mb-5 flex items-start gap-2.5 p-3.5 bg-red-50 border border-red-200
                                            rounded-xl text-red-700 text-sm">
                                <AlertIcon />
                                <span>{pwError}</span>
                            </div>
                        )}
                        {pwSuccess && (
                            <div className="mb-5 flex items-start gap-2.5 p-3.5 bg-green-50 border border-green-200
                                            rounded-xl text-green-700 text-sm">
                                <CheckIcon />
                                <span>{pwSuccess}</span>
                            </div>
                        )}

                        {/* ── Step 1: password fields ── */}
                        {securityStep === 'form' && (
                            <div className="space-y-4">
                                <PasswordField
                                    id="newPassword" label="New Password"
                                    value={newPassword} show={showNew}
                                    onChange={v => { setNewPassword(v); setPwError('') }}
                                    onToggle={() => setShowNew(p => !p)}
                                    placeholder="At least 8 characters"
                                />
                                <PasswordField
                                    id="confirmPassword" label="Confirm New Password"
                                    value={confirmPassword} show={showConfirm}
                                    onChange={v => { setConfirmPassword(v); setPwError('') }}
                                    onToggle={() => setShowConfirm(p => !p)}
                                    placeholder="Repeat new password"
                                />

                                {/* strength hints */}
                                <div className="text-xs text-gray-400 bg-gray-50 rounded-lg px-4 py-3 space-y-1">
                                    <p className={`flex items-center gap-1.5 ${newPassword.length >= 8 ? 'text-green-600' : ''}`}>
                                        <span>{newPassword.length >= 8 ? '✓' : '·'}</span> At least 8 characters
                                    </p>
                                    <p className={`flex items-center gap-1.5 ${newPassword && newPassword === confirmPassword ? 'text-green-600' : ''}`}>
                                        <span>{newPassword && newPassword === confirmPassword ? '✓' : '·'}</span> Passwords match
                                    </p>
                                </div>

                                <p className="text-xs text-gray-500">
                                    After clicking below, a code will be sent to{' '}
                                    <span className="font-medium text-gray-700">{userInfo.email}</span>
                                </p>

                                <Button
                                    onClick={handleSendOtp}
                                    loading={isSendingOtp}
                                    disabled={isSendingOtp}
                                    className="w-full sm:w-auto flex items-center gap-2"
                                >
                                    {!isSendingOtp && <MailIcon />}
                                    Send Verification Code
                                </Button>
                            </div>
                        )}

                        {/* ── Step 2: OTP ── */}
                        {securityStep === 'otp' && (
                            <div className="space-y-5">
                                <div>
                                    <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Verification Code
                                    </label>
                                    <input
                                        id="otp"
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={otp}
                                        onChange={e => { setOtp(e.target.value.replace(/\D/g, '')); setPwError('') }}
                                        placeholder="000000"
                                        className="h-14 w-48 rounded-xl border border-gray-300 bg-white px-4
                                                   text-center text-2xl tracking-[0.4em] font-mono
                                                   focus:outline-none focus:ring-2 focus:ring-btcl-primary focus:border-btcl-primary"
                                    />
                                    <div className="mt-2">
                                        <button type="button" onClick={handleResendOtp}
                                            disabled={resendCooldown > 0 || isSendingOtp}
                                            className="text-sm text-btcl-primary hover:underline
                                                       disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed">
                                            {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-1">
                                    <Button onClick={handleChangePassword} loading={isChanging} disabled={isChanging}>
                                        {isChanging
                                            ? <><SpinnerIcon /> Updating...</>
                                            : 'Change Password'}
                                    </Button>
                                    <button type="button"
                                        onClick={() => { setSecurityStep('form'); setOtp(''); setPwError('') }}
                                        className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
                                        ← Back
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}
