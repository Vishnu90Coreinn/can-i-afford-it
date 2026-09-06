import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name:'BeforeYouBuy — Can I Afford It?',
    short_name:'BeforeYouBuy',
    description:'See what a purchase changes before you decide.',
    start_url:'/',
    display:'standalone',
    background_color:'#0a0a0a',
    theme_color:'#0a0a0a',
    categories:['finance','utilities']
  };
}
