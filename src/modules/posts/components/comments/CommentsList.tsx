export type Comment = {
  id: string
  author: string
  avatar: string
  date: string
  text: string
  canDelete?: boolean
}

type Props = {
  comments: Comment[]
  onDelete?: (id: string) => void
}

export default function CommentsList({ comments, onDelete }: Props) {
  if (!comments?.length) {
    return <p className="text-sm text-gray-500">Sé el primero en comentar.</p>
  }

  return (
    <ul className="mt-6 space-y-3">
      {comments.map((c, i) => (
        <li key={c.id || i} className={`bg-white rounded-xl border border-gray-200 p-4`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
            <img src={c.avatar} alt={c.author} className="w-10 h-10 rounded-full" />
            <div>
              <p className="font-medium">{c.author}</p>
              <p className="text-xs text-gray-500">{c.date}</p>
            </div>
            </div>
            {c.canDelete && onDelete && (
              <button
                onClick={() => onDelete(c.id)}
                className="text-xs px-2 py-1 rounded-md border border-red-300 text-red-700 hover:bg-red-50"
                title="Eliminar comentario"
              >Eliminar</button>
            )}
          </div>
          <p className="mt-3 text-gray-700 text-sm">{c.text}</p>
        </li>
      ))}
    </ul>
  )
}
