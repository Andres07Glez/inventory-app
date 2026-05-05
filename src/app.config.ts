import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';
import { definePreset } from '@primeuix/themes';
import { routes } from './app/app.routes';

// ── Preset personalizado sobre Aura con los colores del design system ──────────
const InventarioPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50:  '#F5FFFD',
      100: '#F5FFFD',
      200: '#5EC9B5',
      300: '#5EC9B5',
      400: '#5EC9B5',
      500: '#007D68',
      600: '#007D68',
      700: '#0E5247',
      800: '#0E5247',
      900: '#001A15',
      950: '#001A15',
    },
    colorScheme: {
      light: {
        surface: {
          0:   '#ffffff',
          50:  '#F5FFFD',
          100: '#F7F7F7',
          200: '#eeeeee',
          300: '#e0e0e0',
          400: '#B3B3B3',
          500: '#9e9e9e',
          600: '#7F7F7F',
          700: '#4D4D4D',
          800: '#2a2a2a',
          900: '#1A1A1A',
          950: '#111111',
        },
        primary: {
          color:         '#007D68',
          contrastColor: '#ffffff',
          hoverColor:    '#0E5247',
          activeColor:   '#001A15',
        },
      },
      dark: {
        surface: {
          0:   '#ffffff',
          50:  '#1e1e1e',
          100: '#242424',
          200: '#2c2c2c',
          300: '#333333',
          400: '#3d3d3d',
          500: '#4D4D4D',
          600: '#7F7F7F',
          700: '#B3B3B3',
          800: '#d4d4d4',
          900: '#eeeeee',
          950: '#F7F7F7',
        },
        primary: {
          color:         '#5EC9B5',
          contrastColor: '#001A15',
          hoverColor:    '#007D68',
          activeColor:   '#0E5247',
        },
      },
    },
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    provideAnimationsAsync(),
    providePrimeNG({
      theme: {
        preset: InventarioPreset,
        options: {
          prefix: 'p',
          darkModeSelector: 'system',   // ← detecta el tema del SO automáticamente
          cssLayer: false,
        },
      },
    }),
  ],
};