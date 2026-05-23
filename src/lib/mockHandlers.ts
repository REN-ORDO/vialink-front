import { http, HttpResponse } from 'msw';
import { API_BASE } from './api';

const BASE = API_BASE;

export const handlers = [
  http.get(`${BASE}/health`, () => HttpResponse.json({ ok: true })),
];

export { BASE };
