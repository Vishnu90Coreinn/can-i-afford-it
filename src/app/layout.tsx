import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata={title:'BeforeYouBuy — Can I Afford It?',description:'A private purchase-impact simulator. See what a purchase changes before you decide.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>}
