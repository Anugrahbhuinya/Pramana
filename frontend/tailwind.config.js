/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Palantir & Stripe inspired palette
        navy: {
          50: "#f4f6fa",
          100: "#e9edf5",
          200: "#ccd6e6",
          300: "#a0b3cf",
          400: "#6d8bb3",
          500: "#486a98",
          600: "#365178",
          700: "#2a3f5f",
          800: "#0F172A", // Deep Navy background slate
          900: "#0A192F", // Rich Enterprise Navy
          950: "#040A13", // Space-like black navy
        },
        accent: {
          emerald: {
            50: "#ecfdf5",
            100: "#d1fae5",
            200: "#a7f3d0",
            300: "#6ee7b7",
            400: "#34d399",
            500: "#10b981", // Emerald accent
            600: "#059669",
            700: "#047857",
            800: "#065f46",
            900: "#064e3b",
          }
        }
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
        display: ["Outfit", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
      boxShadow: {
        'glass-light': '0 8px 32px 0 rgba(15, 23, 42, 0.04)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'shimmer': 'shimmer 2.5s infinite linear',
        'fade-in-up': 'fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-subtle': 'pulseSubtle 2s infinite ease-in-out',
        'thinking': 'thinking 1.2s infinite ease-in-out',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        thinking: {
          '0%, 100%': { transform: 'translateY(0)', opacity: '0.3' },
          '50%': { transform: 'translateY(-4px)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
