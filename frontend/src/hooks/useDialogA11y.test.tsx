import { fireEvent, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { useDialogA11y } from './useDialogA11y';

interface DialogHarnessProps {
  initialFocus?: 'first' | 'second';
  isOpen?: boolean;
  lockBodyScroll?: boolean;
  onClose?: () => void;
}

const DialogHarness = ({
  initialFocus,
  isOpen = true,
  lockBodyScroll = true,
  onClose = () => {},
}: DialogHarnessProps) => {
  const firstButtonRef = useRef<HTMLButtonElement | null>(null);
  const secondButtonRef = useRef<HTMLButtonElement | null>(null);

  const { dialogRef, handleDialogKeyDown } = useDialogA11y<HTMLDivElement>({
    isOpen,
    onClose,
    initialFocusRef:
      initialFocus === 'first'
        ? firstButtonRef
        : initialFocus === 'second'
          ? secondButtonRef
          : undefined,
    lockBodyScroll,
  });

  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      role="dialog"
      tabIndex={-1}
      onKeyDown={handleDialogKeyDown}
    >
      <button ref={firstButtonRef} type="button">
        First action
      </button>
      <button ref={secondButtonRef} type="button">
        Second action
      </button>
    </div>
  );
};

const makeFocusableElementsVisible = () => {
  Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
    configurable: true,
    get() {
      return document.body;
    },
  });
};

const restoreOffsetParent = (
  originalOffsetParent: PropertyDescriptor | undefined,
) => {
  if (originalOffsetParent) {
    Object.defineProperty(
      HTMLElement.prototype,
      'offsetParent',
      originalOffsetParent,
    );
    return;
  }

  delete (HTMLElement.prototype as { offsetParent?: HTMLElement | null })
    .offsetParent;
};

describe('useDialogA11y', () => {
  const originalOffsetParent = Object.getOwnPropertyDescriptor(
    HTMLElement.prototype,
    'offsetParent',
  );

  beforeEach(() => {
    makeFocusableElementsVisible();
  });

  afterEach(() => {
    restoreOffsetParent(originalOffsetParent);
    document.body.style.overflow = '';
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = jest.fn();

    render(<DialogHarness onClose={onClose} />);

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('loops focus between the first and last focusable elements on Tab', () => {
    render(<DialogHarness />);

    const dialog = screen.getByRole('dialog');
    const firstButton = screen.getByRole('button', { name: 'First action' });
    const secondButton = screen.getByRole('button', { name: 'Second action' });

    firstButton.focus();
    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });

    expect(secondButton).toHaveFocus();

    fireEvent.keyDown(dialog, { key: 'Tab' });

    expect(firstButton).toHaveFocus();
  });

  it('focuses the initial focus ref when the dialog opens', () => {
    render(<DialogHarness initialFocus="second" />);

    expect(screen.getByRole('button', { name: 'Second action' })).toHaveFocus();
  });

  it('locks body scroll while open and restores it on unmount', () => {
    const opener = document.createElement('button');
    document.body.append(opener);
    opener.focus();
    document.body.style.overflow = 'auto';

    const { unmount } = render(<DialogHarness />);

    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('auto');
    expect(opener).toHaveFocus();

    opener.remove();
  });
});
