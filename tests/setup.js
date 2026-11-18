import { beforeEach } from 'vitest';

/** Por defecto las pruebas corren con una sesión de administrador (puede ver todas las páginas). */
beforeEach(() => {
  window.localStorage.setItem(
    'huellas.session',
    JSON.stringify({ role: 'ADMIN', userId: null, name: 'Admin' }),
  );
});
