import type { Metadata, Viewport } from 'next';
import './globals.css';
import './ux.css';

export const metadata: Metadata={
  title:'BeforeYouBuy — Can I Afford It?',
  description:'A private purchase-impact simulator. See what a purchase changes before you decide.'
};

export const viewport: Viewport={width:'device-width',initialScale:1,viewportFit:'cover'};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body>{children}</body></html>;
}
