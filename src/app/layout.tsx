import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: "Prismy AI Translation",
  description: "Smart document translation platform powered by AI",
  keywords: "translation, AI, document, Vietnamese, English, Chinese, Japanese",
  authors: [{ name: "Prismy Team" }],
  openGraph: {
    title: "Prismy AI Translation",
    description: "Smart document translation platform powered by AI",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className="min-h-screen">
        {children}
        <Toaster 
          position="bottom-center"
          reverseOrder={false}
          gutter={8}
          containerStyle={{
            bottom: 40,
          }}
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#fff',
              padding: '16px',
              borderRadius: '8px',
              fontSize: '14px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
              style: {
                background: '#065f46',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
              style: {
                background: '#991b1b',
              },
            },
            loading: {
              iconTheme: {
                primary: '#3b82f6',
                secondary: '#fff',
              },
            },
          }}
        />
      </body>
    </html>
  );
}