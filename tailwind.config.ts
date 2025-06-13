import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg-primary)',
        surface: {
          DEFAULT: 'var(--surface-primary)',
          secondary: 'var(--surface-secondary)',
          hover: 'var(--surface-hover)',
        },
        border: {
          DEFAULT: 'var(--border-primary)',
          secondary: 'var(--border-secondary)',
          hover: 'var(--border-hover)',
        },
        text: {
          DEFAULT: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
        btn: {
          primary: 'var(--btn-primary)',
          hover: 'var(--btn-hover)',
        },
        accent: 'var(--accent)',
        success: 'var(--success)',
      },
    },
  },
  plugins: [],
};
export default config;
