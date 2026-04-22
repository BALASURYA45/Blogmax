import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

type RevisionSummary = {
  _id: string;
  reason: 'autosave' | 'manual' | 'restore';
  createdAt: string;
  snapshotHash: string;
  title: string;
  status: 'draft' | 'published';
};

type RevisionFull = RevisionSummary & {
  content: string;
  excerpt?: string;
  tags?: string[];
  featuredImage?: string;
  category?: any;
};

type Props = {
  open: boolean;
  onClose: () => void;
  postId: string | null;
  currentTitle: string;
  currentContent: string;
  onRestored?: () => void;
};

const stripHtml = (html: string) => {
  try {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
  } catch {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
};

type DiffChunk = { type: 'same' | 'added' | 'removed'; text: string };

const diffWords = (fromText: string, toText: string): DiffChunk[] => {
  const a = fromText.split(/\s+/).filter(Boolean);
  const b = toText.split(/\s+/).filter(Boolean);

  // LCS dynamic programming (good enough for short/medium text excerpts).
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => Array(b.length + 1).fill(0));
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const chunks: DiffChunk[] = [];
  const push = (type: DiffChunk['type'], word: string) => {
    const last = chunks[chunks.length - 1];
    if (last && last.type === type) last.text += ` ${word}`;
    else chunks.push({ type, text: word });
  };

  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      push('same', a[i]);
      i++;
      j++;
      continue;
    }
    if (dp[i + 1][j] >= dp[i][j + 1]) {
      push('removed', a[i]);
      i++;
    } else {
      push('added', b[j]);
      j++;
    }
  }
  while (i < a.length) {
    push('removed', a[i]);
    i++;
  }
  while (j < b.length) {
    push('added', b[j]);
    j++;
  }

  return chunks;
};

const RevisionHistoryModal = ({ open, onClose, postId, currentTitle, currentContent, onRestored }: Props) => {
  const [revisions, setRevisions] = useState<RevisionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedRevision, setSelectedRevision] = useState<RevisionFull | null>(null);
  const [view, setView] = useState<'details' | 'compare'>('details');
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const canLoad = open && !!postId;

  useEffect(() => {
    if (!canLoad) return;
    const run = async () => {
      try {
        setError(null);
        setLoading(true);
        const res = await api.get(`/posts/${postId}/revisions`);
        setRevisions(res.data || []);
        setSelectedId(null);
        setSelectedRevision(null);
        setView('details');
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load revisions');
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [canLoad, postId]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const loadRevision = async (revId: string) => {
    if (!postId) return;
    try {
      setError(null);
      setSelectedId(revId);
      setSelectedRevision(null);
      const res = await api.get(`/posts/${postId}/revisions/${revId}`);
      setSelectedRevision(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to load revision');
    }
  };

  const onRestore = async () => {
    if (!postId || !selectedRevision?._id) return;
    if (!window.confirm('Restore this version? Your current server version will be overwritten (and saved into history).')) return;
    try {
      setError(null);
      setRestoring(true);
      await api.post(`/posts/${postId}/revisions/${selectedRevision._id}/restore`);
      onRestored?.();
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to restore revision');
    } finally {
      setRestoring(false);
    }
  };

  const compareChunks = useMemo(() => {
    if (!selectedRevision) return null;
    const current = stripHtml(currentContent || '');
    const selected = stripHtml(selectedRevision.content || '');
    return diffWords(selected, current); // selected -> current
  }, [currentContent, selectedRevision]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.55)',
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(1020px, 100%)',
          maxHeight: 'min(780px, 92vh)',
          borderRadius: '24px',
          border: '1px solid var(--border-color)',
          background: 'var(--surface-color)',
          color: 'var(--text-color)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.35)',
          overflow: 'hidden',
          display: 'grid',
          gridTemplateColumns: '360px 1fr'
        }}
      >
        <div style={{ borderRight: '1px solid var(--border-color)', padding: '18px 18px 12px 18px', overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
            <div style={{ fontSize: '16px', fontWeight: 800 }}>Version history</div>
            <button
              onClick={onClose}
              aria-label="Close"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '20px' }}
            >
              Ã—
            </button>
          </div>

          <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.4 }}>
            Choose a saved version to compare or restore. The current editor state is compared as plain text.
          </div>

          {error && (
            <div style={{ background: 'rgba(255,60,60,0.12)', border: '1px solid rgba(255,60,60,0.35)', padding: '10px 12px', borderRadius: '12px', marginBottom: '12px' }}>
              <div style={{ fontSize: '12px' }}>{error}</div>
            </div>
          )}

          {loading ? (
            <div style={{ color: 'var(--text-secondary)', padding: '8px 0' }}>Loading versions...</div>
          ) : revisions.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', padding: '8px 0' }}>No versions yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {revisions.map((r) => {
                const selected = r._id === selectedId;
                const label = r.reason === 'autosave' ? 'Auto-save' : r.reason === 'restore' ? 'Restore' : 'Manual';
                return (
                  <button
                    key={r._id}
                    onClick={() => loadRevision(r._id)}
                    style={{
                      textAlign: 'left',
                      background: selected ? 'rgba(110,86,255,0.12)' : 'rgba(255,255,255,0.03)',
                      border: selected ? '1px solid rgba(110,86,255,0.45)' : '1px solid var(--border-color)',
                      borderRadius: '16px',
                      padding: '12px 12px',
                      cursor: 'pointer',
                      color: 'var(--text-color)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ fontWeight: 800, fontSize: '13px', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.title || '(untitled)'}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {new Date(r.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ marginTop: '6px', display: 'flex', gap: '10px', fontSize: '11px', color: 'var(--text-secondary)' }}>
                      <span>{label}</span>
                      <span>â€¢</span>
                      <span>{r.status}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div style={{ padding: '18px', overflow: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '14px' }}>
            <div>
              <div style={{ fontSize: '18px', fontWeight: 900, marginBottom: '6px' }}>
                {selectedRevision ? selectedRevision.title : currentTitle || 'Select a version'}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {selectedRevision ? `Saved ${new Date(selectedRevision.createdAt).toLocaleString()}` : 'Pick a version from the left list.'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-secondary"
                disabled={!selectedRevision}
                onClick={() => setView('details')}
                style={{ padding: '10px 14px', fontSize: '12px' }}
              >
                Details
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={!selectedRevision}
                onClick={() => setView('compare')}
                style={{ padding: '10px 14px', fontSize: '12px' }}
              >
                Compare
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={!selectedRevision || restoring}
                onClick={onRestore}
                style={{ padding: '10px 14px', fontSize: '12px' }}
              >
                {restoring ? 'Restoring...' : 'Restore this version'}
              </button>
            </div>
          </div>

          {!selectedRevision ? (
            <div style={{ color: 'var(--text-secondary)', lineHeight: 1.6, paddingTop: '18px' }}>
              Select a version to see its details, compare it with the current editor text, or restore it.
            </div>
          ) : view === 'details' ? (
            <div style={{ display: 'grid', gap: '14px' }}>
              <div style={{ border: '1px solid var(--border-color)', borderRadius: '18px', padding: '14px', background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 800 }}>Metadata</div>
                <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', rowGap: '8px', columnGap: '12px', fontSize: '13px' }}>
                  <div style={{ color: 'var(--text-secondary)' }}>Reason</div>
                  <div>{selectedRevision.reason}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Status</div>
                  <div>{selectedRevision.status}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>Hash</div>
                  <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {selectedRevision.snapshotHash}
                  </div>
                </div>
              </div>

              <div style={{ border: '1px solid var(--border-color)', borderRadius: '18px', padding: '14px', background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 800 }}>Preview</div>
                <div style={{ fontSize: '13px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                  {stripHtml(selectedRevision.content).slice(0, 800) || '(empty)'}
                  {stripHtml(selectedRevision.content).length > 800 ? '...' : ''}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '18px', padding: '14px', background: 'rgba(255,255,255,0.03)' }}>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px', fontWeight: 800 }}>
                Compare selected â†’ current
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '10px' }}>
                <span style={{ background: 'rgba(110,255,160,0.16)', padding: '2px 8px', borderRadius: '999px', border: '1px solid rgba(110,255,160,0.35)', marginRight: '8px' }}>
                  added
                </span>
                <span style={{ background: 'rgba(255,110,110,0.16)', padding: '2px 8px', borderRadius: '999px', border: '1px solid rgba(255,110,110,0.35)' }}>
                  removed
                </span>
              </div>
              <div style={{ fontSize: '13px', lineHeight: 1.8, color: 'var(--text-color)' }}>
                {compareChunks?.map((c, idx) => {
                  const style =
                    c.type === 'added'
                      ? { background: 'rgba(110,255,160,0.14)', border: '1px solid rgba(110,255,160,0.28)' }
                      : c.type === 'removed'
                      ? { background: 'rgba(255,110,110,0.14)', border: '1px solid rgba(255,110,110,0.28)', textDecoration: 'line-through' as const }
                      : { background: 'transparent', border: '1px solid transparent' };
                  return (
                    <span
                      key={idx}
                      style={{
                        ...style,
                        padding: '2px 6px',
                        borderRadius: '8px',
                        marginRight: '6px',
                        display: 'inline-block'
                      }}
                    >
                      {c.text}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevisionHistoryModal;

