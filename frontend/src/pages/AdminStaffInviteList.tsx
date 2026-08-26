import AdminButton from '../components/Admin/AdminButton';
import AdminCard from '../components/Admin/AdminCard';
import AdminStatusText from '../components/Admin/AdminStatusText';
import type { StaffInvite } from '../types/staff-invite';
import { formatShortDateTime } from '../utils/date';
import classes from './AdminStaff.module.css';

interface AdminStaffInviteListProps {
  invites: StaffInvite[];
  isLoading: boolean;
  onRevoke: (inviteId: string) => void;
}

const AdminStaffInviteList = ({
  invites,
  isLoading,
  onRevoke,
}: AdminStaffInviteListProps) => {
  return (
    <AdminCard>
      <h2 className={classes.CardTitle}>Invitations</h2>

      {isLoading && <AdminStatusText>Loading invites...</AdminStatusText>}
      {!isLoading && invites.length === 0 && (
        <AdminStatusText>No invites yet.</AdminStatusText>
      )}

      <div className={classes.InviteList}>
        {invites.map((invite) => (
          <article className={classes.InviteRow} key={invite.id}>
            <div>
              <strong className={classes.Email}>{invite.email}</strong>
              <p className={classes.Meta}>
                {invite.role} · {invite.status} · expires{' '}
                {formatShortDateTime(invite.expiresAt)}
              </p>
            </div>

            {invite.status === 'pending' && (
              <AdminButton
                variant="danger"
                type="button"
                onClick={() => onRevoke(invite.id)}
              >
                Revoke
              </AdminButton>
            )}
          </article>
        ))}
      </div>
    </AdminCard>
  );
};

export default AdminStaffInviteList;
