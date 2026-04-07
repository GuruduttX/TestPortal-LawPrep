import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  title: {
    default: 'Candidate Assessment Portal — LawPrep',
    template: '%s | LawPrep Assessment',
  },
  description: 'Secure online examination platform for scholarship and law entrance assessments. Take tests, track progress, and view detailed results.',
  keywords: ['law entrance exam', 'scholarship test', 'online assessment', 'CLAT preparation'],
  robots: { index: false, follow: false }, // private exam portal — don't index
  openGraph: {
    type: 'website',
    siteName: 'LawPrep Assessment Portal',
    title: 'Candidate Assessment Portal — LawPrep',
    description: 'Secure online examination platform for scholarship and law entrance assessments.',
  },
  twitter: {
    card: 'summary',
    title: 'Candidate Assessment Portal — LawPrep',
    description: 'Secure online examination platform for scholarship and law entrance assessments.',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`h-full antialiased ${inter.className}`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
