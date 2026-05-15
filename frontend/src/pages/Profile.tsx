import AccountDetailsCard from '../components/Profile/AccountDetailsCard';
import CurrentCartCard from '../components/Profile/CurrentCartCard';
import ProfileHero from '../components/Profile/ProfileHero';
import ProfilePageLayout from '../components/Profile/ProfilePageLayout';
import QuickActionsCard from '../components/Profile/QuickActionsCard';
import RecentOrdersCard from '../components/Profile/RecentOrdersCard';
import { useProfilePage } from './hooks/useProfilePage';

const Profile = () => {
  const {
    user,
    initial,
    firstName,
    accountStatus,
    totalQuantity,
    estimatedTotalPrice,
    hasCartItems,
    verificationMessage,
    verificationError,
    isSendingVerification,
    phone,
    setPhone,
    smsCode,
    setSmsCode,
    smsMessage,
    smsError,
    devSmsCode,
    isSendingSms,
    isVerifyingSms,
    resendVerification,
    sendPhoneCode,
    verifyPhoneCode,
    logout,
  } = useProfilePage();

  return (
    <ProfilePageLayout
      hero={
        <ProfileHero
          initial={initial}
          firstName={firstName}
          accountStatus={accountStatus}
          contact={user?.email ?? user?.phone}
        />
      }
      main={
        <>
          <AccountDetailsCard
            user={user}
            verificationMessage={verificationMessage}
            verificationError={verificationError}
            isSendingVerification={isSendingVerification}
            onResendVerification={resendVerification}
            phone={phone}
            onPhoneChange={setPhone}
            smsCode={smsCode}
            onSmsCodeChange={setSmsCode}
            smsMessage={smsMessage}
            smsError={smsError}
            devSmsCode={devSmsCode}
            isSendingSms={isSendingSms}
            isVerifyingSms={isVerifyingSms}
            onSendPhoneCode={sendPhoneCode}
            onVerifyPhoneCode={verifyPhoneCode}
          />
          <RecentOrdersCard />
        </>
      }
      side={
        <>
          <CurrentCartCard
            totalQuantity={totalQuantity}
            estimatedTotalPrice={estimatedTotalPrice}
            hasCartItems={hasCartItems}
          />
          <QuickActionsCard onLogout={logout} />
        </>
      }
    />
  );
};

export default Profile;
