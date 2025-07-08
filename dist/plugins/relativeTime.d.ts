import type { Plugin } from '../types';
declare module '../TemporalWrapper' {
    interface TemporalWrapper {
        fromNow(withoutSuffix?: boolean): string;
        toNow(withoutSuffix?: boolean): string;
    }
}
declare const relativeTimePlugin: Plugin;
export default relativeTimePlugin;
