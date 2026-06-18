import '../src/config/env';
import { connectDB } from '../src/config/db';
import { UserModel } from '../src/models/user.model';
import { hashPassword } from '../src/utils/password';

const demoUsers = [
  {
    name: 'Demo Customer',
    email: 'customer@burgerclub.test',
    password: 'Burger#2026',
    role: 'customer' as const,
  },
  {
    name: 'Demo Admin',
    email: 'admin@burgerclub.test',
    password: 'Burger#2026',
    role: 'admin' as const,
  },
];

(async () => {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Cannot seed demo users in production');
  }

  await connectDB();

  for (const user of demoUsers) {
    await UserModel.findOneAndUpdate(
      { email: user.email },
      {
        $set: {
          name: user.name,
          email: user.email,
          passwordHash: await hashPassword(user.password),
          role: user.role,
          emailVerified: true,
          phoneVerified: false,
        },
      },
      { new: true, upsert: true },
    ).exec();

    console.log(`Demo ${user.role} ready: ${user.email}`);
  }

  process.exit(0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
