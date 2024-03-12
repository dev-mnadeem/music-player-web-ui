import type { Config } from 'tailwindcss';

const rgb = (variable: string) => `rgb(var(${variable}) / <alpha-value>)`;

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './contexts/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: rgb('--tonearm-bg'),
        surface: rgb('--tonearm-surface'),
        raised: rgb('--tonearm-surface-raised'),
        line: rgb('--tonearm-line'),
        fg: rgb('--tonearm-fg'),
        muted: rgb('--tonearm-muted'),
        accent: rgb('--tonearm-accent'),
        'accent-soft': rgb('--tonearm-accent-soft')
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem', letterSpacing: '0.08em' }]
      },
      gridTemplateColumns: {
        shelf: 'repeat(auto-fill, minmax(11rem, 1fr))'
      },
      keyframes: {
        bob: {
          '0%, 100%': { transform: 'scaleY(0.35)' },
          '50%': { transform: 'scaleY(1)' }
        }
      },
      animation: {
        bob: 'bob 900ms ease-in-out infinite'
      }
    }
  },
  plugins: []
};

export default config;
