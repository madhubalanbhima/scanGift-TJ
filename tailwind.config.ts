import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#181511",
        charcoal: "#26221c",
        parchment: "#f7f2e7",
        card: "#fffdf8",
        gold: {
          DEFAULT: "#b8892b",
          light: "#d9ad4f",
          dark: "#8a651c",
        },
        line: "#e3d9c0",
        error: "#a3342a",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      backgroundImage: {
        "gold-foil":
          "linear-gradient(135deg, #d9ad4f 0%, #b8892b 45%, #8a651c 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
