'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import type { DocType } from '@/lib/brands'

/**
 * Rendu markdown VBWEB — version premium :
 * - ## = section principale, titre cyan UPPERCASE avec barre verticale gauche
 * - ### = sous-section / lot, gras + souligné cyan
 * - listes à puces accentuées en cyan
 * - tableaux avec en-tête marine, lignes alternées, hover
 * - blockquote avec guillemet décorative
 *
 * docType: les synthèses utilisent une taille de texte légèrement plus grosse
 * (lecture longue/dense → +1px sur paragraphes, listes, blockquote).
 */
export function Markdown({
  children,
  docType = 'proposition',
}: {
  children: string
  docType?: DocType
}) {
  const isSynthese = docType === 'synthese'
  const bodyText = isSynthese
    ? 'text-[17px] sm:text-[18px]'
    : 'text-[16px] sm:text-[17px]'
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        h1: (props) => (
          <h1
            className="mb-6 mt-0 font-display text-3xl font-bold tracking-tight text-heading"
            {...props}
          />
        ),
        h2: (props) => (
          <h2
            className="relative mb-6 mt-14 pl-4 font-display text-[1.8rem] font-bold tracking-tight text-heading first:mt-0 sm:text-[2rem] before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-[2px] before:rounded-full before:bg-primary"
            {...props}
          />
        ),
        h3: (props) => (
          <h3
            className="mb-3 mt-9 font-display text-base font-semibold tracking-tight text-foreground sm:text-[1.05rem]"
            {...props}
          />
        ),
        h4: (props) => (
          <h4
            className="mb-2 mt-6 font-display text-sm font-semibold tracking-tight text-foreground"
            {...props}
          />
        ),
        p: (props) => (
          <p
            className={`mb-4 ${bodyText} leading-[1.7] text-foreground/90 last:mb-0`}
            {...props}
          />
        ),
        strong: (props) => (
          <strong className="font-semibold text-foreground" {...props} />
        ),
        em: (props) => <em className="italic text-foreground" {...props} />,
        ul: (props) => (
          <ul
            className={`mb-5 ml-1 space-y-2 ${bodyText} leading-[1.65] text-foreground/90 [&>li]:relative [&>li]:pl-6 [&>li]:before:absolute [&>li]:before:left-0 [&>li]:before:top-[0.6em] [&>li]:before:size-2 [&>li]:before:rounded-full [&>li]:before:bg-primary/80 [&>li]:before:ring-2 [&>li]:before:ring-primary/15`}
            {...props}
          />
        ),
        ol: (props) => (
          <ol
            className={`mb-5 ml-5 list-decimal space-y-2 ${bodyText} leading-[1.65] text-foreground/90 marker:font-semibold marker:text-primary`}
            {...props}
          />
        ),
        li: (props) => <li {...props} />,
        blockquote: (props) => (
          <blockquote
            className={`my-6 rounded-xl border border-primary/20 bg-primary/[0.05] px-6 py-5 ${bodyText} italic leading-[1.65] text-foreground/90 shadow-sm`}
            {...props}
          />
        ),
        a: ({ href, ...rest }) => (
          <a
            href={href}
            className="font-medium text-primary underline-offset-4 transition-colors hover:underline"
            target={href?.startsWith('http') ? '_blank' : undefined}
            rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            {...rest}
          />
        ),
        code: (props) => (
          <code
            className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.92em] text-foreground"
            {...props}
          />
        ),
        hr: () => <hr className="my-10 border-border/60" />,
        table: (props) => (
          <div className="my-8 overflow-x-auto rounded-xl border border-border/60 shadow-sm">
            <table className="w-full border-collapse text-sm" {...props} />
          </div>
        ),
        thead: (props) => (
          <thead className="bg-brand-marine text-brand-marine-foreground" {...props} />
        ),
        th: (props) => (
          <th
            className="border-r border-white/15 px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-[0.12em] last:border-r-0"
            {...props}
          />
        ),
        td: (props) => (
          <td
            className="border-r border-t border-border/50 px-5 py-3 text-[14px] text-foreground/90 last:border-r-0"
            {...props}
          />
        ),
        tr: (props) => (
          <tr className="even:bg-muted/30 hover:bg-primary/[0.04]" {...props} />
        ),
        // eslint-disable-next-line @next/next/no-img-element
        img: ({ src, alt, width, ...rest }) => {
          // width: "50%" -> applique en inline style. data-align: gere
          // l'alignement (left/center/right) via margin auto.
          const widthStr = typeof width === 'string' ? width : undefined
          const align =
            (rest as Record<string, unknown>)['data-align'] === 'left'
              ? 'left'
              : (rest as Record<string, unknown>)['data-align'] === 'right'
                ? 'right'
                : 'center'
          const marginStyle: React.CSSProperties =
            align === 'left'
              ? { marginLeft: 0, marginRight: 'auto' }
              : align === 'right'
                ? { marginLeft: 'auto', marginRight: 0 }
                : { marginLeft: 'auto', marginRight: 'auto' }
          return (
            // eslint-disable-next-line @next/next/no-img-element
            // crossOrigin="anonymous" : indispensable pour que html2canvas puisse
            // rasteriser l'image dans le PDF sans tainter le canvas (CORS).
            // Sans ça, les images R2 apparaissent en blanc dans le PDF.
            <img
              src={src as string}
              alt={alt ?? ''}
              crossOrigin="anonymous"
              style={{
                ...marginStyle,
                ...(widthStr ? { width: widthStr } : { width: '100%' }),
                display: 'block',
                maxWidth: '100%',
                height: 'auto',
              }}
              className="my-8 rounded-xl border border-border/40 shadow-sm"
            />
          )
        },
      }}
    >
      {children}
    </ReactMarkdown>
  )
}
