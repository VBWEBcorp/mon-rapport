'use client'

import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import Image from '@tiptap/extension-image'
import { marked } from 'marked'
import TurndownService from 'turndown'
// @ts-expect-error - pas de types officiels pour @joplin/turndown-plugin-gfm
import { gfm } from '@joplin/turndown-plugin-gfm'
import { useEffect, useRef } from 'react'

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
})

// Plugin GFM : convertit correctement <table>/<thead>/<tr>/<th>/<2d>
// en tableau markdown | col | et inversement. Sans ça turndown supprime
// les tableaux ou les laisse en HTML brut.
turndown.use(gfm)

// Preserve les <img> avec width et/ou data-align en HTML brut dans le markdown
// (turndown par defaut convertit en ![alt](src) et perd ces attributs).
turndown.addRule('imgWithAttrs', {
  filter: (node) => {
    if (node.nodeName !== 'IMG') return false
    const el = node as HTMLImageElement
    return !!el.getAttribute('width') || !!el.getAttribute('data-align')
  },
  replacement: (_content, node) => {
    const el = node as HTMLImageElement
    const src = el.getAttribute('src') ?? ''
    const alt = el.getAttribute('alt') ?? ''
    const width = el.getAttribute('width')
    const align = el.getAttribute('data-align')
    const attrs = [
      `src="${src}"`,
      `alt="${alt}"`,
      width ? `width="${width}"` : '',
      align ? `data-align="${align}"` : '',
    ]
      .filter(Boolean)
      .join(' ')
    return `\n\n<img ${attrs}>\n\n`
  },
})

export function markdownToHtml(md: string): string {
  let html = marked.parse(md, { async: false }) as string
  // Aplatit <thead><tr>...</tr></thead><tbody> en <tbody><tr>...</tr>... pour
  // eviter que Tiptap rende un bandeau marine vide au-dessus de la 1ere ligne
  // (Tiptap a une mauvaise interpretation de thead, et garde une row vide).
  html = html.replace(
    /<thead>([\s\S]*?)<\/thead>\s*<tbody>/g,
    '<tbody>$1'
  )
  // Marked emet <p><img></p> pour ![alt](url). Tiptap Image est "inline: false"
  // (bloc autonome), donc on degage le <p> wrapper pour que ce soit reconnu
  // comme image-bloc au lieu d'un paragraphe contenant une image.
  html = html.replace(/<p>\s*(<img[^>]+>)\s*<\/p>/g, '$1')
  return html
}

export function htmlToMarkdown(html: string): string {
  return turndown.turndown(html)
}

import type { Editor } from '@tiptap/react'

type Props = {
  initialMarkdown: string
  onChange: (markdown: string) => void
  onEditorReady?: (editor: Editor) => void
  className?: string
}

// Upload une image vers /api/upload (R2 ou local fallback) et renvoie l'URL.
export async function uploadImageFile(file: File): Promise<string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch('/api/upload', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: fd,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error ?? 'Echec upload')
  }
  const { url } = (await res.json()) as { url: string }
  return url
}

export function InlineEditor({ initialMarkdown, onChange, onEditorReady, className }: Props) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastEmittedRef = useRef<string>(initialMarkdown)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        // Desactive le Link inclus dans StarterKit pour eviter le doublon
        // avec notre Link.configure custom ci-dessous.
        link: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { rel: 'noopener noreferrer', class: 'text-primary underline-offset-4 hover:underline' },
      }),
      Placeholder.configure({
        placeholder: 'Clique ici pour modifier le contenu…',
      }),
      Table.configure({
        resizable: false,
        HTMLAttributes: { class: 'tiptap-table' },
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image.extend({
        // Ajoute "width" (pourcentage libre, ex. "47%") et "data-align"
        // ("left"|"center"|"right"). Tous deux serialises dans le HTML pour
        // survivre au round-trip markdown via la regle imgWithWidth.
        addAttributes() {
          return {
            ...this.parent?.(),
            width: {
              default: null,
              parseHTML: (el) => el.getAttribute('width'),
              renderHTML: (attrs) =>
                attrs.width ? { width: attrs.width } : {},
            },
            dataAlign: {
              default: null,
              parseHTML: (el) => el.getAttribute('data-align'),
              renderHTML: (attrs) =>
                attrs.dataAlign ? { 'data-align': attrs.dataAlign } : {},
            },
          }
        },
      }).configure({
        inline: false,
        // crossorigin="anonymous" : indispensable pour que html2canvas puisse
        // rasteriser les images dans le PDF (sinon CORS taint le canvas et
        // les images apparaissent en blanc dans le PDF telecharge).
        HTMLAttributes: {
          class: 'tiptap-image',
          crossorigin: 'anonymous',
        },
      }),
    ],
    content: markdownToHtml(initialMarkdown),
    editorProps: {
      attributes: {
        class:
          'prose-vbweb focus:outline-none min-h-[400px]',
      },
      // Intercepte le coller : si le presse-papier contient une image
      // (capture d'ecran macOS/Windows, photo iOS, etc.) on l'upload puis on
      // l'insere a la position du curseur, sans casser le coller normal de texte.
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items
        if (!items) return false
        for (const item of items) {
          if (item.kind === 'file' && item.type.startsWith('image/')) {
            const file = item.getAsFile()
            if (!file) continue
            event.preventDefault()
            uploadImageFile(file)
              .then((url) => {
                view.dispatch(
                  view.state.tr.replaceSelectionWith(
                    view.state.schema.nodes.image.create({ src: url, alt: '' })
                  )
                )
              })
              .catch((err) => {
                console.error('[paste image] upload failed', err)
                alert('Echec upload image : ' + (err?.message || err))
              })
            return true
          }
        }
        return false
      },
      // Meme principe pour le drag & drop d'une image depuis le bureau.
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files
        if (!files || files.length === 0) return false
        const imageFiles = Array.from(files).filter((f) => f.type.startsWith('image/'))
        if (imageFiles.length === 0) return false
        event.preventDefault()
        const coords = view.posAtCoords({ left: event.clientX, top: event.clientY })
        const pos = coords?.pos ?? view.state.selection.from
        for (const file of imageFiles) {
          uploadImageFile(file)
            .then((url) => {
              const node = view.state.schema.nodes.image.create({ src: url, alt: '' })
              view.dispatch(view.state.tr.insert(pos, node))
            })
            .catch((err) => {
              console.error('[drop image] upload failed', err)
              alert('Echec upload image : ' + (err?.message || err))
            })
        }
        return true
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML()
      const md = htmlToMarkdown(html)
      if (md === lastEmittedRef.current) return
      lastEmittedRef.current = md
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => onChange(md), 700)
    },
  })

  // Si initialMarkdown change (ex: nav arrière), resync
  useEffect(() => {
    if (!editor) return
    const currentMd = htmlToMarkdown(editor.getHTML())
    if (currentMd !== initialMarkdown) {
      editor.commands.setContent(markdownToHtml(initialMarkdown), { emitUpdate: false })
      lastEmittedRef.current = initialMarkdown
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMarkdown])

  // Expose l'instance editor au parent (pour brancher une toolbar)
  useEffect(() => {
    if (editor && onEditorReady) onEditorReady(editor)
  }, [editor, onEditorReady])

  return <EditorContent editor={editor} className={className} />
}
