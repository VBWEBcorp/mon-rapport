export type BrandId = 'vbweb' | 'bimi' | 'ouibo'
export type DocType = 'proposition' | 'synthese'

export type Brand = {
  id: BrandId
  name: string
  shortName: string
  /** Couleur d'accent (titres, traits, liens) en hex */
  primary: string
  /** Couleur des bandeaux header/footer en hex */
  marine: string
  /** URL du logo (CDN) ou null pour fallback texte */
  logoUrl: string | null
  /** Email principal de contact pour cette marque */
  email: string
  /** Domaine sans https://, affiché dans le footer */
  website: string
  /** Couleur du texte sur fond marine */
  marineForeground: string
  /** Portraits optionnels affichés dans le footer (ronds, à droite du logo).
   * 1 seule photo = rond simple. Plusieurs = ronds en stack avec léger overlap. */
  portraits?: string[]
}

export const BRANDS: Record<BrandId, Brand> = {
  vbweb: {
    id: 'vbweb',
    name: 'VBWEB',
    shortName: 'VB',
    primary: '#4FC3F7',
    marine: '#173656',
    marineForeground: '#FFFFFF',
    logoUrl: 'https://i.ibb.co/C3ZJ3z59/VBWEB-LOGO-BLEU-BLANC.png',
    email: 'contact@vbweb.fr',
    website: 'vbweb.fr',
    portraits: ['https://i.ibb.co/ZpkH8MbS/image.webp'],
  },
  bimi: {
    id: 'bimi',
    name: 'BIMI',
    shortName: 'BI',
    primary: '#FF9800',
    marine: '#3A1F08',
    marineForeground: '#FFFFFF',
    logoUrl: 'https://i.ibb.co/DDnkv6CH/BIMI-png.png',
    email: 'contact@bimi.fr',
    website: 'bimi-restaurant.com',
    // pas de photos
  },
  ouibo: {
    id: 'ouibo',
    name: 'OUIBO',
    shortName: 'OB',
    primary: '#A855F7',
    marine: '#2A1748',
    marineForeground: '#FFFFFF',
    logoUrl: 'https://i.ibb.co/Y408rXy2/Logo-OUIBO-removebg-preview.png',
    email: 'contact@ouibo.fr',
    website: 'ouibo.fr',
    portraits: [
      'https://i.ibb.co/B55PQmP0/Valentin.jpg',
      'https://i.ibb.co/23zMSVBF/Sarah.jpg',
      'https://i.ibb.co/1fRDj4NP/Victor.jpg',
    ],
  },
}

export const BRAND_LIST: Brand[] = Object.values(BRANDS)

export function getBrand(id: BrandId | string | undefined): Brand {
  if (id && id in BRANDS) return BRANDS[id as BrandId]
  return BRANDS.vbweb
}

export const DOC_TYPES: Array<{ id: DocType; label: string; description: string }> = [
  {
    id: 'proposition',
    label: 'Proposition',
    description: 'Offre détaillée pour un client (lots, tarifs, modalités)',
  },
  {
    id: 'synthese',
    label: 'Synthèse',
    description: 'Audit, bilan ou rapport structuré (SEO, perf, contenu, etc.)',
  },
]
