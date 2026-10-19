import { Plus, Trash2 } from "lucide-react";
import { inputClass } from "../../components/ui/form/Field.tsx";

interface Column<K extends string> {
  key: K;
  label: string;
  placeholder?: string;
  multiline?: boolean;
}

/** Add/remove rows of one or more text inputs; replaces line-based "Label: Value" syntax. */
export default function RowsEditor<K extends string>({
  id,
  legend,
  hint,
  columns,
  rows,
  max,
  addLabel,
  error,
  onChange,
}: {
  id: string;
  legend: string;
  hint?: string;
  columns: Column<K>[];
  rows: Record<K, string>[];
  max: number;
  addLabel: string;
  error?: string;
  onChange: (rows: Record<K, string>[]) => void;
}) {
  const blank = Object.fromEntries(columns.map((c) => [c.key, ""])) as Record<K, string>;
  const update = (i: number, key: K, value: string) =>
    onChange(rows.map((r, n) => (n === i ? { ...r, [key]: value } : r)));
  const add = () => {
    onChange([...rows, blank]);
    // Focus the first input of the new row once rendered.
    requestAnimationFrame(() =>
      document.getElementById(`${id}-${rows.length}-${columns[0].key}`)?.focus(),
    );
  };

  return (
    <fieldset id={id} tabIndex={-1} className="min-w-0 focus:outline-none">
      <legend className="text-[0.875rem] font-semibold text-ink">
        {legend}
        <span className="ml-1.5 text-[0.8125rem] font-normal text-muted">(optional)</span>
      </legend>
      {hint && <p className="mt-1 text-[0.8125rem] text-muted">{hint}</p>}
      {rows.length > 0 && (
        <ol className="mt-3 flex flex-col gap-3">
          {rows.map((row, i) => (
            <li
              key={i}
              className={`grid items-start gap-2 ${columns.length > 1 ? "sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)_auto]" : "grid-cols-[minmax(0,1fr)_auto]"}`}
            >
              {columns.map((c) => {
                const inputId = `${id}-${i}-${c.key}`;
                const props = {
                  id: inputId,
                  value: row[c.key],
                  placeholder: c.placeholder,
                  "aria-label": `${c.label} ${i + 1}`,
                  onChange: (e: { target: { value: string } }) => update(i, c.key, e.target.value),
                };
                return c.multiline ? (
                  <textarea key={c.key} rows={2} {...props} className={`${inputClass} py-3`} />
                ) : (
                  <input key={c.key} type="text" {...props} className={inputClass} />
                );
              })}
              <button
                type="button"
                onClick={() => onChange(rows.filter((_, n) => n !== i))}
                aria-label={`Remove ${legend.toLowerCase()} ${i + 1}`}
                className="grid size-12 place-items-center justify-self-end rounded-xl text-muted hover:bg-danger-soft hover:text-danger"
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </button>
            </li>
          ))}
        </ol>
      )}
      {rows.length < max && (
        <button
          type="button"
          onClick={add}
          className="mt-2 inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 font-semibold text-forest hover:bg-forest-soft/60"
        >
          <Plus aria-hidden="true" className="size-4" />
          {addLabel}
        </button>
      )}
      {error && (
        <p className="text-[0.8125rem] font-semibold text-danger">{error}</p>
      )}
    </fieldset>
  );
}
