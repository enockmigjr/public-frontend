import nextJest from "next/jest.js";

const createJestConfig = nextJest({ dir: "./" });

export default createJestConfig({
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jsdom",
  moduleNameMapper: { "^@/(.*)$": "<rootDir>/src/$1" },
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
  coveragePathIgnorePatterns: ["/src/lib/api/schema.d.ts"],
});
