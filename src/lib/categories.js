import { Landmark, UtensilsCrossed, Coffee, BedDouble, TreePine, FerrisWheel } from 'lucide-react'

/* Place categories, shared by the suggestions panel and the map's Luoghi
   layer: i18n labelKey, lucide Icon for React, inline svg path for Leaflet
   divIcons, and a chip/pin color. Keys are stable enum values stored in
   trip data (suggestion.category / item.category) — never translate them. */
export const CATS = {
  attraction: {
    labelKey: 'cats.attraction', Icon: FerrisWheel, color: '#8b5cf6',
    svg: '<circle cx="12" cy="12" r="4"/><path d="M12 2v4m6.8-1.2-2.9 2.9M22 12h-4m1.2 6.8-2.9-2.9M12 22v-4m-6.8 1.2 2.9-2.9M2 12h4M4.8 5.2l2.9 2.9"/>',
  },
  museum: {
    labelKey: 'cats.museum', Icon: Landmark, color: '#f59e0b',
    svg: '<path d="M3 22h18M6 18v-7m4 7v-7m4 7v-7m4 7v-7M12 2l8 5H4z"/>',
  },
  restaurant: {
    labelKey: 'cats.restaurant', Icon: UtensilsCrossed, color: '#f43f5e',
    svg: '<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>',
  },
  cafe: {
    labelKey: 'cats.cafe', Icon: Coffee, color: '#b45309',
    svg: '<path d="M17 8h1a4 4 0 1 1 0 8h-1M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/>',
  },
  hotel: {
    labelKey: 'cats.hotel', Icon: BedDouble, color: '#0ea5e9',
    svg: '<path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4M2 17h20"/>',
  },
  park: {
    labelKey: 'cats.park', Icon: TreePine, color: '#10b981',
    svg: '<path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17ZM12 22v-3"/>',
  },
}
export const CAT_KEYS = Object.keys(CATS)

/* fallback classification for data saved before categories existed: the
   trip stores only activity/food/hotel, the finer category comes from the
   title (works across it/en since it matches both languages' keywords) */
const CAFE_RE = /caff|café|cafe\b|coffee|bar\b|pasticc|bakery|gelat|pub\b|birreria|enoteca/i
const MUSEUM_RE = /museo|museum|galleria|gallery|pinacoteca|mostra|exhibition/i
const PARK_RE = /parco|park\b|giardin|garden|bosco|forest|lago|lake\b|cascat|falls|spiaggia|beach|sentiero|trail|monte|mount|riserva|oasi|zoo\b|acquario|aquarium/i
export function classify(type, title = '') {
  if (type === 'hotel') return 'hotel'
  if (type === 'food') return CAFE_RE.test(title) ? 'cafe' : 'restaurant'
  if (MUSEUM_RE.test(title)) return 'museum'
  if (PARK_RE.test(title)) return 'park'
  return 'attraction'
}
