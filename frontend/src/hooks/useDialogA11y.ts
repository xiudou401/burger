import {
  KeyboardEvent as ReactKeyboardEvent,
  RefObject,
  useEffect,
  useRef,
} from 'react';

interface UseDialogA11yOptions {
  isOpen: boolean;
  onClose: () => void;
  initialFocusRef?: RefObject<HTMLElement | null>;
  closeOnEscape?: boolean;
  lockBodyScroll?: boolean;
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const getFocusableElements = (container: HTMLElement): HTMLElement[] => {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
  ).filter((element) => {
    return (
      !element.hasAttribute('hidden') &&
      element.getAttribute('aria-hidden') !== 'true' &&
      element.offsetParent !== null
    );
  });
};

export const useDialogA11y = <TElement extends HTMLElement = HTMLElement>({
  isOpen,
  onClose,
  initialFocusRef,
  closeOnEscape = true,
  lockBodyScroll = true,
}: UseDialogA11yOptions) => {
  const dialogRef = useRef<TElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocusedElement = document.activeElement;
    const previousBodyOverflow = document.body.style.overflow;

    if (lockBodyScroll) {
      document.body.style.overflow = 'hidden';
    }

    const initialFocusElement =
      initialFocusRef?.current ??
      (dialogRef.current
        ? (getFocusableElements(dialogRef.current)[0] ?? dialogRef.current)
        : null);

    initialFocusElement?.focus();

    return () => {
      if (lockBodyScroll) {
        document.body.style.overflow = previousBodyOverflow;
      }

      if (previouslyFocusedElement instanceof HTMLElement) {
        previouslyFocusedElement.focus();
      }
    };
  }, [initialFocusRef, isOpen, lockBodyScroll]);

  const handleDialogKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape' && closeOnEscape) {
      event.preventDefault();
      onCloseRef.current();
      return;
    }

    if (event.key !== 'Tab' || !dialogRef.current) return;

    const focusableElements = getFocusableElements(dialogRef.current);

    if (focusableElements.length === 0) {
      event.preventDefault();
      dialogRef.current.focus();
      return;
    }

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault();
      lastElement.focus();
      return;
    }

    if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault();
      firstElement.focus();
    }
  };

  return {
    dialogRef,
    handleDialogKeyDown,
  };
};
