import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors
        brand: {
          primary: '#1A73E8',   // civic blue
          surface: '#F8F9FA',
        },
        // Issue category colors
        category: {
          water:    '#2196F3',  // blue  — Water Logging
          unclean:  '#FF9800',  // amber — Uncleanliness / Garbage
          traffic:  '#F44336',  // red   — Traffic Issues
        },
        // Status
        status: {
          open:     '#4CAF50',
          resolved: '#9E9E9E',
          review:   '#FF9800',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        pill: '9999px',
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.10)',
        fab:  '0 4px 16px rgba(0,0,0,0.20)',
      },
    },
  },
  plugins: [],
}

export default config
