/**
 * @file Performance tests for the from method optimization.
 */

import atemporal from '../index';
import { TemporalUtils } from '../TemporalUtils';
import { Temporal } from '@js-temporal/polyfill';

// Add CI detection to skip performance tests in CI environments
const isCI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';

// Replace the main describe block to skip in CI
const describePerformance = isCI ? describe.skip : describe;

describePerformance('From Method Performance Tests', () => {
    const ITERATIONS = 10000;
    
    test('from method with ISO string input', () => {
        const input = '2023-01-01T12:00:00Z';
        
        // Warm up
        TemporalUtils.from(input);
        
        const start = performance.now();
        
        for (let i = 0; i < ITERATIONS; i++) {
            TemporalUtils.from(input);
        }
        
        const end = performance.now();
        const executionTime = end - start;
        
        console.log(`ISO string: ${ITERATIONS} iterations took ${executionTime.toFixed(2)}ms`);
        expect(executionTime).toBeLessThan(1000); // Adjust threshold as needed
    });
    
    test('from method with Date object input', () => {
        const input = new Date('2023-01-01T12:00:00Z');
        
        // Warm up
        TemporalUtils.from(input);
        
        const start = performance.now();
        
        for (let i = 0; i < ITERATIONS; i++) {
            TemporalUtils.from(input);
        }
        
        const end = performance.now();
        const executionTime = end - start;
        
        console.log(`Date object: ${ITERATIONS} iterations took ${executionTime.toFixed(2)}ms`);
        expect(executionTime).toBeLessThan(1000); // Adjust threshold as needed
    });
    
    test('from method with timestamp input', () => {
        const input = 1672574400000; // 2023-01-01T12:00:00Z
        
        // Warm up
        TemporalUtils.from(input);
        
        const start = performance.now();
        
        for (let i = 0; i < ITERATIONS; i++) {
            TemporalUtils.from(input);
        }
        
        const end = performance.now();
        const executionTime = end - start;
        
        console.log(`Timestamp: ${ITERATIONS} iterations took ${executionTime.toFixed(2)}ms`);
        expect(executionTime).toBeLessThan(1000); // Adjust threshold as needed
    });
    
    test('from method with null input (current time)', () => {
        // Warm up
        TemporalUtils.from(null);
        
        const start = performance.now();
        
        for (let i = 0; i < ITERATIONS; i++) {
            TemporalUtils.from(null);
        }
        
        const end = performance.now();
        const executionTime = end - start;
        
        console.log(`Current time (null): ${ITERATIONS} iterations took ${executionTime.toFixed(2)}ms`);
        expect(executionTime).toBeLessThan(1000); // Adjust threshold as needed
    });
    
    test('from method with ZonedDateTime input', () => {
        const zdt = Temporal.Now.zonedDateTimeISO('UTC');
        
        // Warm up
        TemporalUtils.from(zdt);
        
        const start = performance.now();
        
        for (let i = 0; i < ITERATIONS; i++) {
            TemporalUtils.from(zdt);
        }
        
        const end = performance.now();
        const executionTime = end - start;
        
        console.log(`ZonedDateTime: ${ITERATIONS} iterations took ${executionTime.toFixed(2)}ms`);
        expect(executionTime).toBeLessThan(500); // Should be very fast
    });
    
    test('from method with mixed inputs', () => {
        const inputs = [
            '2023-01-01T12:00:00Z',
            new Date('2023-01-01T12:00:00Z'),
            1672574400000,
            null,
            Temporal.Now.zonedDateTimeISO('UTC'),
            [2023, 1, 1, 12, 0, 0],
            { year: 2023, month: 1, day: 1, hour: 12 }
        ];
        
        // Warm up
        for (const input of inputs) {
            TemporalUtils.from(input);
        }
        
        const start = performance.now();
        
        for (let i = 0; i < ITERATIONS; i++) {
            const input = inputs[i % inputs.length];
            TemporalUtils.from(input);
        }
        
        const end = performance.now();
        const executionTime = end - start;
        
        console.log(`Mixed inputs: ${ITERATIONS} iterations took ${executionTime.toFixed(2)}ms`);
        expect(executionTime).toBeLessThan(2000); // Adjust threshold as needed
    });
});