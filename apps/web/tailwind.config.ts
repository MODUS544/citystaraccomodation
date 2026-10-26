import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        hotel: {
          dark: '#080C15',
          card: '#0F1626',
          border: '#1E293B',
          muted: '#8A99AD',
          gold: {
            DEFAULT: '#D4AF37',
            light: '#F3E5AB',
            dark: '#AA820A',
            hover: '#C29B27',
          },
          cream: '#FAF8F5',
          sand: '#F2EDE4',
        },
      },
      fontFamily: {
        serif: ['var(--font-playfair)', 'Georgia', 'serif'],
        sans: ['var(--font-outfit)', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #F3E5AB 0%, #D4AF37 50%, #AA820A 100%)',
        'dark-gradient': 'linear-gradient(180deg, rgba(8,12,21,0.6) 0%, rgba(8,12,21,0.95) 100%)',
      },
    },
  },
  plugins: [],
};

export default config;
