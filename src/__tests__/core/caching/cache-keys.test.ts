/**
 * @file Comprehensive tests for cache key generation utilities
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { Temporal } from '@js-temporal/polyfill';
import {
    CacheKeyBuilder,
    CacheKeys,
    FastHash,
    CacheKeyUtils
} from '../../../core/caching/cache-keys';
import type { TimeUnit } from '../../../types';

describe('CacheKeyBuilder', () => {
    let builder: CacheKeyBuilder;

    beforeEach(() => {
        builder = new CacheKeyBuilder();
    });

    describe('basic operations', () => {
        it('should add string parts', () => {
            const key = builder.addString('test').build();
            expect(key).toBe('test');
        });

        it('should add number parts', () => {
            const key = builder.addNumber(123).build();
            expect(key).toBe('123');
        });

        it('should add boolean parts', () => {
            const trueKey = builder.addBoolean(true).build();
            expect(trueKey).toBe('1');

            builder.reset();
            const falseKey = builder.addBoolean(false).build();
            expect(falseKey).toBe('0');
        });

        it('should add object parts with sorted keys', () => {
            const obj = { b: 2, a: 1, c: 3 };
            const key = builder.addObject(obj).build();
            expect(key).toBe('{a:1,b:2,c:3}');
        });
    });

    describe('chaining and building', () => {
        it('should chain multiple parts', () => {
            const key = builder
                .addString('prefix')
                .addNumber(42)
                .addBoolean(true)
                .addString('suffix')
                .build();
            expect(key).toBe('prefix|42|1|suffix');
        });

        it('should handle complex objects', () => {
            const obj = {
                nested: { value: 'test' },
                array: [1, 2, 3],
                null: null,
                undefined: undefined
            };
            const key = builder.addObject(obj).build();
            expect(key).toContain('{');
            expect(key).toContain('}');
        });

        it('should reset and reuse builder', () => {
            const key1 = builder.addString('first').build();
            expect(key1).toBe('first');

            const key2 = builder.reset().addString('second').build();
            expect(key2).toBe('second');
        });

        it('should handle empty build', () => {
            const key = builder.build();
            expect(key).toBe('');
        });
    });

    describe('edge cases', () => {
        it('should handle empty strings', () => {
            const key = builder.addString('').build();
            expect(key).toBe('');
        });

        it('should handle zero numbers', () => {
            const key = builder.addNumber(0).build();
            expect(key).toBe('0');
        });

        it('should handle negative numbers', () => {
            const key = builder.addNumber(-123).build();
            expect(key).toBe('-123');
        });

        it('should handle floating point numbers', () => {
            const key = builder.addNumber(3.14159).build();
            expect(key).toBe('3.14159');
        });

        it('should handle empty objects', () => {
            const key = builder.addObject({}).build();
            expect(key).toBe('{}');
        });

        it('should handle special characters in strings', () => {
            const key = builder.addString('test|with|pipes').build();
            expect(key).toBe('test|with|pipes');
        });
    });
});

describe('CacheKeys', () => {
    describe('dateTimeFormat', () => {
        it('should generate consistent keys for same inputs', () => {
            const options: Intl.DateTimeFormatOptions = {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            };
            
            const key1 = CacheKeys.dateTimeFormat('en-US', options);
            const key2 = CacheKeys.dateTimeFormat('en-US', options);
            
            expect(key1).toBe(key2);
            expect(key1).toContain('dtf');
            expect(key1).toContain('en-US');
        });

        it('should generate different keys for different locales', () => {
            const options: Intl.DateTimeFormatOptions = { year: 'numeric' };
            
            const key1 = CacheKeys.dateTimeFormat('en-US', options);
            const key2 = CacheKeys.dateTimeFormat('fr-FR', options);
            
            expect(key1).not.toBe(key2);
        });

        it('should generate different keys for different options', () => {
            const options1: Intl.DateTimeFormatOptions = { year: 'numeric' };
            const options2: Intl.DateTimeFormatOptions = { year: '2-digit' };
            
            const key1 = CacheKeys.dateTimeFormat('en-US', options1);
            const key2 = CacheKeys.dateTimeFormat('en-US', options2);
            
            expect(key1).not.toBe(key2);
        });
    });

    describe('relativeTimeFormat', () => {
        it('should generate keys for relative time format', () => {
            const options: Intl.RelativeTimeFormatOptions = {
                numeric: 'auto',
                style: 'long'
            };
            
            const key = CacheKeys.relativeTimeFormat('en-US', options);
            
            expect(key).toContain('rtf');
            expect(key).toContain('en-US');
        });
    });

    describe('numberFormat', () => {
        it('should generate keys for number format', () => {
            const options: Intl.NumberFormatOptions = {
                style: 'currency',
                currency: 'USD'
            };
            
            const key = CacheKeys.numberFormat('en-US', options);
            
            expect(key).toContain('nf');
            expect(key).toContain('en-US');
        });
    });

    describe('listFormat', () => {
        it('should generate keys for list format', () => {
            const options = {
                style: 'long',
                type: 'conjunction'
            };
            
            const key = CacheKeys.listFormat('en-US', options);
            
            expect(key).toContain('lf');
            expect(key).toContain('en-US');
        });
    });

    describe('diff', () => {
        it('should generate keys for diff calculations', () => {
            const d1 = Temporal.ZonedDateTime.from('2023-01-01T00:00:00[UTC]');
            const d2 = Temporal.ZonedDateTime.from('2023-01-02T00:00:00[UTC]');
            const unit: TimeUnit = 'day';
            
            const key = CacheKeys.diff(d1, d2, unit);
            
            expect(key).toContain('diff');
            expect(key).toContain(d1.epochNanoseconds.toString());
            expect(key).toContain(d2.epochNanoseconds.toString());
            expect(key).toContain('day');
        });

        it('should generate different keys for different dates', () => {
            const d1 = Temporal.ZonedDateTime.from('2023-01-01T00:00:00[UTC]');
            const d2 = Temporal.ZonedDateTime.from('2023-01-02T00:00:00[UTC]');
            const d3 = Temporal.ZonedDateTime.from('2023-01-03T00:00:00[UTC]');
            const unit: TimeUnit = 'day';
            
            const key1 = CacheKeys.diff(d1, d2, unit);
            const key2 = CacheKeys.diff(d1, d3, unit);
            
            expect(key1).not.toBe(key2);
        });

        it('should generate different keys for different units', () => {
            const d1 = Temporal.ZonedDateTime.from('2023-01-01T00:00:00[UTC]');
            const d2 = Temporal.ZonedDateTime.from('2023-01-02T00:00:00[UTC]');
            
            const key1 = CacheKeys.diff(d1, d2, 'day');
            const key2 = CacheKeys.diff(d1, d2, 'hour');
            
            expect(key1).not.toBe(key2);
        });
    });

    describe('formatTokens', () => {
        it('should generate keys for format tokens', () => {
            const key = CacheKeys.formatTokens('instance123', 'en-US');
            
            expect(key).toContain('fmt');
            expect(key).toContain('instance123');
            expect(key).toContain('en-US');
        });
    });

    describe('timezone', () => {
        it('should generate keys for timezone validation', () => {
            const key = CacheKeys.timezone('America/New_York');
            
            expect(key).toContain('tz');
            expect(key).toContain('America/New_York');
        });
    });

    describe('locale', () => {
        it('should generate keys for locale validation', () => {
            const key = CacheKeys.locale('en-US');
            
            expect(key).toContain('loc');
            expect(key).toContain('en-US');
        });
    });

    describe('customFormat', () => {
        it('should generate keys for custom format patterns', () => {
            const key = CacheKeys.customFormat('YYYY-MM-DD', 'en-US');
            
            expect(key).toContain('cfmt');
            expect(key).toContain('YYYY-MM-DD');
            expect(key).toContain('en-US');
        });

        it('should include options when provided', () => {
            const options = { timeZone: 'UTC' };
            const key = CacheKeys.customFormat('YYYY-MM-DD', 'en-US', options);
            
            expect(key).toContain('timeZone:UTC');
        });

        it('should work without options', () => {
            const key = CacheKeys.customFormat('YYYY-MM-DD', 'en-US');
            
            expect(key).toContain('cfmt');
            expect(key).not.toContain('timeZone');
        });
    });

    describe('parseKey', () => {
        it('should generate keys for parsing operations', () => {
            const input = '2023-01-01';
            const options = { timeZone: 'UTC' };
            
            const key = CacheKeys.parseKey(input, options);
            
            expect(key).toContain('parse');
            expect(key).toContain('string');
            expect(key).toContain('2023-01-01');
        });

        it('should handle different input types', () => {
            const numberKey = CacheKeys.parseKey(123, {});
            const stringKey = CacheKeys.parseKey('test', {});
            const objectKey = CacheKeys.parseKey({}, {});
            
            expect(numberKey).toContain('number');
            expect(stringKey).toContain('string');
            expect(objectKey).toContain('object');
        });
    });

    describe('formatCompilation', () => {
        it('should generate keys for format compilation', () => {
            const key = CacheKeys.formatCompilation('YYYY-MM-DD HH:mm:ss');
            
            expect(key).toContain('compile');
            expect(key).toContain('YYYY-MM-DD HH:mm:ss');
        });
    });

    describe('comparison', () => {
        it('should generate keys for comparison operations', () => {
            const epochNanos1 = BigInt('1672531200000000000');
            const epochNanos2 = BigInt('1672617600000000000');
            
            const key = CacheKeys.comparison(epochNanos1, epochNanos2, 'diff');
            
            expect(key).toContain('cmp');
            expect(key).toContain(epochNanos1.toString());
            expect(key).toContain(epochNanos2.toString());
            expect(key).toContain('diff');
        });

        it('should include unit when provided', () => {
            const epochNanos1 = BigInt('1672531200000000000');
            const epochNanos2 = BigInt('1672617600000000000');
            
            const key = CacheKeys.comparison(epochNanos1, epochNanos2, 'diff', 'day');
            
            expect(key).toContain('day');
        });

        it('should include precision when provided', () => {
            const epochNanos1 = BigInt('1672531200000000000');
            const epochNanos2 = BigInt('1672617600000000000');
            
            const key = CacheKeys.comparison(epochNanos1, epochNanos2, 'diff', 'day', 'rounded');
            
            expect(key).toContain('rounded');
        });
    });
});

describe('FastHash', () => {
    describe('hash', () => {
        it('should generate consistent hashes', () => {
            const input = 'test string';
            const hash1 = FastHash.hash(input);
            const hash2 = FastHash.hash(input);
            
            expect(hash1).toBe(hash2);
        });

        it('should generate different hashes for different inputs', () => {
            const hash1 = FastHash.hash('string1');
            const hash2 = FastHash.hash('string2');
            
            expect(hash1).not.toBe(hash2);
        });

        it('should handle empty strings', () => {
            const hash = FastHash.hash('');
            expect(typeof hash).toBe('string');
            expect(hash.length).toBeGreaterThan(0);
        });

        it('should handle long strings', () => {
            const longString = 'a'.repeat(1000);
            const hash = FastHash.hash(longString);
            
            expect(typeof hash).toBe('string');
            expect(hash.length).toBeLessThan(longString.length);
        });

        it('should handle special characters', () => {
            const specialString = '!@#$%^&*()_+-=[]{}|;:,.<>?';
            const hash = FastHash.hash(specialString);
            
            expect(typeof hash).toBe('string');
            expect(hash.length).toBeGreaterThan(0);
        });
    });

    describe('shortKey', () => {
        it('should generate short keys with prefix', () => {
            const key = FastHash.shortKey('test', 'part1', 'part2');
            
            expect(key).toMatch(/^test:/);
            expect(key.length).toBeLessThan(50); // Should be reasonably short
        });

        it('should generate consistent keys for same inputs', () => {
            const key1 = FastHash.shortKey('prefix', 'a', 'b', 'c');
            const key2 = FastHash.shortKey('prefix', 'a', 'b', 'c');
            
            expect(key1).toBe(key2);
        });

        it('should generate different keys for different inputs', () => {
            const key1 = FastHash.shortKey('prefix', 'a', 'b');
            const key2 = FastHash.shortKey('prefix', 'a', 'c');
            
            expect(key1).not.toBe(key2);
        });

        it('should handle empty parts', () => {
            const key = FastHash.shortKey('prefix');
            
            expect(key).toMatch(/^prefix:/);
        });
    });
});

describe('CacheKeyUtils', () => {
    describe('validate', () => {
        it('should validate normal keys', () => {
            expect(CacheKeyUtils.validate('normal-key')).toBe(true);
            expect(CacheKeyUtils.validate('key|with|pipes')).toBe(true);
            expect(CacheKeyUtils.validate('key:with:colons')).toBe(true);
        });

        it('should reject keys that are too long', () => {
            const longKey = 'a'.repeat(501);
            expect(CacheKeyUtils.validate(longKey)).toBe(false);
        });

        it('should reject keys with problematic characters', () => {
            expect(CacheKeyUtils.validate('key\nwith\nnewlines')).toBe(false);
            expect(CacheKeyUtils.validate('key\rwith\rcarriage')).toBe(false);
            expect(CacheKeyUtils.validate('key\0with\0null')).toBe(false);
        });

        it('should accept keys at the length limit', () => {
            const limitKey = 'a'.repeat(500);
            expect(CacheKeyUtils.validate(limitKey)).toBe(true);
        });
    });

    describe('normalize', () => {
        it('should trim and lowercase keys', () => {
            expect(CacheKeyUtils.normalize('  TEST-KEY  ')).toBe('test-key');
            expect(CacheKeyUtils.normalize('MixedCase')).toBe('mixedcase');
        });

        it('should handle empty strings', () => {
            expect(CacheKeyUtils.normalize('')).toBe('');
            expect(CacheKeyUtils.normalize('   ')).toBe('');
        });

        it('should preserve special characters', () => {
            expect(CacheKeyUtils.normalize('KEY|WITH:SPECIAL-CHARS')).toBe('key|with:special-chars');
        });
    });

    describe('truncate', () => {
        it('should not truncate short keys', () => {
            const shortKey = 'short-key';
            expect(CacheKeyUtils.truncate(shortKey)).toBe(shortKey);
        });

        it('should truncate long keys with default length', () => {
            const longKey = 'a'.repeat(300);
            const truncated = CacheKeyUtils.truncate(longKey);
            
            expect(truncated.length).toBeLessThanOrEqual(200);
            expect(truncated).toContain('...');
        });

        it('should truncate with custom max length', () => {
            const longKey = 'a'.repeat(100);
            const truncated = CacheKeyUtils.truncate(longKey, 50);
            
            expect(truncated.length).toBeLessThanOrEqual(50);
            expect(truncated).toContain('...');
        });

        it('should preserve uniqueness with hash', () => {
            const key1 = 'a'.repeat(300) + 'unique1';
            const key2 = 'a'.repeat(300) + 'unique2';
            
            const truncated1 = CacheKeyUtils.truncate(key1);
            const truncated2 = CacheKeyUtils.truncate(key2);
            
            expect(truncated1).not.toBe(truncated2);
        });

        it('should handle keys exactly at max length', () => {
            const exactKey = 'a'.repeat(200);
            expect(CacheKeyUtils.truncate(exactKey, 200)).toBe(exactKey);
        });
    });
});

describe('integration tests', () => {
    it('should work together for complex cache key scenarios', () => {
        // Test that all components work together
        const options = {
            timeZone: 'America/New_York',
            locale: 'en-US',
            format: 'long'
        };
        
        const key = CacheKeys.customFormat('YYYY-MM-DD', 'en-US', options);
        
        expect(CacheKeyUtils.validate(key)).toBe(true);
        
        const normalized = CacheKeyUtils.normalize(key);
        expect(normalized).toBe(key.toLowerCase());
        
        const hash = FastHash.hash(key);
        expect(hash.length).toBeGreaterThan(0);
    });

    it('should handle edge case combinations', () => {
        // Test with very complex objects
        const complexOptions = {
            nested: {
                deep: {
                    value: 'test',
                    array: [1, 2, { inner: 'value' }]
                }
            },
            special: '!@#$%^&*()'
        };
        
        const key = CacheKeys.customFormat('complex-pattern', 'en-US', complexOptions);
        
        expect(key).toContain('cfmt');
        expect(CacheKeyUtils.validate(key)).toBe(true);
    });
});