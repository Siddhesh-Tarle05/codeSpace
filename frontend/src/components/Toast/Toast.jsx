import './Toast.css'

export default function Toast({ msg, type }) {
  return (
    <div className={`toast ${type}`} role="status" aria-live="polite">
      {msg}
    </div>
  )
}
