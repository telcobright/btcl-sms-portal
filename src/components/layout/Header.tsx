'use client'

import { useTranslations } from 'next-intl'
import { useLocale } from 'next-intl'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { LanguageToggle } from './LanguageToggle'
import { useAuth } from '@/lib/contexts/AuthContext'
import toast from 'react-hot-toast'
import { useState } from 'react'

export function Header() {
  const t = useTranslations()
  const locale = useLocale()
  const pathname = usePathname()
  const { isAuthenticated, loading, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const navigation = [
    { name: t('navigation.home'), href: `/${locale}` },
    { name: t('navigation.about'), href: `/${locale}/about` },
    { name: t('navigation.services'), href: `/${locale}/services` },
    { name: t('navigation.pricing'), href: `/${locale}/pricing` },
    { name: t('navigation.contact'), href: `/${locale}/contact` },
  ]

  const handleLogout = () => {
    // Clear all localStorage data
    localStorage.clear()
    logout()
    toast.success('Logged out successfully')
    // Redirect to home page
    window.location.href = `/${locale}`
  }

  return (
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href={`/${locale}`} className="flex items-center space-x-2">
                <Image
                    src="/btcllogo.png"
                    alt="BTCL Logo"
                    width={124}
                    height={100}
                    className="rounded-lg object-contain"
                />
              </Link>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => (
                  <Link
                      key={item.name}
                      href={item.href}
                      className={`text-sm font-medium transition-colors hover:text-btcl-primary ${
                          pathname === item.href
                              ? 'text-btcl-primary'
                              : 'text-gray-700'
                      }`}
                  >
                    {item.name}
                  </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              {/*<LanguageToggle />*/}

              {/* Desktop Auth Buttons */}
              <div className="hidden md:flex items-center space-x-4">
                {loading ? (
                    // Show loading state
                    <div className="flex space-x-4">
                      <div className="w-20 h-9 bg-gray-200 animate-pulse rounded-md"></div>
                      <div className="w-20 h-9 bg-gray-200 animate-pulse rounded-md"></div>
                    </div>
                ) : isAuthenticated ? (
                    // Authenticated state - Show Dashboard and Logout
                    <>
                      <Link href={`/${locale}/dashboard`}>
                        <Button variant="ghost" size="sm">
                          Dashboard
                        </Button>
                      </Link>
                      <Button
                          size="sm"
                          variant="outline"
                          onClick={handleLogout}
                          className="border-red-500 text-red-500 hover:bg-red-50"
                      >
                        Logout
                      </Button>
                    </>
                ) : (
                    // Unauthenticated state - Show Login and Register
                    <>
                      <Link href={`/${locale}/login`}>
                        <Button variant="ghost" size="sm">
                          {t('navigation.login')}
                        </Button>
                      </Link>
                      <Link href={`/${locale}/register`}>
                        <Button size="sm">
                          {t('navigation.register')}
                        </Button>
                      </Link>
                    </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-btcl-primary hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-btcl-primary"
              >
                <span className="sr-only">Open main menu</span>
                {mobileMenuOpen ? (
                    <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                ) : (
                    <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
              <div className="md:hidden border-t border-gray-200">
                <div className="px-2 pt-2 pb-3 space-y-1">
                  {navigation.map((item) => (
                      <Link
                          key={item.name}
                          href={item.href}
                          className={`block px-3 py-2 rounded-md text-base font-medium ${
                              pathname === item.href
                                  ? 'bg-btcl-primary/10 text-btcl-primary'
                                  : 'text-gray-700 hover:bg-gray-100 hover:text-btcl-primary'
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                  ))}
                </div>
                <div className="border-t border-gray-200 px-2 pt-4 pb-3 space-y-2">
                  {loading ? (
                      <div className="space-y-2">
                        <div className="h-9 bg-gray-200 animate-pulse rounded-md"></div>
                        <div className="h-9 bg-gray-200 animate-pulse rounded-md"></div>
                      </div>
                  ) : isAuthenticated ? (
                      <>
                        <Link href={`/${locale}/dashboard`} onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="ghost" size="sm" className="w-full">
                            Dashboard
                          </Button>
                        </Link>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setMobileMenuOpen(false)
                              handleLogout()
                            }}
                            className="w-full border-red-500 text-red-500 hover:bg-red-50"
                        >
                          Logout
                        </Button>
                      </>
                  ) : (
                      <>
                        <Link href={`/${locale}/login`} onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="ghost" size="sm" className="w-full">
                            {t('navigation.login')}
                          </Button>
                        </Link>
                        <Link href={`/${locale}/register`} onClick={() => setMobileMenuOpen(false)}>
                          <Button size="sm" className="w-full">
                            {t('navigation.register')}
                          </Button>
                        </Link>
                      </>
                  )}
                </div>
              </div>
          )}
        </div>
      </header>
  )
}