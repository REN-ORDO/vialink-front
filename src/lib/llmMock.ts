import { paraderosMock } from './mockData';
import type {
  AlternativeRoute,
  AssistantAskResponse,
  RouteRecommendation,
  SuggestedAction,
} from '../types';

const SUGGESTIONS = [
  'Voy de Puerto Colombia a Universidad Libre Centro, primera vez',
  'Cómo llego a la Autónoma del Caribe desde Puerto Colombia?',
  'A qué hora pasa el bus azul por Puerto Colombia?',
  'Me bajo en la Cra 46, qué buses paran ahí?',
];

export function getSuggestions(): string[] {
  return SUGGESTIONS;
}

type Keyword =
  | 'demo_libre_centro'
  | 'autonoma_caribe'
  | 'bus_azul_puerto'
  | 'cra46'
  | 'centro'
  | 'uninorte'
  | 'aeropuerto'
  | 'soledad'
  | 'norte'
  | 'universidad'
  | 'hospital'
  | 'mall'
  | 'oficina'
  | 'casa_noche'
  | 'generic';

function detectKeyword(text: string): Keyword {
  const t = text.toLowerCase();
  if (/(puerto colombia).*(libre|centro)|libre.*(centro|sede)|libre sede/.test(t))
    return 'demo_libre_centro';
  if (/(aut[oó]noma|autonoma del caribe|uniautonoma)/.test(t)) return 'autonoma_caribe';
  if (/(bus azul|puerto colombia).*(hora|pasa|frecuencia)/.test(t))
    return 'bus_azul_puerto';
  if (/(cra ?46|carrera 46|murillo)/.test(t)) return 'cra46';
  if (/(uninorte|del norte)/.test(t)) return 'uninorte';
  if (/(universidad|libre|simon bol[ií]var|metropolitana|atl[áa]ntico)/.test(t))
    return 'universidad';
  if (/(centro|paseo|bol[ií]var hist)/.test(t)) return 'centro';
  if (/(aero|aeropuerto|vuelo|cortissoz)/.test(t)) return 'aeropuerto';
  if (/soledad/.test(t)) return 'soledad';
  if (/(hospital|clinic|cl[ií]nica|urgencia|emergencia)/.test(t)) return 'hospital';
  if (/(mall|buenavista|centro comercial|portal del prado|caribe plaza|viva)/.test(t))
    return 'mall';
  if (/(oficina|trabajo|chamba)/.test(t)) return 'oficina';
  if (/(casa|hogar|llegar a mi|en la noche|tarde|9 ?pm|10 ?pm|tarde noche)/.test(t))
    return 'casa_noche';
  if (/norte/.test(t)) return 'norte';
  return 'generic';
}

function findInMock(rutaNombre: string): RouteRecommendation | undefined {
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
}

function startTripAction(
  routeCode: string,
  destination: string,
  routeId?: string,
): SuggestedAction {
  return {
    type: 'START_TRIP',
    routeId: routeId ?? routeCode,
    routeCode,
    destination,
  };
}

function demoLibreCentroResponse(): {
  answer: string;
  primary: SuggestedAction;
  alternatives: AlternativeRoute[];
  recommendation: RouteRecommendation;
} {
  const primary: SuggestedAction = startTripAction(
    'Bus Azul Puerto',
    'Universidad Libre · Sede Centro',
  );

  const alternativeAction: SuggestedAction = startTripAction(
    'Buseta Amarilla Puerto',
    'Universidad Libre · Sede Centro',
  );

  const recommendation: RouteRecommendation = {
    rutaNombre: 'Bus Azul Puerto',
    origen: 'Puerto Colombia',
    destino: 'Universidad Libre · Sede Centro',
    duracionMinutos: 28,
    paraderoOrigenId: 'p1',
  };

  const alternatives: AlternativeRoute[] = [
    {
      rank: 1,
      label: 'El bus que ya conoces',
      rutaNombre: 'Bus Azul Puerto',
      origen: 'Puerto Colombia',
      destino: 'Centro Histórico',
      duracionMinutos: 28,
      paraderoOrigenId: 'p1',
      insight:
        'Tómalo desde tu casa hasta la Cra. 43 con Cl. 38. Bájate una esquina antes del Paseo Bolívar y caminas 3 minutos.',
      badge: 'recomendada',
      action: primary,
    },
    {
      rank: 2,
      label: 'La buseta amarilla, más directa',
      rutaNombre: 'Buseta Amarilla Puerto',
      origen: 'Puerto Colombia',
      destino: 'Centro Histórico',
      duracionMinutos: 22,
      paraderoOrigenId: 'p4',
      insight:
        'Pasa cada 15 min por la misma esquina del azul. Va más directa al Centro pero no la has tomado antes, pregunta al conductor por la Cl. 37.',
      badge: 'mas_rapida',
      action: alternativeAction,
    },
  ];

  const answer = [
    'Para ir de Puerto Colombia a la Universidad Libre Sede Centro tienes dos opciones que tienen sentido a esta hora:',
    '',
    '1. La opción que ya conoces. Bus azul Puerto que sale de tu casa, te bajas una esquina antes del Paseo Bolívar (Cra. 43 con Cl. 38) y caminas 3 minutos hacia la Cl. 37. Tarda unos 28 minutos. Es la más segura si nunca has ido.',
    '',
    '2. La buseta amarilla de Puerto, más directa. Pasa por la misma parada que el azul cada 15 minutos y te deja a una esquina del Paseo Bolívar. Tarda 22 minutos pero como no la has tomado, pregúntale al conductor por la Cl. 37.',
    '',
    'Como es tu primera vez por allá, te recomiendo la opción 1.',
  ].join('\n');

  return { answer, primary, alternatives, recommendation };
}

function autonomaCaribeResponse(): {
  answer: string;
  primary: SuggestedAction;
  recommendation: RouteRecommendation;
} {
  const rec: RouteRecommendation = {
    rutaNombre: 'Bus Azul Puerto',
    origen: 'Puerto Colombia',
    destino: 'Universidad Autónoma del Caribe',
    duracionMinutos: 34,
    paraderoOrigenId: 'p1',
  };
  return {
    answer:
      'El bus azul de siempre te deja a una cuadra de la Autónoma del Caribe en unos 34 minutos. A esta hora pasa cada 8-10 minutos. Si vas con tiempo, tómalo en la parada de la Cra. 6 con Cl. 4 en Puerto Colombia.',
    primary: startTripAction('Bus Azul Puerto', 'Universidad Autónoma del Caribe'),
    recommendation: rec,
  };
}

function pickRecommendation(kw: Keyword): RouteRecommendation | undefined {
  switch (kw) {
    case 'centro':
      return findInMock('C12');
    case 'uninorte':
    case 'universidad':
      return findInMock('A8');
    case 'aeropuerto':
      return findInMock('L9');
    case 'soledad':
      return findInMock('T1');
    case 'norte':
      return findInMock('B1');
    case 'hospital':
      return findInMock('R3') ?? findInMock('B1');
    case 'mall':
      return findInMock('R3') ?? findInMock('A8');
    case 'oficina':
      return findInMock('B1') ?? findInMock('C12');
    case 'casa_noche':
      return findInMock('L9') ?? findInMock('T1');
    default:
      return findInMock('C12');
  }
}

function buildGenericText(kw: Keyword, rec?: RouteRecommendation): string {
  if (!rec) {
    return 'No encontré una ruta exacta para eso. Si me das un destino concreto (Centro, Uninorte, aeropuerto, hospital, Autónoma del Caribe...) te armo la mejor opción.';
  }
  switch (kw) {
    case 'centro':
      return `La ruta ${rec.rutaNombre} desde ${rec.origen} te deja en el Centro Histórico en unos ${rec.duracionMinutos} minutos. Es la opción más directa a esta hora.`;
    case 'uninorte':
      return `Toma la ${rec.rutaNombre} desde ${rec.origen}. Tarda ~${rec.duracionMinutos} min y para frente a la entrada principal de Uninorte.`;
    case 'universidad':
      return `Te conviene la ${rec.rutaNombre} desde ${rec.origen}. Pasa por varios campus universitarios de la zona norte, ~${rec.duracionMinutos} min de viaje.`;
    case 'aeropuerto':
      return `La ${rec.rutaNombre} sigue operando hasta el Cortissoz, pero es el último bus de la noche. Salida estimada del paradero ${rec.origen} en pocos minutos. No esperes el siguiente.`;
    case 'soledad':
      return `La troncal ${rec.rutaNombre} desde ${rec.origen} es la más rápida hacia Soledad. Llegas en ~${rec.duracionMinutos} min sin trasbordos.`;
    case 'norte':
      return `Para ir al norte te conviene la ${rec.rutaNombre} desde ${rec.origen}. Frecuencia estable cada 8 min, ~${rec.duracionMinutos} min de viaje.`;
    case 'hospital':
      return `Para llegar a la zona de clínicas más rápido, toma la ${rec.rutaNombre} desde ${rec.origen}. ~${rec.duracionMinutos} min.`;
    case 'mall':
      return `La ${rec.rutaNombre} desde ${rec.origen} te deja cerca del centro comercial en ~${rec.duracionMinutos} min.`;
    case 'oficina':
      return `A esta hora la ${rec.rutaNombre} desde ${rec.origen} es la más confiable hacia zona empresarial, ~${rec.duracionMinutos} min.`;
    case 'casa_noche':
      return `Después de las 9 pm las frecuencias bajan. La ${rec.rutaNombre} desde ${rec.origen} todavía pasa cada 15 min, ~${rec.duracionMinutos} min de viaje.`;
    case 'bus_azul_puerto':
      return 'El bus azul en Puerto Colombia pasa cada 8-10 min entre las 5 am y las 9 pm. Despues de esa hora la frecuencia baja a 20 min. La parada principal es Cra. 6 con Cl. 4.';
    case 'cra46':
      return 'Por la Cra. 46 (Av. Murillo) pasan T1, B1, C12 y varias busetas intermunicipales. Es uno de los corredores más activos de Barranquilla. ¿Vas hacia el norte o hacia el centro?';
    default:
      return `Una opción razonable: ${rec.rutaNombre} desde ${rec.origen} hacia ${rec.destino}, ~${rec.duracionMinutos} min.`;
  }
}

export async function mockAskAssistant(
  prompt: string,
): Promise<AssistantAskResponse & { recommendation?: RouteRecommendation; alternatives?: AlternativeRoute[] }> {
  await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));
  const kw = detectKeyword(prompt);

  if (kw === 'demo_libre_centro') {
    const { answer, primary, alternatives, recommendation } = demoLibreCentroResponse();
    return {
      answer,
      suggested_action: primary,
      alternatives,
      recommendation,
      messageId: `m_${Date.now()}_a`,
    };
  }

  if (kw === 'autonoma_caribe') {
    const { answer, primary, recommendation } = autonomaCaribeResponse();
    return {
      answer,
      suggested_action: primary,
      recommendation,
      messageId: `m_${Date.now()}_a`,
    };
  }

  const rec = pickRecommendation(kw);
  const text = buildGenericText(kw, rec);
  const suggested_action: SuggestedAction | null = rec
    ? startTripAction(rec.rutaNombre, rec.destino)
    : null;

  return {
    answer: text,
    suggested_action,
    recommendation: rec,
    messageId: `m_${Date.now()}_a`,
  };
}
