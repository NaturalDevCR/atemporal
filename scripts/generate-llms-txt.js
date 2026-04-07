const fs = require('fs');
const path = require('path');

const repoRoot = path.join(__dirname, '..');
const docsDir = path.join(repoRoot, 'docs');
const outPath = path.join(docsDir, 'public', 'llms.txt');

const filesToInclude = [
  'guide/getting-started.md',
  'guide/core-concepts.md',
  'api/index.md',
  'api/creating-instances.md',
  'api/manipulation.md',
  'api/formatting.md',
  'api/comparison-difference.md',
  'api/durations-utilities.md',
  'api/ranges.md',
  'plugins/index.md',
  'plugins/relative-time.md',
  'plugins/custom-parse-format.md',
  'plugins/advanced-format.md',
  'plugins/week-day.md',
  'plugins/duration-humanizer.md',
  'plugins/date-range-overlap.md',
  'plugins/business-days.md',
  'plugins/time-slots.md'
];

let llmsContent = `# Atemporal Documentation

Atemporal is a modern and ergonomic date-time library for JavaScript and TypeScript, powered by the standardized Temporal API.

This file provides comprehensive documentation formatted for AI assistants.

`;

for (const file of filesToInclude) {
  const fullPath = path.join(docsDir, file);
  if (fs.existsSync(fullPath)) {
    const content = fs.readFileSync(fullPath, 'utf8');
    llmsContent += `\n\n--- FILE: ${file} ---\n\n`;
    llmsContent += content;
  } else {
    console.warn(`File not found: ${fullPath}`);
  }
}

fs.writeFileSync(outPath, llmsContent);
console.log(`Successfully generated ${outPath}`);
