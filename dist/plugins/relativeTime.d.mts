import { P as Plugin } from '../TemporalWrapper-glHCeOuR.mjs';
import '@js-temporal/polyfill';

declare module '../TemporalWrapper' {
    interface TemporalWrapper {
        fromNow(withoutSuffix?: boolean): string;
        toNow(withoutSuffix?: boolean): string;
    }
}
declare const relativeTimePlugin: Plugin;

export { relativeTimePlugin as default };
