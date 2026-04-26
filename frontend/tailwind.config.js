/** @type {import('tailwindcss').Config} */
const plugins = []

try {
  // Keep forms plugin optional so missing local installs do not break dev startup.
  plugins.push(require("@tailwindcss/forms"))
} catch {}

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        teal: {
          50:  "#E1F5EE",
          100: "#C3EBdd",
          200: "#9ED8C6",
          300: "#6FC4AD",
          400: "#3DAF92",
          500: "#0F6E56",
          600: "#0C5C47",
          700: "#094A39",
          800: "#06382B",
          900: "#085041",
        },
        amber: {
          400: "#F5B942",
          500: "#BA7517",
          600: "#9A6012",
        },
        danger: "#A32D2D",
        success: "#3B6D11",
      },
      fontFamily: {
        sans: ["DM Sans", "sans-serif"],
        display: ["Outfit", "sans-serif"],
      },
    },
  },
  plugins,
}