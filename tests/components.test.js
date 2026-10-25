import { beforeEach, describe, expect, it, vi } from 'vitest';
import { APP_NAME } from '../src/js/config.js';
import { renderHeader } from '../src/js/components/header.js';
import { renderEmpty, renderError, renderLoading } from '../src/js/components/stateViews.js';

let container;

beforeEach(() => {
  document.body.innerHTML = '<div id="box"></div>';
  container = document.getElementById('box');
});

describe('renderHeader', () => {
  it('pinta la marca con el nombre de la aplicación', () => {
    renderHeader(container);
    expect(container.querySelector('.brand__name').textContent).toBe(APP_NAME);
    expect(container.querySelector('.brand__mark').textContent).toBe(APP_NAME.charAt(0));
  });

  it('usa el enlace de inicio por defecto', () => {
    renderHeader(container);
    const links = container.querySelectorAll('.site-nav__link');
    expect(links).toHaveLength(1);
    expect(links[0].textContent).toBe('Inicio');
  });

  it('acepta una navegación propia y marca la página actual con aria-current', () => {
    renderHeader(container, {
      links: [
        { key: 'a', href: 'a.html', label: 'Uno' },
        { key: 'b', href: 'b.html', label: 'Dos' },
      ],
      current: 'b',
    });
    const current = container.querySelectorAll('[aria-current="page"]');
    expect(container.querySelectorAll('.site-nav__link')).toHaveLength(2);
    expect(current).toHaveLength(1);
    expect(current[0].textContent).toBe('Dos');
  });

  it('no duplica el contenido al repintar', () => {
    renderHeader(container);
    renderHeader(container);
    expect(container.querySelectorAll('nav')).toHaveLength(1);
  });
});

describe('stateViews', () => {
  it('renderLoading muestra un loader accesible y marca aria-busy', () => {
    renderLoading(container, 'Cargando datos…');
    expect(container.getAttribute('aria-busy')).toBe('true');
    expect(container.querySelector('[role="status"]').textContent).toContain('Cargando datos…');
  });

  it('renderEmpty muestra título, texto y acción opcional', () => {
    const onAction = vi.fn();
    renderEmpty(container, {
      title: 'Sin datos',
      text: 'Nada por aquí',
      actionLabel: 'Limpiar',
      onAction,
    });
    expect(container.getAttribute('aria-busy')).toBe('false');
    expect(container.querySelector('.state__title').textContent).toBe('Sin datos');
    container.querySelector('button').click();
    expect(onAction).toHaveBeenCalledOnce();
  });

  it('renderEmpty sin opciones no rompe y no pinta botón', () => {
    renderEmpty(container);
    expect(container.querySelector('button')).toBeNull();
  });

  it('renderError usa role alert y reintenta', () => {
    const onRetry = vi.fn();
    renderError(container, { onRetry });
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    container.querySelector('button').click();
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('renderError sin onRetry no muestra el botón', () => {
    renderError(container, { title: 'Falló', text: 'Detalle' });
    expect(container.querySelector('button')).toBeNull();
    expect(container.querySelector('.state__title').textContent).toBe('Falló');
  });

  it('reemplaza el estado anterior', () => {
    renderLoading(container);
    renderEmpty(container, { title: 'Vacío' });
    expect(container.querySelectorAll('.state')).toHaveLength(1);
    expect(container.querySelector('.spinner')).toBeNull();
  });
});
