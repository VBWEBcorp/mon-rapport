'use client'

import { motion } from 'framer-motion'
import { PropositionShell } from './proposition-shell'
import { PropositionHero } from './proposition-hero'
import { Markdown } from './markdown'
import type { PropositionPayload } from '@/lib/propositions-types'

const ease = [0.22, 1, 0.36, 1] as const

export function PropositionView({
  data,
  embedded = false,
  animate = false,
}: {
  data: PropositionPayload & { number?: string }
  /** Quand true, omet le Shell (footer) — utilise dans l'editeur ou en iframe. */
  embedded?: boolean
  /** Active les animations d'entree fluides cote client public. */
  animate?: boolean
}) {
  const content = data.content?.trim() ? (
    <Markdown docType={data.docType}>{data.content}</Markdown>
  ) : (
    <p className="text-sm italic text-muted-foreground">
      (Le contenu de la proposition apparaîtra ici dès que tu auras généré ou édité.)
    </p>
  )

  const body = animate ? (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease, delay: 0.55 }}
    >
      {content}
    </motion.div>
  ) : (
    content
  )

  const inner = (
    <>
      <PropositionHero
        brand={data.brand}
        client={data.client || 'Client'}
        baseline={data.baseline}
        date={data.date}
        number={data.number}
        clientLogoUrl={data.clientLogoUrl}
        animate={animate}
      />
      <div className="mx-auto max-w-5xl px-4 pb-8 pt-12 sm:px-8 sm:pt-16">
        {body}
      </div>
    </>
  )

  if (embedded) return <div className="bg-background">{inner}</div>

  return (
    <PropositionShell
      brand={data.brand}
      client={data.client || 'Client'}
      number={data.number}
      animate={animate}
    >
      {inner}
    </PropositionShell>
  )
}
