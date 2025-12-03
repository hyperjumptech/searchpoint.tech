import crypto from "crypto";

const ENCRYPTION_KEY = "scse-license-key-secret-32-chars"; // 32 bytes key
const IV_LENGTH = 16; // AES block size

/**
 * Encrypts text using AES-256-CBC
 * @param {string} text - Text to encrypt
 * @returns {string} - Encrypted text (base64)
 */
function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY, "utf8"),
    iv,
  );
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
}

/**
 * Decrypts text using AES-256-CBC
 * @param {string} encryptedText - Encrypted text (hex with IV)
 * @returns {string} - Decrypted text
 */
function decrypt(encryptedText: string): string {
  const parts = encryptedText.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(ENCRYPTION_KEY, "utf8"),
    iv,
  );
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

/**
 * Generates a license key for a user
 * @param {string} userId - User email
 * @param {string} userRole - User role
 * @param {string} deviceOs - Device OS
 * @returns {string} - Encrypted license key
 */
function generateLicenseKey(
  userId: string,
  userRole: string,
  deviceOs: string,
): string {
  const licenseData = {
    user_id: userId,
    user_role: userRole,
    device_os: deviceOs,
    issued_at: new Date().toISOString(),
    version: "1.0",
  };

  const jsonData = JSON.stringify(licenseData);
  return encrypt(jsonData);
}

/**
 * Formats license key for display (adds dashes for readability)
 * @param {string} licenseKey - Raw license key
 * @returns {string} - Formatted license key
 */
function formatLicenseKey(licenseKey: string): string {
  // Remove any existing formatting
  const clean = licenseKey.replace(/[^A-Za-z0-9]/g, "");

  // Add dashes every 4 characters for readability
  const formatted = clean.match(/.{1,4}/g)?.join("-") || clean;

  return formatted.toUpperCase();
}

// Export functions for use in API routes
export { encrypt, decrypt, generateLicenseKey, formatLicenseKey };
