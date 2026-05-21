'use client'

import { motion, type Variants } from 'framer-motion'
import { getBrand, type BrandId } from '@/lib/brands'
import { BrandLogo } from './brand-logo'

const ease = [0.22, 1, 0.36, 1] as const

const footerContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.08, delayChildren: 0.25 },
  },
}

const footerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
}

export function PropositionShell({
  children,
  client,
  number,
  totalPages = 1,
  pageIndex = 1,
  brand = 'vbweb',
  animate = false,
}: {
  children: React.ReactNode
  client: string
  number?: string
  totalPages?: number
  pageIndex?: number
  brand?: BrandId
  /** Active les animations d'entree (cote client public). Off dans l'editeur. */
  animate?: boolean
}) {
  const b = getBrand(brand)
  const initial = animate ? 'hidden' : 'visible'

  return (
    <div data-brand={b.id} className="flex min-h-dvh flex-col bg-background">
      <main className="flex-1">{children}</main>

      {/* Footer marine — miroir du header, fine bordure cyan en haut */}
      <motion.footer
        data-pdf="footer"
        variants={footerContainer}
        initial={initial}
        whileInView="visible"
        viewport={{ once: true, margin: '0px 0px -80px 0px' }}
        animate={animate ? undefined : 'visible'}
        className="relative mt-20 overflow-hidden bg-brand-marine text-brand-marine-foreground"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-primary/45"
        />

        <div className="relative mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-4 gap-y-3 px-4 py-6 sm:px-8 sm:py-7">
          <motion.div variants={footerItem} className="flex items-center gap-3">
            <BrandLogo brand={b} className="h-10 w-auto opacity-95 sm:h-12" />
            {b.portraits && b.portraits.length > 0 ? (
              <div className="flex -space-x-2">
                {b.portraits.map((src, i) => (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    key={src}
                    src={src}
                    alt={`Portrait ${i + 1}`}
                    className="size-14 rounded-full object-cover ring-2 ring-brand-marine sm:size-16"
                    style={{ zIndex: b.portraits!.length - i }}
                  />
                ))}
              </div>
            ) : null}
            <span aria-hidden className="hidden h-8 w-px bg-white/15 sm:inline-block" />
            <a
              href={`https://${b.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden text-[12px] font-medium tracking-wide text-brand-marine-foreground/85 transition-colors hover:text-brand-marine-foreground sm:block"
            >
              {b.website}
            </a>
          </motion.div>

          <motion.p
            variants={footerItem}
            className="hidden text-[11px] uppercase tracking-[0.18em] text-brand-marine-foreground/70 md:block"
          >
            Document confidentiel · {client}
          </motion.p>

          <motion.div
            variants={footerItem}
            className="flex flex-col items-end gap-0.5 text-right"
          >
            {number ? (
              <p className="font-display text-sm font-semibold tracking-tight">
                {number}
              </p>
            ) : null}
            <p
              data-pdf-page-counter
              className="text-[11px] uppercase tracking-[0.18em] text-brand-marine-foreground/70 tabular-nums"
            >
              Page {pageIndex} / {totalPages}
            </p>
          </motion.div>
        </div>
      </motion.footer>
    </div>
  )
}
