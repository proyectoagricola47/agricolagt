import { useEffect, useMemo, useState } from 'react'
import { cropsService } from '../services/cropsService'
import type { Crop } from '../../../model/crop'
import CropCard from '../components/cropCard'
import { useNavigate } from 'react-router-dom'

export default function MyCropsPage() {
  const navigate = useNavigate()
  const [crops, setCrops] = useState<Crop[]>([])
  const [q, setQ] = useState('')

  useEffect(() => {
    let alive = true
    async function load() {
      try {
        const rows = await cropsService.list()
        if (alive) setCrops(rows)
      } catch (e) {
        console.error(e)
      }
    }
    load()
    return () => { alive = false }
  }, [])

  const filtered = useMemo(() => {
    const query = q.toLowerCase()
    return crops.filter(c =>
      [c.name, c.speciesName, c.type, c.location].some(v => (v || '').toLowerCase().includes(query))
    )
  }, [crops, q])

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar cultivo?')) return
    try {
      await cropsService.remove(id)
      const rows = await cropsService.list()
      setCrops(rows)
    } catch (e) {
      console.error(e)
      alert('No se pudo eliminar el cultivo')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">Mis Cultivos</h1>
        <button className="px-3 py-2 rounded-lg border border-primary-500 text-primary-700 hover:bg-primary-50 text-sm" onClick={() => navigate('/crops/new')}>Nuevo cultivo</button>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, especie..." className="h-10 flex-1 rounded-lg border border-gray-300 px-3 text-sm" />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center text-gray-500">
          Aún no tienes cultivos. Crea el primero para llevar seguimiento.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
          {filtered.map(c => (
            <CropCard key={c.id} crop={c} onEdit={(id) => navigate(`/crops/${id}/edit`)} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  )
}
