import { menuRepository } from '../repositories/menu.repository';
import { bumpMenuVersion, getMenuVersion } from './menu.service';

jest.mock('../repositories/menu.repository', () => ({
  menuRepository: {
    findMainVersion: jest.fn(),
    incrementMainVersion: jest.fn(),
  },
}));

describe('menu service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('returns zero when no menu version exists yet', async () => {
    jest.mocked(menuRepository.findMainVersion).mockResolvedValue(null);

    await expect(getMenuVersion()).resolves.toBe(0);
  });

  test('bumps the menu version through the repository atomic increment', async () => {
    jest.mocked(menuRepository.incrementMainVersion).mockResolvedValue(42);

    await expect(bumpMenuVersion()).resolves.toBe(42);
    expect(menuRepository.incrementMainVersion).toHaveBeenCalledTimes(1);
  });
});
