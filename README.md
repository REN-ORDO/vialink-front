# Vialink

> Paradero virtual inteligente para el transporte público de Barranquilla.
> Webapp mobile-first con asistente de IA conversacional.

*Cómo Colombia se mueve en bus, finalmente bien.*

---

## Qué es

Vialink es una webapp que combina mapa en tiempo real, ETAs por ruta y un asistente
de IA que entiende preguntas en lenguaje natural como *"¿voy de afán al Centro, qué
bus tomo?"* y responde con la mejor ruta razonada.

El usuario abre la app, ve qué buses están llegando cerca, cuándo, a dónde van, y
puede pedirle a la IA cómo llegar a cualquier lugar sin saber rutas de memoria.

---

## Diferenciadores

1. **Asistente IA conversacional** — entiende contexto, urgencia y preferencias.
   No es un buscador de rutas, es alguien que razona contigo.
2. **Vista admin con 500 agentes simulados** — durante el pitch se ven 500 usuarios
   IA usando la app en vivo, prueba de escala sin necesidad de tráfico real.

---

## Pantallas

| Ruta | Pantalla |
|------|----------|
| `/` | Mapa principal con paraderos cercanos y buses en vivo |
| `/paradero/:id` | Detalle de paradero con rutas ordenadas por ETA |
| `/asistente` | Chat con asistente IA + recomendaciones tappables |
| `/viaje/:id` | Viaje activo con ruta dibujada y tiempo restante |
| `/admin` | Vista interna del simulador con 500 agentes en vivo |

---

## Stack

**Frontend:** React + Vite + TypeScript · Tailwind CSS · React Router · Zustand ·
TanStack Query · Framer Motion · Leaflet · WebSocket nativo.

**Backend** (repo separado): NestJS + PostgreSQL en Railway/Render con WebSocket
para eventos en tiempo real.

---

## Contexto

Proyecto de hackathon — 48h, Mayo 2026. Mobile-first sin excepciones: diseñado
para 393 px (iPhone 15). El jurado abre la URL desde su celular.
