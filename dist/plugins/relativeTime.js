"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/plugins/relativeTime.ts
var relativeTime_exports = {};
__export(relativeTime_exports, {
  default: () => relativeTime_default
});
module.exports = __toCommonJS(relativeTime_exports);
var relativeTimePlugin = (Atemporal, atemporal) => {
  const UNITS = ["year", "month", "day", "hour", "minute", "second"];
  Atemporal.prototype.fromNow = function(withoutSuffix = false) {
    if (!this.isValid()) {
      return "Invalid Date";
    }
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
    const now = atemporal();
    const diff = this.diff(now, "second");
    return this.fromNow(withoutSuffix);
  };
};
var relativeTime_default = relativeTimePlugin;
//# sourceMappingURL=relativeTime.js.map