/**
 * EdgeOne Pages Edge Function — trailing-slash normalization.
 *
 * EdgeOne Pages serves `/blog` and `/blog/` both with 200 (it resolves
 * directory → index.html without redirecting). That makes every page
 * reachable under two URLs, which Search Console reported as
 * "alternate page with proper canonical" (28 URLs) and
 * "duplicate, Google chose a different canonical" (1 URL).
 *
 * This edge function returns a 301 for the slash-less form so only the
 * canonical URL is indexable.
 */
export default function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const path = url.pathname;

  // Paths that must never be redirected
  if (
    path === '/' ||
    path.endsWith('/') ||
    /\.[a-z0-9]+$/i.test(path) ||          // files (has extension)
    path.startsWith('/_next') ||
    path.startsWith('/cdn-cgi') ||
    path.startsWith('/og/') ||
    path.startsWith('/api/')
  ) {
    return fetch(request);
  }

  // 301 → canonical trailing-slash form
  const target = new URL(path + '/', url.origin);
  return Response.redirect(target.toString(), 301);
}
