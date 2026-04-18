'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import toast from 'react-hot-toast'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { API_BASE_URL, API_ENDPOINTS } from '@/config/api'

type Step = 'email' | 'reset' | 'done'

export default function ForgotPasswordPage() {
    const params = useParams()
    const locale = params.locale as string

    const [step, setStep] = useState<Step>('email')
    const [email, setEmail] = useState('')
    const [otp, setOtp] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [resendCooldown, setResendCooldown] = useState(0)

    // ── Step 1: send OTP ──────────────────────────────────────────────────────
    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        try {
            const { data } = await axios.post(
                `${API_BASE_URL}${API_ENDPOINTS.emailOtp.send}`,
                { email: email.trim().toLowerCase(), purpose: 'password_reset' }
            )

            if (data.success) {
                setStep('reset')
                startCooldown(data.retryAfterSeconds || 60)
                toast.success('Verification code sent to your email')
            } else {
                setError(data.message || 'Failed to send OTP. Please try again.')
            }
        } catch (err: any) {
            const msg = err.response?.data?.message || 'Failed to send OTP. Please try again.'
            setError(msg)
        } finally {
            setIsLoading(false)
        }
    }

    // ── Resend OTP ────────────────────────────────────────────────────────────
    const handleResendOtp = async () => {
        if (resendCooldown > 0) return
        setError('')
        setIsLoading(true)

        try {
            const { data, status } = await axios.post(
                `${API_BASE_URL}${API_ENDPOINTS.emailOtp.send}`,
                { email: email.trim().toLowerCase(), purpose: 'password_reset' }
            )

            if (data.success) {
                startCooldown(data.retryAfterSeconds || 60)
                toast.success('New code sent')
            } else {
                startCooldown(data.retryAfterSeconds || 60)
                setError(data.message || 'Please wait before requesting another code.')
            }
        } catch (err: any) {
            if (err.response?.status === 429) {
                startCooldown(err.response.data?.retryAfterSeconds || 60)
            }
            setError(err.response?.data?.message || 'Failed to resend code.')
        } finally {
            setIsLoading(false)
        }
    }

    const startCooldown = (seconds: number) => {
        setResendCooldown(seconds)
        const interval = setInterval(() => {
            setResendCooldown(prev => {
                if (prev <= 1) { clearInterval(interval); return 0 }
                return prev - 1
            })
        }, 1000)
    }

    // ── Step 2: verify OTP + reset password ──────────────────────────────────
    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.')
            return
        }
        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters.')
            return
        }

        setIsLoading(true)
        try {
            const { data } = await axios.post(
                `${API_BASE_URL}${API_ENDPOINTS.passwordReset}`,
                { email: email.trim().toLowerCase(), otp: otp.trim(), newPassword }
            )

            if (data.success) {
                setStep('done')
                toast.success('Password reset successfully!')
            } else {
                setError(data.message || 'Failed to reset password. Please try again.')
            }
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to reset password. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="py-20">
                <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">

                    {/* ── Done ── */}
                    {step === 'done' && (
                        <Card>
                            <CardHeader className="text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <CardTitle className="text-2xl font-bold">Password Reset!</CardTitle>
                                <CardDescription>
                                    Your password has been updated. You can now sign in with your new password.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <Link href={`/${locale}/login`}>
                                    <Button className="w-full">Go to Sign In</Button>
                                </Link>
                            </CardContent>
                        </Card>
                    )}

                    {/* ── Step 1: Email ── */}
                    {step === 'email' && (
                        <Card>
                            <CardHeader className="text-center">
                                <CardTitle className="text-2xl font-bold">Forgot Password?</CardTitle>
                                <CardDescription>
                                    Enter your email address and we'll send you a verification code.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleSendOtp} className="space-y-6">
                                    {error && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
                                            {error}
                                        </div>
                                    )}

                                    <Input
                                        id="email"
                                        label="Email Address"
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        placeholder="Enter your email address"
                                        required
                                        autoComplete="email"
                                    />

                                    <Button type="submit" className="w-full" loading={isLoading} disabled={isLoading}>
                                        Send Verification Code
                                    </Button>

                                    <div className="text-sm text-center">
                                        <Link href={`/${locale}/login`} className="text-btcl-primary hover:underline">
                                            ← Back to Sign In
                                        </Link>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                    {/* ── Step 2: OTP + New Password ── */}
                    {step === 'reset' && (
                        <Card>
                            <CardHeader className="text-center">
                                <CardTitle className="text-2xl font-bold">Enter Your Code</CardTitle>
                                <CardDescription>
                                    We sent a 6-digit code to <span className="font-medium text-gray-800">{email}</span>.
                                    Enter it below along with your new password.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleResetPassword} className="space-y-5">
                                    {error && (
                                        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
                                            {error}
                                        </div>
                                    )}

                                    {/* OTP */}
                                    <div className="space-y-1">
                                        <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                                            Verification Code
                                        </label>
                                        <input
                                            id="otp"
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            required
                                            value={otp}
                                            onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                                            placeholder="000000"
                                            className="flex h-10 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-center tracking-widest font-mono placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-btcl-primary focus:border-btcl-primary"
                                        />
                                        <div className="text-right">
                                            <button
                                                type="button"
                                                onClick={handleResendOtp}
                                                disabled={resendCooldown > 0 || isLoading}
                                                className="text-sm text-btcl-primary hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                                            >
                                                {resendCooldown > 0
                                                    ? `Resend code in ${resendCooldown}s`
                                                    : 'Resend code'}
                                            </button>
                                        </div>
                                    </div>

                                    <Input
                                        id="newPassword"
                                        label="New Password"
                                        type="password"
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        placeholder="At least 8 characters"
                                        required
                                        minLength={8}
                                    />

                                    <Input
                                        id="confirmPassword"
                                        label="Confirm New Password"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        placeholder="Repeat new password"
                                        required
                                    />

                                    <Button type="submit" className="w-full" loading={isLoading} disabled={isLoading}>
                                        Reset Password
                                    </Button>

                                    <div className="text-sm text-center">
                                        <button
                                            type="button"
                                            onClick={() => { setStep('email'); setError(''); setOtp(''); setNewPassword(''); setConfirmPassword('') }}
                                            className="text-btcl-primary hover:underline"
                                        >
                                            ← Use a different email
                                        </button>
                                    </div>
                                </form>
                            </CardContent>
                        </Card>
                    )}

                </div>
            </div>
        </div>
    )
}
