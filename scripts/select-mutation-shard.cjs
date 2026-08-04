const fs = require('node:fs');
const path = require('node:path');

const shardCount = Number(process.env.MUTATION_SHARD_COUNT ?? 128);
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
      const lineCount = fs.readFileSync(absolutePath, 'utf8').split(/\r?\n/).length;
      files.push({ path: relativePath, lineCount });
    }
  }
}

visit(sourceRoot);
files.sort((left, right) => right.lineCount - left.lineCount || left.path.localeCompare(right.path));

const totalLines = files.reduce((total, file) => total + file.lineCount, 0);
const targetLinesPerChunk = Math.max(1, Math.ceil(totalLines / shardCount));
const chunks = [];

for (const file of files) {
  for (let startLine = 1; startLine <= file.lineCount; startLine += targetLinesPerChunk) {
    const endLine = Math.min(file.lineCount, startLine + targetLinesPerChunk - 1);
    chunks.push({
      selector: `${file.path}:${startLine}-${endLine}`,
      weight: endLine - startLine + 1,
    });
  }
}

if (chunks.length < shardCount) {
  throw new Error(`Cannot fill ${shardCount} mutation shards with ${chunks.length} source ranges`);
}

const shards = Array.from({ length: shardCount }, () => ({ chunks: [], weight: 0 }));
chunks.sort((left, right) => right.weight - left.weight || left.selector.localeCompare(right.selector));
for (const chunk of chunks) {
  const target = shards.reduce((lightest, candidate) =>
    candidate.weight < lightest.weight ? candidate : lightest,
  );
  target.chunks.push(chunk.selector);
  target.weight += chunk.weight;
}

const selectedChunks = shards[shardIndex].chunks.sort();
if (selectedChunks.length === 0) {
  throw new Error(`Mutation shard ${shardIndex} is empty`);
}

process.stdout.write(selectedChunks.join(','));
