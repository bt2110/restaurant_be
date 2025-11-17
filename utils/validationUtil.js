/** Validation Utility - Reusable validation functions */

// Check valid email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Check password strength: 8+ chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
const validatePasswordStrength = (password) => {
  const errors = [];

  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain at least one special character (!@#$%^&*)');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate string length
const validateStringLength = (str, minLength = 1, maxLength = 255) => {
  if (!str || str.trim().length === 0) {
    return { isValid: false, error: 'String cannot be empty' };
  }
  if (str.length < minLength) {
    return { isValid: false, error: `String must be at least ${minLength} characters` };
  }
  if (str.length > maxLength) {
    return { isValid: false, error: `String must not exceed ${maxLength} characters` };
  }
  return { isValid: true, error: null };
};

// Validate required fields
const validateRequiredFields = (obj, requiredFields = []) => {
  const missingFields = [];

  for (const field of requiredFields) {
    if (!obj[field] || (typeof obj[field] === 'string' && obj[field].trim() === '')) {
      missingFields.push(field);
    }
  }

  return {
    isValid: missingFields.length === 0,
    missingFields
  };
};

// Validate numeric value
const validateNumber = (value, min = null, max = null) => {
  const num = Number(value);

  if (isNaN(num)) {
    return { isValid: false, error: 'Value must be a number' };
  }

  if (min !== null && num < min) {
    return { isValid: false, error: `Value must be at least ${min}` };
  }

  if (max !== null && num > max) {
    return { isValid: false, error: `Value must not exceed ${max}` };
  }

  return { isValid: true, error: null };
};

// Validate enum value (checks if value exists in allowed set)
const validateEnum = (value, allowedValues = []) => {
  if (!allowedValues.includes(value)) {
    return {
      isValid: false,
      error: `Value must be one of: ${allowedValues.join(', ')}`
    };
  }
  return { isValid: true, error: null };
};

// Batch validate multiple fields
const batchValidate = (data, schema) => {
  const errors = {};

  for (const [field, rules] of Object.entries(schema)) {
    const value = data[field];

    // Check required
    if (rules.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      errors[field] = `${field} is required`;
      continue;
    }

    if (!value) continue; // Skip validation if optional and empty

    // Type-specific validation
    switch (rules.type) {
      case 'email':
        if (!isValidEmail(value)) {
          errors[field] = 'Invalid email format';
        }
        break;

      case 'password':
        const pwdValidation = validatePasswordStrength(value);
        if (!pwdValidation.isValid) {
          errors[field] = pwdValidation.errors[0];
        }
        break;

      case 'number':
        const numValidation = validateNumber(value, rules.min, rules.max);
        if (!numValidation.isValid) {
          errors[field] = numValidation.error;
        }
        break;

      case 'enum':
        const enumValidation = validateEnum(value, rules.allowedValues);
        if (!enumValidation.isValid) {
          errors[field] = enumValidation.error;
        }
        break;

      case 'string':
        const strValidation = validateStringLength(value, rules.minLength, rules.maxLength);
        if (!strValidation.isValid) {
          errors[field] = strValidation.error;
        }
        break;

      case 'url':
        try {
          new URL(value);
        } catch {
          errors[field] = 'Invalid URL format';
        }
        break;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

module.exports = {
  isValidEmail,
  validatePasswordStrength,
  validateStringLength,
  validateRequiredFields,
  validateNumber,
  validateEnum,
  batchValidate
};
