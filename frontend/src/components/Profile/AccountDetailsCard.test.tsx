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
};

describe('AccountDetailsCard', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('shows account verification details without phone linking controls', () => {
    render(<AccountDetailsCard {...baseProps} />);

    expect(screen.getByText('Email status')).toBeInTheDocument();
    expect(screen.getByText('Phone status')).toBeInTheDocument();
    expect(screen.queryByText('Link phone number')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /verify phone/i })).toBeNull();
  });
});
