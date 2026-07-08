import { render, screen } from '@testing-library/react';
import AccountDetailsCard from './AccountDetailsCard';
import type { User } from '../../types/auth';

const user: User = {
  id: 'user-1',
  name: 'Pat',
  email: 'pat@example.com',
  role: 'customer',
  emailVerified: true,
  phoneVerified: false,
};

const baseProps = {
  user,
  verificationMessage: null,
  verificationError: null,
  isSendingVerification: false,
  onResendVerification: jest.fn(),
  phone: '',
  onPhoneChange: jest.fn(),
  smsCode: '',
  onSmsCodeChange: jest.fn(),
  smsMessage: null,
  smsError: null,
  devSmsCode: null,
  isSendingSms: false,
  isVerifyingSms: false,
  onSendPhoneCode: jest.fn(),
  onVerifyPhoneCode: jest.fn(),
};

describe('AccountDetailsCard', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('hides SMS phone linking when SMS auth is disabled', () => {
    render(<AccountDetailsCard {...baseProps} showPhoneVerification={false} />);

    expect(screen.queryByText('Link phone number')).not.toBeInTheDocument();
    expect(screen.queryByText('Send SMS code')).not.toBeInTheDocument();
  });

  test('shows SMS phone linking when SMS auth is enabled', () => {
    render(<AccountDetailsCard {...baseProps} showPhoneVerification />);

    expect(screen.getByText('Link phone number')).toBeInTheDocument();
    expect(screen.getByText('Send SMS code')).toBeInTheDocument();
  });
});
