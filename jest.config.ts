// /jest.config.ts

import type { Config } from 'jest';

/**
 * @type {import('jest').Config}
 */
const config: Config = {
    // El preset 'ts-jest' es fundamental para que Jest entienda TypeScript.
    preset: 'ts-jest',

    // El entorno de prueba. 'node' es el adecuado para una librería como la tuya.
    testEnvironment: 'node',

    // Limpia los mocks entre cada test para asegurar el aislamiento.
    clearMocks: true,

    // El proveedor de cobertura. 'v8' es moderno y rápido.
    coverageProvider: 'v8',

    // Especifica de qué archivos se debe recolectar la cobertura.
    // Excluimos el archivo de tipos y el index principal si solo exporta.
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/types.ts',
        '!src/index.ts',
        '!src/examples/**'
    ],

    // Ignora la carpeta de distribución para que Jest no intente ejecutar tests ahí.
    modulePathIgnorePatterns: [
        '<rootDir>/dist/'
    ],
};

export default config;