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
import { Settings } from 'lucide-react'

export function Header() {
  const t = useTranslations()
  const locale = useLocale()
  const pathname = usePathname()
  const { isAuthenticated, logout } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isAdmin = (() => {
    if (typeof window === 'undefined') return false
    try {
      const roles = localStorage.getItem('userRoles')
      if (!roles) return false
      return JSON.parse(roles).some((r: { name: string }) => r.name === 'ROLE_ADMIN')
    } catch { return false }
  })()

  const dashboardHref = isAdmin ? `/${locale}/admin` : `/${locale}/dashboard`

  const navigation = [
    { name: t('navigation.home'), href: `/${locale}` },
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
      <header className="bg-gradient-to-r from-btcl-primary to-btcl-primaryDark shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href={`/${locale}`} className="flex items-center gap-3">
                <Image
                    src="/btcllogo.png"
                    alt="BTCL Logo"
                    width={128}
                    height={128}
                    className="h-14 w-auto object-contain"
                    priority
                />
                <span className="text-xl font-bold text-white tracking-tight">
                  Alaap Cloud
                </span>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              {navigation.map((item) => (
                  <Link
                      key={item.name}
                      href={item.href}
                      className={`relative text-sm font-semibold transition-colors hover:text-white ${
                          pathname === item.href
                              ? 'text-white after:absolute after:-bottom-1.5 after:left-0 after:right-0 after:h-0.5 after:rounded-full after:bg-btcl-primaryLight'
                              : 'text-white/75'
                      }`}
                  >
                    {item.name}
                  </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:block">
                <LanguageToggle />
              </div>

              {/* Desktop Auth Buttons */}
              <div className="hidden md:flex items-center space-x-4">
                {isAuthenticated ? (
                    // Authenticated state - Show Dashboard, Settings and Logout
                    <>
                      <Link href={dashboardHref}>
                        <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white">
                          Dashboard
                        </Button>
                      </Link>
                      <Link
                        href={`/${locale}/settings`}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Settings"
                      >
                        <Settings className="w-5 h-5 text-white" />
                      </Link>
                      <Button
                          size="sm"
                          variant="outline"
                          onClick={handleLogout}
                          className="border-2 border-white/40 bg-transparent text-white hover:bg-white hover:text-red-600 hover:border-white"
                      >
                        Logout
                      </Button>
                    </>
                ) : (
                    // Unauthenticated state - Show Login and Register
                    <>
                      <Link href={`/${locale}/login`}>
                        <Button variant="ghost" size="sm" className="text-white hover:bg-white/10 hover:text-white">
                          {t('navigation.login')}
                        </Button>
                      </Link>
                      <Link href={`/${locale}/register`}>
                        <Button size="sm" className="bg-white text-btcl-primary border border-white hover:bg-btcl-primaryLight hover:text-white hover:border-btcl-primaryLight transition-colors">
                          {t('navigation.register')}
                        </Button>
                      </Link>
                    </>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white/40"
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
              <div className="md:hidden border-t border-white/10">
                <div className="px-2 pt-2 pb-3 space-y-1">
                  {navigation.map((item) => (
                      <Link
                          key={item.name}
                          href={item.href}
                          className={`block px-3 py-2 rounded-md text-base font-medium ${
                              pathname === item.href
                                  ? 'bg-white/15 text-white'
                                  : 'text-white/75 hover:bg-white/10 hover:text-white'
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                      >
                        {item.name}
                      </Link>
                  ))}
                </div>
                <div className="border-t border-white/10 px-2 pt-4 pb-3 space-y-2">
                  <LanguageToggle variant="mobile" />
                  {isAuthenticated ? (
                      <>
                        <Link href={dashboardHref} onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="ghost" size="sm" className="w-full text-white hover:bg-white/10 hover:text-white">
                            Dashboard
                          </Button>
                        </Link>
                        <Link href={`/${locale}/settings`} onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="ghost" size="sm" className="w-full flex items-center gap-2 text-white hover:bg-white/10 hover:text-white">
                            <Settings className="w-4 h-4" />
                            Settings
                          </Button>
                        </Link>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setMobileMenuOpen(false)
                              handleLogout()
                            }}
                            className="w-full border-2 border-white/40 bg-transparent text-white hover:bg-white hover:text-red-600 hover:border-white"
                        >
                          Logout
                        </Button>
                      </>
                  ) : (
                      <>
                        <Link href={`/${locale}/login`} onClick={() => setMobileMenuOpen(false)}>
                          <Button variant="ghost" size="sm" className="w-full text-white hover:bg-white/10 hover:text-white">
                            {t('navigation.login')}
                          </Button>
                        </Link>
                        <Link href={`/${locale}/register`} onClick={() => setMobileMenuOpen(false)}>
                          <Button size="sm" className="w-full bg-white text-btcl-primary border border-white hover:bg-btcl-primaryLight hover:text-white hover:border-btcl-primaryLight transition-colors">
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