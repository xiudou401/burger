import { render, screen } from '@testing-library/react';
import AccountDetailsCard from './AccountDetailsCard';
import type { User } from '../../types/auth';

const user: User = {
  id: 'user-1',
  name: 'Pat',
  email: 'pat@example.com',
  role: 'customer',
  emailVerified: true,
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

  test('shows account and email verification details', () => {
    render(<AccountDetailsCard {...baseProps} />);

    expect(screen.getByText('Role')).toBeInTheDocument();
    expect(screen.getByText('Customer')).toBeInTheDocument();
    expect(screen.getByText('Account status')).toBeInTheDocument();
    expect(screen.getByText('Ready to order')).toBeInTheDocument();
    expect(screen.getByText('Email status')).toBeInTheDocument();
  });
});
