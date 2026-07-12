import {
  buildMenuItemPayload,
  menuItemToForm,
  validateMenuItemForm,
} from './admin-menu-form';

const validForm = {
  name: ' Classic Burger ',
  description: ' Fresh beef ',
  price: '12.50',
  image: ' /img/meals/1.png ',
  category: 'burger' as const,
  isAvailable: true,
  isFeatured: false,
};

describe('admin menu form helpers', () => {
  test('builds a trimmed menu item payload with cents pricing', () => {
    expect(buildMenuItemPayload(validForm)).toEqual({
      name: 'Classic Burger',
      description: 'Fresh beef',
      priceCents: 1250,
      image: '/img/meals/1.png',
      category: 'burger',
      isAvailable: true,
      isFeatured: false,
    });
  });

  test.each(['', '   '])('rejects blank names', (name) => {
    expect(() => buildMenuItemPayload({ ...validForm, name })).toThrow(
      'Name is required',
    );
  });

  test.each(['', '0', '-1', 'abc'])('rejects invalid prices', (price) => {
    expect(() => buildMenuItemPayload({ ...validForm, price })).toThrow(
      'Price must be greater than 0',
    );
  });

  test('keeps image optional', () => {
    expect(buildMenuItemPayload({ ...validForm, image: ' ' }).image).toBe('');
  });

  test('accepts app paths and http image URLs', () => {
    expect(
      validateMenuItemForm({ ...validForm, image: '/img/item.png' }),
    ).toEqual({});
    expect(
      validateMenuItemForm({
        ...validForm,
        image: 'https://example.com/item.png',
      }),
    ).toEqual({});
  });

  test('returns field-level errors', () => {
    expect(
      validateMenuItemForm({
        ...validForm,
        name: ' ',
        price: '0',
        image: 'not a url',
      }),
    ).toEqual({
      name: 'Name is required',
      price: 'Price must be greater than 0',
      image: 'Image must be a URL or app path',
    });
  });

  test('maps menu items into editable form state', () => {
    expect(
      menuItemToForm({
        name: 'Classic Burger',
        priceCents: 1200,
        category: 'burger',
        isAvailable: true,
        isFeatured: true,
      }),
    ).toEqual({
      name: 'Classic Burger',
      description: '',
      price: '12.00',
      image: '',
      category: 'burger',
      isAvailable: true,
      isFeatured: true,
    });
  });
});
