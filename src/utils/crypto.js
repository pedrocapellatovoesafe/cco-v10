/**
 * Utility for basic token obfuscation/encryption to comply with security mandates.
 * Note: This is client-side obfuscation. True security depends on HTTPS and secure backend practices.
 */

const SECRET_SALT = 'cco-safe-v10-salt';

export const encrypt = (text) => {
  if (!text) return null;
  const combined = `${SECRET_SALT}:${text}`;
  return btoa(unescape(encodeURIComponent(combined)));
};

export const decrypt = (encoded) => {
  if (!encoded) return null;
  try {
    const decoded = decodeURIComponent(escape(atob(encoded)));
    const parts = decoded.split(':');
    if (parts[0] === SECRET_SALT) {
      return parts.slice(1).join(':');
    }
    return null;
  } catch (e) {
    console.error('Crypto: Failed to decrypt', e);
    return null;
  }
};
