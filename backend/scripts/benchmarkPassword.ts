import { performance } from 'perf_hooks';
import { hashPassword, verifyPassword } from '../src/utils/password';

const SAMPLE_SIZE = 5;
const PASSWORD = 'Burger#2026';

const average = (values: number[]) =>
  values.reduce((sum, value) => sum + value, 0) / values.length;

const measure = async (label: string, fn: () => Promise<unknown>) => {
  const timings: number[] = [];

  for (let index = 0; index < SAMPLE_SIZE; index += 1) {
    const startedAt = performance.now();
    await fn();
    timings.push(performance.now() - startedAt);
  }

  const rounded = timings.map((value) => Math.round(value));

  console.log(`${label}`);
  console.log(`  samples: ${rounded.join('ms, ')}ms`);
  console.log(`  average: ${Math.round(average(timings))}ms`);
};

(async () => {
  const hash = await hashPassword(PASSWORD);
  const [iterations] = hash.split(':');

  console.log(`PBKDF2-SHA512 password benchmark`);
  console.log(`  iterations: ${iterations}`);
  console.log(`  samples: ${SAMPLE_SIZE}`);

  await measure('hashPassword', () => hashPassword(PASSWORD));
  await measure('verifyPassword', () => verifyPassword(PASSWORD, hash));
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
