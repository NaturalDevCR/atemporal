/**
 * Centralized regex cache system.
 * Improves performance by precompiling and reusing common regular expressions.
 * @internal
 */
import { LRUCache } from "./core/caching/lru-cache";

export class RegexCache {
  // Configurable maximum cache size
  private static readonly MAX_CACHE_SIZE = 100;

  // Cache for dynamic regular expressions
  private static _dynamicRegexCache: LRUCache<string, RegExp> | null = null;

  // Static precompiled regular expressions
  private static _precompiledRegex: Map<string, RegExp> = new Map();

  // Initialization of precompiled regular expressions
  static {
    // Date/time format - ordered by length to prevent single char matches
    this._precompiledRegex.set(
      "tokenRegex",
      /\[([^\]]+)]|YYYY|MMMM|dddd|MMM|ddd|YY|MM|DD|HH|hh|mm|ss|SSS|ZZ|dd|(?<!\w)[MDAHhmsZaz](?!\w)/g
    );

    // ISO UTC validation
    this._precompiledRegex.set(
      "isoUtcRegex",
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/
    );

    // Custom format - UPDATED to include bracket handling
    this._precompiledRegex.set(
      "customFormatTokenRegex",
      /\[([^\]]+)]|YYYY|YY|MMMM|MMM|MM|M|DDDD|DDD|DD|D|WWW|WW|W|HH|H|hh|h|mm|m|ss|s|SSS|SS|S|A|a/g
    );
    this._precompiledRegex.set("escapeRegexChars", /[-/\\^$*+?.()|[\]{}]/g);

    // Advanced format
    this._precompiledRegex.set("advancedTokenRegex", /Qo|Do|zzzz|zzz/g);
  }

  /**
   * Gets the precompiled custom format token regex.
   * @returns The custom format token regex for parsing format strings
   */
  static getCustomFormatTokenRegex(): RegExp {
    const regex = this._precompiledRegex.get("customFormatTokenRegex");
    if (!regex) {
      throw new Error(
        "Custom format token regex not found in precompiled cache"
      );
    }
    return regex;
  }

  /**
   * Gets a precompiled regular expression by its name.
   * @param name Name of the precompiled regular expression
   * @returns The precompiled regular expression or undefined if not found
   */
  static getPrecompiled(name: string): RegExp | undefined {
    return this._precompiledRegex.get(name);
  }

  /**
   * Gets or creates a dynamic regular expression.
   * @param pattern Regular expression pattern
   * @param flags Regular expression flags (default: none)
   * @returns The cached regular expression
   */
  static getDynamic(pattern: string, flags?: string): RegExp {
    const key = `${pattern}|${flags || ""}`;

    // Initialize cache if necessary
    if (!this._dynamicRegexCache) {
      this._dynamicRegexCache = new LRUCache<string, RegExp>(
        this.MAX_CACHE_SIZE
      );
    }

    // Check if it already exists in the cache
    let regex = this._dynamicRegexCache.get(key);
    if (!regex) {
      // Create new regular expression and store it in the cache
      regex = new RegExp(pattern, flags);
      this._dynamicRegexCache.set(key, regex);
    }

    return regex;
  }

  /**
   * Clears the dynamic regular expression cache.
   */
  static clear(): void {
    if (this._dynamicRegexCache) {
      this._dynamicRegexCache.clear();
    }
  }

  /**
   * Sets the maximum cache size.
   * @param size New maximum size for the cache
   */
  static setMaxCacheSize(size: number): void {
    if (size < 1) throw new Error("Cache size must be at least 1");

    // Create a new cache with the updated size
    this._dynamicRegexCache = new LRUCache<string, RegExp>(size);
  }

  /**
   * Gets cache statistics for monitoring.
   */
  static getStats() {
    return {
      precompiled: this._precompiledRegex.size,
      dynamic: this._dynamicRegexCache ? this._dynamicRegexCache.size : 0,
      maxSize: this.MAX_CACHE_SIZE,
    };
  }
}
