module.exports = {
  preset: 'ts-jest',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.json',
        isolatedModules: true,
        diagnostics: false,
      },
    ],
  },
  roots: ['<rootDir>/src'],
  testPathIgnorePatterns: ['/node_modules/', '/lib/'],
  testMatch: ['**/__tests__/**/*-test.(ts|js)'],
};
