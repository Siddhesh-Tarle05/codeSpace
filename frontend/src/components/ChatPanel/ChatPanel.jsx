import { useState, useRef, useEffect, useCallback } from 'react'
import './ChatPanel.css'

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function TypingIndicator() {
  return (
    <div className="typing-indicator">
      <span className="t-dot" /><span className="t-dot" /><span className="t-dot" />
    </div>
  )
}

function Message({ role, text, streaming }) {
  return (
    <div className={`msg msg-${role}`}>
      <div className="msg-role">
        <span className="msg-role-dot" />
        {role === 'user' ? 'You' : '🤖 FrontendForge'}
      </div>
      <div className={`msg-bubble ${streaming ? 'streaming' : ''}`}>
        {streaming && !text ? <TypingIndicator /> : text}
        {streaming && text && <span className="cursor-blink" />}
      </div>
    </div>
  )
}

export default function ChatPanel({ sandboxId, showToast }) {
  const [messages,   setMessages]   = useState([])
  const [input,      setInput]      = useState('')
  const [aiWorking,  setAiWorking]  = useState(false)
  const [status,     setStatus]     = useState('')
  const msgsEndRef = useRef(null)
  const textareaRef = useRef(null)

  const scrollBottom = () => msgsEndRef.current?.scrollIntoView({ behavior: 'smooth' })

  useEffect(() => { scrollBottom() }, [messages])

  const sendMessage = useCallback(async () => {
    const msg = input.trim()
    if (!msg || aiWorking) return

    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    // Add user message
    setMessages(prev => [...prev, { role: 'user', text: msg }])

    // Add streaming AI placeholder
    const aiIdx = Date.now()
    setMessages(prev => [...prev, { role: 'ai', text: '', streaming: true, id: aiIdx }])
    setAiWorking(true)
    setStatus('🤖 FrontendForge is thinking…')

    try {
      const res = await fetch('/api/ai/invoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, projectId: sandboxId }),
      })

      if (!res.ok) throw new Error(`Server error ${res.status}`)

      const reader  = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let full   = ''

      setStatus('✍️ Writing code…')

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop()

        for (const line of lines) {
          if (!line.trim()) continue
          let chunk = line.startsWith('data: ') ? line.slice(6) : line
          if (chunk === '[DONE]') continue
          full += chunk

          setMessages(prev =>
            prev.map(m =>
              m.id === aiIdx ? { ...m, text: full } : m
            )
          )
        }
      }

      // Flush remaining buffer
      if (buffer.trim() && buffer !== '[DONE]') {
        const chunk = buffer.startsWith('data: ') ? buffer.slice(6) : buffer
        if (chunk !== '[DONE]') {
          full += chunk
          setMessages(prev =>
            prev.map(m => m.id === aiIdx ? { ...m, text: full } : m)
          )
        }
      }

      // Mark streaming done
      setMessages(prev =>
        prev.map(m => m.id === aiIdx ? { ...m, streaming: false } : m)
      )

      setStatus('✅ Refreshing preview…')

      // Trigger file tree + preview refresh
      window.dispatchEvent(new CustomEvent('filetree:refresh'))
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('preview:refresh'))
        showToast('✅ AI updated your project!', 'success')
        setStatus('')
      }, 1500)

    } catch (err) {
      setMessages(prev =>
        prev.map(m => m.id === aiIdx
          ? { ...m, text: '⚠️ ' + err.message, streaming: false }
          : m
        )
      )
      setStatus('')
      showToast('❌ AI request failed', 'error')
    } finally {
      setAiWorking(false)
    }
  }, [input, aiWorking, sandboxId, showToast])

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  function handleInput(e) {
    setInput(e.target.value)
    const ta = e.target
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 130) + 'px'
  }

  return (
    <section className="chat-panel">
      <div className="panel-header">
        AI Assistant — FrontendForge
      </div>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-welcome">
            <div className="welcome-icon">🤖</div>
            <h3>FrontendForge is ready</h3>
            <p>
              Describe the frontend you want to build. The AI will
              write, update and preview your code live.
            </p>
            <div className="welcome-suggestions">
              {[
                'Build a dark theme landing page',
                'Add a pricing section with 3 tiers',
                'Make the hero section more vibrant',
              ].map(s => (
                <button
                  key={s}
                  className="suggestion-chip"
                  onClick={() => { setInput(s); textareaRef.current?.focus() }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <Message key={m.id ?? i} role={m.role} text={m.text} streaming={m.streaming} />
        ))}
        <div ref={msgsEndRef} />
      </div>

      {status && (
        <div className="ai-status-bar">
          <span className="spinner" style={{ width: 10, height: 10 }} />
          {status}
        </div>
      )}

      <div className="chat-input-area">
        <div className={`chat-input-wrap ${aiWorking ? 'disabled' : ''}`}>
          <textarea
            ref={textareaRef}
            id="chat-input"
            rows={1}
            placeholder="e.g. Build a dark landing page with animated hero…"
            value={input}
            onChange={handleInput}
            onKeyDown={handleKey}
            disabled={aiWorking}
          />
          <button
            id="send-btn"
            className="send-btn"
            onClick={sendMessage}
            disabled={aiWorking || !input.trim()}
            title="Send (Enter)"
            aria-label="Send message"
          >
            ➤
          </button>
        </div>
        <p className="input-hint">Enter to send · Shift+Enter for new line</p>
      </div>
    </section>
  )
}
