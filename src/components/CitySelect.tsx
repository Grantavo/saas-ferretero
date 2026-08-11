'use client';

import { useMemo, useRef, useState, useEffect } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import colombiaCities from '@/lib/colombia-cities.json';

interface CitySelectProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function CitySelect({ value, onChange, placeholder = 'Selecciona una ciudad' }: CitySelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list: { department: string; city: string }[] = [];
    for (const [department, cities] of Object.entries(colombiaCities.departments)) {
      for (const city of cities) {
        if (!q || city.toLowerCase().includes(q) || department.toLowerCase().includes(q)) {
          list.push({ department, city });
        }
      }
    }
    return list.slice(0, 50);
  }, [query]);

  const displayed = value || placeholder;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={cn(
          "w-full p-4 pl-12 bg-slate-50 border-none rounded-2xl font-bold outline-none focus:ring-4 focus:ring-primary/5 transition-all flex items-center gap-3 text-left",
          value ? 'text-slate-800' : 'text-slate-400'
        )}
      >
        <Search className="absolute left-4 w-5 h-5 text-slate-400" />
        <span className="flex-1 truncate">{displayed}</span>
        <ChevronDown className={cn("w-5 h-5 text-slate-400 transition-transform shrink-0", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute z-50 mt-2 w-full bg-white rounded-2xl shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
          <div className="p-3 border-b border-slate-50">
            <input
              autoFocus
              type="text"
              placeholder="Buscar ciudad…"
              className="w-full px-4 py-3 bg-slate-50 border-none rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-2">
            {results.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm font-bold text-slate-400">Sin resultados</p>
            ) : (
              results.map(r => {
                const selected = r.city === value;
                return (
                  <button
                    key={`${r.department}-${r.city}`}
                    type="button"
                    onClick={() => {
                      onChange(r.city);
                      setOpen(false);
                      setQuery('');
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all text-left",
                      selected && "bg-primary/5 text-primary"
                    )}
                  >
                    <Check className={cn("w-4 h-4 shrink-0", selected ? "opacity-100" : "opacity-0")} />
                    <span className="flex-1">{r.city}</span>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{r.department}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}