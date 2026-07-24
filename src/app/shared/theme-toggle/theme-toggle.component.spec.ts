import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { ThemeToggleComponent } from './theme-toggle.component';

describe('ThemeToggleComponent', () => {
  let fixture: ComponentFixture<ThemeToggleComponent>;

  beforeEach(async () => {
    const storedThemes = new Map<string, string>();
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      value: {
        get length() {
          return storedThemes.size;
        },
        clear: vi.fn(() => storedThemes.clear()),
        getItem: vi.fn((key: string) => storedThemes.get(key) ?? null),
        key: vi.fn((index: number) => [...storedThemes.keys()][index] ?? null),
        removeItem: vi.fn((key: string) => storedThemes.delete(key)),
        setItem: vi.fn((key: string, value: string) => storedThemes.set(key, value)),
      } satisfies Storage,
    });
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn(() => ({
        matches: false,
        addEventListener: vi.fn(),
      })),
    });

    await TestBed.configureTestingModule({ imports: [ThemeToggleComponent] }).compileComponents();
    fixture = TestBed.createComponent(ThemeToggleComponent);
    fixture.detectChanges();
  });

  it('exposes its current state and toggles accessibly', () => {
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(button.getAttribute('role')).toBe('switch');
    expect(button.getAttribute('aria-checked')).toBe('false');
    expect(button.getAttribute('aria-label')).toBe('Switch to dark mode');

    button.click();
    fixture.detectChanges();

    expect(button.getAttribute('aria-checked')).toBe('true');
    expect(button.getAttribute('aria-label')).toBe('Switch to light mode');
  });
});
