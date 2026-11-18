import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  listAdoptions,
  assignVeterinarian,
  updateAdoptionStatus,
} from '../src/js/api/adoptionsApi.js';
import * as coexistence from '../src/js/api/coexistenceApi.js';
import { listMessages, sendMessage } from '../src/js/api/messagesApi.js';
import { getPetHistory } from '../src/js/api/petHistoryApi.js';
import { getShelterReport } from '../src/js/api/reportsApi.js';
import { createShelterEvent, listShelterEvents } from '../src/js/api/shelterEventsApi.js';
import {
  createVaccination,
  deleteVaccination,
  listVaccinations,
} from '../src/js/api/vaccinationsApi.js';
import {
  listAssignedAdoptions,
  listAssignedFollowUps,
} from '../src/js/api/veterinarianAdoptionsApi.js';
import { listAllReviews } from '../src/js/api/reviewsApi.js';
import { createShelter } from '../src/js/api/sheltersApi.js';
import { addPetPhoto } from '../src/js/api/petManagementApi.js';
import { createPetEvent } from '../src/js/api/petEventsApi.js';
import { updateAdopter } from '../src/js/api/adoptersApi.js';
import { jsonResponse } from './helpers.js';

const lastCall = () => {
  const [url, init] = fetch.mock.calls.at(-1);
  return { url, method: init.method, body: init.body ? JSON.parse(init.body) : undefined };
};

describe('APIs nuevas', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse([])));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('vacunas: lista, próximas dosis, alta y baja', async () => {
    await listVaccinations(3);
    expect(lastCall().url).toBe('/api/pets/3/vaccinations');
    await listVaccinations(3, { upcoming: true });
    expect(lastCall().url).toBe('/api/pets/3/vaccinations?upcoming=true');
    await createVaccination(3, { name: 'Rabia' });
    expect(lastCall()).toMatchObject({ method: 'POST', body: { name: 'Rabia' } });
    fetch.mockResolvedValue(new Response(null, { status: 204 }));
    await deleteVaccination(3, 9);
    expect(lastCall()).toMatchObject({ url: '/api/pets/3/vaccinations/9', method: 'DELETE' });
  });

  it('convivencia de prueba: ruta por adopción y verbos', async () => {
    await coexistence.getCoexistenceTest(5);
    expect(lastCall().url).toBe('/api/adoptions/5/coexistence-test');
    await coexistence.createCoexistenceTest(5, { result: 'IN_PROGRESS' });
    expect(lastCall().method).toBe('POST');
    await coexistence.updateCoexistenceTest(5, { result: 'SUCCESSFUL' });
    expect(lastCall().method).toBe('PUT');
    await coexistence.deleteCoexistenceTest(5);
    expect(lastCall().method).toBe('DELETE');
  });

  it('adopciones: lista, estado y veterinario asignado', async () => {
    await listAdoptions();
    expect(lastCall().url).toBe('/api/adoptions');
    await updateAdoptionStatus(4, { adoptionDate: '2026-11-01', status: 'APPROVED', extra: 1 });
    expect(lastCall()).toMatchObject({
      url: '/api/adoptions/4',
      method: 'PUT',
      body: { adoptionDate: '2026-11-01', status: 'APPROVED' },
    });
    await assignVeterinarian(4, 8);
    expect(lastCall()).toMatchObject({ url: '/api/adoptions/4/veterinarian/8', method: 'PUT' });
  });

  it('mensajes, calendario y reportes por refugio', async () => {
    await listMessages(2, { petId: 6 });
    expect(lastCall().url).toBe('/api/shelters/2/messages?petId=6');
    await sendMessage(2, { content: 'Hola' });
    expect(lastCall()).toMatchObject({ method: 'POST', body: { content: 'Hola' } });
    await listShelterEvents(2);
    expect(lastCall().url).toBe('/api/shelters/2/events');
    await createShelterEvent(2, { type: 'FAIR' });
    expect(lastCall().method).toBe('POST');
    await getShelterReport(2, { from: '2026-01-01', to: '' });
    expect(lastCall().url).toBe('/api/shelters/2/reports?from=2026-01-01');
  });

  it('veterinario: adopciones asignadas y seguimientos', async () => {
    await listAssignedAdoptions(1);
    expect(lastCall().url).toBe('/api/veterinarians/1/adoptions');
    await listAssignedFollowUps(1, 7);
    expect(lastCall().url).toBe('/api/veterinarians/1/adoptions/7/follow-ups');
  });

  it('historial, reseñas públicas, refugio, fotos, eventos y adoptante', async () => {
    await getPetHistory(3);
    expect(lastCall().url).toBe('/api/pets/3/history');
    await listAllReviews({ successStory: true });
    expect(lastCall().url).toBe('/api/reviews?successStory=true');
    await createShelter({ name: 'A', city: 'B', photos: [], videos: [] });
    expect(lastCall()).toMatchObject({ url: '/api/shelters', method: 'POST' });
    await addPetPhoto(3, 'https://x.test/a.jpg');
    expect(lastCall()).toMatchObject({
      url: '/api/pets/3/photos',
      body: { url: 'https://x.test/a.jpg' },
    });
    await createPetEvent(3, { eventType: 'ILLNESS' });
    expect(lastCall()).toMatchObject({ url: '/api/pets/3/events', method: 'POST' });
    await updateAdopter(5, { address: 'Calle 1' });
    expect(lastCall()).toMatchObject({ url: '/api/adopters/5', method: 'PUT' });
  });
});
