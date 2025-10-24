import { useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { cropsService } from '../services/cropsService'
import type { Crop, CropInput } from '../../../model/crop'
import CropForm from '../components/CropForm'

export default function CropUpsertPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [initial, setInitial] = useState<Crop | undefined>()

  useEffect(() => {
    let alive = true
    async function load() {
      if (!id) return
      try {
        const c = await cropsService.get(id)
        if (alive) setInitial(c)
      } catch (e) {
        console.error(e)
      }
    }
    load()
    return () => { alive = false }
  }, [id])

  async function handleSubmit(data: CropInput) {
    try {
      if (id && initial) {
        await cropsService.update(id, data)
      } else {
        await cropsService.create(data)
      }
      navigate('/crops')
    } catch (e) {
      console.error(e)
      alert('No se pudo guardar el cultivo')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="text-2xl font-bold">{id ? 'Editar cultivo' : 'Nuevo cultivo'}</h1>
      </div>

      <div className="rounded-xl border border-gray-200 p-4">
        <CropForm initial={initial} onSubmit={handleSubmit} onCancel={() => navigate('/crops')} />
      </div>
    </div>
  )
}
