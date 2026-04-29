import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { parseHTML } from 'linkedom';
import { readTurnstileTokenFromUrl, verifyTurnstileToken } from '../_shared/turnstile';
import { renderTextToolPage, turnstileSiteKeyFromEnv } from '../_shared/tool-page';

type Env = { Bindings: { TURNSTILE_SITE_KEY?: string; TURNSTILE_SECRET_KEY?: string } };

const app = new Hono<Env>();
app.use('/api/*', cors());
app.get('/', (c) => c.html(renderTextToolPage({ title: 'Meta Tag Checker', description: 'Check title, description, canonical, Open Graph, and Twitter tags.', endpoint: '/api/check', sample: '{ "title": "...", "issues": [] }', siteKey: turnstileSiteKeyFromEnv(c.env), buttonLabel: 'Analyze' })));
app.get('/health', (c) => c.json({ ok: true }));
app.get('/api/check', async (c) => {
  const captcha = await verifyTurnstileToken(c.env, readTurnstileTokenFromUrl(c.req.url), c.req.header('CF-Connecting-IP'));
  if (!captcha.ok) return c.json({ error: captcha.error }, 403);
  const normalized = normalizeUrl(c.req.query('url') ?? '');
  if (!normalized) return c.json({ error: 'A valid http(s) URL is required.' }, 400);
  const html = await fetchHtml(normalized);
  if (!html) return c.json({ error: 'Failed to fetch page.' }, 502);
  const { document } = parseHTML(html);
  const title = document.title || '';
  const description = meta(document, 'description');
  const canonical = document.querySelector('link[rel="canonical"]')?.getAttribute('href') || '';
  const ogTitle = meta(document, 'og:title', 'property');
  const ogDescription = meta(document, 'og:description', 'property');
  const ogImage = meta(document, 'og:image', 'property');
  const twitterCard = meta(document, 'twitter:card');
  const issues = [
    !title && 'Missing title tag',
    title && (title.length < 30 || title.length > 60) && 'Title should usually be 30-60 characters',
    !description && 'Missing meta description',
    description && (description.length < 70 || description.length > 160) && 'Meta description should usually be 70-160 characters',
    !canonical && 'Missing canonical URL',
    !ogTitle && 'Missing og:title',
    !ogDescription && 'Missing og:description',
    !ogImage && 'Missing og:image',
    !twitterCard && 'Missing twitter:card',
  ].filter(Boolean);
  return c.json({ url: normalized, title, description, canonical, openGraph: { title: ogTitle, description: ogDescription, image: ogImage }, twitter: { card: twitterCard }, issues });
});

function meta(document: any, name: string, attr = 'name') { return document.querySelector(`meta[${attr}="${name}"]`)?.getAttribute('content') || ''; }
async function fetchHtml(url: string) { const r = await fetch(url, { headers: { accept: 'text/html,application/xhtml+xml' } }).catch(() => null); return r?.ok ? r.text() : null; }
function normalizeUrl(value: string): string | null { try { return new URL(value.startsWith('http') ? value : `https://${value}`).toString(); } catch { return null; } }
export default app;
