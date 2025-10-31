import { Router } from 'express';
import { buildSitemapXML } from '../utils/sitemap.js';
const router = Router();

router.get('/sitemap.xml', async (_req, res) => {
  try {
    const xml = await buildSitemapXML();
    res.header('Content-Type', 'application/xml');
    res.set('Cache-Control', 'public, max-age=3600');
    res.status(200).send(xml);
  } catch (e) {
    console.error('Sitemap error:', e);
    res.status(500).send('Sitemap generation failed');
  }
});

router.get('/robots.txt', (_req, res) => {
  const base = process.env.BASE_URL || 'https://tinymillion.com';
  res.type('text/plain').send(
`User-agent: *
Disallow: /admin/
Disallow: /cart
Disallow: /checkout
Allow: /
Sitemap: ${base}/sitemap.xml`
  );
});

export default router;