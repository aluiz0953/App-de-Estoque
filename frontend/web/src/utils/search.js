// Search helpers: case- and accent-insensitive, and every word of the term must appear
// ("kaiak masc" finds "Kaiak Masculino"). An empty term matches everything.
export const norm = (value) => String(value ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export const matches = (haystack, term) => {
  const words = norm(term).split(/\s+/).filter(Boolean);
  const text = norm(haystack);
  return words.every((word) => text.includes(word));
};
