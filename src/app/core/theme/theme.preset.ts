import { definePreset } from "@primeuix/themes";
import Aura from '@primeuix/themes/aura';

export const InventoryTheme = definePreset(Aura, {
  semantic: {
    // Escala PRIMARY
    primary: {
      50:  '#F5FFFD',
      100: '#F5FFFD',
      200: '#CCFFF6',
      300: '#66FFE5',
      400: '#5EC9B5',
      500: '#00CCAA',
      600: '#007D68', // MAIN COLOR
      700: '#006655',
      800: '#0E5247',
      900: '#00332A',
      950: '#001A15',
    },
    // Colores semánticos para Toasts, Badges y Mensajes
    colorScheme: {
      light: {
        primary: {
          color:        '{primary.600}', // Forzamos a que use el 600 como base
          inverseColor: '#ffffff',
          hoverColor:   '{primary.700}',
          activeColor:  '{primary.800}',
        },
        // Configuración de colores semánticos nativos de PrimeNG
        green: { // Equivale a tu SUCCESS
          100: '#F0FEF2', 200: '#B4FDBD', 300: '#6EF77E', 400: '#42F057', 500: '#1AE531',
          600: '#18B32A', 700: '#0F8A1E', 800: '#086814', 900: '#04490C', 950: '#013207'
        },
        red: { // Equivale a tu DANGER
          100: '#FFF5F5', 200: '#FEE2E2', 300: '#F8A5A5', 400: '#F07A7A', 500: '#E65151',
          600: '#D92D2D', 700: '#B71A1A', 800: '#8E1010', 900: '#630808', 950: '#350303'
        },
        yellow: { // Equivale a tu WARNING
          100: '#FFFCF5', 200: '#FDF7E2', 300: '#F7E4A6', 400: '#EFD47B', 500: '#E5C352',
          600: '#D9B12D', 700: '#B68D1B', 800: '#8D6811', 900: '#624409', 950: '#352303'
        },
        blue: { // Equivale a tu INFO
          100: '#F5F8FF', 200: '#E2EBFE', 300: '#A5BFF8', 400: '#7A9FF0', 500: '#5180E6',
          600: '#2D63D9', 700: '#1A4CB7', 800: '#10388E', 900: '#082563', 950: '#031335'
        }
      }
    }
  }
});
