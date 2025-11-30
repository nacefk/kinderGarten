/**
 * Input validation utilities
 */
export const validation = {
  /**
   * Validate email format
   */
  email: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Validate password (minimum 8 characters)
   */
  password: (password: string): boolean => {
    return password.length >= 8;
  },

  /**
   * Validate phone number (10+ digits, spaces, hyphens, +)
   */
  phone: (phone: string): boolean => {
    const phoneRegex = /^\+?[\d\s\-()]{10,}$/;
    return phoneRegex.test(phone);
  },

  /**
   * Validate name (2-100 characters, no special chars except spaces)
   */
  name: (name: string): boolean => {
    if (name.length < 2 || name.length > 100) return false;
    return /^[a-zA-Z\s'-]+$/.test(name);
  },

  /**
   * Validate slug (lowercase, numbers, hyphens only)
   */
  slug: (slug: string): boolean => {
    return /^[a-z0-9-]+$/.test(slug.toLowerCase());
  },

  /**
   * Validate username (alphanumeric and hyphens, 3-50 chars)
   */
  username: (username: string): boolean => {
    if (username.length < 3 || username.length > 50) return false;
    return /^[a-zA-Z0-9-]+$/.test(username);
  },

  /**
   * Validate date format (YYYY-MM-DD)
   */
  dateFormat: (date: string): boolean => {
    return /^\d{4}-\d{2}-\d{2}$/.test(date);
  },

  /**
   * Validate URL
   */
  url: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Validate required field
   */
  required: (value: any): boolean => {
    if (typeof value === "string") return value.trim().length > 0;
    return value !== null && value !== undefined;
  },
};

/**
 * Get validation error message
 */
export function getValidationMessage(field: string, type: string): string {
  const messages: Record<string, Record<string, string>> = {
    username: {
      required: "Username is required",
      invalid: "Username must contain only letters, numbers, and hyphens (3-50 characters)",
    },
    password: {
      required: "Password is required",
      invalid: "Password must be at least 8 characters",
    },
    tenant: {
      required: "Tenant slug is required",
      invalid: "Tenant must contain only lowercase letters, numbers, and hyphens",
    },
    phone: {
      required: "Phone number is required",
      invalid: "Phone number must be at least 10 digits",
    },
    name: {
      required: "Name is required",
      invalid: "Name must be 2-100 characters with only letters, spaces, hyphens, and apostrophes",
    },
    email: {
      required: "Email is required",
      invalid: "Please enter a valid email address",
    },
  };

  return messages[field]?.[type] || `Invalid ${field}`;
}

/**
 * Convert a tenant name to slug format
 * Example: "New Kindergarten" → "new-kindergarten"
 */
export function convertToSlug(tenantName: string): string {
  return tenantName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^a-z0-9-]/g, "") // Remove special characters
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}
