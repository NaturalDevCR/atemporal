"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const relativeTimePlugin = (Atemporal, atemporal) => {
    const UNITS = ['year', 'month', 'day', 'hour', 'minute', 'second'];
    Atemporal.prototype.fromNow = function (withoutSuffix = false) {
        const dateToCompare = this;
        const now = atemporal();
        let bestUnit = 'second';
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
        const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
        if (withoutSuffix) {
            // Usamos formatToParts para descomponer el string
            const parts = rtf.formatToParts(bestDiff, bestUnit);
            // Nos quedamos solo con las partes que son el número y la unidad, y las unimos.
            return parts
                .filter(part => part.type === 'integer' || part.type === 'unit')
                .map(part => part.value)
                .join(' ');
        }
        // Si no se pide 'withoutSuffix', usamos el formato normal.
        return rtf.format(bestDiff, bestUnit);
    };
    Atemporal.prototype.toNow = function (withoutSuffix = false) {
        return this.fromNow(withoutSuffix);
    };
};
exports.default = relativeTimePlugin;
