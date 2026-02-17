const fs = require('fs');
const path = require('path');

// Read the file
const filePath = '/Users/jdavidoa91/Documents/GitHub/atemporal/src/__tests__/core/comparison/comparison-optimizer-coverage.test.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Function to fix ComparisonMetrics objects
function fixComparisonMetrics(content) {
  // Pattern to match ComparisonMetrics objects
  const metricsPattern = /(const \w+: ComparisonMetrics = \{[^}]+\};)/gs;
  
  return content.replace(metricsPattern, (match) => {
    // Extract the variable name
    const nameMatch = match.match(/const (\w+): ComparisonMetrics/);
    const varName = nameMatch ? nameMatch[1] : 'metrics';
    
    // Extract existing values or use defaults
    const totalComparisons = extractValue(match, 'totalComparisons') || '1000';
    const fastPathHits = extractValue(match, 'fastPathHits') || '600';
    const cacheHits = extractValue(match, 'cacheHits') || '400';
    const cacheMisses = extractValue(match, 'cacheMisses') || '400';
    const averageComputeTime = extractValue(match, 'averageComputeTime') || '0.5';
    
    return `const ${varName}: ComparisonMetrics = {
        totalComparisons: ${totalComparisons},
        fastPathHits: ${fastPathHits},
        cacheHits: ${cacheHits},
        cacheMisses: ${cacheMisses},
        averageComputeTime: ${averageComputeTime},
        operationBreakdown: {
          isBefore: 100,
          isAfter: 80,
          isSame: 60,
          isSameOrBefore: 40,
          isSameOrAfter: 30,
          isBetween: 50,
          diff: 20,
          duration: 10
        },
        unitBreakdown: {
          nanosecond: 0, nanoseconds: 0,
          microsecond: 0, microseconds: 0,
          millisecond: 50, milliseconds: 25,
          second: 100, seconds: 50,
          minute: 150, minutes: 75,
          hour: 100, hours: 50,
          day: 75, days: 37,
          week: 25, weeks: 12,
          month: 12, months: 6,
          year: 5, years: 2
        }
      };`;
  });
}

function extractValue(text, property) {
  const regex = new RegExp(`${property}:\\s*(\\d+(?:\\.\\d+)?)`);  
  const match = text.match(regex);
  return match ? match[1] : null;
}

// Fix the content
content = fixComparisonMetrics(content);

// Write back to file
fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed comparison optimizer test file with proper ComparisonMetrics objects');