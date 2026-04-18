'use client'

import { useState } from 'react'
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
    const [loginError, setLoginError] = useState('')

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
        if (loginError) setLoginError('')
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!validateForm()) return

        setIsLoading(true)
        setLoginError('')

        try {
            const response = await loginUser({
                email: formData.email,
                password: formData.password
            })

            setAuthToken(response.token)

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

            const customerPrePaid = decodedToken.customerPrePaid
            if (customerPrePaid === 2) {
                router.push(`/${locale}/postpaid-pending`)
            } else {
                router.push(`/${locale}/dashboard`)
            }
        } catch (error: any) {
            const errorMessage = error.response?.data?.message || error.message || 'Invalid email or password. Please try again.'
            setLoginError(errorMessage)
            toast.error(errorMessage)
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
                                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                                        {loginError}
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
