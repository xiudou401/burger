import '../src/config/env';
import { connectDB } from '../src/config/db';
import { UserModel } from '../src/models/user.model';

const email = process.argv[2]?.trim().toLowerCase();

if (!email || !email.includes('@')) {
  console.error('Usage: npm run make:admin -- admin@example.com');
  process.exit(1);
}

(async () => {
  await connectDB();

  const user = await UserModel.findOneAndUpdate(
    { email },
    { $set: { role: 'admin' } },
    { new: true },
  ).exec();

  if (!user) {
    console.error(`No user found for ${email}`);
    process.exit(1);
  }

  console.log(`${email} is now an admin`);
  process.exit(0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
