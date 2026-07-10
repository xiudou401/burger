import { menuItemRepository } from '../repositories/menu-item.repository';
import { bumpMenuVersion, getMenuVersion } from './menu.service';
import { recordAuditLog } from './audit-log.service';
import {
  createMenuItem,
  deleteMenuItem,
  findAllMenuItems,
  updateMenuItem,
} from './menu-item.service';

jest.mock('./menu.service', () => ({
  bumpMenuVersion: jest.fn(),
  getMenuVersion: jest.fn(),
}));

jest.mock('./audit-log.service', () => ({
  recordAuditLog: jest.fn(),
}));

jest.mock('../repositories/menu-item.repository', () => ({
  menuItemRepository: {
    create: jest.fn(),
    deleteById: jest.fn(),
    findById: jest.fn(),
    findPage: jest.fn(),
    count: jest.fn(),
    updateById: jest.fn(),
  },
}));

describe('menu item service', () => {
  const adminActor = {
    id: '507f1f77bcf86cd799439011',
    role: 'admin' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(menuItemRepository.findPage).mockResolvedValue([]);
    jest.mocked(menuItemRepository.count).mockResolvedValue(0);
    jest.mocked(getMenuVersion).mockResolvedValue(1);
    jest.mocked(bumpMenuVersion).mockResolvedValue(2);
  });

  test('escapes search keywords before building regex queries', async () => {
    await findAllMenuItems({ keyword: '.*burger?' });

    const expectedQuery = {
      $or: [
        { name: { $regex: '\\.\\*burger\\?', $options: 'i' } },
        { description: { $regex: '\\.\\*burger\\?', $options: 'i' } },
      ],
    };

    expect(menuItemRepository.findPage).toHaveBeenCalledWith(
      expect.objectContaining({ query: expectedQuery }),
    );
    expect(menuItemRepository.count).toHaveBeenCalledWith(expectedQuery);
  });

  test('bumps menu version after creating a menu item', async () => {
    jest.mocked(menuItemRepository.create).mockResolvedValue({
      _id: 'menu-item-1',
      name: 'Classic Burger',
      priceCents: 1200,
      category: 'burger',
      isAvailable: true,
      isFeatured: false,
    } as never);

    await createMenuItem(
      {
        name: 'Classic Burger',
        priceCents: 1200,
        category: 'burger',
        isAvailable: true,
        isFeatured: false,
      },
      adminActor,
    );

    expect(bumpMenuVersion).toHaveBeenCalledTimes(1);
    expect(recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: adminActor.id,
        actorRole: 'admin',
        action: 'menu_item.created',
        entityType: 'menu_item',
        entityId: 'menu-item-1',
      }),
    );
  });

  test('bumps menu version after updating a menu item', async () => {
    jest.mocked(menuItemRepository.findById).mockResolvedValue({
      _id: 'menu-item-1',
      name: 'Classic Burger',
      priceCents: 1200,
      category: 'burger',
      isAvailable: true,
      isFeatured: false,
    } as never);
    jest.mocked(menuItemRepository.updateById).mockResolvedValue({
      _id: 'menu-item-1',
      name: 'Classic Burger',
      priceCents: 1300,
      category: 'burger',
      isAvailable: true,
      isFeatured: false,
    } as never);

    await updateMenuItem(
      'menu-item-1',
      {
        name: 'Classic Burger',
        priceCents: 1300,
        category: 'burger',
        isAvailable: true,
        isFeatured: false,
      },
      adminActor,
    );

    expect(bumpMenuVersion).toHaveBeenCalledTimes(1);
    expect(recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: adminActor.id,
        actorRole: 'admin',
        action: 'menu_item.updated',
        entityType: 'menu_item',
        entityId: 'menu-item-1',
        before: expect.objectContaining({ priceCents: 1200 }),
        after: expect.objectContaining({ priceCents: 1300 }),
      }),
    );
  });

  test('does not bump menu version when updating a missing menu item', async () => {
    jest.mocked(menuItemRepository.updateById).mockResolvedValue(null);

    await expect(
      updateMenuItem('missing-menu-item', {
        name: 'Classic Burger',
        priceCents: 1300,
        category: 'burger',
        isAvailable: true,
        isFeatured: false,
      }),
    ).rejects.toThrow('Menu item not found');

    expect(bumpMenuVersion).not.toHaveBeenCalled();
  });

  test('bumps menu version after deleting a menu item', async () => {
    jest.mocked(menuItemRepository.deleteById).mockResolvedValue({
      _id: 'menu-item-1',
      name: 'Classic Burger',
      priceCents: 1200,
      category: 'burger',
      isAvailable: true,
      isFeatured: false,
    } as never);

    await deleteMenuItem('menu-item-1', adminActor);

    expect(bumpMenuVersion).toHaveBeenCalledTimes(1);
    expect(recordAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({
        actorId: adminActor.id,
        actorRole: 'admin',
        action: 'menu_item.deleted',
        entityType: 'menu_item',
        entityId: 'menu-item-1',
        before: expect.objectContaining({ name: 'Classic Burger' }),
      }),
    );
  });

  test('does not bump menu version when deleting a missing menu item', async () => {
    jest.mocked(menuItemRepository.deleteById).mockResolvedValue(null);

    await expect(deleteMenuItem('missing-menu-item')).rejects.toThrow(
      'Menu item not found',
    );

    expect(bumpMenuVersion).not.toHaveBeenCalled();
  });
});
