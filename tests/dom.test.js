import { describe, expect, it, vi } from 'vitest';
import { clear, el, getQueryParam } from '../src/js/utils/dom.js';

describe('el', () => {
  it('crea el elemento con clase, atributos y texto', () => {
    const node = el('a', { class: 'link', href: '/x', 'aria-label': 'Ir' }, 'Hola');
    expect(node.tagName).toBe('A');
    expect(node.className).toBe('link');
    expect(node.getAttribute('href')).toBe('/x');
    expect(node.textContent).toBe('Hola');
  });

  it('omite atributos falsos, nulos o indefinidos y escribe los booleanos verdaderos', () => {
    const node = el('input', { disabled: true, hidden: false, title: null, alt: undefined });
    expect(node.hasAttribute('disabled')).toBe(true);
    expect(node.hasAttribute('hidden')).toBe(false);
    expect(node.hasAttribute('title')).toBe(false);
    expect(node.hasAttribute('alt')).toBe(false);
  });

  it('registra manejadores onXxx', () => {
    const onClick = vi.fn();
    const button = el('button', { onClick }, 'Ok');
    button.click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('inserta los textos como texto y no como HTML', () => {
    const node = el('p', {}, '<img src=x onerror=alert(1)>');
    expect(node.querySelector('img')).toBeNull();
    expect(node.textContent).toBe('<img src=x onerror=alert(1)>');
  });

  it('aplana hijos anidados y descarta nulos y falsos', () => {
    const node = el('ul', {}, [el('li', {}, 'a'), null], false, el('li', {}, 'b'));
    expect(node.children).toHaveLength(2);
  });
});

describe('clear', () => {
  it('vacía el contenedor y lo devuelve', () => {
    const box = el('div', {}, el('span', {}, 'x'));
    expect(clear(box)).toBe(box);
    expect(box.childNodes).toHaveLength(0);
  });
});

describe('getQueryParam', () => {
  it('lee un parámetro existente', () => {
    expect(getQueryParam('id', '?id=12&x=1')).toBe('12');
  });

  it('devuelve null si no existe', () => {
    expect(getQueryParam('id', '?x=1')).toBeNull();
  });

  it('usa la URL actual por defecto', () => {
    window.history.pushState({}, '', '/pagina.html?id=5');
    expect(getQueryParam('id')).toBe('5');
  });
});
