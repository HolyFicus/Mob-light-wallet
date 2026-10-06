import React, { useState } from 'react';
import { X, Users, Plus, Trash2, Check } from 'lucide-react';

interface ManageMembersModalProps {
  isOpen: boolean;
  onClose: () => void;
  members: string[];
  onSaveMembers: (members: string[]) => void;
}

export const ManageMembersModal: React.FC<ManageMembersModalProps> = ({
  isOpen,
  onClose,
  members,
  onSaveMembers,
}) => {
  const [newMember, setNewMember] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const name = newMember.trim();
    if (!name) return;
    if (members.includes(name)) {
      setError('Член семьи с таким именем уже существует');
      return;
    }
    onSaveMembers([...members, name]);
    setNewMember('');
    setError(null);
  };

  const handleRemove = (name: string) => {
    if (members.length <= 1) {
      setError('В семье должен оставаться хотя бы один член семьи');
      return;
    }
    onSaveMembers(members.filter((m) => m !== name));
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                Члены семьи
              </h2>
              <p className="text-xs text-slate-500">
                Управление списком участников семейного бюджета
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {/* Add member form */}
          <form onSubmit={handleAdd} className="flex gap-2">
            <input
              type="text"
              value={newMember}
              onChange={(e) => {
                setNewMember(e.target.value);
                setError(null);
              }}
              placeholder="Имя (например: Бабушка, Дедушка)"
              className="flex-1 text-xs px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Добавить</span>
            </button>
          </form>

          {error && (
            <div className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-100">
              {error}
            </div>
          )}

          {/* Members list */}
          <div className="space-y-2 pt-2">
            {members.map((m) => (
              <div
                key={m}
                className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                    {m.charAt(0)}
                  </div>
                  <span className="text-sm font-semibold text-slate-800">{m}</span>
                </div>
                <button
                  onClick={() => handleRemove(m)}
                  className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  title="Удалить"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
          >
            Готово
          </button>
        </div>
      </div>
    </div>
  );
};
