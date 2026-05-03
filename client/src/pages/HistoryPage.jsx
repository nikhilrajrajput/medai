import { useState, useEffect } from 'react';
import { History, Pill, FileText, Trash2, Loader2, RefreshCw, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const timeAgo = (date) => {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [clearing, setClearing] = useState(false);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/history');
      setHistory(data.data);
    } catch {
      toast.error('Failed to load history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const deleteItem = async (id) => {
    try {
      await api.delete(`/history/${id}`);
      setHistory((prev) => prev.filter((h) => h._id !== id));
      toast.success('Record deleted.');
    } catch {
      toast.error('Failed to delete record.');
    }
  };

  const clearAll = async () => {
    if (!window.confirm('Clear all history? This cannot be undone.')) return;
    setClearing(true);
    try {
      await api.delete('/history');
      setHistory([]);
      toast.success('History cleared.');
    } catch {
      toast.error('Failed to clear history.');
    } finally {
      setClearing(false);
    }
  };

  const filtered = filter === 'all' ? history : history.filter((h) => h.type === filter);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <History size={18} color="var(--green)" />
            <h1 className="font-display text-3xl">Search History</h1>
          </div>
          <p style={{ color: 'var(--text2)', fontSize: 14 }}>
            All your medication searches and report analyses.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={fetchHistory} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          {history.length > 0 && (
            <button className="btn-ghost" onClick={clearAll} disabled={clearing} style={{ color: 'var(--red)', borderColor: 'rgba(239,68,68,0.3)' }}>
              {clearing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { key: 'all', label: 'All' },
          { key: 'medication', label: 'Medications' },
          { key: 'report', label: 'Reports' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className="px-4 py-1.5 rounded-lg text-sm font-medium transition-all"
            style={{
              background: filter === key ? 'rgba(34,197,94,0.1)' : 'var(--surface2)',
              border: `1px solid ${filter === key ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
              color: filter === key ? 'var(--green)' : 'var(--text2)',
              cursor: 'pointer',
            }}
          >
            {label}
            {key === 'all' && (
              <span
                className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
                style={{ background: 'var(--surface3)', color: 'var(--text3)' }}
              >
                {history.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card p-4 flex items-center gap-4">
              <div className="skeleton w-10 h-10 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-3" style={{ width: '60%' }} />
                <div className="skeleton h-2.5" style={{ width: '40%' }} />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="text-center py-20 rounded-2xl"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <Clock size={36} className="mx-auto mb-4" style={{ color: 'var(--text3)' }} />
          <p className="font-medium mb-1" style={{ color: 'var(--text2)' }}>No history yet</p>
          <p className="text-sm" style={{ color: 'var(--text3)' }}>
            Your searches and analyses will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <div
              key={item._id}
              className="card flex items-center gap-4 px-4 py-3 group transition-all"
            >
              {/* Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: item.type === 'medication' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                  border: `1px solid ${item.type === 'medication' ? 'rgba(34,197,94,0.2)' : 'rgba(245,158,11,0.2)'}`,
                }}
              >
                {item.type === 'medication'
                  ? <Pill size={16} color="var(--green)" />
                  : <FileText size={16} color="var(--amber)" />}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                  {item.query}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{
                      background: item.type === 'medication' ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)',
                      color: item.type === 'medication' ? 'var(--green)' : 'var(--amber)',
                    }}
                  >
                    {item.type === 'medication' ? 'Medication' : 'Report'}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text3)' }}>{timeAgo(item.createdAt)}</span>
                  {item.fileName && (
                    <span className="text-xs truncate" style={{ color: 'var(--text3)' }}>· {item.fileName}</span>
                  )}
                </div>
              </div>

              {/* Delete btn */}
              <button
                onClick={() => deleteItem(item._id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all"
                style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--red)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text3)')}
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}