/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#73A8B3",
          50: "#F0F7F8",
          100: "#E1EEF1",
          200: "#C3DDE3",
          300: "#A5CCD5",
          400: "#87BBC7",
          500: "#73A8B3",
          600: "#5C869F",
          700: "#45648B",
          800: "#2E4277",
          900: "#172063",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "#213235",
          50: "#F7F8F8",
          100: "#EFF1F1",
          200: "#DFE3E3",
          300: "#CFD5D5",
          400: "#BFC7C7",
          500: "#213235",
          600: "#1A282B",
          700: "#131E21",
          800: "#0C1417",
          900: "#050A0D",
          foreground: "hsl(var(--secondary-foreground))",
        },
        accent: {
          DEFAULT: "#E07A5F",
          50: "#FDF6F4",
          100: "#FBEDE9",
          200: "#F7DBD3",
          300: "#F3C9BD",
          400: "#EFB7A7",
          500: "#E07A5F",
          600: "#B3624C",
          700: "#864A39",
          800: "#593226",
          900: "#2C1A13",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        'sans': ['var(--font-pt-sans)', 'PT Sans', 'sans-serif'],
        'serif': ['var(--font-playfair)', 'Playfair Display', 'serif'],
        'playfair': ['var(--font-playfair)', 'Playfair Display', 'serif'],
        'pt-sans': ['var(--font-pt-sans)', 'PT Sans', 'sans-serif'],
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "banner-slide": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-100%)" },
        },
        "wheel-spin": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "fade-in": {
          "0%": { opacity: 0, transform: "translateY(10px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "banner-slide": "banner-slide 20s linear infinite",
        "wheel-spin": "wheel-spin 3s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      maxWidth: {
        '8xl': '88rem',
        '9xl': '96rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
}
