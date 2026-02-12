/**
 * Format price for display
 */
export function formatPrice(value: number | null, currency = '$'): string {
  if (value === null) return `${currency}0.00`;
  return `${currency}${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)}`;
}

/**
 * Format time for display
 */
export function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format date for display
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Get today's date range (start and end)
 */
export function getTodayRange(): { start: string; end: string } {
  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
  return {
    start: startOfDay.toISOString(),
    end: endOfDay.toISOString(),
  };
}

/**
 * Get slug from URL params
 */
export function getSlugFromParams(params: { slug?: string | string[] }): string {
  const value = params?.slug;
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value[0] ?? '';
  return '';
}

/**
 * Classnames helper (simple cn function)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
