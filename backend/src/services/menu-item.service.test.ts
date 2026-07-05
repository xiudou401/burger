import { menuItemRepository } from '../repositories/menu-item.repository';
import { getMenuVersion } from './menu.service';
import { findAllMenuItems } from './menu-item.service';

jest.mock('./menu.service', () => ({
  getMenuVersion: jest.fn(),
}));

jest.mock('../repositories/menu-item.repository', () => ({
  menuItemRepository: {
    findPage: jest.fn(),
    count: jest.fn(),
  },
}));

describe('menu item service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(menuItemRepository.findPage).mockResolvedValue([]);
    jest.mocked(menuItemRepository.count).mockResolvedValue(0);
    jest.mocked(getMenuVersion).mockResolvedValue(1);
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
});
