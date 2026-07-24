import { DOCUMENT } from '@angular/common';
import { computed, inject, Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

const THEME_STORAGE_KEY = 'taskflow-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly browser = this.document.defaultView;
  private readonly systemPreference = this.browser?.matchMedia?.('(prefers-color-scheme: dark)');
  private explicitPreference = this.readStoredTheme();
  private readonly themeSignal = signal<Theme>(
    this.explicitPreference ?? (this.systemPreference?.matches ? 'dark' : 'light'),
  );

  readonly theme = this.themeSignal.asReadonly();
  readonly isDark = computed(() => this.themeSignal() === 'dark');

  constructor() {
    this.applyTheme(this.themeSignal());
    this.systemPreference?.addEventListener('change', (event) => {
      if (!this.explicitPreference) this.applyTheme(event.matches ? 'dark' : 'light');
    });
  }

  toggle(): void {
    this.setTheme(this.isDark() ? 'light' : 'dark');
  }

  setTheme(theme: Theme): void {
    this.explicitPreference = theme;
    try {
      this.browser?.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Theme selection still applies when storage is unavailable.
    }
    this.applyTheme(theme);
  }

  private applyTheme(theme: Theme): void {
    this.themeSignal.set(theme);
    this.document.documentElement.dataset['theme'] = theme;
    this.document.documentElement.style.colorScheme = theme;
  }

  private readStoredTheme(): Theme | null {
    try {
      const stored = this.browser?.localStorage.getItem(THEME_STORAGE_KEY);
      return stored === 'light' || stored === 'dark' ? stored : null;
    } catch {
      return null;
    }
  }
}
