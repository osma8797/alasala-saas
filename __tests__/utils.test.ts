import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatPrice,
  formatTime,
  formatDate,
  getTodayRange,
  getSlugFromParams,
  cn,
} from '@/lib/utils';

describe('Utility Functions', () => {
  describe('formatPrice', () => {
    it('should format price with default currency', () => {
      expect(formatPrice(100)).toBe('$100.00');
      expect(formatPrice(99.99)).toBe('$99.99');
      expect(formatPrice(1000)).toBe('$1,000.00');
    });

    it('should format price with custom currency', () => {
      expect(formatPrice(100, 'SAR ')).toBe('SAR 100.00');
      expect(formatPrice(50, '€')).toBe('€50.00');
    });

    it('should handle null value', () => {
      expect(formatPrice(null)).toBe('$0.00');
      expect(formatPrice(null, 'SAR ')).toBe('SAR 0.00');
    });

    it('should handle zero value', () => {
      expect(formatPrice(0)).toBe('$0.00');
    });

    it('should handle decimal values correctly', () => {
      expect(formatPrice(10.5)).toBe('$10.50');
      expect(formatPrice(10.555)).toBe('$10.56'); // rounds
    });
  });

  describe('formatTime', () => {
    it('should format time correctly', () => {
      const result = formatTime('2026-02-01T14:30:00Z');
      // Time format depends on locale, just check it's a string with expected pattern
      expect(result).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)?/i);
    });

    it('should handle different time zones', () => {
      const morning = formatTime('2026-02-01T08:00:00Z');
      const evening = formatTime('2026-02-01T20:00:00Z');
      expect(morning).toBeTruthy();
      expect(evening).toBeTruthy();
    });
  });

  describe('formatDate', () => {
    it('should format date with full details', () => {
      const result = formatDate('2026-02-01T14:30:00Z');
      // Should include weekday, month, day, year
      expect(result).toContain('2026');
    });

    it('should handle different dates', () => {
      const result1 = formatDate('2026-01-15T00:00:00Z');
      const result2 = formatDate('2026-12-25T00:00:00Z');
      expect(result1).toBeTruthy();
      expect(result2).toBeTruthy();
    });
  });

  describe('getTodayRange', () => {
    beforeEach(() => {
      // Mock Date to return a consistent date
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-02-01T12:00:00Z'));
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should return start and end of today', () => {
      const { start, end } = getTodayRange();

      // Start should be beginning of day (midnight)
      expect(new Date(start).getHours()).toBe(0);
      expect(new Date(start).getMinutes()).toBe(0);
      expect(new Date(start).getSeconds()).toBe(0);

      // End should be start of next day
      const startDate = new Date(start);
      const endDate = new Date(end);
      const diffMs = endDate.getTime() - startDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      expect(diffHours).toBe(24);
    });

    it('should return ISO strings', () => {
      const { start, end } = getTodayRange();

      expect(start).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(end).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe('getSlugFromParams', () => {
    it('should return slug when string', () => {
      expect(getSlugFromParams({ slug: 'alasala' })).toBe('alasala');
      expect(getSlugFromParams({ slug: 'restaurant-name' })).toBe('restaurant-name');
    });

    it('should return first slug when array', () => {
      expect(getSlugFromParams({ slug: ['alasala', 'menu'] })).toBe('alasala');
      expect(getSlugFromParams({ slug: ['first'] })).toBe('first');
    });

    it('should return empty string when slug is undefined', () => {
      expect(getSlugFromParams({})).toBe('');
      expect(getSlugFromParams({ slug: undefined })).toBe('');
    });

    it('should handle empty array', () => {
      expect(getSlugFromParams({ slug: [] })).toBe('');
    });
  });

  describe('cn (classnames helper)', () => {
    it('should join class names with space', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
      expect(cn('a', 'b', 'c')).toBe('a b c');
    });

    it('should filter out falsy values', () => {
      expect(cn('class1', false, 'class2')).toBe('class1 class2');
      expect(cn('class1', undefined, 'class2')).toBe('class1 class2');
      expect(cn('class1', null, 'class2')).toBe('class1 class2');
      expect(cn('class1', '', 'class2')).toBe('class1 class2');
    });

    it('should handle conditional classes', () => {
      const isActive = true;
      const isDisabled = false;
      expect(cn('base', isActive && 'active', isDisabled && 'disabled')).toBe('base active');
    });

    it('should return empty string when no valid classes', () => {
      expect(cn(false, undefined, null)).toBe('');
    });
  });
});
