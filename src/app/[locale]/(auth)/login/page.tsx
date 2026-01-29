// 'use client'
//
// import { useState } from 'react'
// import { useTranslations } from 'next-intl'
// import { useRouter, useParams } from 'next/navigation'
// import { Header } from '@/components/layout/Header'
// import { Button } from '@/components/ui/Button'
// import { Input } from '@/components/ui/Input'
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
// import Link from 'next/link'
// import { loginUser, setAuthToken } from '@/lib/api-client/auth'
// import { useAuth } from '@/lib/contexts/AuthContext' // ✅ Add this import
// import toast from 'react-hot-toast' // ✅ Add this import
//
// export default function LoginPage() {
//     const params = useParams()
//     const locale = params.locale as string
//     const t = useTranslations()
//     const router = useRouter()
//     const { checkAuth } = useAuth() // ✅ Add this line
//
//     const [formData, setFormData] = useState({ email: '', password: '' })
//     const [errors, setErrors] = useState({
//         password: "",
//         email: ""
//     })
//     const [isLoading, setIsLoading] = useState(false)
//     const [loginError, setLoginError] = useState('')
//
//     const validateForm = () => {
//         const newErrors: any = {}
//         if (!formData.email.trim()) {
//             newErrors.email = 'Email is required'
//         } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
//             newErrors.email = 'Email is invalid'
//         }
//         if (!formData.password) {
//             newErrors.password = 'Password is required'
//         }
//         setErrors(newErrors)
//         return Object.keys(newErrors).length === 0
//     }
//
//     const handleInputChange = (field: string, value: string) => {
//         setFormData(prev => ({ ...prev, [field]: value }))
//         if (errors[field as keyof typeof errors]) {
//             setErrors(prev => ({ ...prev, [field]: '' }))
//         }
//         if (loginError) setLoginError('')
//     }
//
//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault()
//         if (!validateForm()) return
//
//         setIsLoading(true)
//         setLoginError('')
//
//         // try {
//         //     // Use your custom login API
//         //     const response = await loginUser({
//         //         email: formData.email,
//         //         password: formData.password
//         //     })
//         //
//         //     // Store the authentication token
//         //     setAuthToken(response.token)
//         //     localStorage.setItem('userEmail', formData.email)
//         //     localStorage.setItem('userPassword', formData.password)
//         //     // ✅ Update auth state in context
//         //     checkAuth()
//         //
//         //     // ✅ Show success message
//         //     toast.success('Login successful!')
//         //
//         //     // Redirect to dashboard
//         //     router.push(`/${locale}/dashboard`)
//         // } catch (error: any) {
//         //     console.error('Login error:', error)
//         //     const errorMessage = error.response?.data?.message || 'Invalid email or password. Please try again.'
//         //     setLoginError(errorMessage)
//         //     // ✅ Show error toast
//         //     toast.error(errorMessage)
//         // } finally {
//         //     setIsLoading(false)
//         // }
//
//         const handleSubmit = async (e: React.FormEvent) => {
//             e.preventDefault()
//             if (!validateForm()) return
//
//             setIsLoading(true)
//             setLoginError('')
//
//             try {
//                 console.log('🔵 Logging in...')
//
//                 const response = await loginUser({
//                     email: formData.email,
//                     password: formData.password
//                 })
//
//                 console.log('✅ Login response:', response)
//
//                 // CRITICAL: Extract and store partner ID from response
//                 const partnerId = response.idPartner || response.partnerId
//
//                 if (!partnerId) {
//                     console.error('❌ Partner ID missing in response:', response)
//                     throw new Error('Partner ID not found in login response')
//                 }
//
//                 console.log('✅ Partner ID extracted:', partnerId)
//
//                 // Store all necessary data
//                 setAuthToken(response.token)
//                 localStorage.setItem('userEmail', formData.email)
//                 localStorage.setItem('userPassword', formData.password)
//                 localStorage.setItem('partnerId', partnerId.toString()) // CRITICAL
//
//                 // Store user context if available
//                 if (response.userContext) {
//                     try {
//                         const userContext = JSON.parse(response.userContext)
//                         localStorage.setItem('firstName', userContext.firstName || '')
//                         localStorage.setItem('lastName', userContext.lastName || '')
//                         localStorage.setItem('phone', userContext.phone || '')
//                     } catch (e) {
//                         console.log('Could not parse userContext')
//                     }
//                 }
//
//                 checkAuth()
//                 toast.success('Login successful!')
//
//                 console.log('🎉 Redirecting to dashboard...')
//                 router.push(`/${locale}/dashboard`)
//             } catch (error: any) {
//                 console.error('❌ Login error:', error)
//                 const errorMessage = error.response?.data?.message || error.message || 'Invalid email or password. Please try again.'
//                 setLoginError(errorMessage)
//                 toast.error(errorMessage)
//             } finally {
//                 setIsLoading(false)
//             }
//         }
//
//
//     }
//
//     return (
//         <div className="min-h-screen bg-gray-50">
//             <Header />
//             <div className="py-20">
//                 <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
//                     <Card>
//                         <CardHeader className="text-center">
//                             <CardTitle className="text-2xl font-bold">{t('auth.login.title')}</CardTitle>
//                             <CardDescription>Enter your credentials to access your account</CardDescription>
//                         </CardHeader>
//                         <CardContent>
//                             <form onSubmit={handleSubmit} className="space-y-6">
//                                 {loginError && (
//                                     <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
//                                         {loginError}
//                                     </div>
//                                 )}
//
//                                 <Input
//                                     label={t('auth.login.email')}
//                                     type="email"
//                                     value={formData.email}
//                                     onChange={(e) => handleInputChange('email', e.target.value)}
//                                     error={errors.email as string}
//                                     required
//                                     autoComplete="email"
//                                 />
//
//                                 <Input
//                                     label={t('auth.login.password')}
//                                     type="password"
//                                     value={formData.password}
//                                     onChange={(e) => handleInputChange('password', e.target.value)}
//                                     error={errors.password as string}
//                                     required
//                                     autoComplete="current-password"
//                                 />
//
//                                 <div className="text-sm text-center">
//                                     <Link
//                                         href={`/${locale}/register`}
//                                         className="text-blue-600 hover:underline"
//                                     >
//                                         Don't have an account? Register here
//                                     </Link>
//                                 </div>
//
//                                 <Button type="submit" className="w-full" loading={isLoading} disabled={isLoading}>
//                                     {t('auth.login.submit')}
//                                 </Button>
//                             </form>
//                         </CardContent>
//                     </Card>
//                 </div>
//             </div>
//         </div>
//     )
// }






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

// Function to decode JWT token
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
            console.log('🔵 Logging in...')

            const response = await loginUser({
                email: formData.email,
                password: formData.password
            })

            console.log('✅ Login response:', response)

            // Store the token first
            setAuthToken(response.token)

            // Decode the JWT token to extract idPartner
            const decodedToken = decodeToken(response.token)
            console.log('🔓 Decoded token:', decodedToken)

            if (!decodedToken || !decodedToken.idPartner) {
                console.error('❌ Partner ID missing in decoded token:', decodedToken)
                throw new Error('Partner ID not found in token')
            }

            const partnerId = decodedToken.idPartner
            console.log('✅ Partner ID extracted from token:', partnerId)

            // Store all necessary data
            localStorage.setItem('userEmail', formData.email)
            localStorage.setItem('userPassword', formData.password)
            localStorage.setItem('partnerId', partnerId.toString())

            // Store additional token data if needed
            if (decodedToken.roles) {
                localStorage.setItem('userRoles', JSON.stringify(decodedToken.roles))
            }

            // Store user context if available in response
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

            // Update auth state
            await checkAuth()

            // Show success message
            toast.success('Login successful!')

            // Check customer type from decoded token
            const customerPrePaid = decodedToken.customerPrePaid
            console.log('🔍 Customer PrePaid value:', customerPrePaid)

            // Route based on customer type
            // customerPrePaid = 1 means Prepaid -> route to payment/dashboard
            // customerPrePaid = 2 means Postpaid -> route to postpaid-pending page
            if (customerPrePaid === 1) {
                console.log('🎉 Prepaid customer - Redirecting to dashboard...')
                router.push(`/${locale}/dashboard`)
            } else if (customerPrePaid === 2) {
                console.log('🎉 Postpaid customer - Redirecting to postpaid-pending page...')
                router.push(`/${locale}/postpaid-pending`)
            } else {
                // Default to dashboard if customer type is not set
                console.log('🎉 Customer type not set - Redirecting to dashboard...')
                router.push(`/${locale}/dashboard`)
            }
        } catch (error: any) {
            console.error('❌ Login error:', error)
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

                                <div className="text-sm text-center">
                                    <Link
                                        href={`/${locale}/register`}
                                        className="text-blue-600 hover:underline"
                                    >
                                        Don't have an account? Register here
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