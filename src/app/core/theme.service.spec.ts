import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let mediaMatches: boolean;
  let changeListener: ((event: MediaQueryListEvent) => void) | undefined;
  let storedThemes: Map<string, string>;
  let storage: Storage;

  beforeEach(() => {
    mediaMatches = false;
    changeListener = undefined;
    storedThemes = new Map();
    storage = {
      get length() {
        return storedThemes.size;
      },
      clear: vi.fn(() => storedThemes.clear()),
      getItem: vi.fn((key: string) => storedThemes.get(key) ?? null),
      key: vi.fn((index: number) => [...storedThemes.keys()][index] ?? null),
      removeItem: vi.fn((key: string) => storedThemes.delete(key)),
      setItem: vi.fn((key: string, value: string) => storedThemes.set(key, value)),
    };
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: storage,
    });
    document.documentElement.removeAttribute('data-theme');
    document.documentElement.style.removeProperty('color-scheme');

    const mediaQuery = {
      get matches() {
        return mediaMatches;
      },
      media: '(prefers-color-scheme: dark)',
      onchange: null,
      addEventListener: vi.fn(
        (_event: string, listener: (event: MediaQueryListEvent) => void) =>
          (changeListener = listener),
      ),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    } as unknown as MediaQueryList;

    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => mediaQuery),
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it('restores a persisted preference and applies it to the root document', () => {
    storage.setItem('taskflow-theme', 'dark');

    const service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(document.documentElement.style.colorScheme).toBe('dark');
  });

  it('uses and follows the system preference until the user selects a theme', () => {
    mediaMatches = true;
    const service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('dark');

    mediaMatches = false;
    changeListener?.({ matches: false } as MediaQueryListEvent);

    expect(service.theme()).toBe('light');
    expect(document.documentElement.dataset['theme']).toBe('light');
  });

  it('persists a manual toggle and ignores later system changes', () => {
    const service = TestBed.inject(ThemeService);

    service.toggle();
    changeListener?.({ matches: false } as MediaQueryListEvent);

    expect(service.theme()).toBe('dark');
    expect(storage.getItem('taskflow-theme')).toBe('dark');
  });

  it('falls back to the system preference when storage cannot be read', () => {
    mediaMatches = true;
    vi.mocked(storage.getItem).mockImplementation(() => {
      throw new Error('Storage disabled');
    });

    const service = TestBed.inject(ThemeService);

    expect(service.theme()).toBe('dark');
  });
});
