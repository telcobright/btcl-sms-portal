import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency: string = "BDT"): string {
  return new Intl.NumberFormat('bn-BD', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatPhoneNumber(phone: string): string {
  // Remove any non-digit characters
  const cleaned = phone.replace(/\D/g, '')
  
  // Check if it's a Bangladesh number
  if (cleaned.startsWith('880')) {
    return `+${cleaned}`
  } else if (cleaned.startsWith('0')) {
    return `+880${cleaned.slice(1)}`
  } else if (cleaned.length === 10) {
    return `+880${cleaned}`
  }
  
  return phone
}

export function validateBangladeshPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '')
  
  // Check various valid formats for Bangladesh Mobile numbers
  if (cleaned.startsWith('880') && cleaned.length === 13) {
    return true
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    return true
  } else if (cleaned.length === 10) {
    return true
  }
  
  return false
}