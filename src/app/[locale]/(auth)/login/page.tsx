'use client'

import { useState, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import Link from 'next/link'
import { loginUser, setAuthToken } from '@/lib/api-client/auth'
import { useAuth } from '@/lib/contexts/AuthContext'
import toast from 'react-hot-toast'

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
            if (!deactivated) toast.error(errorMessage)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            <div className="py-20">
                <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
                    <Card>
                        <CardHeader className="text-center">
                            <CardTitle className="text-2xl font-bold">{t('auth.login.title')}</CardTitle>
                            <CardDescription>Enter your credentials to access your account</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {loginError && (
                                    <div className={`flex items-start gap-3 rounded-xl p-4 border ${isDeactivated ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200'}`}>
                                        <span className="text-xl flex-shrink-0 leading-none mt-0.5">
                                            {isDeactivated ? '🚫' : '⚠️'}
                                        </span>
                                        <div className="flex-1">
                                            <p className={`font-bold text-sm ${isDeactivated ? 'text-orange-800' : 'text-red-800'}`}>
                                                {isDeactivated ? 'Account Deactivated' : 'Login Failed'}
                                            </p>
                                            <p className={`text-sm mt-0.5 ${isDeactivated ? 'text-orange-700' : 'text-red-700'}`}>
                                                {loginError}
                                            </p>
                                            {isDeactivated && (
                                                <p className="text-sm mt-2 text-orange-800 font-medium">
                                                    For support, call{' '}
                                                    <a href="tel:+88028831115000" className="font-bold text-orange-900 hover:underline">
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

                                <Input
                                    label={t('auth.login.password')}
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                    error={errors.password as string}
                                    required
                                    autoComplete="current-password"
                                />

                                <div className="flex items-center justify-between text-sm">
                                    <Link
                                        href={`/${locale}/register`}
                                        className="text-blue-600 hover:underline"
                                    >
                                        Don&apos;t have an account? Register here
                                    </Link>
                                    <Link
                                        href={`/${locale}/forgot-password`}
                                        className="text-btcl-primary hover:underline"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Security Check</label>
                                    {lockedUntil && Date.now() < lockedUntil ? (
                                        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-center">
                                            <p className="text-red-600 text-sm font-semibold">Too many failed attempts</p>
                                            <p className="text-red-800 text-sm mt-1">Please try again in <strong>{lockCountdown}</strong></p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                                                <span className="text-base font-semibold text-gray-800 whitespace-nowrap">
                                                    {captchaA} + {captchaB} = ?
                                                </span>
                                                <input
                                                    type="number"
                                                    value={captchaAnswer}
                                                    onChange={(e) => { setCaptchaAnswer(e.target.value); setCaptchaError(''); }}
                                                    className="w-24 text-center text-base font-semibold px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    placeholder="Answer"
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={generateCaptcha}
                                                    title="Refresh CAPTCHA"
                                                    className="text-gray-500 hover:text-gray-700 text-lg p-1"
                                                >
                                                    ↻
                                                </button>
                                            </div>
                                            {captchaError && (
                                                <p className="text-red-600 text-xs font-medium mt-1.5">{captchaError}</p>
                                            )}
                                        </>
                                    )}
                                </div>

                                <Button type="submit" className="w-full" loading={isLoading} disabled={isLoading}>
                                    {t('auth.login.submit')}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
