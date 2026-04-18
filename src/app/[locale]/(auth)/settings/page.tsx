'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { jwtDecode } from 'jwt-decode'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { API_BASE_URL, API_ENDPOINTS } from '@/config/api'
import { getAuthToken } from '@/lib/api-client/auth'

// ─── types ────────────────────────────────────────────────────────────────────

interface DecodedToken {
    sub?: string      // email
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
    const firstName = typeof window !== 'undefined' ? localStorage.getItem('firstName') || '' : ''
    const lastName  = typeof window !== 'undefined' ? localStorage.getItem('lastName')  || '' : ''
    const email     = getEmailFromToken()
    const partnerId = typeof window !== 'undefined' ? localStorage.getItem('partnerId') || '' : ''
    return { firstName, lastName, email, partnerId }
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
    const params   = useParams()
    const locale   = params.locale as string

    // profile info (display only)
    const [userInfo, setUserInfo] = useState({ firstName: '', lastName: '', email: '', partnerId: '' })

    // security step
    const [securityStep, setSecurityStep]       = useState<SecurityStep>('form')
    const [newPassword, setNewPassword]         = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showNew, setShowNew]                 = useState(false)
    const [showConfirm, setShowConfirm]         = useState(false)
    const [otp, setOtp]                         = useState('')
    const [isSendingOtp, setIsSendingOtp]       = useState(false)
    const [isChanging, setIsChanging]           = useState(false)
    const [resendCooldown, setResendCooldown]   = useState(0)
    const [pwError, setPwError]                 = useState('')
    const [pwSuccess, setPwSuccess]             = useState('')

    useEffect(() => {
        setUserInfo(getUserInfo())
    }, [])

    // ── cooldown timer ────────────────────────────────────────────────────────
    const startCooldown = (seconds: number) => {
        setResendCooldown(seconds)
        const interval = setInterval(() => {
            setResendCooldown(prev => {
                if (prev <= 1) { clearInterval(interval); return 0 }
                return prev - 1
            })
        }, 1000)
    }

    // ── Step 1: validate fields then send OTP ─────────────────────────────────
    const handleSendOtp = async () => {
        setPwError('')

        if (!newPassword) { setPwError('Please enter a new password'); return }
        if (newPassword.length < 8) { setPwError('Password must be at least 8 characters'); return }
        if (newPassword !== confirmPassword) { setPwError('Passwords do not match'); return }

        const email = getEmailFromToken()
        if (!email) { setPwError('Could not read your email from session. Please log in again.'); return }

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

    // ── Resend OTP ────────────────────────────────────────────────────────────
    const handleResendOtp = async () => {
        if (resendCooldown > 0) return
        const email = getEmailFromToken()
        if (!email) return
        setIsSendingOtp(true)
        try {
            const { data } = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.sendResetOtp}`, { email })
            startCooldown(data.retryAfterSeconds || 60)
            toast.success('New code sent')
        } catch {
            // silently ignore
        } finally {
            setIsSendingOtp(false)
        }
    }

    // ── Step 2: verify OTP + update password ─────────────────────────────────
    const handleChangePassword = async () => {
        setPwError('')
        if (!otp.trim()) { setPwError('Please enter the verification code'); return }

        const email = getEmailFromToken()
        if (!email) { setPwError('Could not read your email from session. Please log in again.'); return }

        setIsChanging(true)
        try {
            const { data } = await axios.post(`${API_BASE_URL}${API_ENDPOINTS.passwordReset}`, {
                email,
                otp: otp.trim(),
                newPassword,
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

    const resetForm = () => {
        setSecurityStep('form')
        setOtp('')
        setPwError('')
    }

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />

            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

                {/* Page heading */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
                    <p className="text-gray-500 mt-1">Manage your profile and security preferences</p>
                </div>

                {/* ── Profile card (read-only) ── */}
                <Card className="mb-6">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            {/* Avatar */}
                            <div className="w-14 h-14 rounded-full bg-btcl-primary flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
                                {userInfo.firstName
                                    ? userInfo.firstName[0].toUpperCase()
                                    : userInfo.email?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div>
                                <CardTitle>
                                    {userInfo.firstName || userInfo.lastName
                                        ? `${userInfo.firstName} ${userInfo.lastName}`.trim()
                                        : 'My Account'}
                                </CardTitle>
                                <CardDescription>{userInfo.email || '—'}</CardDescription>
                                {userInfo.partnerId && (
                                    <p className="text-xs text-gray-400 mt-0.5">Partner ID: {userInfo.partnerId}</p>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                </Card>

                {/* ── Security card ── */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-btcl-primary/10 flex items-center justify-center">
                                <svg className="w-5 h-5 text-btcl-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <div>
                                <CardTitle className="text-base">Security</CardTitle>
                                <CardDescription>
                                    {securityStep === 'form'
                                        ? 'Set a new password — a verification code will be sent to your email'
                                        : `Enter the 6-digit code sent to ${userInfo.email}`}
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent>
                        {/* Alerts */}
                        {pwError && (
                            <div className="mb-5 flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                {pwError}
                            </div>
                        )}
                        {pwSuccess && (
                            <div className="mb-5 flex items-start gap-2 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                                <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                {pwSuccess}
                            </div>
                        )}

                        {/* Step 1 — password fields */}
                        {securityStep === 'form' && (
                            <div className="space-y-4">
                                <Input
                                    id="newPassword"
                                    label="New Password"
                                    type={showNew ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={e => { setNewPassword(e.target.value); setPwError('') }}
                                    placeholder="At least 8 characters"
                                    required
                                />
                                {/* toggle show/hide sits on top of Input — we keep it simple with a suffix approach */}
                                <Input
                                    id="confirmPassword"
                                    label="Confirm New Password"
                                    type={showConfirm ? 'text' : 'password'}
                                    value={confirmPassword}
                                    onChange={e => { setConfirmPassword(e.target.value); setPwError('') }}
                                    placeholder="Repeat new password"
                                    required
                                />

                                <p className="text-xs text-gray-500">
                                    After clicking the button below, a 6-digit code will be sent to{' '}
                                    <span className="font-medium text-gray-700">{userInfo.email}</span> to confirm the change.
                                </p>

                                <Button
                                    onClick={handleSendOtp}
                                    loading={isSendingOtp}
                                    disabled={isSendingOtp}
                                    className="w-full sm:w-auto"
                                >
                                    Send Verification Code
                                </Button>
                            </div>
                        )}

                        {/* Step 2 — OTP entry */}
                        {securityStep === 'otp' && (
                            <div className="space-y-5">
                                <div>
                                    <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
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
                                        className="flex h-12 w-full max-w-xs rounded-md border border-gray-300 bg-white px-3 py-2 text-center text-2xl tracking-widest font-mono placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-btcl-primary focus:border-btcl-primary"
                                    />
                                    <div className="mt-2">
                                        <button
                                            type="button"
                                            onClick={handleResendOtp}
                                            disabled={resendCooldown > 0 || isSendingOtp}
                                            className="text-sm text-btcl-primary hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                                        >
                                            {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 flex-wrap">
                                    <Button
                                        onClick={handleChangePassword}
                                        loading={isChanging}
                                        disabled={isChanging}
                                    >
                                        Change Password
                                    </Button>
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="text-sm text-gray-500 hover:text-gray-700"
                                    >
                                        ← Back
                                    </button>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Back to dashboard */}
                <div className="mt-6 text-center">
                    <Link href={`/${locale}/dashboard`} className="text-sm text-gray-500 hover:text-btcl-primary">
                        ← Back to Dashboard
                    </Link>
                </div>

            </div>
        </div>
    )
}
