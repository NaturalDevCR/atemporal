const { Temporal } = require('@js-temporal/polyfill');

function calculateDiff(d1, d2, unit) {
  const normalizedUnit = unit.replace(/s$/, '');
  try {
    const duration = d1.since(d2);
    console.log('Duration:', duration.toString());
    const total = duration.total({ unit: normalizedUnit, relativeTo: d1 });
    console.log('Total:', total);
    return total;
  } catch (error) {
    console.error('Error:', error.message);
    return 0;
  }
}

const d1 = Temporal.ZonedDateTime.from('2023-01-01T00:00:00Z[UTC]');
const d2 = Temporal.ZonedDateTime.from('2023-01-02T00:00:00Z[UTC]');

console.log('Diff days:', calculateDiff(d1, d2, 'days'));
