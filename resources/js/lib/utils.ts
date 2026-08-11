import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function footerLogoUrl(logoPath?: string | null): string {
  return logoPath ? (logoPath.startsWith('/') ? logoPath : `/storage/${logoPath}`) : '/img/company_logo/company-logos-01.png'
}
