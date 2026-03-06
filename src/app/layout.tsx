import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "FoxLabs - Desarrollo Web con IA",
  description: "Convertimos ideas en aplicaciones web profesionales usando IA. Sin reuniones interminables. Sin costos ocultos.",
  keywords: ["desarrollo web", "aplicaciones", "nextjs", "react", "ia", "software a medida"],
  openGraph: {
    title: "FoxLabs - Desarrollo Web con IA",
    description: "Tu idea, desplegada en dias",
    type: "website",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black`}
      >
        {children}
      </body>
    </html>
  )
}
