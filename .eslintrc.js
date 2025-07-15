module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  parser: "@typescript-eslint/parser", // koristi TypeScript parser
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: "latest",
    sourceType: "module",
  },
  plugins: ["react", "react-hooks", "@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:@typescript-eslint/recommended", // samo osnovna pravila
  ],
  rules: {
    "react/react-in-jsx-scope": "off", // za React 17+
    "react/prop-types": "off",         // jer ne koristiš prop-types
    "@typescript-eslint/no-unused-vars": "warn", // korisno i za .tsx
  },
  settings: {
    react: {
      version: "detect",
    },
  },
};