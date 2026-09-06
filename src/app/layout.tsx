import type { Metadata, Viewport } from 'next';
import './globals.css';
import './ux.css';

const siteUrl='https://can-i-afford-it-core90.vercel.app';

export const metadata: Metadata={
  metadataBase:new URL(siteUrl),
  applicationName:'BeforeYouBuy',
  title:{default:'BeforeYouBuy — Can I Afford It?',template:'%s · BeforeYouBuy'},
  description:'See what a purchase changes before you decide. A privacy-first purchase impact simulator with cash, EMI, runway, reserve-target, wait and stress scenarios.',
  keywords:['purchase impact calculator','can I afford it','cash vs EMI','emergency fund','financial runway','purchase simulator'],
  alternates:{canonical:'/'},
  openGraph:{
    type:'website',
    url:siteUrl,
    siteName:'BeforeYouBuy',
    title:'BeforeYouBuy — Can I Afford It?',
    description:'Before you buy it, see what it does to your money.',
    images:[{url:'/opengraph-image',width:1200,height:630,alt:'BeforeYouBuy — Can I Afford It?'}]
  },
  twitter:{
    card:'summary_large_image',
    title:'BeforeYouBuy — Can I Afford It?',
    description:'Before you buy it, see what it does to your money.',
    images:['/opengraph-image']
  },
  robots:{index:true,follow:true},
  category:'finance'
};

export const viewport: Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#0a0a0a'};

export default function RootLayout({children}:{children:React.ReactNode}){
  return <html lang="en"><body>{children}</body></html>;
}
