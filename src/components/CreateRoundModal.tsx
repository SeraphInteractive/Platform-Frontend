import React, { useState } from 'react';
import { useCreateRound } from '../hooks/useVotingApi.ts';
import { useAuth, isStaff } from '../context/AuthContext.tsx';

interface CreateRoundModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (roundId: string) => void;
}

export const CreateRoundModal: React.FC<CreateRoundModalProps> = ({
  isOpen,
  onClose,
  onCreated,
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Narrative');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'ACTIVE' | 'DRAFT'>('ACTIVE');
  const [error, setError] = useState<string | null>(null);

  const createRoundMutation = useCreateRound();

  if (!isOpen || !isStaff(user?.role)) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Round title is required.');
      return;
    }
    if (!description.trim()) {
      setError('Round description is required.');
      return;
    }

    try {
      const created = await createRoundMutation.mutateAsync({
        title: title.trim(),
        category: category.trim(),
        description: description.trim(),
        status,
      });
      setTitle('');
      setDescription('');
      setError(null);
      onClose();
      if (onCreated && created?.id) {
        onCreated(created.id);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create round');
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
        className="white-card modal-sheet-mobile modal-dialog-desktop"
        style={{
          maxWidth: 520,
          width: '100%',
          boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.15)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-drag-pill" />
        <div className="card-header" style={{ marginBottom: 12 }}>
          <div>
            <div className="card-title" style={{ fontSize: '16px' }}>
              Create Round
            </div>
            <div className="card-desc">
              Form and configure a new community voting round.
            </div>
          </div>
          <button
            className="icon-btn modal-close-btn"
            onClick={onClose}
            title="Close modal"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="callout callout-danger" style={{ marginBottom: 14 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="form-group">
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
              Round Title
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Round 3: Worldbuilding & Locations"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
                Creative Track
              </label>
              <select
                className="select-field"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="Story">Story & Narrative</option>
                <option value="Art">Art & Style</option>
                <option value="Builds">Builds & Sets</option>
                <option value="Audio">Audio & Voice</option>
                <option value="Animation">Animation & Scene</option>
                <option value="General">General Milestone</option>
              </select>
            </div>

            <div className="form-group">
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
                Initial Status
              </label>
              <select
                className="select-field"
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'DRAFT')}
              >
                <option value="ACTIVE">Active (Accepting Ballots)</option>
                <option value="DRAFT">Draft (Unpublished)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-main)' }}>
              Round Prompt & Description
            </label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Describe the objective and criteria for this voting round..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="modal-actions-stacked" style={{ marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createRoundMutation.isPending}
            >
              {createRoundMutation.isPending ? 'Creating Round...' : 'Publish Round'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
