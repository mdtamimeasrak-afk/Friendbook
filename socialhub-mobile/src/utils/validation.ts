/**
 * Validation helpers for forms (login / signup).
 */

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_RE.test(email.trim());
}

/** Same rule the website uses: lowercase, alphanumeric, dot, underscore. */
export function generateUsername(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9._]/g, "");
}

export function validateSignup(name: string, email: string, password: string, confirm: string): string | null {
  if (!name.trim()) {
    return "Please enter your name.";
  }
  if (!isValidEmail(email)) {
    return "Please enter a valid email address.";
  }
  if (password.length < 6) {
    return "Password must be at least 6 characters.";
  }
  if (password !== confirm) {
    return "Passwords do not match.";
  }
  return null;
}
