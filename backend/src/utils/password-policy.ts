export const PASSWORD_POLICY_MESSAGE =
  'Password must be at least 8 characters and include uppercase, lowercase, number, and special character';

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_INPUT_PATTERN =
  '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9])\\S{8,}$';

const PASSWORD_POLICY_REGEX = new RegExp(PASSWORD_INPUT_PATTERN);

export const validatePasswordPolicy = (password: string) => {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return false;
  }

  return PASSWORD_POLICY_REGEX.test(password);
};
