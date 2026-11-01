import { beforeEach, describe, expect, it } from 'vitest';
import { renderContract, splitTerms } from '../src/js/components/contractView.js';
import { renderLoading } from '../src/js/components/stateViews.js';

describe('splitTerms', () => {
  it('separa los términos por líneas y descarta las vacías', () => {
    expect(splitTerms('Uno\r\n\r\n  Dos  \nTres\n')).toEqual(['Uno', 'Dos', 'Tres']);
  });

  it.each([[undefined], [null], [''], ['   \n  '], [42]])(
    'sin términos (%s) devuelve []',
    (terms) => {
      expect(splitTerms(terms)).toEqual([]);
    },
  );
});

describe('renderContract', () => {
  let container;

  beforeEach(() => {
    document.body.innerHTML = '<div id="box"></div>';
    container = document.getElementById('box');
  });

  it('muestra el número, la fecha y los términos y condiciones', () => {
    renderContract(container, {
      id: 3,
      signedDate: '2026-03-16T00:00:00.000+00:00',
      termsAndConditions: 'Brindar alimento y espacio.\nNo abandonar a la mascota.',
    });

    const facts = [...container.querySelectorAll('.contract__fact')].map(
      (fact) => fact.textContent,
    );
    expect(facts).toEqual(['Contraton.º 3', 'Fecha del contrato16 de marzo de 2026']);
    expect(container.querySelector('time').getAttribute('datetime')).toBe('2026-03-16');
    expect(container.querySelector('.contract__heading').textContent).toBe(
      'Términos y condiciones',
    );
    const paragraphs = container.querySelectorAll('.contract__terms p');
    expect([...paragraphs].map((p) => p.textContent)).toEqual([
      'Brindar alimento y espacio.',
      'No abandonar a la mascota.',
    ]);
  });

  it('acepta la fecha como milisegundos', () => {
    renderContract(container, {
      id: 1,
      signedDate: Date.UTC(2026, 0, 5),
      termsAndConditions: 'Ok',
    });

    expect(container.querySelector('time').textContent).toBe('5 de enero de 2026');
  });

  it('avisa cuando la fecha no está disponible, sin etiqueta time', () => {
    renderContract(container, { id: 1, signedDate: null, termsAndConditions: 'Ok' });

    expect(container.querySelector('time')).toBeNull();
    expect(container.textContent).toContain('Fecha no disponible');
  });

  it('avisa cuando el contrato no tiene términos', () => {
    renderContract(container, { id: 1, signedDate: '2026-03-16', termsAndConditions: '  ' });

    expect(container.querySelector('.contract__empty').textContent).toBe(
      'Este contrato no tiene términos y condiciones registrados.',
    );
  });

  it('omite el número cuando el contrato no tiene id', () => {
    renderContract(container, { signedDate: '2026-03-16', termsAndConditions: 'Ok' });

    expect(container.querySelectorAll('.contract__fact')).toHaveLength(1);
  });

  it('inserta los términos como texto y no como HTML', () => {
    renderContract(container, {
      id: 1,
      signedDate: '2026-03-16',
      termsAndConditions: '<img src=x onerror=alert(1)>',
    });

    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('.contract__terms p').textContent).toBe(
      '<img src=x onerror=alert(1)>',
    );
  });

  it('reemplaza el estado de carga y deja de estar ocupado', () => {
    renderLoading(container);
    renderContract(container, { id: 1, signedDate: '2026-03-16', termsAndConditions: 'Ok' });

    expect(container.getAttribute('aria-busy')).toBe('false');
    expect(container.querySelector('.spinner')).toBeNull();
    expect(container.querySelectorAll('.contract')).toHaveLength(1);
  });
});
