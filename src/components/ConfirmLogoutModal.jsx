function ConfirmLogoutModal({ onConfirm, onCancel, isProcessing, error }) {
  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card">
        <div className="modal-header">
          <div>
            <p className="modal-eyebrow">Sign out</p>
            <h2>Confirm sign out</h2>
            <p className="modal-subtitle">You will need to sign in again to access hospital data.</p>
          </div>

          <button type="button" className="close-btn" onClick={onCancel} aria-label="Close">
            x
          </button>
        </div>

        <div className="modal-body">
          <p>Are you sure you want to sign out of your account?</p>

          {error ? (
            <div className="form-message error-text" role="alert">
              {error}
            </div>
          ) : null}
        </div>

        <div className="modal-footer">
          <button type="button" className="action-btn ghost" onClick={onCancel} disabled={isProcessing}>
            Cancel
          </button>

          <button type="button" className="action-btn danger" onClick={onConfirm} disabled={isProcessing}>
            {isProcessing ? 'Signing out...' : 'Sign out'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmLogoutModal
