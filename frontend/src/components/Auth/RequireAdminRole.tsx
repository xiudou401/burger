import RequirePermission from './RequirePermission';

const RequireAdminRole = () => {
  return <RequirePermission permission="manage_menu" />;
};

export default RequireAdminRole;
