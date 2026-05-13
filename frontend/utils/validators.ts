export function validateRequired(value: string, label: string) {
  if (!value.trim()) {
    return `${label} is required.`;
  }

  return null;
}

export function validateEmail(email: string) {
  if (!email.trim()) {
    return null;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? null : 'Enter a valid email address.';
}

export function validatePhone(phone: string) {
  if (!phone.trim()) {
    return null;
  }

  return /^\+?[0-9\s-]{10,20}$/.test(phone) ? null : 'Enter a valid phone number.';
}

export function validatePassword(password: string) {
  if (!password) {
    return 'Password is required.';
  }

  const strongPasswordRegex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;

  return strongPasswordRegex.test(password)
    ? null
    : 'Use 8+ chars with upper, lower, number, and symbol.';
}

export function validateOtp(value: string) {
  return /^\d{6}$/.test(value) ? null : 'OTP must be 6 digits.';
}

export function validateNumberRange(value: string, label: string, min: number, max: number) {
  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < min || parsed > max) {
    return `${label} must be between ${min} and ${max}.`;
  }

  return null;
}
