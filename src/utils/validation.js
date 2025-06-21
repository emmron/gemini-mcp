// Input validation to prevent disasters
export function validateString(value, name, maxLength = 1000) {
  if (typeof value !== 'string') {
    throw new Error(`${name} must be a string`);
  }
  if (value.length > maxLength) {
    throw new Error(`${name} exceeds maximum length of ${maxLength}`);
  }
  return value.trim();
}

export function validateObject(value, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${name} must be a valid object`);
  }
  return value;
}

export function validatePath(filePath) {
  if (!filePath || typeof filePath !== 'string') {
    throw new Error('File path must be a string');
  }
  
  // Prevent directory traversal
  if (filePath.includes('..') || filePath.includes('~')) {
    throw new Error('Invalid file path');
  }
  
  return filePath;
}

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  // Remove potential injection attempts
  return input
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
}