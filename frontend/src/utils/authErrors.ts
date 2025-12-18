export interface AuthError {
  message: string;
  type: 'email_exists' | 'provider_mismatch' | 'invalid_credentials' | 'network_error' | 'unknown';
  suggestedAction?: string;
}

export const parseAuthError = (error: any): AuthError => {
  if (!error) {
    return {
      message: 'An unexpected error occurred',
      type: 'unknown'
    };
  }

  const errorMessage = error.message || error.toString();
  const lowerMessage = errorMessage.toLowerCase();

  // Check for email already exists with different provider
  if (lowerMessage.includes('email') && lowerMessage.includes('already registered')) {
    return {
      message: 'An account with this email already exists. Please sign in with the original method you used to create your account.',
      type: 'email_exists',
      suggestedAction: 'Try signing in with your original authentication method (email/password, Google, or Facebook).'
    };
  }

  // Check for provider mismatch
  if (lowerMessage.includes('provider') && lowerMessage.includes('mismatch')) {
    return {
      message: 'This email is already registered with a different sign-in method. Please use the original method you used to create your account.',
      type: 'provider_mismatch',
      suggestedAction: 'If you created your account with Google, use Google sign-in. If you used email/password, use that instead.'
    };
  }

  // Check for invalid credentials
  if (lowerMessage.includes('invalid') && (lowerMessage.includes('credentials') || lowerMessage.includes('password'))) {
    return {
      message: 'Invalid email or password. Please check your credentials and try again.',
      type: 'invalid_credentials',
      suggestedAction: 'Make sure your email and password are correct, or try signing in with a different method.'
    };
  }

  // Check for network errors
  if (lowerMessage.includes('network') || lowerMessage.includes('fetch') || lowerMessage.includes('timeout')) {
    return {
      message: 'Network error. Please check your internet connection and try again.',
      type: 'network_error',
      suggestedAction: 'Check your internet connection and try again.'
    };
  }

  // Check for OAuth errors
  if (lowerMessage.includes('oauth') || lowerMessage.includes('provider')) {
    return {
      message: 'Authentication provider error. Please try again or use a different sign-in method.',
      type: 'provider_mismatch',
      suggestedAction: 'Try signing in with email/password, or try again with the social provider.'
    };
  }

  // Default error
  return {
    message: errorMessage || 'An unexpected error occurred. Please try again.',
    type: 'unknown',
    suggestedAction: 'Please try again or contact support if the problem persists.'
  };
};

export const getProviderName = (provider: string): string => {
  switch (provider.toLowerCase()) {
    case 'google':
      return 'Google';
    case 'facebook':
      return 'Facebook';
    case 'email':
      return 'Email/Password';
    default:
      return provider;
  }
};
