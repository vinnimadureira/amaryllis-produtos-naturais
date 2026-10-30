import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        // Mr. Cone — DM Serif Display para headlines, Fira Sans para body.
        serif: ["'DM Serif Display'", "Georgia", "serif"],
        display: ["'DM Serif Display'", "Georgia", "serif"],
        sans: ["'Fira Sans'", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "monospace"],
        admin: ["'Inter'", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Aliases legados → tokens Mr. Cone (compat)
        rose: {
          DEFAULT: "hsl(var(--brand-ember))",
          light: "hsl(var(--brand-orange-soft))",
          dark: "hsl(var(--brand-brasa))",
        },
        gold: {
          DEFAULT: "hsl(var(--brand-gold))",
          light: "hsl(var(--brand-gold) / 0.2)",
        },
        beige: "hsl(var(--secondary))",
        cream: "hsl(var(--brand-cream))",
        brand: {
          deep: "hsl(var(--brand-deep))",
          graphite: "hsl(var(--brand-graphite))",
          orange: "hsl(var(--brand-ember))",
          "orange-soft": "hsl(var(--brand-orange-soft))",
          ember: "hsl(var(--brand-ember))",
          brasa: "hsl(var(--brand-brasa))",
          cream: "hsl(var(--brand-cream))",
          gold: "hsl(var(--brand-gold))",
          steel: "hsl(var(--brand-steel))",
          mist: "hsl(var(--brand-mist))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "image-reveal": {
          "0%": { opacity: "0", transform: "scale(1.08)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-up": "fade-up 0.6s ease-out forwards",
        "fade-in": "fade-in 0.5s ease-out forwards",
        "float": "float 3s ease-in-out infinite",
        "image-reveal": "image-reveal 1.1s cubic-bezier(0.22, 1, 0.36, 1) forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
