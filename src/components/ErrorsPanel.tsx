import { useState } from 'react';

interface ErrorsPanelProps {
  errors: { line: number; value: string; reason: string }[];
  onFix: (lineIndex: number) => void;
}

export function ErrorsPanel({ errors, onFix }: ErrorsPanelProps) {
  const [expanded, setExpanded] = useState(true);

  if (errors.length === 0) return null;

  return (
    <section className="card" aria-label="Invalid value errors">
      <h2 id="errors-heading">Invalid values ({errors.length})</h2>
      <div className="error-summary" role="status">
        {errors.length} line{errors.length === 1 ? '' : 's'} could not be encoded. They are{' '}
        <strong>not printed or downloaded</strong> until corrected.
      </div>
      {expanded && (
        <ul className="error-list">
          {errors.map((e) => (
            <li key={e.line} className="error-item">
              <span className="line-no">Line {e.line}</span>
              <span className="err-value">{e.value}</span>
              <span>{e.reason}</span>
              <button type="button" className="btn btn-small" onClick={() => onFix(e.line - 1)}>
                Fix
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="btn-row">
        <button type="button" className="btn btn-small" onClick={() => setExpanded(!expanded)}>
          {expanded ? 'Hide details' : 'Show details'}
        </button>
      </div>
    </section>
  );
}
