import { beforeEach, describe, expect, it } from 'vitest';
import { createMedicalPetSearch } from '../src/js/components/medicalPetSearch.js';
import {
  NO_RECORDS_MESSAGE,
  renderMedicalRecordList,
} from '../src/js/components/medicalRecordList.js';

const PETS = [
  { id: 1, name: 'Luna', status: 'AVAILABLE' },
  { id: 2, name: 'Bruno', status: 'ADOPTED' },
];

let mount;
beforeEach(() => {
  document.body.innerHTML = '<div id="mount"></div>';
  mount = document.getElementById('mount');
});

function type(text) {
  const input = document.querySelector('#medical-pet-search');
  input.value = text;
  input.dispatchEvent(new Event('input'));
}
const links = () => [...document.querySelectorAll('li a')].map((a) => a.getAttribute('href'));

describe('createMedicalPetSearch', () => {
  it('muestra todas las mascotas a cargo al inicio', () => {
    mount.append(createMedicalPetSearch({ pets: PETS, veterinarianId: 3 }));
    expect(links()).toEqual([
      'medical-history.html?veterinarian=3&pet=1',
      'medical-history.html?veterinarian=3&pet=2',
    ]);
  });

  it('va mostrando las coincidencias mientras escribe', () => {
    mount.append(createMedicalPetSearch({ pets: PETS, veterinarianId: 3 }));
    type('bru');
    expect(links()).toEqual(['medical-history.html?veterinarian=3&pet=2']);
    expect(document.querySelector('[role="status"]').textContent).toBe('1 coincidencia');
    type('2');
    expect(links()).toHaveLength(1);
  });

  it('avisa cuando no hay coincidencias', () => {
    mount.append(createMedicalPetSearch({ pets: PETS, veterinarianId: 3 }));
    type('zzz');
    expect(links()).toEqual([]);
    expect(document.querySelector('[role="status"]').textContent).toContain('No hay mascotas');
  });
});

describe('renderMedicalRecordList', () => {
  it('muestra fecha, motivo, diagnóstico y tratamiento, más reciente primero', () => {
    renderMedicalRecordList(mount, [
      { id: 1, date: '2026-01-10', reason: 'Vacuna', diagnosis: 'Sano', treatment: 'Ninguno' },
      { id: 2, date: '2026-05-02', reason: 'Tos', diagnosis: 'Resfriado', treatment: 'Reposo' },
    ]);
    const cards = [...mount.querySelectorAll('li.card')];
    expect(cards[0].querySelector('time').textContent).toBe('2 de mayo de 2026');
    expect(cards[0].textContent).toContain('Resfriado');
    expect(cards[1].textContent).toContain('Vacuna');
  });

  it('omite los datos no disponibles', () => {
    renderMedicalRecordList(mount, [{ id: 1, date: '2026-01-10', reason: 'Control' }]);
    expect(mount.textContent).toContain('Motivo de consulta');
    expect(mount.textContent).not.toContain('Diagnóstico');
    renderMedicalRecordList(mount, [{ id: 2, date: '2026-01-10' }]);
    expect(mount.textContent).toContain('Sin más datos registrados.');
  });

  it('sin registros avisa que no existen', () => {
    renderMedicalRecordList(mount, []);
    expect(mount.querySelector('.state__title').textContent).toBe(NO_RECORDS_MESSAGE);
  });

  it('inserta los datos como texto y no como HTML', () => {
    renderMedicalRecordList(mount, [{ id: 1, date: '2026-01-10', reason: '<b>x</b>' }]);
    expect(mount.querySelector('b')).toBeNull();
  });
});
