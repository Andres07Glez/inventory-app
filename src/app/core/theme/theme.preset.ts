import { definePreset } from "@primeuix/themes";
import Aura from '@primeuix/themes/aura';

export const InventoryTheme = definePreset(Aura, {
  semantic: {
    // ── Color primario: #007D68 (verde institucional) ──────────────────────
    // La escala se genera manualmente alrededor del valor objetivo (500).
    primary: {
      50:  '#e0f5f2',
      100: '#b3e6df',
      200: '#80d4ca',
      300: '#4dc2b5',
      400: '#26b5a3',
      500: '#007D68',   // ← color principal
      600: '#007260',
      700: '#006455',
      800: '#00564b',
      900: '#003d36',
      950: '#002520',
    },

    colorScheme: {
      light: {
        primary: {
          color:        '{primary.500}',
          inverseColor: '#ffffff',
          hoverColor:   '{primary.600}',
          activeColor:  '{primary.700}',
        },
        highlight: {
          background:      '{primary.50}',
          focusBackground: '{primary.100}',
          color:           '{primary.700}',
          focusColor:      '{primary.800}',
        },
      },
    },
  },
});
