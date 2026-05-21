'use client'

import { motion, type Variants } from 'framer-motion'
import { getBrand, type BrandId } from '@/lib/brands'
import { BrandLogo } from './brand-logo'

const ease = [0.22, 1, 0.36, 1] as const

const container: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.11, delayChildren: 0.05 },
  },
}

const item: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease } },
}

const itemLogo: Variants = {
  hidden: { opacity: 0, scale: 0.94, y: 8 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.7, ease } },
}

type Props = {
  brand?: BrandId
  client: string
  baseline?: string
  date?: string
  number?: string
  clientLogoUrl?: string
  /** Active les animations d'entree (cote client public). Off dans l'editeur. */
  animate?: boolean
}

export function PropositionHero({
  brand = 'vbweb',
  client,
  baseline,
  date,
  number,
  clientLogoUrl,
  animate = false,
}: Props) {
  const b = getBrand(brand)
  // Astuce : on garde motion.* dans les 2 cas, mais en mode "non anime" on
  // initialise directement a "visible" -> aucune animation perceptible, et la
  // structure reste identique pour le PDF (l'editeur evite le clignotement).
  const initial = animate ? 'hidden' : 'visible'

  return (
    <motion.div
      data-pdf="header"
      variants={container}
      initial={initial}
      animate="visible"
    >
      {/* Bandeau marine — aplat avec accent cyan discret (premium) */}
      <div className="relative overflow-hidden bg-brand-marine text-brand-marine-foreground">
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-primary/45"
        />

        <div className="relative mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-4 px-4 py-6 sm:px-8 sm:py-7">
          <motion.div
            variants={itemLogo}
            className="flex items-center gap-4 sm:gap-6"
          >
            <BrandLogo brand={b} className="h-10 w-auto sm:h-12" />
            {clientLogoUrl ? (
              <>
                {/* X stylise a la place du trait vertical (collab agence × client) */}
                <span
                  aria-hidden
                  className="select-none font-display text-2xl font-extralight leading-none text-white/45 sm:text-[28px]"
                >
                  ×
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <motion.img
                  variants={itemLogo}
                  src={clientLogoUrl}
                  alt={`Logo ${client}`}
                  crossOrigin="anonymous"
                  className="h-9 w-auto max-w-[160px] object-contain sm:h-11"
                />
              </>
            ) : null}
          </motion.div>

          {number || date ? (
            <motion.div
              variants={item}
              className="flex flex-col items-end gap-0.5 text-right"
            >
              {number ? (
                <p className="font-display text-base font-semibold tracking-tight sm:text-lg">
                  {number}
                </p>
              ) : null}
              {date ? (
                <p className="text-[11px] uppercase tracking-[0.18em] text-brand-marine-foreground/70 sm:text-xs">
                  Date de création · {date}
                </p>
              ) : null}
            </motion.div>
          ) : null}
        </div>
      </div>

      {/* Objet de la proposition */}
      <header className="relative bg-background">
        <div className="mx-auto max-w-5xl px-4 pt-12 sm:px-8 sm:pt-16">
          {b.portraits && b.portraits.length > 0 ? (
            <motion.div variants={itemLogo} className="mb-5 flex -space-x-2">
              {b.portraits.map((src, i) => (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  key={src}
                  src={src}
                  alt={`Portrait ${i + 1}`}
                  className="size-20 rounded-full object-cover shadow-sm ring-2 ring-background sm:size-24"
                  style={{ zIndex: b.portraits!.length - i }}
                />
              ))}
            </motion.div>
          ) : null}
          <motion.p
            variants={item}
            className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary"
          >
            Objet du document
          </motion.p>
          <motion.h1
            variants={item}
            className="mt-3 font-display text-3xl font-semibold leading-[1.15] tracking-tight text-balance text-foreground sm:text-4xl lg:text-[2.6rem]"
          >
            {baseline || `Document pour ${client}`}{' '}
            <span className="text-foreground/55">pour </span>
            <span className="text-heading">{client}</span>
          </motion.h1>
          <motion.div
            variants={item}
            className="mt-6 h-[2px] w-12 rounded-full bg-primary"
          />
        </div>
      </header>
    </motion.div>
  )
}
