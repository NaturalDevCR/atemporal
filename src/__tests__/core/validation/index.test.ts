/**
 * @file Test suite for validation module exports
 * Ensures all exports are properly accessible
 */

import { InstanceValidator } from '../../../core/validation';
import { InstanceValidator as DirectInstanceValidator } from '../../../core/validation/instance-validator';

describe('Validation Module Exports', () => {
    it('should export InstanceValidator from index', () => {
        expect(InstanceValidator).toBeDefined();
        expect(typeof InstanceValidator).toBe('function');
    });

    it('should export the same InstanceValidator as direct import', () => {
        expect(InstanceValidator).toBe(DirectInstanceValidator);
    });

    it('should have all expected static methods', () => {
        expect(typeof InstanceValidator.isValidZonedDateTime).toBe('function');
        expect(typeof InstanceValidator.isValidDateInput).toBe('function');
        expect(typeof InstanceValidator.isValidTimeZone).toBe('function');
        expect(typeof InstanceValidator.isValidLocale).toBe('function');
        expect(typeof InstanceValidator.isValidNumber).toBe('function');
        expect(typeof InstanceValidator.isValidTimeUnit).toBe('function');
        expect(typeof InstanceValidator.isValidInclusivity).toBe('function');
    });

    it('should be able to instantiate and use methods', () => {
        // Test that methods work when imported from index
        expect(InstanceValidator.isValidNumber(42)).toBe(true);
        expect(InstanceValidator.isValidTimeUnit('day')).toBe(true);
        expect(InstanceValidator.isValidInclusivity('[]')).toBe(true);
    });
});