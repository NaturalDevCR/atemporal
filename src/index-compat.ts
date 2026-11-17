/** Synchronous v2-compatible entry, including legacy plugin re-exports. */
export { default } from './index';
export * from './index';

// Export the dateRangeOverlap plugin and related utilities
export {
  default as dateRangeOverlapPlugin,
  checkDateRangeOverlap,
  InvalidDateRangeError,
  OverlapDetectionError,
} from "./plugins/dateRangeOverlap";
export { default as businessDaysPlugin } from "./plugins/businessDays";
export { default as timeSlotsPlugin } from "./plugins/timeSlots";

