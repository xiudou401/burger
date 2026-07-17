import AccountDetailsCard from '../components/Profile/AccountDetailsCard';
import CurrentCartCard from '../components/Profile/CurrentCartCard';
import ProfilePageLayout from '../components/Profile/ProfilePageLayout';
import QuickActionsCard from '../components/Profile/QuickActionsCard';
import RecentOrdersCard from '../components/Profile/RecentOrdersCard';
import { useProfilePage } from './hooks/useProfilePage';

const Profile = () => {
  const {
    user,
    totalQuantity,
    estimatedTotalCents,
    hasCartItems,
    orders,
    isLoadingOrders,
    ordersError,
    verificationMessage,
    verificationError,
    isSendingVerification,
    resendVerification,
    logout,
  } = useProfilePage();

  return (
    <ProfilePageLayout
      main={
        <>
          <AccountDetailsCard
            user={user}
            verificationMessage={verificationMessage}
            verificationError={verificationError}
            isSendingVerification={isSendingVerification}
            onResendVerification={resendVerification}
          />
          <RecentOrdersCard
            orders={orders}
            isLoading={isLoadingOrders}
            error={ordersError}
          />
        </>
      }
      side={
        <>
          <CurrentCartCard
            totalQuantity={totalQuantity}
            estimatedTotalCents={estimatedTotalCents}
            hasCartItems={hasCartItems}
          />
          <QuickActionsCard onLogout={logout} />
        </>
      }
    />
  );
};

export default Profile;
