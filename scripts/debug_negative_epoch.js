const { TemporalUtils } = require('./src/TemporalUtils.ts');

console.log('Testing -86400000 parsing:');
try {
  const result = TemporalUtils.from(-86400000);
  console.log('Result year:', result.year);
  console.log('Result month:', result.month);
  console.log('Result day:', result.day);
  console.log('Full result:', result.toString());
} catch (e) {
  console.log('Error:', e.message);
}

console.log('\nExpected result (using Date):');
const expected = new Date(-86400000);
console.log('Expected year:', expected.getUTCFullYear());
console.log('Expected month:', expected.getUTCMonth() + 1);
console.log('Expected day:', expected.getUTCDate());
console.log('Expected ISO:', expected.toISOString());