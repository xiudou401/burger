// Unit tests must not use the real provider key from a developer's .env file.
process.env.OPENAI_API_KEY = '';

if (!process.env.MONGO_URI?.trim()) {
  process.env.MONGO_URI = 'mongodb://localhost:27017/test';
}

if (!process.env.JWT_SECRET?.trim()) {
  process.env.JWT_SECRET = 'test-secret-for-jest-at-least-32-chars';
}
