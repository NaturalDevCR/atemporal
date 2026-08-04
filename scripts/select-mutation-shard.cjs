const fs = require('node:fs');
const path = require('node:path');

const shardCount = Number(process.env.MUTATION_SHARD_COUNT ?? 24);
const shardIndex = Number(process.env.MUTATION_SHARD_INDEX);

if (!Number.isInteger(shardCount) || shardCount < 1) {
  throw new Error(`MUTATION_SHARD_COUNT must be a positive integer (received ${shardCount})`);
}

if (!Number.isInteger(shardIndex) || shardIndex < 0 || shardIndex >= shardCount) {
  throw new Error(
    `MUTATION_SHARD_INDEX must be an integer from 0 to ${shardCount - 1} (received ${shardIndex})`,
  );
}

const sourceRoot = path.resolve('src');
const files = [];

function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      visit(absolutePath);
      continue;
    }

    const relativePath = path.relative(process.cwd(), absolutePath).split(path.sep).join('/');
    if (
      entry.name.endsWith('.ts') &&
      !entry.name.endsWith('.d.ts') &&
      relativePath !== 'src/types.ts' &&
      relativePath !== 'src/index.ts' &&
      !relativePath.startsWith('src/examples/') &&
      !relativePath.startsWith('src/__tests__/') &&
      !entry.name.endsWith('.test.ts') &&
      !entry.name.endsWith('.spec.ts')
    ) {
      files.push({
        path: relativePath,
        weight: fs.readFileSync(absolutePath, 'utf8').split(/\r?\n/).length,
      });
    }
  }
}

visit(sourceRoot);
files.sort((left, right) => right.weight - left.weight || left.path.localeCompare(right.path));

const shards = Array.from({ length: shardCount }, () => ({ files: [], weight: 0 }));
for (const file of files) {
  const target = shards.reduce((lightest, candidate) =>
    candidate.weight < lightest.weight ? candidate : lightest,
  );
  target.files.push(file.path);
  target.weight += file.weight;
}

const selectedFiles = shards[shardIndex].files.sort();
if (selectedFiles.length === 0) {
  throw new Error(`Mutation shard ${shardIndex} is empty`);
}

process.stdout.write(selectedFiles.join(','));
