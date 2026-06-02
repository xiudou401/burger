import { addItem, deleteItem, removeItem } from './cart-logic';

describe('addItem', () => {
  it('should add new item if it does not exist', () => {
    const result = addItem([], '1');

    expect(result).toEqual([{ id: '1', quantity: 1 }]);
  });

  it('should add new item when cart has other items', () => {
    const items = [{ id: '2', quantity: 3 }];

    const result = addItem(items, '1');

    expect(result).toHaveLength(2);
    expect(result).toEqual(expect.arrayContaining([{ id: '1', quantity: 1 }]));

    const existingItem = result.find((item) => item.id === '2');
    expect(existingItem?.quantity).toBe(3);
  });

  it('should increase quantity if item exists', () => {
    const result = addItem([{ id: '1', quantity: 1 }], '1');
    const item = result.find((item) => item.id === '1');
    expect(item?.quantity).toBe(2);
  });

  it('should not mutate original array', () => {
    const original = [{ id: '1', quantity: 1 }];
    const result = addItem(original, '1');

    expect(original[0].quantity).toBe(1);
    expect(result).not.toBe(original);
  });

  it('should not mutate original item object', () => {
    const original = [{ id: '1', quantity: 1 }];
    const result = addItem(original, '1');

    expect(result[0]).not.toBe(original[0]);
  });
});

describe('removeItem', () => {
  it('should decrease quantity if item exists', () => {
    const result = removeItem([{ id: '1', quantity: 3 }], '1');

    expect(result).toEqual([{ id: '1', quantity: 2 }]);
  });

  it('should remove item when quantity reaches zero', () => {
    const result = removeItem([{ id: '1', quantity: 1 }], '1');

    expect(result).toEqual([]);
  });

  it('should keep other items unchanged', () => {
    const result = removeItem(
      [
        { id: '1', quantity: 2 },
        { id: '2', quantity: 4 },
      ],
      '1',
    );

    expect(result).toEqual([
      { id: '1', quantity: 1 },
      { id: '2', quantity: 4 },
    ]);
  });

  it('should return equivalent items if item does not exist', () => {
    const items = [{ id: '1', quantity: 2 }];

    const result = removeItem(items, '2');

    expect(result).toEqual(items);
  });

  it('should not mutate original array or item object', () => {
    const original = [{ id: '1', quantity: 2 }];
    const result = removeItem(original, '1');

    expect(original).toEqual([{ id: '1', quantity: 2 }]);
    expect(result).not.toBe(original);
    expect(result[0]).not.toBe(original[0]);
  });
});

describe('deleteItem', () => {
  it('should delete matching item', () => {
    const result = deleteItem(
      [
        { id: '1', quantity: 2 },
        { id: '2', quantity: 4 },
      ],
      '1',
    );

    expect(result).toEqual([{ id: '2', quantity: 4 }]);
  });

  it('should return equivalent items if item does not exist', () => {
    const items = [{ id: '1', quantity: 2 }];

    const result = deleteItem(items, '2');

    expect(result).toEqual(items);
  });

  it('should not mutate original array', () => {
    const original = [{ id: '1', quantity: 2 }];
    const result = deleteItem(original, '1');

    expect(original).toEqual([{ id: '1', quantity: 2 }]);
    expect(result).not.toBe(original);
  });
});
