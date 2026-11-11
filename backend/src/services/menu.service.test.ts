import { menuRepository } from '../repositories/menu.repository';
import { bumpMenuVersion, getMenuVersion, mutateMenu } from './menu.service';
import mongoose from 'mongoose';
import { emitMenuUpdated } from './realtime.service';

jest.mock('./realtime.service', () => ({ emitMenuUpdated: jest.fn() }));

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

  test('writes and increments within one transaction, then broadcasts after commit', async () => {
    const session = {} as mongoose.ClientSession;
    const steps: string[] = [];
    jest
      .spyOn(mongoose.connection, 'transaction')
      .mockImplementationOnce(async (write) => {
        const result = await write(session);
        steps.push('committed');
        return result;
      });
    jest
      .mocked(menuRepository.incrementMainVersion)
      .mockImplementationOnce(async (received) => {
        expect(received).toBe(session);
        steps.push('version');
        return 43;
      });
    jest.mocked(emitMenuUpdated).mockImplementationOnce(() => {
      steps.push('broadcast');
    });
    await expect(
      mutateMenu(async (received) => {
        expect(received).toBe(session);
        steps.push('write');
        return 'saved';
      }),
    ).resolves.toBe('saved');
    expect(steps).toEqual(['write', 'version', 'committed', 'broadcast']);
  });

  test('does not broadcast when the transaction fails', async () => {
    jest
      .spyOn(mongoose.connection, 'transaction')
      .mockImplementationOnce(async (write) =>
        write({} as mongoose.ClientSession),
      );
    jest
      .mocked(menuRepository.incrementMainVersion)
      .mockRejectedValueOnce(new Error('version failed'));
    await expect(mutateMenu(async () => 'saved')).rejects.toThrow(
      'version failed',
    );
    expect(emitMenuUpdated).not.toHaveBeenCalled();
  });

  test('bumps the menu version through the repository atomic increment', async () => {
    jest.mocked(menuRepository.incrementMainVersion).mockResolvedValue(42);

    await expect(bumpMenuVersion()).resolves.toBe(42);
    expect(menuRepository.incrementMainVersion).toHaveBeenCalledTimes(1);
  });
});
