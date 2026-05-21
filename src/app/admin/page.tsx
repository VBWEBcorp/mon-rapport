'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowDownNarrowWide,
  ArrowUpNarrowWide,
  Copy,
  ExternalLink,
  Files,
  LayoutGrid,
  List,
  LogOut,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react'

import { BRAND_LIST, getBrand } from '@/lib/brands'
import type { BrandId, DocType, PropositionWithMeta } from '@/lib/propositions-types'

const ease = [0.22, 1, 0.36, 1] as const

const TYPE_FILTERS: Array<{ value: 'all' | DocType; label: string }> = [
  { value: 'all', label: 'Tous' },
  { value: 'proposition', label: 'Propositions' },
  { value: 'synthese', label: 'Synthèses' },
]

type SortOrder = 'recent' | 'oldest'
type ViewMode = 'table' | 'cards'

// "24/04/2026" -> {year: 2026, month: 4, day: 24, ts: 1745452800000}
// Si invalide / vide, on retombe sur createdAt.
function parseDocDate(s: string | undefined, fallbackIso: string): { year: number; ts: number } {
  if (s) {
    const m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})$/)
    if (m) {
      let y = parseInt(m[3], 10)
      if (y < 100) y += 2000
      const mo = parseInt(m[2], 10) - 1
      const d = parseInt(m[1], 10)
      const ts = new Date(y, mo, d).getTime()
      if (!Number.isNaN(ts)) return { year: y, ts }
    }
  }
  const ts = new Date(fallbackIso).getTime()
  return { year: new Date(ts).getFullYear(), ts }
}

export default function AdminHome() {
  const router = useRouter()
  const [items, setItems] = useState<PropositionWithMeta[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [duplicating, setDuplicating] = useState<string | null>(null)
  const [confirmSlug, setConfirmSlug] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState<'all' | BrandId>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | DocType>('all')
  const [yearFilter, setYearFilter] = useState<'all' | number>('all')
  const [sortOrder, setSortOrder] = useState<SortOrder>('recent')
  const [viewMode, setViewMode] = useState<ViewMode>('table')

  // Persiste les filtres en localStorage pour que le user retrouve son contexte
  useEffect(() => {
    const savedBrand = localStorage.getItem('propositor.brandFilter')
    const savedType = localStorage.getItem('propositor.typeFilter')
    const savedYear = localStorage.getItem('propositor.yearFilter')
    const savedSort = localStorage.getItem('propositor.sortOrder')
    const savedView = localStorage.getItem('propositor.viewMode')
    if (savedBrand) setBrandFilter(savedBrand as 'all' | BrandId)
    if (savedType) setTypeFilter(savedType as 'all' | DocType)
    if (savedYear) setYearFilter(savedYear === 'all' ? 'all' : parseInt(savedYear, 10))
    if (savedSort === 'oldest' || savedSort === 'recent') setSortOrder(savedSort)
    if (savedView === 'cards' || savedView === 'table') setViewMode(savedView)
  }, [])

  useEffect(() => {
    localStorage.setItem('propositor.brandFilter', brandFilter)
  }, [brandFilter])
  useEffect(() => {
    localStorage.setItem('propositor.typeFilter', typeFilter)
  }, [typeFilter])
  useEffect(() => {
    localStorage.setItem('propositor.yearFilter', String(yearFilter))
  }, [yearFilter])
  useEffect(() => {
    localStorage.setItem('propositor.sortOrder', sortOrder)
  }, [sortOrder])
  useEffect(() => {
    localStorage.setItem('propositor.viewMode', viewMode)
  }, [viewMode])

  async function load() {
    try {
      const res = await fetch('/api/propositions', { cache: 'no-store' })
      if (!res.ok) throw new Error('Erreur ' + res.status)
      const data = (await res.json()) as PropositionWithMeta[]
      setItems(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur')
    }
  }

  useEffect(() => {
    load()
  }, [])

  function logout() {
    localStorage.removeItem('authToken')
    localStorage.removeItem('authUser')
    router.push('/admin/login')
  }

  async function copyLink(slug: string) {
    const url = `${window.location.origin}/propositions/${slug}`
    await navigator.clipboard.writeText(url)
    setCopiedSlug(slug)
    setTimeout(() => setCopiedSlug(null), 1800)
  }

  async function handleDelete(slug: string) {
    setDeleting(slug)
    try {
      const token = localStorage.getItem('authToken')
      const res = await fetch(`/api/propositions/${slug}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setConfirmSlug(null)
        await load()
      }
    } finally {
      setDeleting(null)
    }
  }

  // Dupliquer : recopie tout le doc original sauf slug/number/timestamps.
  // POST sans slug -> uniqueSlug() cote serveur (ex: "valentin-2")
  // POST sans number -> nextProposalNumber() cote serveur (ex: N°2026-11)
  async function handleDuplicate(slug: string) {
    setDuplicating(slug)
    setError(null)
    try {
      const token = localStorage.getItem('authToken')
      const getRes = await fetch(`/api/propositions/${slug}`, { cache: 'no-store' })
      if (!getRes.ok) throw new Error('Doc introuvable')
      const original = (await getRes.json()) as PropositionWithMeta
      const payload = {
        brand: original.brand,
        docType: original.docType,
        client: original.client,
        title: original.title,
        baseline: original.baseline,
        date: original.date,
        content: original.content,
        clientLogoUrl: original.clientLogoUrl,
      }
      const res = await fetch('/api/propositions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error ?? 'Erreur duplication')
      }
      const created = (await res.json()) as PropositionWithMeta
      router.push(`/admin/edit/${created.slug}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur duplication')
      setDuplicating(null)
    }
  }

  // Annees presentes dans les docs (date du doc en priorite, sinon createdAt)
  const availableYears = useMemo(() => {
    if (!items) return []
    const ys = new Set<number>()
    for (const p of items) {
      ys.add(parseDocDate(p.date, p.createdAt).year)
    }
    return Array.from(ys).sort((a, b) => b - a)
  }, [items])

  const filtered = useMemo(() => {
    if (!items) return null
    const q = search.trim().toLowerCase()
    const withMeta = items.map((p) => {
      const d = parseDocDate(p.date, p.createdAt)
      return { p, year: d.year, ts: d.ts }
    })
    const filteredList = withMeta.filter(({ p, year }) => {
      if (brandFilter !== 'all' && p.brand !== brandFilter) return false
      if (typeFilter !== 'all' && p.docType !== typeFilter) return false
      if (yearFilter !== 'all' && year !== yearFilter) return false
      if (!q) return true
      return (
        p.client.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q) ||
        (p.baseline ?? '').toLowerCase().includes(q) ||
        (p.number ?? '').toLowerCase().includes(q) ||
        (p.title ?? '').toLowerCase().includes(q)
      )
    })
    filteredList.sort((a, b) => (sortOrder === 'recent' ? b.ts - a.ts : a.ts - b.ts))
    return filteredList.map(({ p }) => p)
  }, [items, search, brandFilter, typeFilter, yearFilter, sortOrder])

  const totalCount = items?.length ?? 0
  const filteredCount = filtered?.length ?? 0

  const activeFiltersCount =
    (brandFilter !== 'all' ? 1 : 0) +
    (typeFilter !== 'all' ? 1 : 0) +
    (yearFilter !== 'all' ? 1 : 0) +
    (search.trim() ? 1 : 0)

  function resetFilters() {
    setSearch('')
    setBrandFilter('all')
    setTypeFilter('all')
    setYearFilter('all')
  }

  return (
    <div
      data-brand={brandFilter !== 'all' ? brandFilter : 'vbweb'}
      className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8"
    >
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease }}
        className="space-y-5"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
              Propositor
            </p>
            <h1 className="mt-1.5 font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              Mes documents
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href="/admin/new"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              <Plus className="size-4" />
              <span>Nouveau</span>
            </Link>
            <button
              type="button"
              onClick={logout}
              className="inline-flex size-10 items-center justify-center rounded-lg border border-border/60 bg-card text-foreground/80 transition-colors hover:bg-muted"
              aria-label="Déconnexion"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>

        {/* Recherche + tri */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher par client, n°, titre…"
              className="h-10 w-full rounded-lg border border-border/70 bg-background pl-9 pr-9 text-sm text-foreground outline-none transition-colors focus:border-primary/50 focus:ring-2 focus:ring-primary/15"
            />
            {search ? (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Effacer la recherche"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => setSortOrder((s) => (s === 'recent' ? 'oldest' : 'recent'))}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border/60 bg-card px-3 text-xs font-semibold text-foreground/85 transition-colors hover:bg-muted"
            title={sortOrder === 'recent' ? 'Plus récents en premier' : 'Plus anciens en premier'}
          >
            {sortOrder === 'recent' ? (
              <ArrowDownNarrowWide className="size-4" />
            ) : (
              <ArrowUpNarrowWide className="size-4" />
            )}
            <span>{sortOrder === 'recent' ? 'Récents' : 'Anciens'}</span>
          </button>

          {/* Toggle vue : Tableau / Cartes — meme rendu mobile et desktop */}
          <div className="inline-flex h-10 items-center gap-0.5 rounded-lg border border-border/60 bg-card p-1">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors ${
                viewMode === 'table'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Vue tableau"
              aria-pressed={viewMode === 'table'}
            >
              <List className="size-3.5" />
              <span className="hidden sm:inline">Tableau</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`inline-flex h-8 items-center gap-1.5 rounded-md px-2.5 text-xs font-semibold transition-colors ${
                viewMode === 'cards'
                  ? 'bg-muted text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Vue cartes"
              aria-pressed={viewMode === 'cards'}
            >
              <LayoutGrid className="size-3.5" />
              <span className="hidden sm:inline">Cartes</span>
            </button>
          </div>
        </div>

        {/* Filtres en 3 lignes : Marque / Type / Année */}
        <div className="space-y-3">
          <FilterRow label="Marque émettrice">
            <BrandPill
              active={brandFilter === 'all'}
              onClick={() => setBrandFilter('all')}
              label="Toutes"
              swatches={BRAND_LIST.map((b) => b.primary)}
            />
            {BRAND_LIST.map((b) => (
              <BrandPill
                key={b.id}
                active={brandFilter === b.id}
                onClick={() => setBrandFilter(b.id)}
                label={b.name}
                color={b.primary}
              />
            ))}
          </FilterRow>

          <FilterRow label="Type de document">
            {TYPE_FILTERS.map((f) => (
              <Pill
                key={f.value}
                active={typeFilter === f.value}
                onClick={() => setTypeFilter(f.value)}
                label={f.label}
              />
            ))}
          </FilterRow>

          {availableYears.length > 1 ? (
            <FilterRow label="Année">
              <Pill
                active={yearFilter === 'all'}
                onClick={() => setYearFilter('all')}
                label="Toutes"
              />
              {availableYears.map((y) => (
                <Pill
                  key={y}
                  active={yearFilter === y}
                  onClick={() => setYearFilter(y)}
                  label={String(y)}
                />
              ))}
            </FilterRow>
          ) : null}
        </div>

        {items ? (
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <p>
              {filteredCount === totalCount
                ? `${totalCount} document${totalCount > 1 ? 's' : ''}`
                : `${filteredCount} sur ${totalCount}`}
            </p>
            {activeFiltersCount > 0 ? (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-primary transition-colors hover:bg-primary/10"
              >
                <X className="size-3" />
                Réinitialiser les filtres
              </button>
            ) : null}
          </div>
        ) : null}
      </motion.header>

      {error ? (
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {/* Tableau (sm+) + liste cards (mobile) */}
      <div className="mt-6">
        {items === null && !error ? (
          <div className="h-24 animate-pulse rounded-xl bg-muted/40" />
        ) : filtered && filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/60 bg-card p-10 text-center">
            <p className="text-sm font-medium text-foreground">
              {totalCount === 0
                ? 'Aucun document pour le moment.'
                : 'Aucun résultat.'}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {totalCount === 0
                ? 'Crée ton premier doc en cliquant sur Nouveau.'
                : 'Essaie un autre filtre ou retire la recherche.'}
            </p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto rounded-xl border border-border/60 bg-card">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="border-b border-border/60 bg-muted/40 text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Marque</th>
                  <th className="px-2 py-3 text-left font-semibold">Type</th>
                  <th className="px-2 py-3 text-left font-semibold">N°</th>
                  <th className="px-2 py-3 text-left font-semibold">Client</th>
                  <th className="px-2 py-3 text-left font-semibold">Date</th>
                  <th className="px-2 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered?.map((p, i) => {
                  const b = getBrand(p.brand)
                  return (
                    <motion.tr
                      key={p.slug}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease, delay: 0.015 * i }}
                      className="group border-t border-border/40 transition-colors hover:bg-muted/30"
                    >
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center gap-2 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
                          style={{ background: b.primary }}
                        >
                          {b.name}
                        </span>
                      </td>
                      <td className="px-2 py-3">
                        <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          {p.docType === 'synthese' ? 'Synthèse' : 'Propal'}
                        </span>
                      </td>
                      <td className="px-2 py-3 font-mono text-xs text-foreground/80">
                        {p.number ?? '—'}
                      </td>
                      <td className="px-2 py-3">
                        <Link
                          href={`/admin/edit/${p.slug}`}
                          className="block min-w-0"
                        >
                          <p className="truncate font-medium text-foreground">
                            {p.client}
                          </p>
                          {p.baseline ? (
                            <p className="truncate text-xs text-muted-foreground">
                              {p.baseline}
                            </p>
                          ) : null}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-2 py-3 text-xs text-muted-foreground">
                        {p.date ?? '—'}
                      </td>
                      <td className="px-2 py-3">
                        {confirmSlug === p.slug ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="text-[11px] text-destructive">
                              Supprimer ?
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDelete(p.slug)}
                              disabled={deleting === p.slug}
                              className="rounded-md bg-destructive px-2 py-1 text-[11px] font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                            >
                              {deleting === p.slug ? '…' : 'OK'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmSlug(null)}
                              className="rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted"
                            >
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <RowActions
                            slug={p.slug}
                            brandColor={b.primary}
                            duplicating={duplicating === p.slug}
                            copied={copiedSlug === p.slug}
                            onDuplicate={() => handleDuplicate(p.slug)}
                            onCopy={() => copyLink(p.slug)}
                            onDelete={() => setConfirmSlug(p.slug)}
                          />
                        )}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Vue cartes — meme rendu sur mobile et desktop, grille adaptative */
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered?.map((p, i) => {
              const b = getBrand(p.brand)
              return (
                <motion.div
                  key={p.slug}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, ease, delay: 0.02 * i }}
                  className="flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 transition-shadow hover:shadow-sm"
                  style={{ boxShadow: `inset 4px 0 0 0 ${b.primary}` }}
                >
                  <Link href={`/admin/edit/${p.slug}`} className="block min-w-0 pl-2">
                    <div className="mb-2 flex flex-wrap items-center gap-1.5">
                      <span
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white"
                        style={{ background: b.primary }}
                      >
                        {b.name}
                      </span>
                      <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        {p.docType === 'synthese' ? 'Synthèse' : 'Propal'}
                      </span>
                      {p.number ? (
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {p.number}
                        </span>
                      ) : null}
                    </div>
                    <p className="truncate font-display text-base font-semibold text-foreground">
                      {p.client}
                    </p>
                    {p.baseline ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                        {p.baseline}
                      </p>
                    ) : null}
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {p.date ?? '—'}
                    </p>
                  </Link>

                  <div className="flex items-center justify-end gap-0.5 border-t border-border/40 pl-2 pt-2">
                    {confirmSlug === p.slug ? (
                      <div className="flex w-full items-center justify-between gap-1.5">
                        <span className="text-[11px] text-destructive">
                          Supprimer ?
                        </span>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleDelete(p.slug)}
                            disabled={deleting === p.slug}
                            className="rounded-md bg-destructive px-2 py-1 text-[11px] font-semibold text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
                          >
                            {deleting === p.slug ? '…' : 'OK'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmSlug(null)}
                            className="rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-muted"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <RowActions
                        slug={p.slug}
                        brandColor={b.primary}
                        duplicating={duplicating === p.slug}
                        copied={copiedSlug === p.slug}
                        onDuplicate={() => handleDuplicate(p.slug)}
                        onCopy={() => copyLink(p.slug)}
                        onDelete={() => setConfirmSlug(p.slug)}
                      />
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>

      <p className="mt-10 text-center text-xs text-muted-foreground">Propositor</p>
    </div>
  )
}

function RowActions({
  slug,
  brandColor,
  duplicating,
  copied,
  onDuplicate,
  onCopy,
  onDelete,
}: {
  slug: string
  brandColor: string
  duplicating: boolean
  copied: boolean
  onDuplicate: () => void
  onCopy: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex items-center justify-end gap-0.5">
      <Link
        href={`/admin/edit/${slug}`}
        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Éditer"
        title="Éditer"
      >
        <Pencil className="size-3.5" />
      </Link>
      <button
        type="button"
        onClick={onDuplicate}
        disabled={duplicating}
        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
        aria-label="Dupliquer"
        title="Dupliquer (nouveau N° automatique)"
      >
        <Files className="size-3.5" />
      </button>
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label="Copier le lien"
        title="Copier le lien"
      >
        <Copy className="size-3.5" />
      </button>
      <Link
        href={`/propositions/${slug}`}
        target="_blank"
        className="inline-flex size-8 items-center justify-center rounded-md text-white transition-colors hover:opacity-90"
        style={{ background: brandColor }}
        aria-label="Ouvrir"
        title="Ouvrir côté client"
      >
        <ExternalLink className="size-3.5" />
      </Link>
      <button
        type="button"
        onClick={onDelete}
        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        aria-label="Supprimer"
        title="Supprimer"
      >
        <Trash2 className="size-3.5" />
      </button>
      {copied ? (
        <span className="ml-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
          ✓
        </span>
      ) : null}
    </div>
  )
}

function FilterRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  )
}

function Pill({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? 'border-foreground/15 bg-foreground/5 text-foreground shadow-sm'
          : 'border-border/60 bg-card text-foreground/70 hover:bg-muted'
      }`}
    >
      {label}
    </button>
  )
}

function BrandPill({
  active,
  onClick,
  label,
  color,
  swatches,
}: {
  active: boolean
  onClick: () => void
  label: string
  color?: string
  swatches?: string[]
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
        active
          ? 'border-foreground/15 bg-foreground/5 text-foreground shadow-sm'
          : 'border-border/60 bg-card text-foreground/70 hover:bg-muted'
      }`}
    >
      {color ? (
        <span
          className="size-2.5 rounded-full ring-2 ring-white/40"
          style={{ background: color }}
        />
      ) : swatches ? (
        <span className="flex -space-x-1">
          {swatches.map((c) => (
            <span
              key={c}
              className="size-2.5 rounded-full ring-2 ring-background"
              style={{ background: c }}
            />
          ))}
        </span>
      ) : null}
      <span>{label}</span>
    </button>
  )
}
