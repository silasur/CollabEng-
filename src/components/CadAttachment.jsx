import { lazy, Suspense, useId, useRef, useState } from 'react'
import { useWorkspace } from './WorkspaceData'

const CadPreview = lazy(() => import('./CadPreview'))
const previewPattern = /\.(step|stp|iges|igs|stl|obj)$/i

export default function CadAttachment({ attachment }) {
  const { files } = useWorkspace()
  const record = attachment.fileId ? files.find(({ id }) => id === attachment.fileId) : null
  const file = attachment.fileId ? record?.file : attachment
  const name = record?.name ?? attachment.name
  const dialog = useRef(null)
  const headingId = useId()
  const [open, setOpen] = useState(false)
  if (!file || !previewPattern.test(file.name)) return null

  return (
    <>
      <button className="nb-secondary nb-cad-open" type="button" onClick={() => {
        dialog.current.showModal()
        setOpen(true)
      }}>Preview 3D</button>
      <dialog ref={dialog} className="nb-tool-dialog nb-cad-dialog" aria-labelledby={headingId}
        onClose={() => setOpen(false)}>
        <header className="nb-tool-heading">
          <h2 id={headingId}>3D model preview</h2>
          <button type="button" onClick={() => dialog.current.close()} aria-label="Close 3D preview">×</button>
        </header>
        {open && <Suspense fallback={<p role="status">Loading 3D viewer…</p>}>
          <CadPreview file={file} name={name} />
        </Suspense>}
      </dialog>
    </>
  )
}
