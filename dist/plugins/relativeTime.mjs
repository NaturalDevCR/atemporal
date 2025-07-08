// src/plugins/relativeTime.ts
var relativeTimePlugin = (Atemporal, atemporal) => {
  const UNITS = ["year", "month", "day", "hour", "minute", "second"];
  Atemporal.prototype.fromNow = function(withoutSuffix = false) {
    const dateToCompare = this;
    const now = atemporal();
    let bestUnit = "second";
    let bestDiff = 0;
    for (const unit of UNITS) {
      const diff = now.diff(dateToCompare.raw, unit);
      if (Math.abs(diff) >= 1) {
        bestUnit = unit;
        bestDiff = Math.round(diff);
        break;
      }
    }
    const locale = atemporal.getDefaultLocale();
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
    if (withoutSuffix) {
      const parts = rtf.formatToParts(bestDiff, bestUnit);
      return parts.filter((part) => part.type === "integer" || part.type === "unit").map((part) => part.value).join(" ");
    }
    return rtf.format(bestDiff, bestUnit);
  };
  Atemporal.prototype.toNow = function(withoutSuffix = false) {
    return this.fromNow(withoutSuffix);
  };
};
var relativeTime_default = relativeTimePlugin;
export {
  relativeTime_default as default
};
//# sourceMappingURL=relativeTime.mjs.map