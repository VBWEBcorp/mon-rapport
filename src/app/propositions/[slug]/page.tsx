import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { PropositionView } from '@/components/proposition/proposition-view'
import {
  getProposition,
  listPropositionSlugs,
} from '@/lib/propositions'
import type { BrandId } from '@/lib/brands'
import { siteConfig } from '@/lib/seo'

export const dynamic = 'force-dynamic'

const VALID_BRANDS: BrandId[] = ['vbweb', 'bimi', 'ouibo']

export async function generateStaticParams() {
  const slugs = await listPropositionSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const prop = await getProposition(slug)
  if (!prop) return { title: 'Proposition introuvable' }
  return {
    title: `Proposition · ${prop.client}`,
    description:
      prop.baseline ??
      `Proposition commerciale ${siteConfig.name} pour ${prop.client}.`,
    robots: { index: false, follow: false },
    alternates: { canonical: `/propositions/${slug}` },
  }
}

export default async function PropositionPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ brand?: string }>
}) {
  const { slug } = await params
  const { brand: brandOverride } = await searchParams
  const prop = await getProposition(slug)
  if (!prop) notFound()

  // Override visuel optionnel pour les aperçus dans /admin/new
  // (ne touche pas la DB, juste le rendu)
  const data =
    brandOverride && VALID_BRANDS.includes(brandOverride as BrandId)
      ? { ...prop, brand: brandOverride as BrandId }
      : prop

  return <PropositionView data={data} animate />
}
