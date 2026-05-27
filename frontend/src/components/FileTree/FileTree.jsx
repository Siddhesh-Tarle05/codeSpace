import { useState, useEffect, useCallback } from 'react'
import './FileTree.css'

const FILE_ICONS = {
  jsx: '⚛', tsx: '⚛', js: '🟨', ts: '🔷',
  css: '🎨', html: '🌐', json: '📦',
  md: '📝', svg: '🖼', png: '🖼', jpg: '🖼', gif: '🖼',
  dockerfile: '🐳', env: '⚙',
}

function getIcon(name) {
  const ext = name.split('.').pop().toLowerCase()
  return FILE_ICONS[ext] || FILE_ICONS[name.toLowerCase()] || '📄'
}

function buildTree(paths) {
  const root = {}
  for (const p of paths) {
    const parts = p.replace(/\\/g, '/').split('/')
    let node = root
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i]
      if (i === parts.length - 1) {
        if (!(part in node)) node[part] = null
      } else {
        if (!node[part] || node[part] === null) node[part] = {}
        node = node[part]
      }
    }
  }
  return root
}

function TreeFolder({ name, children, prefix }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="tree-folder-wrap">
      <div
        className="tree-folder"
        role="button"
        tabIndex={0}
        onClick={() => setOpen(o => !o)}
        onKeyDown={e => e.key === 'Enter' && setOpen(o => !o)}
      >
        <span className="folder-chevron">{open ? '▾' : '▸'}</span>
        <span className="folder-icon">📁</span>
        <span className="folder-name">{name}</span>
      </div>
      {open && (
        <div className="tree-children">
          <TreeNodes node={children} prefix={prefix} />
        </div>
      )}
    </div>
  )
}

function TreeFile({ name, path, active, onClick }) {
  return (
    <div
      className={`tree-file ${active ? 'active' : ''}`}
      role="button"
      tabIndex={0}
      title={path}
      onClick={() => onClick(path)}
      onKeyDown={e => e.key === 'Enter' && onClick(path)}
    >
      <span className="file-icon">{getIcon(name)}</span>
      <span className="file-name">{name}</span>
    </div>
  )
}

function TreeNodes({ node, prefix, activeFile, onFileClick }) {
  const entries = Object.entries(node).sort(([a, av], [b, bv]) => {
    const aIsDir = av !== null
    const bIsDir = bv !== null
    if (aIsDir !== bIsDir) return aIsDir ? -1 : 1
    return a.localeCompare(b)
  })

  return entries.map(([name, child]) => {
    const fullPath = prefix ? `${prefix}/${name}` : name
    if (child === null) {
      return (
        <TreeFile
          key={fullPath}
          name={name}
          path={fullPath}
          active={activeFile === fullPath}
          onClick={onFileClick}
        />
      )
    }
    return (
      <TreeFolder key={fullPath} name={name} children={child} prefix={fullPath} />
    )
  })
}

export default function FileTree({ sandboxId, showToast }) {
  const [files, setFiles]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [activeFile, setActiveFile] = useState(null)

  const agentBase = `http://${sandboxId}.agent.localhost`

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`${agentBase}/list-files`)
      const data = await res.json()
      setFiles(data.files || [])
    } catch {
      showToast('⚠ Could not load files', 'error')
    } finally {
      setLoading(false)
    }
  }, [agentBase, showToast])

  useEffect(() => { load() }, [load])

  // Listen for AI updates to refresh tree
  useEffect(() => {
    const handler = () => load()
    window.addEventListener('filetree:refresh', handler)
    return () => window.removeEventListener('filetree:refresh', handler)
  }, [load])

  const tree = buildTree(files)

  return (
    <aside className="file-tree-panel">
      <div className="panel-header">
        Explorer
        <div className="panel-actions">
          <button className="icon-btn" onClick={load} title="Refresh">↺</button>
        </div>
      </div>

      <div className="file-tree-scroll">
        {loading ? (
          <div className="tree-state">
            <span className="spinner" style={{ width: 14, height: 14 }} />
            <span>Loading…</span>
          </div>
        ) : files.length === 0 ? (
          <div className="tree-state">No files found</div>
        ) : (
          <div className="tree-root">
            <TreeNodes
              node={tree}
              prefix=""
              activeFile={activeFile}
              onFileClick={setActiveFile}
            />
          </div>
        )}
      </div>
    </aside>
  )
}
