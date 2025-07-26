import type {Metadata} from 'next';
import { Toaster } from "@/components/ui/toaster"
import './globals.css';
import {Providers} from "@/app/providers"

export const metadata: Metadata = {
  title: 'Alter Ego Chat',
  description: 'Create a persona and practice your conversation skills with an AI wingman.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet"></link>
      </head>
      <body className="font-body antialiased">
        <Providers>
        {children}
        <Toaster />
        </Providers>
      </body>
    </html>
  );
}
