import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Modern class name merger for Tailwind CSS with clsx/tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const THAI_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

/**
 * Returns the Thai Buddhist year for a given date (Calendar Year)
 */
export function getThaiYear(date: string | Date = new Date()): number {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return new Date().getFullYear() + 543;
    const year = d.getFullYear();
    return year < 2400 ? year + 543 : year;
  } catch {
    return new Date().getFullYear() + 543;
  }
}

/**
 * Returns the Thai Fiscal Year for a given date (Starts in October)
 */
export function getThaiFiscalYear(date: string | Date = new Date()): number {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return getThaiFiscalYear(new Date());
    
    const year = d.getFullYear();
    const month = d.getMonth(); // 0-indexed, Oct is 9
    
    // Thai Fiscal Year starts in October (month 9)
    const fy = month >= 9 ? year + 1 : year;
    return fy < 2400 ? fy + 543 : fy;
  } catch {
    return getThaiFiscalYear(new Date());
  }
}

/**
 * Formats an ISO date string to a Thai date format (Buddhist Era)
 */
export function formatThaiDate(isoString: string | Date | null | undefined, includeTime: boolean = true): string {
  if (!isoString) return '-';
  try {
    const d = typeof isoString === 'string' ? new Date(isoString) : isoString;
    if (isNaN(d.getTime())) return String(isoString);
    
    const day = d.getDate();
    const month = THAI_MONTHS[d.getMonth()];
    const year = getThaiYear(d);
    
    if (!includeTime) return `${day} ${month} ${year}`;

    const hours = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    
    return `${day} ${month} ${year} ${hours}:${mins}`;
  } catch {
    return String(isoString);
  }
}
