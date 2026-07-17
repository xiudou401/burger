import classes from './AdminStatusText.module.css';

interface AdminStatusTextProps {
  children: string;
  tone?: 'neutral' | 'success' | 'error';
}

const AdminStatusText = ({
  children,
  tone = 'neutral',
}: AdminStatusTextProps) => {
  return <p className={`${classes.StatusText} ${classes[tone]}`}>{children}</p>;
};

export default AdminStatusText;
