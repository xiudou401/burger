import { act, fireEvent, render, screen } from '@testing-library/react';
import { test, expect, vi } from 'vitest';
import AdminMenuItemDialog from './AdminMenuItemDialog';
import { emptyMenuForm } from './utils/admin-menu-form';
import { uploadMenuImageFile } from '../api/uploads';

vi.mock('../api/uploads', () => ({ uploadMenuImageFile: vi.fn() }));

test('blocks submit during upload and ignores results after closing', async () => {
  const backdropRoot = document.createElement('div');
  backdropRoot.id = 'backdrop-root';
  document.body.append(backdropRoot);
  let resolve!: (url: string) => void;
  vi.mocked(uploadMenuImageFile).mockReturnValueOnce(
    new Promise((done) => {
      resolve = done;
    }),
  );
  const onSubmit = vi.fn();
  const updateForm = vi.fn();
  const view = render(
    <AdminMenuItemDialog
      form={emptyMenuForm}
      fieldErrors={{}}
      isEditing={false}
      isSubmitting={false}
      error={null}
      updateForm={updateForm}
      onSubmit={onSubmit}
      onClose={vi.fn()}
    />,
  );
  fireEvent.change(document.getElementById('menu-item-image-upload')!, {
    target: {
      files: [new File(['image'], 'burger.png', { type: 'image/png' })],
    },
  });
  expect(screen.getByRole('button', { name: 'Add item' })).toBeDisabled();
  fireEvent.submit(
    screen.getByRole('button', { name: 'Add item' }).closest('form')!,
  );
  expect(onSubmit).not.toHaveBeenCalled();
  view.unmount();
  await act(async () => {
    resolve('https://images.example/burger.png');
  });
  expect(updateForm).not.toHaveBeenCalled();
  backdropRoot.remove();
});
