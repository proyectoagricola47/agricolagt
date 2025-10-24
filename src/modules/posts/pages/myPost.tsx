import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Post } from '../../../model/post'
import { listMyPosts, setPostStatus } from '../services/postService'

function formatDate(iso?: string) {
	if (!iso) return ''
	const d = new Date(iso)
	return d.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })
}

export default function MyPostsPage() {
	const navigate = useNavigate()
	const [query, setQuery] = useState('')
	const [status, setStatus] = useState<'all' | 'published' | 'draft'>('all')
	const [rows, setRows] = useState<Post[]>([])
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [updatingId, setUpdatingId] = useState<string | null>(null)

	useEffect(() => {
		let alive = true
		async function load() {
			try {
				setLoading(true)
				const items = await listMyPosts('all')
				if (!alive) return
				setRows(items)
			} catch (e: any) {
				console.error(e)
				if (alive) setError(e?.message || 'No se pudieron cargar tus publicaciones')
			} finally {
				if (alive) setLoading(false)
			}
		}
		load()
		return () => { alive = false }
	}, [])

	const filtered = useMemo(() => {
		const q = query.trim().toLowerCase()
		return rows.filter((r) => {
			const okStatus = status === 'all' ? true : r.status === status
			const source = (r.title + ' ' + (r.excerpt || '') + ' ' + (r.content || '')).toLowerCase()
			const okQuery = q ? source.includes(q) : true
			return okStatus && okQuery
		})
	}, [rows, query, status])

	async function togglePublish(id: string, current?: 'published' | 'draft') {
		const next: 'published' | 'draft' = current === 'published' ? 'draft' : 'published'
		try {
			setUpdatingId(id)
			await setPostStatus(id, next)
			setRows((prev) => prev.map((p) => (p.id === id ? { ...p, status: next } : p)))
		} catch (e: any) {
			console.error(e)
			alert(e?.message || 'No se pudo actualizar el estado')
		} finally {
			setUpdatingId(null)
		}
	}

	return (
		<div className="pb-16">
			<div className="flex items-center justify-between gap-3 mb-5">
				<h1 className="text-2xl font-bold">Mis Publicaciones</h1>
				<button
					onClick={() => navigate('/posts/new')}
					className="px-4 py-2 rounded-lg border border-primary-500 text-primary-700 hover:bg-primary-50 text-sm"
				>
					Nuevo post
				</button>
			</div>

			{/* Filtros */}
			<div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
				<div className="flex items-center gap-2 w-full sm:w-auto">
					<input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						type="search"
						placeholder="Buscar por título o contenido…"
						className="h-10 w-full sm:w-96 rounded-lg border border-gray-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
					/>
					<select
						value={status}
						onChange={(e) => setStatus(e.target.value as any)}
						className="h-10 rounded-lg border border-gray-300 px-3 text-sm bg-white"
					>
						<option value="all">Todos</option>
						<option value="published">Publicado</option>
						<option value="draft">Borrador</option>
					</select>
				</div>
			</div>

			{loading && (
				<div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-600">Cargando…</div>
			)}
			{error && (
				<div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
			)}

			{/* Grid de tarjetas */}
			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
				{filtered.map((p) => {
					const thumb = p.images?.[0] || 'https://source.unsplash.com/800x450/?farm,field'
					return (
						<article key={p.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
							<div className="aspect-[16/9] w-full overflow-hidden">
								<img src={thumb} alt={p.title} className="w-full h-full object-cover" />
							</div>
							<div className="p-4 flex flex-col gap-3 flex-1">
								<div className="flex items-center justify-between gap-2">
									<h3 className="font-semibold text-gray-900 leading-snug line-clamp-2">{p.title}</h3>
									{p.status === 'published' ? (
										<span className="shrink-0 inline-flex items-center px-2 py-0.5 text-[10px] rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Publicado</span>
									) : (
										<span className="shrink-0 inline-flex items-center px-2 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-700 border border-gray-200">Borrador</span>
									)}
								</div>
								<p className="text-sm text-gray-600 line-clamp-3 flex-1">{p.excerpt || 'Sin extracto.'}</p>
								<div className="text-xs text-gray-500">{formatDate(p.createdAt)}{p.commentsCount ? ` · ${p.commentsCount} comentarios` : ''}</div>
								<div className="flex flex-wrap items-center gap-2 pt-2">
									<button onClick={() => navigate(`/posts/${p.id}`)} className="px-3 py-1.5 rounded-md border text-sm">Ver</button>
									<button onClick={() => navigate('/posts/new')} className="px-3 py-1.5 rounded-md border border-primary-500 text-primary-700 text-sm">Editar</button>
									<button
										onClick={() => togglePublish(p.id, p.status)}
										disabled={updatingId === p.id}
										className="px-3 py-1.5 rounded-md border border-amber-500 text-amber-700 text-sm disabled:opacity-50"
									>
										{p.status === 'published' ? 'Despublicar' : 'Publicar'}
									</button>
								</div>
							</div>
						</article>
					)
				})}
			</div>

			{filtered.length === 0 && !loading && (
				<div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50/60 p-8 text-center text-sm text-gray-600">
					No hay publicaciones con esos filtros.
				</div>
			)}
		</div>
	)
}

