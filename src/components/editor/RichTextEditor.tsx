import { useEffect, useRef } from 'react'

type Props = {
  value: string
  onChange: (html: string) => void
  className?: string
}

// Editor sencillo basado en contentEditable + execCommand (soporte básico)
export default function RichTextEditor({ value, onChange, className }: Props) {
  const ref = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== value) {
      ref.current.innerHTML = value || ''
    }
  }, [value])

  function handleInput() {
    if (ref.current) onChange(ref.current.innerHTML)
  }

  function cmd(command: string, arg?: any) {
    document.execCommand(command, false, arg)
    handleInput()
  }

  function addLink() {
    const url = prompt('URL del enlace:')
    if (url) cmd('createLink', url)
  }

  function addImage() {
    const url = prompt('URL de la imagen:')
    if (url) cmd('insertImage', url)
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-1 mb-2">
        <button type="button" onClick={() => cmd('bold')} className="px-2 py-1 border rounded">B</button>
        <button type="button" onClick={() => cmd('italic')} className="px-2 py-1 border rounded italic">I</button>
        <button type="button" onClick={() => cmd('underline')} className="px-2 py-1 border rounded underline">U</button>
        <button type="button" onClick={() => cmd('formatBlock', '<h2>')} className="px-2 py-1 border rounded">H2</button>
        <button type="button" onClick={() => cmd('formatBlock', '<h3>')} className="px-2 py-1 border rounded">H3</button>
        <button type="button" onClick={() => cmd('insertUnorderedList')} className="px-2 py-1 border rounded">• Lista</button>
        <button type="button" onClick={() => cmd('insertOrderedList')} className="px-2 py-1 border rounded">1. Lista</button>
        <button type="button" onClick={addLink} className="px-2 py-1 border rounded">Link</button>
        <button type="button" onClick={addImage} className="px-2 py-1 border rounded">Imagen</button>
        <button type="button" onClick={() => cmd('removeFormat')} className="px-2 py-1 border rounded">Limpiar</button>
      </div>
      <div
        ref={ref}
        className="min-h-40 border rounded-lg p-2 bg-white prose max-w-none"
        contentEditable
        onInput={handleInput}
        suppressContentEditableWarning
      />
    </div>
  )
}
