import bcrypt from 'bcryptjs';

const strongPasswordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,64}$/;

export function validatePasswordStrength(password: string) {
  if (!strongPasswordRegex.test(password)) {
    throw new Error(
      'Password must be 8-64 characters and include upper, lower, number, and special character.'
    );
  }
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
