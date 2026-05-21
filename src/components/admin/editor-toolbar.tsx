'use client'

import { useRef } from 'react'
import type { Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Table as TableIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Undo,
  Redo,
  RemoveFormatting,
  Trash2,
  Plus,
} from 'lucide-react'

type Props = {
  editor: Editor | null
}

export function EditorToolbar({ editor }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  if (!editor) return null

  const setLink = () => {
    const previousUrl = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('URL du lien', previousUrl ?? 'https://')
    if (url === null) return
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run()
      return
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  }

  const insertTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 2, withHeaderRow: true })
      .run()
  }

  const onImageFile = async (file: File) => {
    try {
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
      editor.chain().focus().setImage({ src: url, alt: '' }).run()
    } catch (e) {
      alert('Echec upload image : ' + (e instanceof Error ? e.message : String(e)))
    }
  }

  const inTable = editor.isActive('table')
  const inImage = editor.isActive('image')

  const setImageWidth = (width: string | null) => {
    editor.chain().focus().updateAttributes('image', { width }).run()
  }
  const setImageAlign = (align: 'left' | 'center' | 'right' | null) => {
    editor.chain().focus().updateAttributes('image', { dataAlign: align }).run()
  }
  const deleteImage = () => {
    editor.chain().focus().deleteSelection().run()
  }
  const imgAttrs = editor.getAttributes('image')
  const currentImageWidth = imgAttrs.width as string | null | undefined
  const currentImageAlign = (imgAttrs.dataAlign as string | null | undefined) ?? 'center'
  // Largeur en nombre (pour le slider) ; defaut 100
  const widthNum = currentImageWidth
    ? parseInt(String(currentImageWidth).replace('%', ''), 10) || 100
    : 100

  return (
    <div className="no-print sticky top-[57px] z-30 flex flex-nowrap items-center gap-1 overflow-x-auto border-b border-border/60 bg-background/95 px-3 py-2 backdrop-blur-xl md:flex-wrap md:overflow-visible [scrollbar-width:thin]">
      {/* Annuler / refaire */}
      <ToolBtn
        title="Annuler (Ctrl+Z)"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
      >
        <Undo className="size-4" />
      </ToolBtn>
      <ToolBtn
        title="Refaire (Ctrl+Y)"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
      >
        <Redo className="size-4" />
      </ToolBtn>

      <Sep />

      {/* Titres */}
      <ToolBtn
        title="Titre de section (H2)"
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading1 className="size-4" />
      </ToolBtn>
      <ToolBtn
        title="Sous-titre (H3)"
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading2 className="size-4" />
      </ToolBtn>
      <ToolBtn
        title="Sous-sous-titre (H4)"
        active={editor.isActive('heading', { level: 4 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
      >
        <Heading3 className="size-4" />
      </ToolBtn>

      <Sep />

      {/* Inline */}
      <ToolBtn
        title="Gras (Ctrl+B)"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="size-4" />
      </ToolBtn>
      <ToolBtn
        title="Italique (Ctrl+I)"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="size-4" />
      </ToolBtn>
      <ToolBtn
        title="Barré"
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="size-4" />
      </ToolBtn>
      <ToolBtn title="Lien (Ctrl+K)" active={editor.isActive('link')} onClick={setLink}>
        <LinkIcon className="size-4" />
      </ToolBtn>
      <ToolBtn
        title="Ajouter une image (ou colle directement une capture d'ecran)"
        onClick={() => fileInputRef.current?.click()}
      >
        <ImageIcon className="size-4" />
      </ToolBtn>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp, image/gif"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onImageFile(f)
          e.currentTarget.value = ''
        }}
      />

      <Sep />

      {/* Listes + citation */}
      <ToolBtn
        title="Liste à puces"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="size-4" />
      </ToolBtn>
      <ToolBtn
        title="Liste numérotée"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="size-4" />
      </ToolBtn>
      <ToolBtn
        title="Citation"
        active={editor.isActive('blockquote')}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="size-4" />
      </ToolBtn>

      <Sep />

      {/* Tableau */}
      <ToolBtn
        title="Insérer un tableau"
        active={inTable}
        onClick={insertTable}
      >
        <TableIcon className="size-4" />
      </ToolBtn>
      {inTable ? (
        <>
          <ToolBtn
            title="Ajouter une colonne"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
          >
            <Plus className="size-3.5" />
            <span className="text-[10px] font-semibold">col</span>
          </ToolBtn>
          <ToolBtn
            title="Ajouter une ligne"
            onClick={() => editor.chain().focus().addRowAfter().run()}
          >
            <Plus className="size-3.5" />
            <span className="text-[10px] font-semibold">ligne</span>
          </ToolBtn>
          <ToolBtn
            title="Supprimer le tableau"
            onClick={() => editor.chain().focus().deleteTable().run()}
          >
            <Trash2 className="size-4 text-destructive" />
          </ToolBtn>
        </>
      ) : null}

      <Sep />

      {/* Effacer formatage */}
      <ToolBtn
        title="Effacer le formatage"
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
      >
        <RemoveFormatting className="size-4" />
      </ToolBtn>

      {/* Controles image (visibles uniquement si une image est selectionnee) */}
      {inImage ? (
        <>
          <Sep />
          <span className="ml-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Image
          </span>

          {/* Alignement */}
          <ToolBtn
            title="Aligner a gauche"
            active={currentImageAlign === 'left'}
            onClick={() => setImageAlign('left')}
          >
            <AlignLeft className="size-4" />
          </ToolBtn>
          <ToolBtn
            title="Centrer"
            active={currentImageAlign === 'center' || !imgAttrs.dataAlign}
            onClick={() => setImageAlign('center')}
          >
            <AlignCenter className="size-4" />
          </ToolBtn>
          <ToolBtn
            title="Aligner a droite"
            active={currentImageAlign === 'right'}
            onClick={() => setImageAlign('right')}
          >
            <AlignRight className="size-4" />
          </ToolBtn>

          <Sep />

          {/* Slider largeur exacte */}
          <div className="ml-1 flex items-center gap-2 rounded-md border border-border/60 bg-card px-2 py-1">
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={widthNum}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10)
                setImageWidth(v >= 100 ? null : `${v}%`)
              }}
              className="h-1 w-24 cursor-pointer accent-primary sm:w-32"
              title="Largeur de l'image"
            />
            <span className="min-w-[36px] text-right text-[11px] font-semibold tabular-nums text-foreground/80">
              {widthNum}%
            </span>
          </div>

          <ToolBtn title="Supprimer l'image" onClick={deleteImage}>
            <Trash2 className="size-4 text-destructive" />
          </ToolBtn>
        </>
      ) : null}
    </div>
  )
}

function ToolBtn({
  title,
  active,
  disabled,
  onClick,
  children,
}: {
  title: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      // Tap targets : 44px sur mobile (guideline iOS/Android), conserve l'ancien
      // padding sur tablette/desktop pour ne pas changer le design >=md.
      className={`inline-flex shrink-0 items-center gap-1 rounded-md px-3 py-2.5 text-foreground/80 transition-colors hover:bg-muted md:px-2 md:py-1.5 ${
        active ? 'bg-primary/10 text-primary' : ''
      } disabled:cursor-not-allowed disabled:opacity-40`}
    >
      {children}
    </button>
  )
}

function Sep() {
  return <span aria-hidden className="mx-1 h-5 w-px bg-border/70" />
}
