module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    transform: {
      '^.+\\.tsx?$': 'ts-jest',
    },
    moduleDirectories: ['node_modules', 'src'],
    moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    },
  roots: ['<rootDir>/test'],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],
  };
  