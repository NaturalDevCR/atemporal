import re

# Read the file
with open('/Users/jdavidoa91/Documents/GitHub/atemporal/src/__tests__/core/comparison/comparison-optimizer-coverage.test.ts', 'r') as f:
    content = f.read()

# Remove all duplicate cacheMisses properties
content = re.sub(r'(cacheMisses: \d+,)\s*\n\s*cacheMisses: \d+,', r'\1', content)

# Remove all duplicate unitBreakdown properties
content = re.sub(r'(unitBreakdown: \{[^}]+\}),?\s*\n\s*unitBreakdown: \{[^}]+\}', r'\1', content, flags=re.DOTALL)

# Fix any remaining syntax issues
content = re.sub(r'},\s*}', '}\n      }', content)

# Write back to file
with open('/Users/jdavidoa91/Documents/GitHub/atemporal/src/__tests__/core/comparison/comparison-optimizer-coverage.test.ts', 'w') as f:
    f.write(content)

print('Fixed duplicate properties in comparison optimizer test file')