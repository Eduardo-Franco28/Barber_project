// Slug do link público da barbearia (/b/<slug>): minúsculas, sem acento,
// só letras/números/hífens.
export function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function isValidSlug(slug) {
  return (
    typeof slug === 'string' && slug.length >= 2 && slug.length <= 60 && SLUG_REGEX.test(slug)
  );
}
