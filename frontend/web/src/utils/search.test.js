import { describe, expect, it } from 'vitest';
import { matches, norm } from './search';

describe('matches', () => {
  it('ignores case and accents', () => {
    expect(matches('Desodorante Colônia Masculino', 'colonia')).toBe(true);
    expect(matches('O Boticário', 'BOTICARIO')).toBe(true);
    expect(norm('Fragrância')).toBe('fragrancia');
  });

  it('needs every word of the term, in any order', () => {
    expect(matches('Kaiak Tradicional Masculino', 'kaiak masc')).toBe(true);
    expect(matches('Kaiak Tradicional Masculino', 'masc kaiak')).toBe(true);
    expect(matches('Kaiak Aero Feminino', 'kaiak masc')).toBe(false);
  });

  it('matches everything for an empty or blank term', () => {
    expect(matches('qualquer coisa', '')).toBe(true);
    expect(matches('qualquer coisa', '   ')).toBe(true);
    expect(matches(undefined, '')).toBe(true);
  });

  it('does not match a missing value against a real term', () => {
    expect(matches(undefined, 'kaiak')).toBe(false);
    expect(matches(null, 'kaiak')).toBe(false);
  });
});
