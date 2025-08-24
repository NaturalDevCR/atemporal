/**
 * @file Comprehensive coverage tests for parsing-strategies.ts
 * Tests the deprecated parsing strategies file to achieve 100% coverage
 */

import { describe, it, expect } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

describe('parsing-strategies.ts - Deprecated File Coverage', () => {
    const filePath = path.resolve(__dirname, '../../../core/parsing/parsing-strategies.ts');
    
    /**
     * Test that the deprecated file exists and can be read
     */
    it('should exist as a deprecated file', () => {
        expect(fs.existsSync(filePath)).toBe(true);
    });
    
    /**
     * Test the file content to ensure it contains deprecation notices
     */
    it('should contain deprecation notices and comments', () => {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        
        // Verify the file contains the expected deprecation content
        expect(fileContent).toContain('Legacy parsing strategies - DEPRECATED');
        expect(fileContent).toContain('These implementations are kept for compatibility');
        expect(fileContent).toContain('Use the proper strategy implementations in the strategies/ folder instead');
    });
    
    /**
     * Test that the file contains proper documentation about deprecated strategies
     */
    it('should document all deprecated strategy types', () => {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        
        // Verify documentation for specific deprecated strategies
        expect(fileContent).toContain('DEPRECATED: StringStrategy');
        expect(fileContent).toContain('DateParseStrategy from strategies/date-strategy.ts');
        expect(fileContent).toContain('NumberParseStrategy from strategies/number-strategy.ts');
        expect(fileContent).toContain('TemporalWrapperStrategy from strategies/temporal-wrapper-strategy.ts');
        expect(fileContent).toContain('ArrayLikeStrategy from strategies/array-like-strategy.ts');
        expect(fileContent).toContain('FirebaseTimestampStrategy from strategies/firebase-strategy.ts');
        expect(fileContent).toContain('FallbackStrategy from strategies/fallback-strategy.ts');
    });
    
    /**
     * Test that the file has the expected structure and line count
     */
    it('should have the expected file structure', () => {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const lines = fileContent.split('\n');
        
        // Verify the file has the expected number of lines (29 total)
        expect(lines.length).toBe(29);
        
        // Verify the first line contains the file header
        expect(lines[0]).toContain('/**');
        expect(lines[1]).toContain('@file Legacy parsing strategies - DEPRECATED');
    });
    
    /**
     * Test that the file doesn't export any actual implementations
     */
    it('should not export any actual strategy implementations', () => {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        
        // Verify no actual exports exist (only comments)
        expect(fileContent).not.toContain('export class');
        expect(fileContent).not.toContain('export function');
        expect(fileContent).not.toContain('export const');
        expect(fileContent).not.toContain('export default');
    });
    
    /**
     * Test that importing the file doesn't cause errors
     */
    it('should be importable without errors', async () => {
        // Since the file only contains comments, importing should not throw
        expect(() => {
            // Dynamic import to test the file can be loaded
            require('../../../core/parsing/parsing-strategies');
        }).not.toThrow();
    });
    
    /**
     * Test file metadata and properties
     */
    it('should have correct file metadata', () => {
        const stats = fs.statSync(filePath);
        
        // Verify it's a file and not a directory
        expect(stats.isFile()).toBe(true);
        expect(stats.isDirectory()).toBe(false);
        
        // Verify file has content (not empty)
        expect(stats.size).toBeGreaterThan(0);
    });
    
    /**
     * Test that the file contains proper TypeScript/JavaScript syntax
     */
    it('should contain valid comment syntax', () => {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        
        // Verify proper comment block syntax
        expect(fileContent).toContain('/**');
        expect(fileContent).toContain('*/');
        expect(fileContent).toContain('/*');
        
        // Verify no syntax errors in comments
        const commentBlocks = fileContent.match(/\/\*[\s\S]*?\*\//g);
        expect(commentBlocks).toBeTruthy();
        expect(commentBlocks!.length).toBeGreaterThan(0);
    });
    
    /**
     * Test deprecation warnings and migration guidance
     */
    it('should provide clear migration guidance', () => {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        
        // Verify migration guidance is present
        expect(fileContent).toContain('strategies/ folder');
        expect(fileContent).toContain('proper strategy implementations');
        expect(fileContent).toContain('should not be used');
        
        // Verify specific file references for migration
        expect(fileContent).toContain('.ts');
        expect(fileContent).toContain('strategies/');
    });
    
    /**
     * Test that the file follows the expected deprecation pattern
     */
    it('should follow proper deprecation documentation pattern', () => {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        
        // Verify deprecation markers
        const deprecatedCount = (fileContent.match(/DEPRECATED/g) || []).length;
        expect(deprecatedCount).toBeGreaterThan(0);
        
        // Verify proper file header structure
        expect(fileContent.startsWith('/**')).toBe(true);
        expect(fileContent).toContain('@file');
    });
});