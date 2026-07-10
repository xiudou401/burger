import RequirePermission from './RequirePermission';

const RequireAdmin = () => {
  return <RequirePermission permission="view_orders" />;
};

export default RequireAdmin;
