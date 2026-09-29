import { FORMATS } from '../lib/formats';

interface TypeSelectorProps {
  value: string;
  onChange: (id: string) => void;
}

export function TypeSelector({ value, onChange }: TypeSelectorProps) {
  return (
    <fieldset className="card">
      <legend>Barcode type</legend>
      <div className="type-grid" role="radiogroup" aria-label="Barcode type">
        {FORMATS.map((f) => (
          <label key={f.id} className="type-option">
            <input
              type="radio"
              name="barcode-type"
              value={f.id}
              checked={value === f.id}
              onChange={() => onChange(f.id)}
            />
            <span>{f.label}</span>
          </label>
        ))}
      </div>
      {FORMATS.find((f) => f.id === value)?.notes && (
        <p className="card-note">{FORMATS.find((f) => f.id === value)!.notes}</p>
      )}
    </fieldset>
  );
}
