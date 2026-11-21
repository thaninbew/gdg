import { Inter } from "next/font/google"

// Shared by the layout wrapper and portaled popovers, which render outside it.
export const inter = Inter({
  variable: "--font-inter-b",
  subsets: ["latin"],
  fallback: ["system-ui", "sans-serif"],
})

// Apply to anything that must carry direction B's palette and font (wrapper, portals).
export const DIR_B = `${inter.variable} dir-b`
