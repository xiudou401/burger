if (!process.env.MONGO_URI?.trim()) {
  process.env.MONGO_URI = 'mongodb://localhost:27017/test';
}

if (!process.env.JWT_SECRET?.trim()) {
  process.env.JWT_SECRET = 'test-secret';
}
