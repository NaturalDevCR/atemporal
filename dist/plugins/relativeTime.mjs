// src/plugins/relativeTime.ts
var getRelativeTime = (instance, comparisonDate, withoutSuffix, locale) => {
  if (!instance.isValid() || !comparisonDate.isValid()) {
    return "Invalid Date";
  }
  const THRESHOLDS = {
    s: 45,
    // seconds to minute
    m: 45,
    // minutes to hour
    h: 22,
    // hours to day
    d: 26,
    // days to month
    M: 11
    // months to year
  };
  const diffSeconds = instance.diff(comparisonDate, "second");
  const diffMinutes = instance.diff(comparisonDate, "minute");
  const diffHours = instance.diff(comparisonDate, "hour");
  const diffDays = instance.diff(comparisonDate, "day");
  const diffMonths = instance.diff(comparisonDate, "month");
  const diffYears = instance.diff(comparisonDate, "year");
  let bestUnit;
  let bestDiff;
  if (Math.abs(diffSeconds) < THRESHOLDS.s) {
    bestUnit = "second";
    bestDiff = Math.round(diffSeconds);
  } else if (Math.abs(diffMinutes) < THRESHOLDS.m) {
    bestUnit = "minute";
    bestDiff = Math.round(diffMinutes);
  } else if (Math.abs(diffHours) < THRESHOLDS.h) {
    bestUnit = "hour";
    bestDiff = Math.round(diffHours);
  } else if (Math.abs(diffDays) < THRESHOLDS.d) {
    bestUnit = "day";
    bestDiff = Math.round(diffDays);
  } else if (Math.abs(diffMonths) < THRESHOLDS.M) {
    bestUnit = "month";
    bestDiff = Math.round(diffMonths);
  } else {
    bestUnit = "year";
    bestDiff = Math.round(diffYears);
  }
  if (withoutSuffix) {
    return new Intl.NumberFormat(locale, {
      style: "unit",
      unit: bestUnit,
      unitDisplay: "long"
    }).format(Math.abs(bestDiff));
  }
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  return rtf.format(bestDiff, bestUnit);
};
var relativeTimePlugin = (Atemporal, atemporal) => {
  Atemporal.prototype.fromNow = function(withoutSuffix = false) {
    const now = atemporal();
    const locale = atemporal.getDefaultLocale();
    return getRelativeTime(this, now, withoutSuffix, locale);
  };
  Atemporal.prototype.toNow = function(withoutSuffix = false) {
    const now = atemporal();
    const locale = atemporal.getDefaultLocale();
    return getRelativeTime(now, this, withoutSuffix, locale);
  };
};
var relativeTime_default = relativeTimePlugin;
export {
  relativeTime_default as default
};
//# sourceMappingURL=relativeTime.mjs.map