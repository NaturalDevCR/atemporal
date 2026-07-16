// /jest.config.ts

import type { Config } from 'jest';

/**
 * @type {import('jest').Config}
 */
const config: Config = {
    preset: 'ts-jest',
    transform: {
        '^.+\\.tsx?$': ['ts-jest', {
            tsconfig: {
                module: 'Node16',
                moduleResolution: 'Node16',
            },
        }],
    },
    testEnvironment: 'node',
    clearMocks: true,
    coverageProvider: 'v8',
    
    // Add timezone consistency
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/types.ts',
        '!src/examples/**'
    ],

    coverageThreshold: {
        global: {
            statements: 95,
            lines: 95,
            branches: 90,
            functions: 90,
        },
    },
    
    modulePathIgnorePatterns: [
        '<rootDir>/dist/'
    ],
    
    // Exclude performance tests in CI environments
    testPathIgnorePatterns: [
        '<rootDir>/dist/',
        ...(process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true' 
            ? ['<rootDir>/src/__tests__/performance.test.ts', '<rootDir>/src/__tests__/from-performance.test.ts']
            : [])
    ],
    
    // Add timeout for CI environments
    testTimeout: 10000,
};

export default config;
