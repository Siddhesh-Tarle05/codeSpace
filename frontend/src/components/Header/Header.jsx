import './Header.css'

export default function Header({ sandboxId, previewUrl, onExit, showToast }) {
  const short = sandboxId ? sandboxId.slice(0, 8) + '…' : '—'

  function handleRefresh() {
    window.dispatchEvent(new CustomEvent('preview:refresh'))
    showToast('🔄 Preview refreshed')
  }

  function handleOpen() {
    if (previewUrl) window.open(previewUrl, '_blank')
  }

  return (
    <header className="ws-header">
      <div className="ws-logo">
        <span className="ws-logo-icon">⚡</span>
        CodeSpace
      </div>

      <div className="ws-divider" />

      <div className="sandbox-badge">
        <span className="status-dot" />
        <span className="sandbox-id">{short}</span>
      </div>

      <div className="ws-spacer" />

      <nav className="header-actions">
        <button className="header-btn" onClick={handleRefresh} title="Reload preview">
          <span>↺</span> Refresh Preview
        </button>
        <button className="header-btn" onClick={handleOpen} title="Open preview in new tab">
          <span>↗</span> Open
        </button>
        <button className="header-btn danger" onClick={onExit} title="Exit sandbox">
          <span>✕</span> Exit
        </button>
      </nav>
    </header>
  )
}
