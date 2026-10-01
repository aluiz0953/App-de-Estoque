import { describe, expect, it } from 'vitest';
import { sortProducts } from './sort';

const produtos = [
  { nome: 'Kaiak', precoVenda: 79.9 },
  { nome: 'Égeo Dolce', precoVenda: 149.9 },
  { nome: 'Botik Sérum', precoVenda: 149.9 },
  { nome: 'Arbo', precoVenda: null },
  { nome: 'Zaad', precoVenda: 10 },
];
const nomes = (list) => list.map((p) => p.nome);

describe('sortProducts', () => {
  it('sorts A to Z, ignoring accents and case', () => {
    expect(nomes(sortProducts(produtos, 'az'))).toEqual(['Arbo', 'Botik Sérum', 'Égeo Dolce', 'Kaiak', 'Zaad']);
  });

  it('sorts Z to A', () => {
    expect(nomes(sortProducts(produtos, 'za'))).toEqual(['Zaad', 'Kaiak', 'Égeo Dolce', 'Botik Sérum', 'Arbo']);
  });

  it('sorts price low to high, ties by name, no price last', () => {
    expect(nomes(sortProducts(produtos, 'menor'))).toEqual(['Zaad', 'Kaiak', 'Botik Sérum', 'Égeo Dolce', 'Arbo']);
  });

  it('sorts price high to low, ties by name, no price last', () => {
    expect(nomes(sortProducts(produtos, 'maior'))).toEqual(['Botik Sérum', 'Égeo Dolce', 'Kaiak', 'Zaad', 'Arbo']);
  });

  it('does not change the list it was given', () => {
    const copia = [...produtos];
    sortProducts(produtos, 'maior');
    expect(produtos).toEqual(copia);
  });
});
