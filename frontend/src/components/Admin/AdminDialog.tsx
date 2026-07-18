import { MouseEvent, ReactNode, useCallback, useId } from 'react';
import Backdrop from '../UI/Backdrop/Backdrop';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import classes from './AdminDialog.module.css';

interface AdminDialogProps {
  title: string;
  children: ReactNode;
  description?: ReactNode;
  size?: 'normal' | 'wide';
  onClose?: () => void;
  closeDisabled?: boolean;
}

const AdminDialog = ({
  title,
  children,
  description,
  size = 'normal',
  onClose,
  closeDisabled = false,
}: AdminDialogProps) => {
  const titleId = useId();
  const descriptionId = useId();
  const canClose = Boolean(onClose) && !closeDisabled;

  const requestClose = useCallback(() => {
    if (canClose) {
      onClose?.();
    }
  }, [canClose, onClose]);

  const { dialogRef, handleDialogKeyDown } = useDialogA11y({
    isOpen: true,
    onClose: requestClose,
  });

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && canClose) {
      onClose?.();
    }
  };

  return (
    <Backdrop className={classes.Backdrop}>
      <div className={classes.BackdropContent} onClick={handleBackdropClick}>
        <section
          className={`${classes.Dialog} ${classes[size]}`}
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={description ? descriptionId : undefined}
          tabIndex={-1}
          onKeyDown={handleDialogKeyDown}
        >
          <header className={classes.Header}>
            <h2 id={titleId} className={classes.Title}>
              {title}
            </h2>
            {description && (
              <p id={descriptionId} className={classes.Description}>
                {description}
              </p>
            )}
          </header>

          {children}
        </section>
      </div>
    </Backdrop>
  );
};

export default AdminDialog;
