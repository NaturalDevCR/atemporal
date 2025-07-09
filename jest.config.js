/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: [
        // Busca archivos .ts o .js en cualquier subdirectorio de __tests__
        "**/__tests__/**/*.?(m)[jt]s?(x)",
        // O archivos que terminen en .test.ts, .spec.ts, etc.
        "**/?(*.)+(spec|test).?(m)[jt]s?(x)"
    ],
};