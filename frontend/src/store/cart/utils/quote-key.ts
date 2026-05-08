export const buildQuoteKey = (itemsSig: string, menuVersion: number) =>
  `${itemsSig}::${menuVersion}`;
