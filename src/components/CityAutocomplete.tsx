'use client';

import { useEffect, useRef, useState } from 'react';

export interface City {
  id: number;
  name: string;
  country_code: string;
  lat: number;
  lng: number;
}

const COUNTRY_LABEL: Record<string, string> = {
  RS: 'Srbija', BA: 'BiH', HR: 'Hrvatska', ME: 'Crna Gora',
  MK: 'Sev. Makedonija', SI: 'Slovenija', AL: 'Albanija', XK: 'Kosovo',
};

export function cityLabel(c: Pick<City, 'name' | 'country_code'>) {
  return `${c.name}, ${COUNTRY_LABEL[c.country_code] || c.country_code}`;
}

interface Props {
  value: City | null;
  onChange: (city: City | null) => void;
  placeholder?: string;
  className?: string;
}

export default function CityAutocomplete({ value, onChange, placeholder, className }: Props) {
  const [query, setQuery] = useState(value ? cityLabel(value) : '');
  const [results, setResults] = useState<City[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Drži tekst u skladu sa spolja izabranim gradom
  useEffect(() => {
    if (value) setQuery(cityLabel(value));
  }, [value]);

  // Zatvori na klik van komponente
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const search = (q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/cities?q=${encodeURIComponent(q.trim())}`);
        const data = await res.json();
        setResults(data.cities || []);
        setOpen(true);
        setActive(-1);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 220);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setQuery(v);
    if (value) onChange(null); // promenio tekst -> poništi prethodni izbor
    search(v);
  };

  const select = (c: City) => {
    onChange(c);
    setQuery(cityLabel(c));
    setOpen(false);
    setResults([]);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(a + 1, results.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
    else if (e.key === 'Enter' && active >= 0) { e.preventDefault(); select(results[active]); }
    else if (e.key === 'Escape') { setOpen(false); }
  };

  return (
    <div ref={boxRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={handleInput}
        onKeyDown={onKeyDown}
        onFocus={() => { if (results.length > 0) setOpen(true); }}
        placeholder={placeholder || 'Počni da kucaš grad...'}
        autoComplete="off"
        className={className || 'w-full px-5 py-4 border border-border rounded-xl focus:outline-none focus:border-muted'}
      />
      {open && (
        <div className="absolute z-30 mt-1 w-full bg-white border border-border rounded-xl shadow-lg overflow-hidden">
          {loading && <div className="px-4 py-3 text-sm text-muted">Tražim...</div>}
          {!loading && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-muted">Nema rezultata. Probaj drugačije.</div>
          )}
          {!loading && results.map((c, i) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); select(c); }}
              onMouseEnter={() => setActive(i)}
              className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between transition-colors ${
                i === active ? 'bg-secondary' : 'hover:bg-secondary'
              }`}
            >
              <span className="font-medium">{c.name}</span>
              <span className="text-xs text-muted">{COUNTRY_LABEL[c.country_code] || c.country_code}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
