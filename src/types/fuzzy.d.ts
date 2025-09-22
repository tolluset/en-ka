declare module 'fuzzy' {
  interface FilterResult<T> {
    original: T;
    string: string;
    score: number;
    index: number;
  }

  interface FilterOptions {
    pre?: string;
    post?: string;
    extract?: (el: any) => string;
  }

  export function filter<T>(
    pattern: string,
    arr: T[],
    options?: FilterOptions
  ): FilterResult<T>[];

  export function match(
    pattern: string,
    string: string,
    options?: FilterOptions
  ): FilterResult<string> | null;

  export function test(pattern: string, string: string): boolean;
}