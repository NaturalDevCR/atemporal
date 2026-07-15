import { TemporalWrapper } from './TemporalWrapper';
import { TemporalUtils } from './TemporalUtils';
import type { Temporal } from '@js-temporal/polyfill';
import { Temporal as TemporalAPI } from './core/temporal-api';
import type { OfficialPluginName, Plugin } from './types';

export function isAtemporal(input: unknown): input is TemporalWrapper {
    return input instanceof TemporalWrapper;
}

export function isValid(input: unknown): boolean {
    if (input === null || input === undefined) {
        return false;
    }
    try {
        TemporalUtils.from(input);
        return true;
    } catch (e) {
        return false;
    }
}

export function isDuration(input: unknown): input is Temporal.Duration {
    return input instanceof TemporalAPI.Duration;
}

export function isValidTimeZone(tz: string): boolean {
    try {
        new Intl.DateTimeFormat('en-US', { timeZone: tz });
        return true;
    } catch {
        return false;
    }
}

export function isValidLocale(code: string): boolean {
    try {
        new Intl.Locale(code);
        return true;
    } catch {
        return false;
    }
}

export const PLUGIN_SENTINEL = Symbol('atemporal.plugin');
export const OFFICIAL_PLUGIN_METADATA = Symbol('atemporal.officialPlugin');

export type OfficialPluginMetadata = Readonly<{
    name: OfficialPluginName;
    official: true;
}>;

export function markAsPlugin<T extends Plugin>(
    fn: T,
    metadata?: OfficialPluginMetadata,
): T {
    const record = fn as unknown as Record<symbol, unknown>;
    record[PLUGIN_SENTINEL] = true;
    if (metadata) record[OFFICIAL_PLUGIN_METADATA] = metadata;
    return fn;
}

export function getOfficialPluginMetadata(input: unknown): OfficialPluginMetadata | null {
    if (typeof input !== 'function') return null;
    const metadata = (input as unknown as Record<symbol, unknown>)[OFFICIAL_PLUGIN_METADATA];
    return metadata && typeof metadata === 'object' && (metadata as OfficialPluginMetadata).official === true
        ? metadata as OfficialPluginMetadata
        : null;
}

export function isPlugin(input: unknown): boolean {
    if (typeof input !== 'function') return false;
    if ((input as unknown as Record<symbol, unknown>)[PLUGIN_SENTINEL] === true) return true;
    return (input.length === 2 || input.length === 3) && input.name !== '';
}
