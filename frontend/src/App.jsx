import { useState, useCallback } from 'react'
import Landing from './pages/Landing/Landing'
import Workspace from './pages/Workspace/Workspace'
import Toast from './components/Toast/Toast'

export default function App() {
  const [sandbox, setSandbox] = useState(null)   // { sandboxId, previewUrl }
  const [toast, setToast]     = useState(null)   // { msg, type }

  const showToast = useCallback((msg, type = '') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
  }, [])

  const handleSandboxCreated = useCallback((data) => {
    setSandbox(data)
  }, [])

  const handleExit = useCallback(() => {
    setSandbox(null)
  }, [])

  return (
    <>
      {!sandbox ? (
        <Landing onSandboxCreated={handleSandboxCreated} showToast={showToast} />
      ) : (
        <Workspace sandbox={sandbox} onExit={handleExit} showToast={showToast} />
      )}
      {toast && <Toast msg={toast.msg} type={toast.type} />}
    </>
  )
}
