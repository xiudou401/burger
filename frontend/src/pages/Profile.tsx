import AccountDetailsCard from '../components/Profile/AccountDetailsCard';
import CurrentCartCard from '../components/Profile/CurrentCartCard';
import ProfilePageLayout from '../components/Profile/ProfilePageLayout';
import RecentOrdersCard from '../components/Profile/RecentOrdersCard';
import { useProfilePage } from './hooks/useProfilePage';

const Profile = () => {
  const {
    user,
    totalQuantity,
    estimatedTotalCents,
    hasCartItems,
    canCreateOrder,
    orders,
    canViewOwnOrders,
    isLoadingOrders,
    ordersError,
    verificationMessage,
    verificationError,
    isSendingVerification,
    resendVerification,
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
          {canViewOwnOrders && (
            <RecentOrdersCard
              orders={orders}
              isLoading={isLoadingOrders}
              error={ordersError}
            />
          )}
        </>
      }
      side={
        canCreateOrder ? (
          <CurrentCartCard
            totalQuantity={totalQuantity}
            estimatedTotalCents={estimatedTotalCents}
            hasCartItems={hasCartItems}
          />
        ) : undefined
      }
    />
  );
};

export default Profile;
