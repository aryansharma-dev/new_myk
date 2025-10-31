// @ts-nocheck
import { SitemapStream, streamToPromise } from 'sitemap';
import Product from '../models/productModel.js';

const RAW_BASE = process.env.BASE_URL || 'https://tinymillion.com';
const BASE_URL = RAW_BASE.replace(/\/+$/, ''); // trailing slash remove
const ONE_HOUR = 1000 * 60 * 60;

let CACHE = { xml: null, builtAt: 0 };

export async function buildSitemapXML() {
  if (CACHE.xml && Date.now() - CACHE.builtAt < ONE_HOUR) return CACHE.xml;

  const sm = new SitemapStream({ hostname: BASE_URL });
  const now = new Date();

  // ✅ Sirf public SEO pages
  [
    { url: '/',           changefreq: 'daily',  priority: 1.0, lastmod: now },
    { url: '/collection', changefreq: 'weekly', priority: 0.8, lastmod: now },
    { url: '/about',      changefreq: 'yearly', priority: 0.3, lastmod: now },
    { url: '/contact',    changefreq: 'yearly', priority: 0.3, lastmod: now },
  ].forEach((u) => sm.write(u));

  // ✅ Products (fail-safe)
  try {
    const products = await Product.find({ isActive: true })
      .select('slug updatedAt _id')
      .lean();

    for (const p of products) {
      const path = p.slug ? `/product/${p.slug}` : `/product/${p._id}`;
      sm.write({
        url: path,
        changefreq: 'weekly',
        priority: 0.8,
        lastmod: p.updatedAt ? new Date(p.updatedAt) : now,
      });
    }
  } catch (err) {
    console.error('Sitemap products error:', err?.message || err);
  }

  sm.end();
  const xml = (await streamToPromise(sm)).toString();
  CACHE = { xml, builtAt: Date.now() };
  return xml;
}