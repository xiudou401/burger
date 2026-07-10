import { auditLogRepository } from '../repositories/audit-log.repository';
import { listAuditLogs, recordAuditLog } from './audit-log.service';

jest.mock('../repositories/audit-log.repository', () => ({
  auditLogRepository: {
    create: jest.fn(),
    listRecent: jest.fn(),
  },
}));

describe('audit log service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('records audit log entries', async () => {
    await recordAuditLog({
      actorId: '507f1f77bcf86cd799439011',
      actorRole: 'staff',
      action: 'order.status_changed',
      entityType: 'order',
      entityId: '507f1f77bcf86cd799439012',
      before: { status: 'paid' },
      after: { status: 'preparing' },
    });

    expect(auditLogRepository.create).toHaveBeenCalledWith({
      actorId: '507f1f77bcf86cd799439011',
      actorRole: 'staff',
      action: 'order.status_changed',
      entityType: 'order',
      entityId: '507f1f77bcf86cd799439012',
      before: { status: 'paid' },
      after: { status: 'preparing' },
    });
  });

  test('does not throw when audit log writes fail', async () => {
    jest
      .mocked(auditLogRepository.create)
      .mockRejectedValue(new Error('database unavailable') as never);

    await expect(
      recordAuditLog({
        actorId: '507f1f77bcf86cd799439011',
        actorRole: 'admin',
        action: 'menu_item.deleted',
        entityType: 'menu_item',
        entityId: '507f1f77bcf86cd799439013',
      }),
    ).resolves.toBeUndefined();

    expect(console.error).toHaveBeenCalledWith(
      'Audit log write failed',
      expect.any(Error),
    );
  });

  test('lists recent audit logs as public payloads', async () => {
    const createdAt = new Date('2026-07-08T16:30:00.000Z');
    jest.mocked(auditLogRepository.listRecent).mockResolvedValue([
      {
        _id: 'audit-1',
        actorId: '507f1f77bcf86cd799439011',
        actorRole: 'staff',
        action: 'order.status_changed',
        entityType: 'order',
        entityId: '507f1f77bcf86cd799439012',
        before: { status: 'paid' },
        after: { status: 'preparing' },
        createdAt,
      },
    ] as never);

    await expect(listAuditLogs(500)).resolves.toEqual([
      {
        id: 'audit-1',
        actorId: '507f1f77bcf86cd799439011',
        actorRole: 'staff',
        action: 'order.status_changed',
        entityType: 'order',
        entityId: '507f1f77bcf86cd799439012',
        before: { status: 'paid' },
        after: { status: 'preparing' },
        createdAt,
      },
    ]);
    expect(auditLogRepository.listRecent).toHaveBeenCalledWith(100);
  });
});
