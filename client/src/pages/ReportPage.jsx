import { useState, useRef } from 'react';
import { Upload, FileText, X, Loader2, Activity, AlertTriangle, ChevronRight, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const urgencyConfig = {
  routine: { label: 'Routine Follow-up', badge: 'badge-green', color: 'var(--green)' },
  soon: { label: 'See Doctor Soon', badge: 'badge-amber', color: 'var(--amber)' },
  urgent: { label: 'Urgent Attention', badge: 'badge-red', color: 'var(--red)' },
  emergency: { label: 'EMERGENCY', badge: 'badge-red', color: 'var(--red)' },
};

function Chip({ text, type = 'green' }) {
  const colors = {
    green: { bg: 'rgba(34,197,94,0.1)', color: 'var(--green)', border: 'rgba(34,197,94,0.2)' },
    amber: { bg: 'rgba(245,158,11,0.1)', color: 'var(--amber)', border: 'rgba(245,158,11,0.2)' },
    red: { bg: 'rgba(239,68,68,0.1)', color: 'var(--red)', border: 'rgba(239,68,68,0.2)' },
    gray: { bg: 'var(--surface3)', color: 'var(--text2)', border: 'var(--border2)' },
  };
  const c = colors[type];
  return (
    <span
      className="inline-block text-xs px-2.5 py-1 rounded-lg mr-1.5 mb-1.5"
      style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}
    >
      {text}
    </span>
  );
}

function ResultSection({ label, children }) {
  return (
    <div className="py-4" style={{ borderBottom: '1px solid var(--border)' }}>
      <p className="section-label mb-3">{label}</p>
      {children}
    </div>
  );
}

export default function ReportPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const inputRef = useRef();

  const handleFile = (f) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowed.includes(f.type)) { toast.error('Only JPEG, PNG, WEBP, and PDF files are allowed.'); return; }
    if (f.size > 15 * 1024 * 1024) { toast.error('File too large (max 15MB).'); return; }
    setFile(f);
    setResult(null);
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const analyze = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);
    const fd = new FormData();
    fd.append('report', file);
    try {
      const { data } = await api.post('/report/analyze', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setResult(data.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Analysis failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const urgency = result ? (urgencyConfig[result.urgency] || urgencyConfig.routine) : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <FileText size={18} color="var(--green)" />
          <h1 className="font-display text-3xl">Report Analysis</h1>
        </div>
        <p style={{ color: 'var(--text2)', fontSize: 14 }}>
          Upload a medical report — Gemini AI identifies findings, suggests follow-up treatments, and flags urgency.
        </p>
      </div>

      {/* Upload card */}
      <div className="card p-5 mb-6">
        {!file ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => inputRef.current.click()}
            className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all"
            style={{
              borderColor: dragging ? 'var(--green-dim)' : 'var(--border2)',
              background: dragging ? 'rgba(34,197,94,0.04)' : 'var(--surface2)',
            }}
          >
            <input ref={inputRef} type="file" className="hidden" accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={(e) => e.target.files[0] && handleFile(e.target.files[0])} />
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}
            >
              <Upload size={22} color="var(--green)" />
            </div>
            <p className="font-medium mb-1" style={{ color: 'var(--text)' }}>Drop your report here</p>
            <p className="text-sm" style={{ color: 'var(--text3)' }}>PDF, JPEG, PNG, WEBP · Max 15MB</p>
          </div>
        ) : (
          <div>
            {/* File preview bar */}
            <div
              className="flex items-center gap-3 p-3 rounded-xl mb-4"
              style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)' }}
            >
              {preview ? (
                <img src={preview} alt="preview" className="w-12 h-12 object-cover rounded-lg" />
              ) : (
                <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)' }}>
                  <FileText size={20} color="var(--green)" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>{file.name}</p>
                <p className="text-xs" style={{ color: 'var(--text3)' }}>{(file.size / 1024).toFixed(1)} KB · {file.type}</p>
              </div>
              <button
                onClick={() => { setFile(null); setPreview(null); setResult(null); }}
                className="p-1.5 rounded-lg transition-colors"
                style={{ background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--red)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text3)')}
              >
                <Trash2 size={15} />
              </button>
            </div>
            <button className="btn-primary w-full" onClick={analyze} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Analyzing with Gemini AI…
                </>
              ) : (
                <>
                  <Activity size={16} />
                  Analyze Report
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Loading skeleton */}
      {loading && (
        <div className="card p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <Loader2 size={18} className="animate-spin" style={{ color: 'var(--green)' }} />
            <span style={{ color: 'var(--text2)', fontSize: 14 }}>Gemini AI is reading your report…</span>
          </div>
          {[75, 90, 55, 80, 65, 70].map((w, i) => (
            <div key={i} className="skeleton h-3" style={{ width: `${w}%`, animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="card overflow-hidden animate-slide-up">
          {/* Result header */}
          <div className="p-6" style={{ background: 'linear-gradient(135deg,#0a2018,#0d2a1f)', borderBottom: '1px solid var(--border)' }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-label mb-1">Analysis Complete</p>
                <h2 className="font-display text-2xl mb-3">{result.title}</h2>
                <span className={`badge ${urgency.badge}`}>{urgency.label}</span>
              </div>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <Activity size={20} color="var(--green)" />
              </div>
            </div>
            {result.urgencyReason && (
              <p className="mt-4 text-sm" style={{ color: 'var(--text2)', lineHeight: 1.7 }}>{result.urgencyReason}</p>
            )}
          </div>

          <div className="px-6">
            <ResultSection label="Clinical Summary">
              <p className="text-sm" style={{ color: 'var(--text2)', lineHeight: 1.8 }}>{result.summary}</p>
            </ResultSection>

            <ResultSection label="Key Findings">
              <ul className="space-y-2">
                {result.findings?.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text2)' }}>
                    <ChevronRight size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--green)' }} />
                    {f}
                  </li>
                ))}
              </ul>
            </ResultSection>

            {result.abnormalValues?.length > 0 && (
              <ResultSection label="Abnormal Values">
                <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--border)' }}>
                  <table className="w-full text-sm">
                    <thead>
                      <tr style={{ background: 'var(--surface2)' }}>
                        {['Parameter', 'Value', 'Normal Range', 'Flag'].map((h) => (
                          <th key={h} className="text-left px-4 py-2.5 section-label">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {result.abnormalValues.map((row, i) => (
                        <tr key={i} style={{ borderTop: '1px solid var(--border)' }}>
                          <td className="px-4 py-2.5" style={{ color: 'var(--text)' }}>{row.parameter}</td>
                          <td className="px-4 py-2.5 font-mono font-medium" style={{ color: row.flag ? 'var(--amber)' : 'var(--text)' }}>{row.value}</td>
                          <td className="px-4 py-2.5" style={{ color: 'var(--text3)' }}>{row.normal}</td>
                          <td className="px-4 py-2.5">
                            <span className={`badge ${row.flag === 'HIGH' ? 'badge-red' : 'badge-amber'}`} style={{ fontSize: 11 }}>{row.flag}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ResultSection>
            )}

            <ResultSection label="Possible Diagnoses">
              <div>{result.diagnoses?.map((d, i) => <Chip key={i} text={d} type="gray" />)}</div>
            </ResultSection>

            <ResultSection label="Imaging Recommended">
              <div>
                {result.imagingRecommended?.length
                  ? result.imagingRecommended.map((img, i) => <Chip key={i} text={img} type="amber" />)
                  : <p className="text-sm" style={{ color: 'var(--text3)' }}>None identified</p>}
              </div>
            </ResultSection>

            <ResultSection label="Surgical Interventions">
              <div>
                {result.surgicalInterventions?.length
                  ? result.surgicalInterventions.map((s, i) => <Chip key={i} text={s} type="red" />)
                  : <p className="text-sm" style={{ color: 'var(--text3)' }}>None identified</p>}
              </div>
            </ResultSection>

            <ResultSection label="Suggested Medications">
              <div className="space-y-2">
                {result.medicationsSuggested?.length
                  ? result.medicationsSuggested.map((m, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Chip text={m.name} type="green" />
                      <span className="text-xs mt-1.5" style={{ color: 'var(--text3)' }}>{m.reason}</span>
                    </div>
                  ))
                  : <p className="text-sm" style={{ color: 'var(--text3)' }}>None suggested</p>}
              </div>
            </ResultSection>

            <ResultSection label="Specialist Referral">
              <div>{result.specialistReferral?.map((s, i) => <Chip key={i} text={s} type="gray" />)}</div>
            </ResultSection>

            <ResultSection label="Lifestyle Advice">
              <ul className="space-y-1.5">
                {result.lifestyleAdvice?.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ color: 'var(--text2)' }}>
                    <ChevronRight size={14} className="flex-shrink-0 mt-0.5" style={{ color: 'var(--green)' }} />
                    {a}
                  </li>
                ))}
              </ul>
            </ResultSection>

            <div className="py-4" style={{ borderBottom: '1px solid var(--border)' }}>
              <p className="section-label mb-2">Follow-up Plan</p>
              <p className="text-sm" style={{ color: 'var(--text2)' }}>{result.followUp}</p>
            </div>

            {/* Warning */}
            <div className="py-4">
              <div
                className="flex items-start gap-3 p-4 rounded-xl"
                style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
              >
                <AlertTriangle size={15} style={{ color: 'var(--amber)', flexShrink: 0, marginTop: 2 }} />
                <p className="text-xs" style={{ color: 'var(--text3)', lineHeight: 1.7 }}>
                  This AI analysis is for educational and informational purposes only. It is not a substitute for
                  professional medical diagnosis or treatment. Always consult a qualified healthcare provider.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}