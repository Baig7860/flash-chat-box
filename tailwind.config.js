/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: "#f4f4fb",
        surface: "#ffffff",
        line: "#e6e5f2",
        ink: {
          DEFAULT: "#191734",
          soft: "#6c6890",
          faint: "#9d9ab8",
        },
        brand: {
          50: "#f3f2fe",
          100: "#e9e8fd",
          200: "#d6d4fb",
          300: "#b9b5f8",
          400: "#948ef2",
          500: "#6f66ea",
          600: "#4f46e5",
          700: "#4338ca",
          800: "#372fa8",
          900: "#2c2685",
        },
        danger: {
          DEFAULT: "#e5484d",
          soft: "#fdecec",
        },
      },
      fontFamily: {
        sans: [
          "Plus Jakarta Sans",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(10px) scale(0.99)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        pop: {
          "0%": { opacity: "0", transform: "translateY(6px) scale(0.97)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        pulseFast: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.35" },
        },
      },
      animation: {
        rise: "rise 0.5s cubic-bezier(0.2, 0.7, 0.3, 1) both",
        pop: "pop 0.28s cubic-bezier(0.2, 0.7, 0.3, 1) both",
        "pulse-fast": "pulseFast 1.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
