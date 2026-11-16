/**
 * Password rules shared by the API routes (enforced) and the forms (instant feedback).
 * Pure TypeScript, no Node APIs, so it is safe to import from client components.
 *
 * Applied only when a password is SET (signup, reset). Existing accounts with older,
 * shorter passwords can still sign in.
 */

export const PASSWORD_MIN_LENGTH = 8;
/** Upper bound keeps PBKDF2 hashing cheap and blocks huge-payload abuse. */
export const PASSWORD_MAX_LENGTH = 128;

export const PASSWORD_HINT = `At least ${PASSWORD_MIN_LENGTH} characters, with a letter and a number`;

/** Most common leaked passwords that would otherwise pass the length/character rules. */
const COMMON_PASSWORDS = new Set([
  "password", "password1", "password12", "password123", "password1234", "passw0rd", "p@ssw0rd",
  "12345678", "123456789", "1234567890", "12341234", "11111111", "00000000", "87654321",
  "qwerty123", "qwertyuiop", "qwerty12", "1qaz2wsx", "1q2w3e4r", "1q2w3e4r5t", "zaq12wsx",
  "abc12345", "abcd1234", "a1b2c3d4", "iloveyou1", "welcome1", "welcome123", "admin123",
  "admin1234", "administrator1", "letmein1", "monkey123", "dragon123", "sunshine1",
  "football1", "baseball1", "princess1", "trustno1", "superman1", "batman123", "master123",
  "login123", "starwars1", "computer1", "michael1", "pakistan1", "pakistan123", "student1",
  "student123", "teacher1", "teacher123", "school123", "chemistry1", "chemistry123",
  "chemcurious", "chemcurious1", "chemcurious123", "changeme1", "test1234", "testing123",
]);

/**
 * Returns a user-facing error message, or null when the password is acceptable.
 * Pass the email so the password can't simply be the address or its name part.
 */
export function validatePassword(password: string, email?: string): string | null {
  if (typeof password !== "string" || password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`;
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Password must include at least one letter and one number.";
  }
  if (/^(.)\1+$/.test(password)) {
    return "Password can't be a single repeated character.";
  }

  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lower)) {
    return "That password is too common. Please choose something less guessable.";
  }

  if (email) {
    const normalized = email.toLowerCase().trim();
    const localPart = normalized.split("@")[0] ?? "";
    if (lower === normalized || (localPart.length >= 4 && lower.includes(localPart))) {
      return "Password can't contain your email address.";
    }
  }

  return null;
}
