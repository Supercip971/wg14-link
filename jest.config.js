module.exports = {
  projects: [
    {
      displayName: "test",
      testEnvironment: "node",
      testMatch: ["<rootDir>/test/*.js"],
    },
    {
      displayName: "lint:eslint",
      runner: "jest-runner-eslint",
      testMatch: ["<rootDir>/**/*.js"],
    },
    {
      displayName: "lint:prettier",
      preset: "jest-runner-prettier",
      testMatch: ["<rootDir>/**/*.js"],
    },
  ],
};
