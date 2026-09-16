import React, { useState, useRef } from 'react';
import { useSubmitEntry } from '../hooks/useVotingApi.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { sounds } from '../utils/soundEffects.ts';

interface CreatePitchModalProps {
  isOpen: boolean;
  roundId: string;
  onClose: () => void;
  onCreated?: (entryId: string) => void;
}

const MAX_CHAR_LIMIT = 1500; // approx 256 words
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export const CreatePitchModal: React.FC<CreatePitchModalProps> = ({
  isOpen,
  roundId,
  onClose,
  onCreated,
}) => {
  const { isBarred } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const submitMutation = useSubmitEntry(roundId);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      setError('File exceeds maximum size of 5 MB.');
      sounds.playReset();
      return;
    }

    sounds.playPop();
    setError(null);
    setMediaFile(file);
    setIsVideo(file.type.startsWith('video/'));
    setMediaPreview(URL.createObjectURL(file));
  };

  const handleRemoveMedia = () => {
    sounds.playReset();
    setMediaFile(null);
    setMediaPreview(null);
    setIsVideo(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roundId) {
      setError('No active round found in database. Please wait for an active round to be created.');
      return;
    }
    if (isBarred) {
      setError('Account barred from submitting scene proposals.');
      return;
    }
    if (!title.trim()) {
      setError('Proposal title is required.');
      return;
    }
    if (!description.trim()) {
      setError('Proposal description is required.');
      return;
    }
    if (description.length > MAX_CHAR_LIMIT) {
      setError(`Description exceeds character limit of ${MAX_CHAR_LIMIT}.`);
      return;
    }

    setIsUploading(true);
    let uploadedMediaUrl: string | undefined = undefined;

    try {
      // If a media file was attached, upload it first
      if (mediaFile) {
        const formData = new FormData();
        formData.append('file', mediaFile);
        
        try {
          const uploadRes = await fetch('/api/v1/uploads', {
            method: 'POST',
            body: formData,
            credentials: 'include',
          });
          if (uploadRes.ok) {
            const uploadData = await uploadRes.json();
            uploadedMediaUrl = uploadData.data?.url;
          }
        } catch {
          // Fallback to local object preview if upload endpoint is unreachable
          uploadedMediaUrl = mediaPreview || undefined;
        }
      }

      const created = await submitMutation.mutateAsync({
        title: title.trim(),
        description: description.trim(),
        mediaUrl: uploadedMediaUrl,
      });

      sounds.playLevelUp();
      setTitle('');
      setDescription('');
      setMediaFile(null);
      setMediaPreview(null);
      setError(null);
      onClose();

      if (onCreated && created?.id) {
        onCreated(created.id);
      }
    } catch (err: unknown) {
      sounds.playReset();
      setError(err instanceof Error ? err.message : 'Failed to submit proposal');
    } finally {
      setIsUploading(false);
    }
  };

  const charCount = description.length;
  const wordCount = description.trim() ? description.trim().split(/\s+/).length : 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(9, 13, 22, 0.65)',
        backdropFilter: 'blur(8px)',
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
          maxWidth: 560,
          width: '100%',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
          padding: '28px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="card-header" style={{ marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-green)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
              Creator Intake
            </div>
            <div className="card-title" style={{ fontSize: '18px', fontWeight: 900 }}>
              Proposal
            </div>
          </div>
          <button
            className="icon-btn"
            style={{ width: 30, height: 30 }}
            onClick={() => {
              sounds.playReset();
              onClose();
            }}
            title="Close modal"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Review notice callout */}
        <div
          className="white-card"
          style={{
            marginBottom: 16,
            padding: '12px 16px',
            background: 'var(--bg-card-muted)',
            borderRadius: '10px',
            fontSize: '12px',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}
        >
          <strong style={{ color: 'var(--text-main)' }}>Supervisor Review Queue:</strong> New proposals undergo review at the Supervisor Desk before entering the active voting pool.
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

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Title input */}
          <div className="form-group">
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>
              Proposal Title
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Enter a concise, evocative title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isBarred || isUploading}
              autoFocus
            />
          </div>

          {/* Description input with 256 word counter */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>
                Description (Max 256 Words)
              </label>
              <span
                className="mono"
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: charCount > MAX_CHAR_LIMIT ? 'var(--color-danger)' : 'var(--text-light)',
                }}
              >
                {wordCount} / 256 words ({charCount}/{MAX_CHAR_LIMIT} chars)
              </span>
            </div>
            <textarea
              className="input-field"
              rows={4}
              placeholder="Describe your scene synopsis, narrative conflict, or visual concept in under 256 words..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isBarred || isUploading}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Media attachment (Image or Video max 5MB) */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>
                Media Attachment (Max 5 MB)
              </label>
              {mediaPreview && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '2px 8px', fontSize: '11px' }}
                  onClick={handleRemoveMedia}
                >
                  Remove Media
                </button>
              )}
            </div>

            {mediaPreview ? (
              <div
                style={{
                  width: '100%',
                  maxHeight: 180,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  background: 'var(--bg-card-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isVideo ? (
                  <video src={mediaPreview} controls style={{ width: '100%', maxHeight: 180, objectFit: 'cover' }} />
                ) : (
                  <img src={mediaPreview} alt="Upload preview" style={{ width: '100%', maxHeight: 180, objectFit: 'cover' }} />
                )}
              </div>
            ) : (
              <div
                style={{
                  borderRadius: '12px',
                  padding: '20px',
                  textAlign: 'center',
                  background: 'var(--bg-card-muted)',
                  cursor: 'pointer',
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/mp4,video/webm"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  disabled={isBarred || isUploading}
                />
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', marginBottom: 2 }}>
                  Click to upload image or video
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  PNG, JPG, GIF, MP4, WebM (Max 5 MB)
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                sounds.playReset();
                onClose();
              }}
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitMutation.isPending || isUploading || isBarred || charCount > MAX_CHAR_LIMIT}
              style={{ padding: '10px 24px' }}
            >
              {isBarred ? 'Restricted' : isUploading || submitMutation.isPending ? 'Submitting...' : 'Submit Proposal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
