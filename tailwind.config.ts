import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#090c10",
          900: "#0e131b",
          850: "#131923",
          800: "#18202d",
          700: "#222c3e",
          600: "#2f3c53",
          500: "#445370",
          400: "#697b9e",
          300: "#98a6c2",
          200: "#c7d1e3",
          100: "#e5ebf5",
        },
        candle: {
          50: "#fdf8ec",
          100: "#faefcf",
          200: "#f5dda0",
          300: "#eec66a",
          400: "#e5ab37",
          500: "#d39424",
          600: "#b5731b",
          700: "#905318",
          800: "#764319",
          900: "#643818",
        },
        parchment: {
          50: "#fdfcf9",
          100: "#faf6ee",
          200: "#f3ecdc",
          300: "#e8dcbe",
          400: "#d9c59c",
          500: "#c7ad7c",
          600: "#a98d5f",
          700: "#866e4a",
          800: "#6c583e",
          900: "#594834",
        },
      },
      fontFamily: {
        serif: ["Lora", "Fraunces", "Georgia", "serif"],
        sans: ["Nunito", "Plus Jakarta Sans", "system-ui", "sans-serif"],
      },
      keyframes: {
        flicker: {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "25%": { opacity: "0.85", transform: "scale(0.98) translateY(0.5px)" },
          "50%": { opacity: "1", transform: "scale(1.02) translateY(-0.5px)" },
          "75%": { opacity: "0.9", transform: "scale(0.99)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        flicker: "flicker 3.5s ease-in-out infinite",
        "flicker-fast": "flicker 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;

