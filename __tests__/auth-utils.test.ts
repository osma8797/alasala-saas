import { describe, it, expect } from 'vitest';

/**
 * Auth Utility Functions
 * These functions validate user input for authentication
 */

// Validation functions that could be extracted to a separate file
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || email.trim() === '') {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  return { valid: true };
}

export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password || password === '') {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 6) {
    return { valid: false, error: 'Password must be at least 6 characters' };
  }

  return { valid: true };
}

export function validateFullName(name: string): { valid: boolean; error?: string } {
  if (!name || name.trim() === '') {
    return { valid: false, error: 'Full name is required' };
  }

  if (name.trim().length < 2) {
    return { valid: false, error: 'Full name must be at least 2 characters' };
  }

  if (name.length > 100) {
    return { valid: false, error: 'Full name must be less than 100 characters' };
  }

  return { valid: true };
}

export function validateSignUpForm(data: {
  email: string;
  password: string;
  fullName: string;
}): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  const emailResult = validateEmail(data.email);
  if (!emailResult.valid && emailResult.error) {
    errors.email = emailResult.error;
  }

  const passwordResult = validatePassword(data.password);
  if (!passwordResult.valid && passwordResult.error) {
    errors.password = passwordResult.error;
  }

  const nameResult = validateFullName(data.fullName);
  if (!nameResult.valid && nameResult.error) {
    errors.fullName = nameResult.error;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Tests
describe('Auth Utilities', () => {
  describe('validateEmail', () => {
    it('should return valid for correct email', () => {
      expect(validateEmail('test@example.com')).toEqual({ valid: true });
      expect(validateEmail('user.name@domain.co.uk')).toEqual({ valid: true });
    });

    it('should return error for empty email', () => {
      expect(validateEmail('')).toEqual({
        valid: false,
        error: 'Email is required',
      });
      expect(validateEmail('   ')).toEqual({
        valid: false,
        error: 'Email is required',
      });
    });

    it('should return error for invalid email format', () => {
      expect(validateEmail('invalid')).toEqual({
        valid: false,
        error: 'Please enter a valid email address',
      });
      expect(validateEmail('invalid@')).toEqual({
        valid: false,
        error: 'Please enter a valid email address',
      });
      expect(validateEmail('@domain.com')).toEqual({
        valid: false,
        error: 'Please enter a valid email address',
      });
    });
  });

  describe('validatePassword', () => {
    it('should return valid for correct password', () => {
      expect(validatePassword('password123')).toEqual({ valid: true });
      expect(validatePassword('123456')).toEqual({ valid: true });
    });

    it('should return error for empty password', () => {
      expect(validatePassword('')).toEqual({
        valid: false,
        error: 'Password is required',
      });
    });

    it('should return error for short password', () => {
      expect(validatePassword('12345')).toEqual({
        valid: false,
        error: 'Password must be at least 6 characters',
      });
      expect(validatePassword('abc')).toEqual({
        valid: false,
        error: 'Password must be at least 6 characters',
      });
    });
  });

  describe('validateFullName', () => {
    it('should return valid for correct name', () => {
      expect(validateFullName('John Doe')).toEqual({ valid: true });
      expect(validateFullName('Ahmed')).toEqual({ valid: true });
    });

    it('should return error for empty name', () => {
      expect(validateFullName('')).toEqual({
        valid: false,
        error: 'Full name is required',
      });
      expect(validateFullName('   ')).toEqual({
        valid: false,
        error: 'Full name is required',
      });
    });

    it('should return error for too short name', () => {
      expect(validateFullName('A')).toEqual({
        valid: false,
        error: 'Full name must be at least 2 characters',
      });
    });

    it('should return error for too long name', () => {
      const longName = 'A'.repeat(101);
      expect(validateFullName(longName)).toEqual({
        valid: false,
        error: 'Full name must be less than 100 characters',
      });
    });
  });

  describe('validateSignUpForm', () => {
    it('should return valid for correct form data', () => {
      const result = validateSignUpForm({
        email: 'test@example.com',
        password: 'password123',
        fullName: 'John Doe',
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should return all errors for invalid form', () => {
      const result = validateSignUpForm({
        email: 'invalid',
        password: '123',
        fullName: '',
      });

      expect(result.valid).toBe(false);
      expect(result.errors.email).toBe('Please enter a valid email address');
      expect(result.errors.password).toBe('Password must be at least 6 characters');
      expect(result.errors.fullName).toBe('Full name is required');
    });

    it('should return partial errors', () => {
      const result = validateSignUpForm({
        email: 'test@example.com',
        password: '123',
        fullName: 'John',
      });

      expect(result.valid).toBe(false);
      expect(result.errors.email).toBeUndefined();
      expect(result.errors.password).toBe('Password must be at least 6 characters');
      expect(result.errors.fullName).toBeUndefined();
    });
  });

  describe('sanitizeEmail', () => {
    it('should lowercase email', () => {
      expect(sanitizeEmail('Test@EXAMPLE.com')).toBe('test@example.com');
    });

    it('should trim whitespace', () => {
      expect(sanitizeEmail('  test@example.com  ')).toBe('test@example.com');
    });

    it('should handle both trim and lowercase', () => {
      expect(sanitizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
    });
  });

  describe('getInitials', () => {
    it('should return initials from full name', () => {
      expect(getInitials('John Doe')).toBe('JD');
      expect(getInitials('Ahmed Mohamed Ali')).toBe('AM');
    });

    it('should handle single name', () => {
      expect(getInitials('John')).toBe('J');
    });

    it('should uppercase initials', () => {
      expect(getInitials('john doe')).toBe('JD');
    });

    it('should limit to 2 characters', () => {
      expect(getInitials('A B C D E')).toBe('AB');
    });
  });
});
