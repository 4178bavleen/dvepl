import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// ==========================================
// TAILWIND CLASS MERGE HELPER
// ==========================================
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ==========================================
// DATE UTILITIES
// ==========================================
export function formatDateString(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatDateTimeString(date: string | Date): string {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ==========================================
// CURRENCY & FORMATTING UTILITIES
// ==========================================
export function formatINR(val: number | string): string {
  const num = typeof val === 'string' ? Number(val) : val;
  if (isNaN(num)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function truncateText(text: string, limit = 50) {
  if (text.length <= limit) return text;
  return text.slice(0, limit) + '...';
}

// ==========================================
// VALIDATION UTILITIES
// ==========================================
export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return emailRegex.test(email);
}

export function isValidGSTIN(gstin: string): boolean {
  return gstin.length === 15;
}

// ==========================================
// DOWNLOAD & EXPORT UTILITIES
// ==========================================
export function downloadFile(url: string, fileName: string) {
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(data: any[], fileName: string) {
  console.log('Simulating Excel export for:', fileName, data.length, 'records');
}

export function exportToPdf(data: any[], fileName: string) {
  console.log('Simulating PDF export for:', fileName, data.length, 'records');
}
