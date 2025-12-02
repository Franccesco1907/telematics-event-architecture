export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
  roots: ['<rootDir>/apps/', '<rootDir>/libs/'],
  moduleNameMapper: {
    '^@common(|/.*)$': '<rootDir>/libs/common/src/$1',
    '^@app/common(|/.*)$': '<rootDir>/libs/common/src/$1',
  },
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/test/",
    "/dist/",
    "/index.ts$",
    ".module.ts$",
    ".entity.ts$",
    ".dto.ts$",
    "<rootDir>/.*/dto/",
    "<rootDir>/apps/.*/src/main.ts$",
    "typeorm.repository.ts$"
  ]
};
