import { paraderosMock } from './mockData';
import type { ChatMessage, RouteRecommendation } from '../types';

const SUGGESTIONS = [
  'Voy de afán al Centro, qué bus tomo?',
  'Cómo llego a Uninorte desde Buenavista?',
  'Cuál ruta va al aeropuerto a esta hora?',
  'A qué hora pasa el último bus por Plaza de la Paz?',
];

export function getSuggestions(): string[] {
  return SUGGESTIONS;
}

type Keyword = 'centro' | 'uninorte' | 'aeropuerto' | 'soledad' | 'norte' | 'generic';

function detectKeyword(text: string): Keyword {
  const t = text.toLowerCase();
  if (/(centro|paseo|bol[ií]var)/.test(t)) return 'centro';
  if (/(uninorte|universidad|del norte)/.test(t)) return 'uninorte';
  if (/(aero|aeropuerto|vuelo)/.test(t)) return 'aeropuerto';
  if (/soledad/.test(t)) return 'soledad';
  if (/norte/.test(t)) return 'norte';
  return 'generic';
}

function pickRecommendation(kw: Keyword): RouteRecommendation | undefined {
  const find = (rutaNombre: string) => {
    for (const p of paraderosMock) {
      const r = p.rutas.find((x) => x.nombre === rutaNombre);
      if (r) {
        return {
          rutaNombre,
          origen: p.nombre,
          destino: r.destino,
          duracionMinutos: r.etaMinutos + 18,
          paraderoOrigenId: p.id,
        };
      }
    }
    return undefined;
  };

  switch (kw) {
    case 'centro':
      return find('C12');
    case 'uninorte':
      return find('A8');
    case 'aeropuerto':
      return find('L9');
    case 'soledad':
      return find('T1');
    case 'norte':
      return find('B1');
    default:
      return find('C12');
  }
}

function buildText(kw: Keyword, rec?: RouteRecommendation): string {
  if (!rec) {
    return 'No tengo una ruta clara para eso ahora. ¿Puedes darme más detalle del destino?';
  }
  switch (kw) {
    case 'centro':
      return `La ruta ${rec.rutaNombre} desde ${rec.origen} te deja en el Centro Histórico en unos ${rec.duracionMinutos} minutos. Es la opción más directa a esta hora.`;
    case 'uninorte':
      return `Toma la ${rec.rutaNombre} desde ${rec.origen}. Tarda ~${rec.duracionMinutos} min y para frente a la entrada principal de Uninorte.`;
    case 'aeropuerto':
      return `La ${rec.rutaNombre} sigue operando hasta el aeropuerto, pero es el último bus de la noche. Salida estimada del paradero ${rec.origen} en pocos minutos.`;
    case 'soledad':
      return `La troncal ${rec.rutaNombre} desde ${rec.origen} es la más rápida hacia Soledad. Llegas en ~${rec.duracionMinutos} min.`;
    case 'norte':
      return `Para ir al norte te conviene la ${rec.rutaNombre} desde ${rec.origen}. Frecuencia estable, ~${rec.duracionMinutos} min de viaje.`;
    default:
      return `Una opción razonable: ${rec.rutaNombre} desde ${rec.origen} hacia ${rec.destino}, ~${rec.duracionMinutos} min.`;
  }
}

export async function mockAskAssistant(prompt: string): Promise<ChatMessage> {
  const kw = detectKeyword(prompt);
  const rec = pickRecommendation(kw);
  const text = buildText(kw, rec);
  await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));
  return {
    id: `m_${Date.now()}_a`,
    role: 'assistant',
    content: text,
    recommendation: rec,
    createdAt: new Date().toISOString(),
  };
}
