import type { Metadata } from "next"
import { Google_Sans_Code, Google_Sans_Flex } from "next/font/google"
import { ThemeProvider } from "next-themes"

import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "@/components/ui/sonner"
import { GeminiGradientDefs } from "@/components/sentinel/gemini"
import "./globals.css"

const sans = Google_Sans_Flex({
  variable: "--font-google-sans",
  subsets: ["latin"],
  fallback: ["system-ui", "sans-serif"],
  adjustFontFallback: false,
})
const mono = Google_Sans_Code({
  variable: "--font-google-sans-code",
  subsets: ["latin"],
  fallback: ["ui-monospace", "monospace"],
  adjustFontFallback: false,
})

export const metadata: Metadata = {
  title: "SentinelDesk",
  description: "Incident triage and grounded resolution copilot",
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning className={`${sans.variable} ${mono.variable} antialiased`}>
      <body className="min-h-svh">
        <GeminiGradientDefs />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
