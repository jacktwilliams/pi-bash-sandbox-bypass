/** Jest config for the pi extensions workspace. */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  rootDir: __dirname,
  testMatch: ["<rootDir>/packages/*/tests/**/*.spec.ts"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        diagnostics: false,
        tsconfig: "<rootDir>/tsconfig.typecheck.json",
      },
    ],
  },
  collectCoverageFrom: ["packages/*/extensions/**/*.ts"],
  coverageDirectory: "<rootDir>/coverage",
  coverageThreshold: {
    global: {
      lines: 80,
      branches: 80,
      functions: 80,
      statements: 80,
    },
  },
};
