import { useState } from 'react';
import { Search, Pill, AlertTriangle, ChevronRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const QUICK = ['Metformin', 'Amoxicillin', 'Ibuprofen', 'Lisinopril', 'Atorvastatin', 'Omeprazole', 'Paracetamol', 'Azithromycin'];

const urgencyBadge = { routine: 'badge-green', soon: 'badge-amber', urgent: 'badge-red', emergency: 'badge-red' };

function InfoGrid({ items, color = 'var(--green)' }) {
  return (
    <ul className="space-y-1.5">
      {items?.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text2)' }}>
          <ChevronRight size={14} className="flex-shrink-0 mt-0.5" style={{ color }} />
          {item}
        </li>
      ))}
    </ul>
  );
}

function Section({ label, children }) {
  return (
    <div className="py-4" style={{ borderBottom: '1px solid var(--border)' }}>
      <p className="section-label mb-3">{label}</p>
      {children}
    </div>
  );
}

export default function MedicationPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const search = async (name) => {
    const q = name || query.trim();
    if (!q) return;
    setQuery(q);
    setLoading(true);
    setResult(null);
    try {
      const { data } = await api.post('/medication/search', { medicationName: q });
      setResult(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to fetch medication info.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Pill size={18} color="var(--green)" />
          <h1 className="font-display text-3xl">Medication Info</h1>
        </div>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>
          Powered by Gemini AI — enter any medication name to get comprehensive clinical data.
        </p>
      </div>

      {/* Search box */}
      <div
        className="p-5 rounded-2xl mb-6"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text3)' }} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && search()}
              placeholder="e.g. Metformin, Amoxicillin, Ibuprofen…"
              className="input-field pl-9"
            />
          </div>
          <button className="btn-primary px-6" onClick={() => search()} disabled={loading || !query.trim()}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : 'Search'}
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-xs" style={{ color: 'var(--text3)', alignSelf: 'center' }}>Quick:</span>
          {QUICK.map((q) => (
            <button
              key={q}
              onClick={() => search(q)}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-lg transition-all"
              style={{
                background: 'var(--surface2)',
                border: '1px solid var(--border)',
                color: 'var(--text2)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--green-dim)'; e.currentTarget.style.color = 'var(--green)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text2)'; }}
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Loader2 size={18} className="animate-spin" style={{ color: 'var(--green)' }} />
            <span style={{ color: 'var(--text2)', fontSize: 14 }}>Gemini AI is fetching medication data…</span>
          </div>
          {[80, 60, 70, 50, 65].map((w, i) => (
            <div key={i} className="skeleton h-3" style={{ width: `${w}%` }} />
          ))}
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="card animate-slide-up overflow-hidden">
          {/* Result header */}
          <div className="p-6" style={{ background: 'linear-gradient(135deg,#0a2018,#0d2a1f)', borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-label mb-1">Medication</p>
                <h2 className="font-display text-3xl mb-1">{result.name}</h2>
                <span className="badge badge-gray text-xs">{result.class}</span>
              </div>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)' }}
              >
                <Pill size={24} color="var(--green)" />
              </div>
            </div>
          </div>

          <div className="px-6">
            {/* Dosage grid */}
            <div className="grid grid-cols-2 gap-0 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              {[
                { label: 'Dosage', value: result.dosage },
                { label: 'Quantity', value: result.quantity },
                { label: 'Frequency', value: result.frequency },
                { label: 'Timing', value: result.timing },
              ].map(({ label, value }) => (
                <div key={label} className="p-3">
                  <p className="section-label mb-1">{label}</p>
                  <p className="text-sm" style={{ color: 'var(--text)' }}>{value}</p>
                </div>
              ))}
            </div>

            <Section label="Method of Administration">
              <p className="text-sm" style={{ color: 'var(--text2)' }}>{result.method}</p>
            </Section>
             <Section label="Summary of this Medicine">
              <p className="text-sm" style={{ color: 'var(--text2)' }}>{result.summary}</p>
            </Section>
             <Section label="Diet Suggestion">
              <p className="text-sm" style={{ color: 'var(--text2)' }}>{result.dietSuggestion}</p>
            </Section>

            <Section label="Indications">
              <InfoGrid items={result.indications} />
            </Section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
              <Section label="Common Side Effects">
                <InfoGrid items={result.sideEffects?.common} color="var(--amber)" />
              </Section>
              <div className="md:pl-4">
                <Section label="Serious Side Effects">
                  <InfoGrid items={result.sideEffects?.serious} color="var(--red)" />
                </Section>
              </div>
            </div>


            <Section label="Drug Interactions">
              <InfoGrid items={result.interactions} color="var(--amber)" />
            </Section>


            <Section label="Contraindications">
              <InfoGrid items={result.contraindications} color="var(--red)" />
            </Section>

            <Section label="Precautions">
              <InfoGrid items={result.precautions} />
            </Section>
              
            {result.pregnancyCategory && (
              <Section label="Pregnancy Category">
                <p className="text-sm" style={{ color: 'var(--text2)' }}>{result.pregnancyCategory}</p>
              </Section>
            )}

            <Section label="Storage">
              <p className="text-sm" style={{ color: 'var(--text2)' }}>{result.storage}</p>
            </Section>

            {result.overdose && (
              <div className="py-4">
                <div
                  className="flex items-start gap-3 p-4 rounded-xl"
                  style={{ background: 'var(--red-dim)', border: '1px solid rgba(239,68,68,0.2)' }}
                >
                  <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--red)' }} />
                  <div>
                    <p className="section-label mb-1" style={{ color: 'var(--red)' }}>Overdose Warning</p>
                    <p className="text-sm" style={{ color: 'var(--text2)' }}>{result.overdose}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="py-4">
              <p className="text-xs" style={{ color: 'var(--text3)' }}>
                ⚕️ This information is AI-generated for educational purposes only. Always consult a licensed
                healthcare professional before starting, stopping, or changing any medication.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}