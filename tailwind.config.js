/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // ── Corporate & Clean palette ──────────────────────
        primary:       "#1F2937", // dark navy  – sidebar, headers
        secondary:     "#485563", // mid gray-blue – icons, secondary text
        accent: {
          DEFAULT:     "#2563EB", // bright blue – CTAs, active nav
          hover:       "#1D4ED8", // darkened accent for hover states
        },
        // ── Surfaces ──────────────────────────────────────
        "bg-page":     "#F9FAFB", // off-white page background
        "bg-card":     "#FFFFFF", // pure white cards
        "border-card": "#E5E7EB", // subtle card borders
        // ── Typography ────────────────────────────────────
        "text-main":   "#111827", // near-black body text
        "text-muted":  "#485563", // secondary / hint text
        // ── Semantic ──────────────────────────────────────
        success:       "#16A34A", // credit amounts, positive states
        danger:        "#DC2626", // debit amounts, error states
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
