import { userRepository } from '../repositories/user.repository';
import { verifyAuthToken } from '../utils/token';
import {
  disconnectRealtimeUser,
  initializeRealtimeServer,
} from './realtime.service';

type SocketMiddleware = (
  socket: FakeSocket,
  next: (error?: Error) => void,
) => void | Promise<void>;
type ConnectionHandler = (socket: FakeSocket) => void;

interface FakeSocket {
  id: string;
  handshake: {
    auth?: unknown;
  };
  data: Record<string, unknown>;
  join: jest.Mock;
}

const serverUse = jest.fn();
const serverOn = jest.fn();
const serverIn = jest.fn();
const disconnectSockets = jest.fn();

jest.mock('socket.io', () => ({
  Server: jest.fn().mockImplementation(() => ({
    use: serverUse,
    on: serverOn,
    to: jest.fn().mockReturnThis(),
    in: serverIn,
    emit: jest.fn(),
  })),
}));

jest.mock('../repositories/user.repository', () => ({
  userRepository: {
    findLeanById: jest.fn(),
  },
}));

jest.mock('../utils/token', () => ({
  verifyAuthToken: jest.fn(),
}));

jest.mock('../utils/logger', () => ({
  appLogger: {
    info: jest.fn(),
    warn: jest.fn(),
  },
}));

const getMiddleware = () => {
  const middleware = serverUse.mock.calls[0]?.[0] as
    | SocketMiddleware
    | undefined;

  if (!middleware) {
    throw new Error('Socket middleware was not registered');
  }

  return middleware;
};

const getConnectionHandler = () => {
  const connectionHandler = serverOn.mock.calls.find(
    ([eventName]) => eventName === 'connection',
  )?.[1] as ConnectionHandler | undefined;

  if (!connectionHandler) {
    throw new Error('Socket connection handler was not registered');
  }

  return connectionHandler;
};

const createSocket = (auth?: unknown): FakeSocket => ({
  id: 'socket-1',
  handshake: { auth },
  data: {},
  join: jest.fn(),
});

const runMiddleware = async (socket: FakeSocket) => {
  const next = jest.fn();

  await getMiddleware()(socket, next);

  return next.mock.calls[0]?.[0] as Error | undefined;
};

describe('realtime service permissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    serverIn.mockReturnValue({ disconnectSockets });
    initializeRealtimeServer({} as never);
  });

  test('allows public menu sockets without an auth token', async () => {
    const socket = createSocket();

    await expect(runMiddleware(socket)).resolves.toBeUndefined();

    getConnectionHandler()(socket);

    expect(socket.join).toHaveBeenCalledWith('menu-subscribers');
    expect(socket.join).not.toHaveBeenCalledWith('admins');
  });

  test('rejects admin sockets without an auth token', async () => {
    const socket = createSocket({ scope: 'admin' });

    const error = await runMiddleware(socket);

    expect(error?.message).toBe('Authorization token required');
    expect(verifyAuthToken).not.toHaveBeenCalled();
  });

  test('rejects customer-role users that request admin realtime access', async () => {
    jest.mocked(verifyAuthToken).mockResolvedValue({ sub: 'user-1' } as never);
    jest.mocked(userRepository.findLeanById).mockResolvedValue({
      _id: { toString: () => 'user-1' },
      role: 'customer',
      status: 'active',
    } as never);

    const socket = createSocket({ scope: 'admin', token: 'token' });
    const error = await runMiddleware(socket);

    expect(error?.message).toBe('Permission required');
  });

  test('rejects disabled users for authenticated realtime access', async () => {
    jest.mocked(verifyAuthToken).mockResolvedValue({ sub: 'user-1' } as never);
    jest.mocked(userRepository.findLeanById).mockResolvedValue({
      _id: { toString: () => 'user-1' },
      role: 'customer',
      status: 'disabled',
    } as never);

    const socket = createSocket({ scope: 'customer', token: 'token' });
    const error = await runMiddleware(socket);

    expect(error?.message).toBe('Unauthorized');
  });

  test('puts customer sockets into their user room but not the admin room', async () => {
    jest.mocked(verifyAuthToken).mockResolvedValue({ sub: 'user-1' } as never);
    jest.mocked(userRepository.findLeanById).mockResolvedValue({
      _id: { toString: () => 'user-1' },
      role: 'customer',
      status: 'active',
    } as never);

    const socket = createSocket({ scope: 'customer', token: 'token' });

    await expect(runMiddleware(socket)).resolves.toBeUndefined();
    getConnectionHandler()(socket);

    expect(socket.join).toHaveBeenCalledWith('menu-subscribers');
    expect(socket.join).toHaveBeenCalledWith('user:user-1');
    expect(socket.join).not.toHaveBeenCalledWith('admins');
  });

  test('puts staff admin sockets into the admin room', async () => {
    jest.mocked(verifyAuthToken).mockResolvedValue({ sub: 'staff-1' } as never);
    jest.mocked(userRepository.findLeanById).mockResolvedValue({
      _id: { toString: () => 'staff-1' },
      role: 'staff',
      status: 'active',
    } as never);

    const socket = createSocket({ scope: 'admin', token: 'token' });

    await expect(runMiddleware(socket)).resolves.toBeUndefined();
    getConnectionHandler()(socket);

    expect(socket.join).toHaveBeenCalledWith('menu-subscribers');
    expect(socket.join).toHaveBeenCalledWith('user:staff-1');
    expect(socket.join).toHaveBeenCalledWith('admins');
  });

  test('disconnects active realtime sockets for a disabled user room', () => {
    disconnectRealtimeUser('user-1');

    expect(serverIn).toHaveBeenCalledWith('user:user-1');
    expect(disconnectSockets).toHaveBeenCalledWith(true);
  });
});
