export enum AuthConstants {
  VERIFY_PREFIX = 'verify:',
  VERIFY_TTL = 600, // 10 minutes
}

export enum AuthMessage {
  INVALID_CREDENTIALS = 'Invalid email or password',
  EMAIL_ALREADY_EXISTS = 'User with this email already exists',
  USERNAME_TAKEN = 'Username is already taken',
  REGISTER_SUCCESS = 'Registration successful. Please verify your email.',
  INVALID_VERIFICATION_CODE = 'Invalid or expired verification code',
  ALREADY_VERIFIED = 'Email is already verified',
  VERIFY_SUCCESS = 'Email verified successfully',
  RESEND_CODE_SUCCESS = 'If the email is registered and unverified, a new code has been sent',
  PASSWORD_CHANGE_UNAVAILABLE = 'Password change is not available for OAuth-only accounts',
  CURRENT_PASSWORD_INCORRECT = 'Current password is incorrect',
  PASSWORD_CHANGED = 'Password changed successfully',
  SESSION_NOT_FOUND = 'Session not found',
  SESSION_REVOKED = 'Session revoked successfully',
  LOGGED_OUT = 'Logged out successfully',
  CANNOT_REVOKE_CURRENT = 'Cannot revoke current session. Use logout instead.',
}
