"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemporalWrapper = void 0;
const TemporalUtils_1 = require("./TemporalUtils");
class TemporalWrapper {
    constructor(input, timeZone = TemporalUtils_1.TemporalUtils.defaultTimeZone) {
        this.datetime = TemporalUtils_1.TemporalUtils.from(input, timeZone);
    }
    static from(input, tz) {
        return new TemporalWrapper(input, tz);
    }
    timeZone(tz) {
        return new TemporalWrapper(this.datetime.withTimeZone(tz));
    }
    add(value, unit) {
        // @ts-ignore
        const newDate = this.datetime.add({ [unit]: value });
        return new TemporalWrapper(newDate);
    }
    subtract(value, unit) {
        // @ts-ignore
        const newDate = this.datetime.subtract({ [unit]: value });
        return new TemporalWrapper(newDate);
    }
    set(unit, value) {
        const newDate = this.datetime.with({ [unit]: value });
        return new TemporalWrapper(newDate);
    }
    startOf(unit) {
        // @ts-ignore
        const newDate = this.datetime.round({ smallestUnit: unit, roundingMode: 'floor' });
        return new TemporalWrapper(newDate);
    }
    endOf(unit) {
        const start = this.startOf(unit).raw;
        // @ts-ignore
        const nextStart = start.add({ [unit]: 1 });
        const endDate = nextStart.subtract({ milliseconds: 1 });
        return new TemporalWrapper(endDate);
    }
    clone() {
        return new TemporalWrapper(this.datetime);
    }
    get(unit) {
        return this.datetime[unit];
    }
    get year() { return this.datetime.year; }
    get month() { return this.datetime.month; }
    get day() { return this.datetime.day; }
    get hour() { return this.datetime.hour; }
    get minute() { return this.datetime.minute; }
    get second() { return this.datetime.second; }
    get millisecond() { return this.datetime.millisecond; }
    get quarter() {
        return Math.ceil(this.datetime.month / 3);
    }
    get weekOfYear() {
        return this.datetime.weekOfYear;
    }
    format(options, localeCode) {
        return TemporalUtils_1.TemporalUtils.format(this.datetime, options, localeCode);
    }
    diff(other, unit = 'millisecond') {
        return TemporalUtils_1.TemporalUtils.diff(this.datetime, other, unit);
    }
    toDate() {
        return TemporalUtils_1.TemporalUtils.toDate(this.datetime);
    }
    toString() {
        return this.datetime.toString();
    }
    get raw() {
        return this.datetime;
    }
    isBefore(other) {
        return TemporalUtils_1.TemporalUtils.isBefore(this.datetime, other);
    }
    isAfter(other) {
        return TemporalUtils_1.TemporalUtils.isAfter(this.datetime, other);
    }
    isSameDay(other) {
        return TemporalUtils_1.TemporalUtils.isSameDay(this.datetime, other);
    }
    isLeapYear() {
        return this.datetime.inLeapYear;
    }
}
exports.TemporalWrapper = TemporalWrapper;
