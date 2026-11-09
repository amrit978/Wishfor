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
        navy: {
          950: "#0c0d14", // Split page content dark
          900: "#13151f", // Base page background
          850: "#141a33", // Split page left textured navy
          800: "#1c223d",
        },
        editorial: {
          white: "#f2f2f5", // Headlines, active items
          body: "#aab0c4",  // Reading body text
          muted: "#7c8299", // Labels, inactive nav, timestamps
          hairline: "rgba(255, 255, 255, 0.10)",
          border: "rgba(255, 255, 255, 0.28)",
          borderHover: "rgba(255, 255, 255, 0.60)",
        },
        category: {
          pink: "#e2869a",
          amber: "#e5ab37",
          green: "#7ec89f",
          cyan: "#68b9d0",
          violet: "#a78bfa",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Newsreader", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Figtree", "system-ui", "sans-serif"],
      },
      letterSpacing: {
        widestplus: "0.22em",
        tightplus: "-0.015em",
      },
      lineHeight: {
        editorialTight: "0.92",
        headingTight: "0.98",
        bodyLoose: "1.75",
      },
      boxShadow: {
        glow: "0 0 60px rgba(78, 115, 223, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
