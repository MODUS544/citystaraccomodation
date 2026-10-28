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
        travl: {
          primary: '#135846', // Travl Hunter Forest Green
          'primary-dark': '#0d4334',
          'primary-light': '#ebf7f2',
          coral: '#FE5757', // Travl Signature Coral Red
          'coral-light': '#FFEBEB',
          canvas: '#F4F6F9',
          card: '#FFFFFF',
          border: '#EAEFF4',
          text: '#1E2538',
          muted: '#7E8BA0',
          blue: '#4A85F6',
          'blue-light': '#EBF4FF',
          amber: '#F59E0B',
          'amber-light': '#FFF8E6',
        },
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
      keyframes: {
        'fade-slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.04)' },
        },
      },
      animation: {
        'fade-slide-up': 'fade-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-soft': 'pulse-soft 2s infinite ease-in-out',
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
