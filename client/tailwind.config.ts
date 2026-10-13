import type { Config } from "tailwindcss";

// Components use Tailwind's default `teal` plus a custom navy `ink` scale.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f4f7fa",
          100: "#e8edf3",
          200: "#d3dbe6",
          300: "#a9b6c8",
          400: "#7e8fa8",
          500: "#5b708e",
          600: "#445a7a",
          700: "#2b4468",
          800: "#173257",
          900: "#0b2545",
          950: "#081a33",
        },
      },
      boxShadow: { card: "0 1px 2px rgba(11,37,69,0.05), 0 1px 3px rgba(11,37,69,0.04)" },
    },
  },
  plugins: [],
};
export default config;
