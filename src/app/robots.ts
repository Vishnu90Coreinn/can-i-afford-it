import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules:{userAgent:'*',allow:'/'},
    sitemap:'https://can-i-afford-it-core90.vercel.app/sitemap.xml',
    host:'https://can-i-afford-it-core90.vercel.app'
  };
}
