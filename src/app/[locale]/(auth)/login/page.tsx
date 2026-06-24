'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Link from 'next/link'
import { loginUser, setAuthToken } from '@/lib/api-client/auth'
import { useAuth } from '@/lib/contexts/AuthContext'
import toast from 'react-hot-toast'
import { showApiError } from '@/lib/api-error'

const decodeToken = (token: string) => {
    try {
        const base64Url = token.split('.')[1]
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        )
        return JSON.parse(jsonPayload)
    } catch (error) {
        console.error('Error decoding token:', error)
        return null
    }
}

export default function LoginPage() {
    const params = useParams()
    const locale = params.locale as string
    const t = useTranslations()
    const router = useRouter()
    const { checkAuth } = useAuth()

    const [formData, setFormData] = useState({ email: '', password: '' })
    const [errors, setErrors] = useState({
        password: "",
        email: ""
    })
    const [isLoading, setIsLoading] = useState(false)
    const [captchaA, setCaptchaA] = useState(0)
    const [captchaB, setCaptchaB] = useState(0)
    const [captchaAnswer, setCaptchaAnswer] = useState('')
    const [captchaError, setCaptchaError] = useState('')
    const [captchaAttempts, setCaptchaAttempts] = useState(0)
    const [lockedUntil, setLockedUntil] = useState<number | null>(null)
    const [lockCountdown, setLockCountdown] = useState('')
    const lockTimerRef = useRef<NodeJS.Timeout | null>(null)

    const generateCaptcha = () => {
        setCaptchaA(Math.floor(Math.random() * 20) + 1)
        setCaptchaB(Math.floor(Math.random() * 20) + 1)
        setCaptchaAnswer('')
        setCaptchaError('')
    }

    useEffect(() => {
        generateCaptcha()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const startLockCountdown = (until: number) => {
        if (lockTimerRef.current) clearInterval(lockTimerRef.current)
        const update = () => {
            const remaining = until - Date.now()
            if (remaining <= 0) {
                clearInterval(lockTimerRef.current!)
                setLockedUntil(null)
                setLockCountdown('')
                setCaptchaAttempts(0)
                localStorage.removeItem('captchaLockedUntil')
                generateCaptcha()
                return
            }
            const mins = Math.floor(remaining / 60000)
            const secs = Math.floor((remaining % 60000) / 1000)
            setLockCountdown(`${mins}:${secs.toString().padStart(2, '0')}`)
        }
        update()
        lockTimerRef.current = setInterval(update, 1000)
    }

    useEffect(() => {
        const savedLock = localStorage.getItem('captchaLockedUntil')
        if (savedLock && Date.now() < parseInt(savedLock, 10)) {
            setLockedUntil(parseInt(savedLock, 10))
            startLockCountdown(parseInt(savedLock, 10))
        } else {
            localStorage.removeItem('captchaLockedUntil')
        }
        return () => { if (lockTimerRef.current) clearInterval(lockTimerRef.current) }
    }, [])

    const wasDeactivated = typeof window !== 'undefined' && !!sessionStorage.getItem('deactivated')
    if (wasDeactivated) sessionStorage.removeItem('deactivated')
    const [loginError, setLoginError] = useState(wasDeactivated ? 'Your account has been deactivated. Please contact support.' : '')
    const [isDeactivated, setIsDeactivated] = useState(wasDeactivated)

    const validateForm = () => {
        const newErrors: any = {}
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required'
        }
        if (!formData.password) {
            newErrors.password = 'Password is required'
        }
        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
        if (errors[field as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [field]: '' }))
        }
        if (loginError) { setLoginError(''); setIsDeactivated(false); }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return

        if (lockedUntil && Date.now() < lockedUntil) return

        if (parseInt(captchaAnswer, 10) !== captchaA + captchaB) {
            const newAttempts = captchaAttempts + 1
            const remaining = 5 - newAttempts
            if (newAttempts >= 5) {
                const lockUntil = Date.now() + 10 * 60 * 1000
                localStorage.setItem('captchaLockedUntil', lockUntil.toString())
                setCaptchaAttempts(newAttempts)
                setLockedUntil(lockUntil)
                setCaptchaError('')
                startLockCountdown(lockUntil)
            } else {
                setCaptchaAttempts(newAttempts)
                setCaptchaError(`Incorrect answer. You have ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`)
            }
            generateCaptcha()
            return
        }

        setIsLoading(true)
        setLoginError('')
        setIsDeactivated(false)
        setCaptchaError('')
        setCaptchaAttempts(0)

        try {
            const response = await loginUser({
                email: formData.email,
                password: formData.password
            })

            setAuthToken(response.token)

            // Store password expiry info
            if (response.passwordExpired) {
                localStorage.setItem('passwordExpired', 'true')
            } else {
                localStorage.removeItem('passwordExpired')
            }
            if (response.daysUntilExpiry != null) {
                localStorage.setItem('daysUntilExpiry', String(response.daysUntilExpiry))
            }

            const decodedToken = decodeToken(response.token)

            if (!decodedToken || !decodedToken.idPartner) {
                throw new Error('Partner ID not found in token')
            }

            const partnerId = decodedToken.idPartner

            localStorage.setItem('userEmail', formData.email)
            localStorage.setItem('userPassword', formData.password)
            localStorage.setItem('partnerId', partnerId.toString())

            if (decodedToken.roles) {
                localStorage.setItem('userRoles', JSON.stringify(decodedToken.roles))
            }

            if (response.userContext) {
                try {
                    const userContext = typeof response.userContext === 'string'
                        ? JSON.parse(response.userContext)
                        : response.userContext

                    localStorage.setItem('firstName', userContext.firstName || '')
                    localStorage.setItem('lastName', userContext.lastName || '')
                    localStorage.setItem('phone', userContext.phone || '')
                } catch (e) {
                    console.log('Could not parse userContext:', e)
                }
            }

            await checkAuth()
            toast.success('Login successful!')

            // Check if user has ROLE_ADMIN
            const isAdmin = decodedToken.roles?.some(
                (role: { name: string }) => role.name === 'ROLE_ADMIN'
            )

            if (isAdmin) {
                router.push(`/${locale}/admin`)
                return
            }

            const customerPrePaid = decodedToken.customerPrePaid
            if (customerPrePaid === 2) {
                router.push(`/${locale}/postpaid-pending`)
            } else {
                router.push(`/${locale}/dashboard`)
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Invalid email or password. Please try again.'
            const deactivated = error.response?.status === 403
            setIsDeactivated(deactivated)
            setLoginError(errorMessage)
            if (!deactivated) {
                showApiError(error, { fallbackMessage: 'Invalid email or password. Please try again.' })
            }
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-white via-btcl-primaryLight/5 to-white">
            <Header />
            <div className="relative py-12 sm:py-16">
                {/* Decorative blobs - consistent with home hero */}
                <div className="pointer-events-none absolute inset-0 overflow-hidden">
                    <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-btcl-primaryLight/10 blur-3xl" />
                    <div className="absolute -right-24 bottom-16 h-72 w-72 rounded-full bg-btcl-primary/5 blur-3xl" />
                </div>

                <div className="relative max-w-md mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section header */}
                    <div className="mb-8 text-center">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-btcl-primaryLight/20 px-4 py-1.5 text-sm font-semibold text-btcl-primaryDark">
                            <span className="h-2 w-2 animate-pulse rounded-full bg-btcl-primary" />
                            Sign In
                        </div>
                        <h1 className="mb-2 text-3xl font-bold text-gray-900 md:text-4xl">
                            {t('auth.login.title')}
                        </h1>
                        <p className="text-base text-gray-600">
                            Enter your credentials to access your account
                        </p>
                    </div>

                    <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-7">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {loginError && (
                                <div className={`flex items-start gap-3 rounded-xl p-4 border ${isDeactivated ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                                    <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl ${isDeactivated ? 'bg-amber-100' : 'bg-red-100'}`}>
                                        {isDeactivated ? (
                                            <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                                                <circle cx="12" cy="12" r="9" strokeLinecap="round" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.5 5.5l13 13" />
                                            </svg>
                                        ) : (
                                            <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                                            </svg>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`font-bold text-sm ${isDeactivated ? 'text-amber-800' : 'text-red-800'}`}>
                                            {isDeactivated ? 'Account Deactivated' : 'Login Failed'}
                                        </p>
                                        <p className={`text-sm leading-relaxed mt-0.5 ${isDeactivated ? 'text-amber-700' : 'text-red-700'}`}>
                                            {loginError}
                                        </p>
                                        {isDeactivated && (
                                            <p className="text-sm mt-2 text-amber-800 font-medium">
                                                For support, call{' '}
                                                <a href="tel:+88028831115000" className="font-bold text-amber-900 hover:underline">
                                                    +880-2-4831115000
                                                </a>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}

                            <Input
                                label={t('auth.login.email')}
                                type="text"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                error={errors.email as string}
                                required
                                autoComplete="email"
                            />

                            <div className="space-y-1.5">
                                <Input
                                    label={t('auth.login.password')}
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                    error={errors.password as string}
                                    required
                                    autoComplete="current-password"
                                />
                                <div className="flex justify-end">
                                    <Link
                                        href={`/${locale}/forgot-password`}
                                        className="text-sm font-medium text-btcl-primary hover:underline"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs uppercase tracking-wider font-semibold text-btcl-primary mb-2">Security Check</label>
                                {lockedUntil && Date.now() < lockedUntil ? (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
                                        <p className="text-red-700 text-sm font-semibold">Too many failed attempts</p>
                                        <p className="text-red-700 text-sm mt-1">Please try again in <strong>{lockCountdown}</strong></p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-center gap-3 p-3 bg-btcl-primaryLight/5 border border-btcl-primaryLight/20 rounded-xl">
                                            <span className="text-base font-semibold text-btcl-primaryDark whitespace-nowrap">
                                                {captchaA} + {captchaB} = ?
                                            </span>
                                            <input
                                                type="number"
                                                value={captchaAnswer}
                                                onChange={(e) => { setCaptchaAnswer(e.target.value); setCaptchaError(''); }}
                                                className="w-24 text-center text-base font-semibold px-3 py-2 bg-white text-gray-900 placeholder:text-gray-400 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-btcl-primary focus:border-btcl-primary"
                                                placeholder="Answer"
                                                required
                                            />
                                            <button
                                                type="button"
                                                onClick={generateCaptcha}
                                                title="Refresh CAPTCHA"
                                                className="flex h-9 w-9 items-center justify-center rounded-lg text-btcl-primary hover:bg-btcl-primaryLight/10 transition-colors"
                                            >
                                                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                                </svg>
                                            </button>
                                        </div>
                                        {captchaError && (
                                            <p className="text-red-700 text-xs font-medium mt-2">{captchaError}</p>
                                        )}
                                    </>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full transform rounded-lg border-2 border-btcl-primary bg-white px-6 py-2.5 text-sm font-semibold text-btcl-primary transition-all duration-300 hover:scale-105 hover:bg-btcl-primary hover:text-white disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                                loading={isLoading}
                                disabled={isLoading}
                            >
                                {t('auth.login.submit')}
                            </Button>
                        </form>
                    </div>

                    <p className="mt-6 text-center text-sm text-gray-600">
                        Don&apos;t have an account?{' '}
                        <Link
                            href={`/${locale}/register`}
                            className="font-semibold text-btcl-primary hover:underline"
                        >
                            Register here
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    )
}
