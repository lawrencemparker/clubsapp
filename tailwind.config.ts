import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // These link to CSS variables we will define in globals.css
        // This allows you to change the site color dynamically for each client
        brand: {
          primary: "var(--brand-primary)",
          secondary: "var(--brand-secondary)",
          accent: "var(--brand-accent)",
        },
        glass: {
          border: "rgba(255, 255, 255, 0.2)",
          surface: "rgba(255, 255, 255, 0.1)",
          highlight: "rgba(255, 255, 255, 0.5)",
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      animation: {
        // Slow, floating movement for the background orbs
        "blob": "blob 7s infinite",
        "fade-in": "fadeIn 0.5s ease-out forwards",
      },
      keyframes: {
        blob: {
          "0%": { transform: "translate(0px, 0px) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.1)" },
          "66%": { transform: "translate(-20px, 20px) scale(0.9)" },
          "100%": { transform: "translate(0px, 0px) scale(1)" },
        },
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;