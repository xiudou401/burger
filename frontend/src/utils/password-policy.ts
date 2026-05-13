export const PASSWORD_POLICY_MESSAGE =
  'Password must be at least 8 characters and include uppercase, lowercase, number, and special character';

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_INPUT_PATTERN =
  '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9])\\S{8,}$';

export const validatePasswordPolicy = (password: string) => {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return false;
  }

  if (/\s/.test(password)) {
    return false;
  }

  return (
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
};
