/**
 * URL validation utilities for security
 * Prevents open redirect and XSS attacks
 */

/**
 * Validates if a URL is safe to open
 * Only allows http, https, and data URLs
 * Prevents javascript: and other dangerous protocols
 */
export function isValidUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  try {
    const parsedUrl = new URL(url, window.location.origin);
    const protocol = parsedUrl.protocol.toLowerCase();

    // Only allow safe protocols
    const allowedProtocols = ['http:', 'https:', 'data:'];
    if (!allowedProtocols.includes(protocol)) {
      console.warn('Blocked unsafe URL protocol:', protocol);
      return false;
    }

    // Block javascript: and other dangerous protocols
    if (url.toLowerCase().trim().startsWith('javascript:')) {
      console.warn('Blocked javascript: URL');
      return false;
    }

    // For data URLs, only allow safe MIME types
    if (protocol === 'data:') {
      const dataUrlPattern = /^data:(image|application\/pdf|video)\/[^;]+;base64,/i;
      if (!dataUrlPattern.test(url)) {
        console.warn('Blocked unsafe data URL');
        return false;
      }
    }

    return true;
  } catch (error) {
    // Invalid URL format
    console.warn('Invalid URL format:', url);
    return false;
  }
}

/**
 * Safely opens a URL in a new window/tab
 * Validates the URL before opening
 */
export function safeOpenUrl(url: string | null | undefined, target: string = '_blank'): boolean {
  if (!isValidUrl(url)) {
    console.error('Attempted to open invalid URL:', url);
    return false;
  }

  // At this point, we know url is valid (not null/undefined) due to isValidUrl check
  if (!url) {
    return false;
  }

  try {
    window.open(url, target, 'noopener,noreferrer');
    return true;
  } catch (error) {
    console.error('Error opening URL:', error);
    return false;
  }
}

/**
 * Validates if a URL is from an allowed domain
 * Useful for restricting URLs to specific domains (e.g., Supabase)
 */
export function isAllowedDomain(
  url: string | null | undefined,
  allowedDomains: string[]
): boolean {
  if (!isValidUrl(url)) {
    return false;
  }

  // At this point, we know url is valid (not null/undefined) due to isValidUrl check
  if (!url) {
    return false;
  }

  try {
    const parsedUrl = new URL(url, window.location.origin);
    const hostname = parsedUrl.hostname.toLowerCase();

    return allowedDomains.some((domain) => {
      const normalizedDomain = domain.toLowerCase().replace(/^https?:\/\//, '');
      return hostname === normalizedDomain || hostname.endsWith('.' + normalizedDomain);
    });
  } catch (error) {
    return false;
  }
}

