import re

# Read the file
with open('/Users/jdavidoa91/Documents/GitHub/atemporal/src/__tests__/core/comparison/comparison-optimizer-coverage.test.ts', 'r') as f:
    content = f.read()

# Complete CacheStats template
complete_cache_stats = '''{
        hitRatio: 0.7,
        size: 50,
        maxSize: 100,
        hits: 70,
        misses: 30,
        sets: 50,
        evictions: 5,
        hitRate: 0.7,
        averageAccessTime: 0.002,
        efficiency: 0.75
      }'''

# Replace all CacheStats objects
content = re.sub(
    r'const \w+: CacheStats = \{[^}]+\};',
    lambda m: m.group(0).split('=')[0] + '= ' + complete_cache_stats + ';',
    content,
    flags=re.DOTALL
)

# Also fix inline CacheStats objects
content = re.sub(
    r'(\w+: CacheStats = )\{[^}]+\}',
    r'\1' + complete_cache_stats,
    content,
    flags=re.DOTALL
)

# Remove frequency property from ComparisonProfile objects
content = re.sub(r'frequency: [0-9.]+,\s*\n', '', content)

# Write back to file
with open('/Users/jdavidoa91/Documents/GitHub/atemporal/src/__tests__/core/comparison/comparison-optimizer-coverage.test.ts', 'w') as f:
    f.write(content)

print('Fixed CacheStats objects and removed frequency properties')