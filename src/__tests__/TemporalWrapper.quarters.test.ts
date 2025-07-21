import atemporal from '../index';

describe('Quarter Methods', () => {
    describe('Quarter getter', () => {
        it('should get current quarter for Q1', () => {
            const q1Jan = atemporal('2024-01-15');
            expect(q1Jan.quarter()).toBe(1);
            
            const q1Feb = atemporal('2024-02-15');
            expect(q1Feb.quarter()).toBe(1);
            
            const q1Mar = atemporal('2024-03-15');
            expect(q1Mar.quarter()).toBe(1);
        });
        
        it('should get current quarter for Q2', () => {
            const q2Apr = atemporal('2024-04-15');
            expect(q2Apr.quarter()).toBe(2);
            
            const q2May = atemporal('2024-05-15');
            expect(q2May.quarter()).toBe(2);
            
            const q2Jun = atemporal('2024-06-15');
            expect(q2Jun.quarter()).toBe(2);
        });
        
        it('should get current quarter for Q3', () => {
            const q3Jul = atemporal('2024-07-15');
            expect(q3Jul.quarter()).toBe(3);
            
            const q3Aug = atemporal('2024-08-15');
            expect(q3Aug.quarter()).toBe(3);
            
            const q3Sep = atemporal('2024-09-15');
            expect(q3Sep.quarter()).toBe(3);
        });
        
        it('should get current quarter for Q4', () => {
            const q4Oct = atemporal('2024-10-15');
            expect(q4Oct.quarter()).toBe(4);
            
            const q4Nov = atemporal('2024-11-15');
            expect(q4Nov.quarter()).toBe(4);
            
            const q4Dec = atemporal('2024-12-15');
            expect(q4Dec.quarter()).toBe(4);
        });
        
        it('should return NaN for invalid dates', () => {
            const invalid = atemporal('invalid-date');
            expect(invalid.quarter()).toBeNaN();
        });
    });
    
    describe('Quarter setter', () => {
        it('should set quarter and move to start of quarter', () => {
            const date = atemporal('2024-05-15T14:30:45'); // Q2, mid-month, mid-day
            
            // Set to Q1
            const q1 = date.quarter(1);
            expect(q1.format('YYYY-MM-DD HH:mm:ss')).toBe('2024-01-01 00:00:00');
            expect(q1.quarter()).toBe(1);
            
            // Set to Q2
            const q2 = date.quarter(2);
            expect(q2.format('YYYY-MM-DD HH:mm:ss')).toBe('2024-04-01 00:00:00');
            expect(q2.quarter()).toBe(2);
            
            // Set to Q3
            const q3 = date.quarter(3);
            expect(q3.format('YYYY-MM-DD HH:mm:ss')).toBe('2024-07-01 00:00:00');
            expect(q3.quarter()).toBe(3);
            
            // Set to Q4
            const q4 = date.quarter(4);
            expect(q4.format('YYYY-MM-DD HH:mm:ss')).toBe('2024-10-01 00:00:00');
            expect(q4.quarter()).toBe(4);
        });
        
        it('should preserve year when setting quarter', () => {
            const date2023 = atemporal('2023-08-15'); // Q3 2023
            const q1_2023 = date2023.quarter(1);
            expect(q1_2023.year).toBe(2023);
            expect(q1_2023.format('YYYY-MM-DD')).toBe('2023-01-01');
            
            const date2025 = atemporal('2025-11-20'); // Q4 2025
            const q2_2025 = date2025.quarter(2);
            expect(q2_2025.year).toBe(2025);
            expect(q2_2025.format('YYYY-MM-DD')).toBe('2025-04-01');
        });
        
        it('should handle setting to same quarter', () => {
            const date = atemporal('2024-05-15T10:30:00'); // Q2
            const sameQuarter = date.quarter(2);
            expect(sameQuarter.format('YYYY-MM-DD HH:mm:ss')).toBe('2024-04-01 00:00:00');
            expect(sameQuarter.quarter()).toBe(2);
        });
        
        it('should handle invalid quarter values', () => {
            const date = atemporal('2024-05-15');
            
            // Test invalid quarters (< 1 or > 4)
            const invalid0 = date.quarter(0);
            expect(invalid0).toBe(date); // Should return unchanged
            
            const invalid5 = date.quarter(5);
            expect(invalid5).toBe(date); // Should return unchanged
            
            const invalidNegative = date.quarter(-1);
            expect(invalidNegative).toBe(date); // Should return unchanged
        });
        
        it('should return unchanged instance for invalid dates', () => {
            const invalid = atemporal('invalid-date');
            const result = invalid.quarter(2);
            expect(result).toBe(invalid);
        });
    });
    
    describe('Quarter with generic get/set methods', () => {
        it('should work with generic get() method', () => {
            const date = atemporal('2024-08-15'); // Q3
            expect(date.get('quarter')).toBe(3);
            
            const q1Date = atemporal('2024-02-29'); // Q1 (leap year)
            expect(q1Date.get('quarter')).toBe(1);
        });
        
        it('should work with generic set() method', () => {
            const date = atemporal('2024-05-20T15:45:30'); // Q2
            
            const setToQ4 = date.set('quarter', 4);
            expect(setToQ4.format('YYYY-MM-DD HH:mm:ss')).toBe('2024-10-01 00:00:00');
            expect(setToQ4.get('quarter')).toBe(4);
            
            const setToQ1 = date.set('quarter', 1);
            expect(setToQ1.format('YYYY-MM-DD HH:mm:ss')).toBe('2024-01-01 00:00:00');
            expect(setToQ1.get('quarter')).toBe(1);
        });
        
        it('should handle invalid values with generic set() method', () => {
            const date = atemporal('2024-05-15');
            const invalid = date.set('quarter', 6);
            expect(invalid).toBe(date); // Should return unchanged
        });
    });
    
    describe('Quarter edge cases', () => {
        it('should handle leap year dates', () => {
            const leapYear = atemporal('2024-02-29'); // Leap year Q1
            expect(leapYear.quarter()).toBe(1);
            
            const setToQ4 = leapYear.quarter(4);
            expect(setToQ4.format('YYYY-MM-DD')).toBe('2024-10-01');
        });
        
        it('should handle end of year dates', () => {
            const endOfYear = atemporal('2024-12-31T23:59:59'); // Q4
            expect(endOfYear.quarter()).toBe(4);
            
            const setToQ1 = endOfYear.quarter(1);
            expect(setToQ1.format('YYYY-MM-DD HH:mm:ss')).toBe('2024-01-01 00:00:00');
        });
        
        it('should handle different timezones', () => {
            const utc = atemporal('2024-06-15T12:00:00Z'); // Q2 UTC
            const ny = atemporal('2024-06-15T12:00:00', 'America/New_York'); // Q2 NY
            
            expect(utc.quarter()).toBe(2);
            expect(ny.quarter()).toBe(2);
            
            const utcQ3 = utc.quarter(3);
            const nyQ3 = ny.quarter(3);
            
            expect(utcQ3.format('YYYY-MM-DD')).toBe('2024-07-01');
            expect(nyQ3.format('YYYY-MM-DD')).toBe('2024-07-01');
        });
        
        it('should maintain immutability', () => {
            const original = atemporal('2024-05-15'); // Q2
            const modified = original.quarter(3);
            
            // Original should remain unchanged
            expect(original.quarter()).toBe(2);
            expect(original.format('YYYY-MM-DD')).toBe('2024-05-15');
            
            // Modified should be different
            expect(modified.quarter()).toBe(3);
            expect(modified.format('YYYY-MM-DD')).toBe('2024-07-01');
            
            // They should be different instances
            expect(modified).not.toBe(original);
        });
    });
});