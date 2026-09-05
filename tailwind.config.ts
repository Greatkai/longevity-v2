import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#F0F6FC",
          100: "#DCE9F8",
          200: "#B9D4F0",
          300: "#8FBCE6",
          400: "#5DA0DB",
          500: "#3186D8",
          600: "#0E6DC9",
          700: "#0A5BA8",
          800: "#084B8A",
          900: "#063D70",
          950: "#042A4D",
        },
        ink: {
          900: "#12232E",
          800: "#2B3A48",
          600: "#55677A",
          400: "#8494A6",
        },
      },
      fontFamily: {
        sans: [
          "PingFang SC",
          "Noto Sans SC",
          "Helvetica Neue",
          "Microsoft YaHei",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 3px rgba(6, 61, 112, 0.05), 0 8px 24px rgba(6, 61, 112, 0.06)",
        "card-hover":
          "0 4px 8px rgba(6, 61, 112, 0.08), 0 20px 40px rgba(6, 61, 112, 0.12)",
        soft: "0 2px 12px rgba(6, 61, 112, 0.08)",
        glow: "0 0 50px rgba(49, 134, 216, 0.35)",
        "inner-glow": "inset 0 1px 0 rgba(255,255,255,0.2)",
      },
      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #042A4D 0%, #0A5BA8 45%, #3186D8 100%)",
        "brand-soft":
          "linear-gradient(135deg, #F0F6FC 0%, #FFFFFF 50%, #F4F8FC 100%)",
        "hero-mesh":
          "radial-gradient(at 20% 30%, rgba(93, 160, 219, 0.18) 0px, transparent 50%), radial-gradient(at 80% 20%, rgba(49, 134, 216, 0.14) 0px, transparent 50%), radial-gradient(at 60% 80%, rgba(14, 109, 201, 0.12) 0px, transparent 50%)",
        "dot-grid":
          "radial-gradient(circle, rgba(6, 61, 112, 0.08) 1px, transparent 1px)",
      },
      backgroundSize: {
        "dot-grid": "24px 24px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "float-slow": {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-18px) rotate(2deg)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 0.6s ease-out both",
        float: "float 6s ease-in-out infinite",
        "float-slow": "float-slow 9s ease-in-out infinite",
        shimmer: "shimmer 2.5s linear infinite",
        "pulse-soft": "pulse-soft 3s ease-in-out infinite",
      },
    },
  },
  plugins: [typography],
};

export default config;
