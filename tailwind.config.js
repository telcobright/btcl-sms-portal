/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Alaap Cloud — brand guideline blues
        btcl: {
          primary: '#0D529E',        // Blue-1 — main brand
          primaryLight: '#28A8E0',   // Blue-3 — light sky
          primaryDark: '#1F3C71',    // Blue-2 — dark navy
          secondary: '#1F3C71',      // Blue-2 — deep tone
          secondaryLight: '#28A8E0', // Blue-3
          secondaryDark: '#1F3C71',  // Blue-2
          accent: '#28A8E0',         // Blue-3 — sky highlight
          sky: '#008BC9',            // Blue-4 — mid sky blue
          red: '#FF0000',
          gray: {
            50: '#f9fafb',
            100: '#f3f4f6',
            200: '#e5e7eb',
            300: '#d1d5db',
            400: '#9ca3af',
            500: '#6b7280',
            600: '#4b5563',
            700: '#374151',
            800: '#1f2937',
            900: '#111827',
          }
        }
      },
      fontFamily: {
        bengali: ['Kalpurush', 'SolaimanLipi', 'sans-serif'],
      }
    },
  },
  plugins: [],
}