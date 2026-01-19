'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { getAuthToken, removeAuthToken } from '@/lib/api-client/auth'
import { jwtDecode } from 'jwt-decode'
import toast from 'react-hot-toast'

interface DecodedToken {
    exp: number
    iat?: number
    [key: string]: any
}

interface AuthContextType {
    isAuthenticated: boolean
    loading: boolean
    logout: () => void
    checkAuth: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()
    const logoutTimerRef = useRef<NodeJS.Timeout | null>(null)

    // Check if token is expired
    const isTokenExpired = (token: string): boolean => {
        try {
            const decoded = jwtDecode<DecodedToken>(token)
            if (!decoded.exp) return false

            // exp is in seconds, Date.now() is in milliseconds
            const expirationTime = decoded.exp * 1000
            const currentTime = Date.now()

            return currentTime >= expirationTime
        } catch (error) {
            console.error('Error decoding token:', error)
            return true // Treat invalid tokens as expired
        }
    }

    // Get time until token expires (in milliseconds)
    const getTimeUntilExpiry = (token: string): number => {
        try {
            const decoded = jwtDecode<DecodedToken>(token)
            if (!decoded.exp) return 0

            const expirationTime = decoded.exp * 1000
            const currentTime = Date.now()

            return Math.max(0, expirationTime - currentTime)
        } catch (error) {
            return 0
        }
    }

    // Logout function
    const logout = useCallback(() => {
        // Clear the logout timer
        if (logoutTimerRef.current) {
            clearTimeout(logoutTimerRef.current)
            logoutTimerRef.current = null
        }

        removeAuthToken()
        setIsAuthenticated(false)

        // Get locale from pathname
        const locale = pathname?.startsWith('/bn') ? 'bn' : 'en'
        router.push(`/${locale}/login`)
    }, [router, pathname])

    // Auto logout when token expires
    const setupAutoLogout = useCallback((token: string) => {
        // Clear any existing timer
        if (logoutTimerRef.current) {
            clearTimeout(logoutTimerRef.current)
            logoutTimerRef.current = null
        }

        const timeUntilExpiry = getTimeUntilExpiry(token)

        if (timeUntilExpiry > 0) {
            // Set timer to logout 1 second before actual expiry
            const logoutTime = Math.max(0, timeUntilExpiry - 1000)

            console.log(`Token expires in ${Math.round(timeUntilExpiry / 1000 / 60)} minutes. Auto-logout scheduled.`)

            logoutTimerRef.current = setTimeout(() => {
                toast.error('Session expired. Please login again.', {
                    duration: 5000,
                    id: 'session-expired'
                })
                logout()
            }, logoutTime)
        }
    }, [logout])

    // Check authentication status
    const checkAuth = useCallback(() => {
        const token = getAuthToken()

        if (!token) {
            setIsAuthenticated(false)
            setLoading(false)
            return
        }

        // Check if token is expired
        if (isTokenExpired(token)) {
            console.log('Token expired, logging out...')
            toast.error('Session expired. Please login again.', {
                duration: 5000,
                id: 'session-expired'
            })
            removeAuthToken()
            setIsAuthenticated(false)
            setLoading(false)

            // Redirect to login
            const locale = pathname?.startsWith('/bn') ? 'bn' : 'en'
            router.push(`/${locale}/login`)
            return
        }

        // Token is valid
        setIsAuthenticated(true)
        setLoading(false)

        // Setup auto logout timer
        setupAutoLogout(token)
    }, [pathname, router, setupAutoLogout])

    // Initial auth check
    useEffect(() => {
        checkAuth()

        // Cleanup timer on unmount
        return () => {
            if (logoutTimerRef.current) {
                clearTimeout(logoutTimerRef.current)
            }
        }
    }, [checkAuth])

    // Check token on visibility change (when user returns to tab)
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkAuth()
            }
        }

        document.addEventListener('visibilitychange', handleVisibilityChange)

        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange)
        }
    }, [checkAuth])

    // Check token periodically (every minute)
    useEffect(() => {
        const intervalId = setInterval(() => {
            const token = getAuthToken()
            if (token && isTokenExpired(token)) {
                toast.error('Session expired. Please login again.', {
                    duration: 5000,
                    id: 'session-expired'
                })
                logout()
            }
        }, 60000) // Check every minute

        return () => clearInterval(intervalId)
    }, [logout])

    return (
        <AuthContext.Provider value={{ isAuthenticated, loading, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
