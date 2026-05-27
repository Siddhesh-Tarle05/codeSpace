import { useEffect } from 'react'
import Header from '../../components/Header/Header'
import FileTree from '../../components/FileTree/FileTree'
import ChatPanel from '../../components/ChatPanel/ChatPanel'
import PreviewPanel from '../../components/PreviewPanel/PreviewPanel'
import './Workspace.css'

export default function Workspace({ sandbox, onExit, showToast }) {
  const { sandboxId, previewUrl } = sandbox

  // Prevent accidental navigation away
  useEffect(() => {
    const onBeforeUnload = (e) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  return (
    <div className="workspace">
      <Header
        sandboxId={sandboxId}
        previewUrl={previewUrl}
        onExit={onExit}
        showToast={showToast}
      />

      <div className="workspace-body">
        <FileTree sandboxId={sandboxId} showToast={showToast} />
        <ChatPanel sandboxId={sandboxId} showToast={showToast} />
        <PreviewPanel previewUrl={previewUrl} showToast={showToast} />
      </div>
    </div>
  )
}
