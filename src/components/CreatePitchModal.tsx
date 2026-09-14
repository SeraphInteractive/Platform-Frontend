import React, { useState } from 'react';
import { useSubmitEntry } from '../hooks/useVotingApi.ts';
import { useAuth } from '../context/AuthContext.tsx';

interface CreatePitchModalProps {
  isOpen: boolean;
  roundId: string;
  onClose: () => void;
  onCreated?: (entryId: string) => void;
}

export const CreatePitchModal: React.FC<CreatePitchModalProps> = ({
  isOpen,
  roundId,
  onClose,
  onCreated,
}) => {
  const { isBarred } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submitMutation = useSubmitEntry(roundId);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBarred) {
      setError('Your account is barred from submitting scene pitches.');
      return;
    }
    if (!title.trim()) {
      setError('Pitch title is required.');
      return;
    }
    if (!description.trim()) {
      setError('Pitch description is required.');
      return;
    }

    try {
      const created = await submitMutation.mutateAsync({
        title: title.trim(),
        description: description.trim(),
      });
      setTitle('');
      setDescription('');
      setError(null);
      onClose();
      if (onCreated && created?.id) {
        onCreated(created.id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit pitch');
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 20,
      }}
      onClick={onClose}
    >
      <div
        className="white-card"
        style={{
          maxWidth: 520,
          width: '100%',
          boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header" style={{ marginBottom: 12 }}>
          <div>
            <div className="card-title" style={{ fontSize: '16px' }}>
              Submit Proposal
            </div>
            <div className="card-desc">
              Submit a proposal for the active round.
            </div>
          </div>
          <button
            className="icon-btn"
            style={{ width: 30, height: 30 }}
            onClick={onClose}
            title="Close modal"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {isBarred && (
          <div className="callout callout-danger" style={{ marginBottom: 14 }}>
            Account barred: Your account has accumulated 3 warnings and cannot submit proposals.
          </div>
        )}

        {error && (
          <div className="callout callout-danger" style={{ marginBottom: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
              Proposal Title
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Enter proposal title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isBarred}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
              Proposal Description
            </label>
            <textarea
              className="input-field"
              rows={4}
              placeholder="Enter synopsis, narrative structure, and implementation details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isBarred}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitMutation.isPending || isBarred}
            >
              {isBarred ? 'Account Barred' : submitMutation.isPending ? 'Submitting...' : 'Submit Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
