// /jest.config.ts

import type { Config } from 'jest';

/**
 * @type {import('jest').Config}
 */
const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    clearMocks: true,
    coverageProvider: 'v8',
    
    // Add timezone consistency
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/types.ts',
        '!src/index.ts',
        '!src/examples/**'
    ],
    
    modulePathIgnorePatterns: [
        '<rootDir>/dist/'
    ],
    
    // Add timeout for CI environments
    testTimeout: 10000,
};

export default config;