import { useState, useEffect, useRef, useCallback } from 'react'
import './PreviewPanel.css'

export default function PreviewPanel({ previewUrl, showToast }) {
  const [loaded,  setLoaded]  = useState(false)
  const [loading, setLoading] = useState(false)
  const frameRef = useRef(null)

  // Initial load with delay for sandbox startup
  useEffect(() => {
    if (!previewUrl) return
    setLoading(true)
    const t = setTimeout(() => {
      if (frameRef.current) {
        frameRef.current.src = previewUrl
      }
    }, 2000)
    return () => clearTimeout(t)
  }, [previewUrl])

  const refresh = useCallback(() => {
    if (!frameRef.current || !previewUrl) return
    setLoaded(false)
    setLoading(true)
    frameRef.current.src = ''
    setTimeout(() => {
      if (frameRef.current) frameRef.current.src = previewUrl
    }, 120)
  }, [previewUrl])

  // Listen for refresh events from Header / ChatPanel
  useEffect(() => {
    window.addEventListener('preview:refresh', refresh)
    return () => window.removeEventListener('preview:refresh', refresh)
  }, [refresh])

  function handleLoad() {
    setLoaded(true)
    setLoading(false)
  }

  function openExternal() {
    if (previewUrl) window.open(previewUrl, '_blank')
  }

  return (
    <section className="preview-panel">
      {/* Toolbar */}
      <div className="preview-toolbar">
        <div className="preview-url-bar">
          <span className={`preview-dot ${loading ? 'loading' : loaded ? 'ready' : ''}`} />
          <span className="preview-url-text">{previewUrl ?? 'No sandbox active'}</span>
        </div>
        <button className="icon-btn" onClick={refresh}       title="Reload preview">↺</button>
        <button className="icon-btn" onClick={openExternal}  title="Open in new tab">↗</button>
      </div>

      {/* Frame area */}
      <div className="preview-frame-wrap">
        {/* Placeholder shown before sandbox loads */}
        {!loaded && (
          <div className="preview-placeholder">
            {loading ? (
              <>
                <span className="spinner preview-spinner" />
                <p>Starting sandbox preview…</p>
                <span className="preview-url-hint">{previewUrl}</span>
              </>
            ) : (
              <>
                <div className="placeholder-icon">🖥️</div>
                <p>Preview will appear here</p>
              </>
            )}
          </div>
        )}

        <iframe
          ref={frameRef}
          className={`preview-frame ${loaded ? 'visible' : ''}`}
          onLoad={handleLoad}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
          title="Sandbox Preview"
        />
      </div>
    </section>
  )
}
