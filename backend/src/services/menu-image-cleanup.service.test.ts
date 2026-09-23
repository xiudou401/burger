describe('menu image cleanup service', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...originalEnv,
      MONGO_URI: 'mongodb://localhost:27017/test',
      JWT_SECRET: 'test-secret-for-jest-at-least-32-chars',
      AWS_REGION: 'ap-southeast-2',
      S3_MENU_IMAGES_BUCKET: 'sydney-burger-menu-images',
      S3_MENU_IMAGES_PUBLIC_BASE_URL:
        'https://sydney-burger-menu-images.s3.ap-southeast-2.amazonaws.com',
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('extracts keys only for configured menu image URLs', async () => {
    const { getMenuImageKeyFromUrl } =
      await import('./menu-image-cleanup.service');

    expect(
      getMenuImageKeyFromUrl(
        'https://sydney-burger-menu-images.s3.ap-southeast-2.amazonaws.com/menu-images/2026/item.png',
      ),
    ).toBe('menu-images/2026/item.png');

    expect(
      getMenuImageKeyFromUrl(
        'https://sydney-burger-menu-images.s3.ap-southeast-2.amazonaws.com/public/item.png',
      ),
    ).toBeNull();

    expect(
      getMenuImageKeyFromUrl(
        'https://example.com/menu-images/2026/external.png',
      ),
    ).toBeNull();

    expect(getMenuImageKeyFromUrl('/img/meals/1.png')).toBeNull();
  });
});
