/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        auth: {
          primary: "#6D5DFC",
          secondary: "#8B5CF6",
          accent: "#A855F7",
          background: "#0F1117",
          card: "#171A23",
          elevated: "#1E2230",
          "text-primary": "#FFFFFF",
          "text-secondary": "#B8C0CC",
          muted: "#8A93A2",
          success: "#22C55E",
          error: "#EF4444",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
}
