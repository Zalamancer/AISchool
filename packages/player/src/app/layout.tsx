import type {Metadata} from 'next';

export const metadata: Metadata = {
  title: 'MathVision',
  description: 'Cinematic animated math explainers',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: '#0D0D1A',
          color: '#E8E8F0',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        {children}
      </body>
    </html>
  );
}
