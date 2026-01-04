module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        teal: {
          50: '#f0fdff',
          100: '#e0f7ff',
          600: '#0d9488',
          700: '#0f766e',
        },
        cyan: {
          100: '#e0f7ff',
          200: '#b3f0ff',
          400: '#06b6d4',
          500: '#06b6d4',
          600: '#0891b2',
        },
      },
    },
  },
  plugins: [],
}
