import { setupServer } from 'msw/node';
import { handlers } from '../../lib/mockHandlers';

export const server = setupServer(...handlers);
