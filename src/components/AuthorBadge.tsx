import React, { useState, useRef, useEffect } from 'react';
import { GraduationCap, X, User } from 'lucide-react';

export const AuthorBadge: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-30 flex flex-col items-end"
    >
      {/* Popover Content */}
      {isOpen && (
        <div className="mb-2 w-72 sm:w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-4 text-xs animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block leading-tight">
                  Автор проекта
                </span>
                <span className="text-sm font-extrabold text-slate-900 leading-tight">
                  Дмитрий Боев
                </span>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Закрыть информацию об авторе"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="pt-2.5 space-y-1.5 text-slate-600 leading-relaxed">
            <p className="flex items-center gap-1.5 font-medium text-slate-800">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
              <span>Студент НовГУ, ИстФак</span>
            </p>
            <p className="text-[11px] text-slate-500 pl-3">
              Новгородский государственный университет имени Ярослава Мудрого · Исторический факультет
            </p>
          </div>
        </div>
      )}

      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className={`group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all text-xs font-semibold shadow-2xs backdrop-blur-sm ${
          isOpen
            ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-slate-900/10'
            : 'bg-white/90 hover:bg-white text-slate-700 hover:text-slate-900 border-slate-200/90 hover:border-slate-300'
        }`}
        title="Информация об авторе"
        aria-label="Автор проекта"
      >
        <GraduationCap className={`w-3.5 h-3.5 transition-transform group-hover:scale-110 ${isOpen ? 'text-white' : 'text-indigo-600'}`} />
        <span>Автор</span>
      </button>
    </div>
  );
};
