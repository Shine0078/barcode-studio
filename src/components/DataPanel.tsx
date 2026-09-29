import { useRef } from 'react';
import type { RefObject } from 'react';

interface DataPanelProps {
  text: string;
  onChange: (t: string) => void;
  onSample: () => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}

/** Multi-line data entry, one value per line. Line numbers shown next to
 * errors refer to non-empty lines in this field. */
export function DataPanel({ text, onChange, onSample, textareaRef }: DataPanelProps) {
  const localRef = useRef<HTMLTextAreaElement>(null);
  void localRef;
  return (
    <fieldset className="card">
      <legend>Barcode value(s)</legend>
      <label htmlFor="values-input" className="field hint" style={{ display: 'block' }}>
        One value per line. Blank lines are ignored.
      </label>
      <textarea
        id="values-input"
        ref={textareaRef}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        aria-describedby="values-hint"
        placeholder={'Hello-123\nABC-987654'}
      />
      <p id="values-hint" className="field hint">
        Data never leaves your browser — everything is generated locally.
      </p>
      <div className="btn-row">
        <button type="button" className="btn btn-small" onClick={onSample}>
          Load examples
        </button>
        <button type="button" className="btn btn-small" onClick={() => onChange('')}>
          Clear
        </button>
      </div>
    </fieldset>
  );
}
