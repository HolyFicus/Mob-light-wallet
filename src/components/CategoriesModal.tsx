import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  ChevronDown,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Tag,
  Search,
  Sparkles,
} from 'lucide-react';
import { CategoryItem, TransactionType } from '../types';
import {
  CategoryIcon,
  AVAILABLE_CATEGORY_ICONS,
  AVAILABLE_CATEGORY_COLORS,
} from './CategoryIcon';

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseCategories: CategoryItem[];
  incomeCategories: CategoryItem[];
  onSaveCategory: (category: CategoryItem, oldName?: string) => void;
  onDeleteCategory: (category: CategoryItem) => void;
  initialType?: TransactionType;
}

export const CategoriesModal: React.FC<CategoriesModalProps> = ({
  isOpen,
  onClose,
  expenseCategories,
  incomeCategories,
  onSaveCategory,
  onDeleteCategory,
  initialType = 'expense',
}) => {
  const [activeTab, setActiveTab] = useState<TransactionType>(initialType);
  const [searchQuery, setSearchQuery] = useState('');

  // Creation & Editing states
  const [isCreating, setIsCreating] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);

  // Form states for new / edited category
  const [formName, setFormName] = useState('');
  const [formIcon, setFormIcon] = useState('Tag');
  const [formColor, setFormColor] = useState('#10b981');
  const [formSubcategories, setFormSubcategories] = useState<string[]>([]);
  const [newSubInput, setNewSubInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Quick subcategory inline addition per existing category card
  const [quickSubInputs, setQuickSubInputs] = useState<Record<string, string>>({});
  const [editingSubcategory, setEditingSubcategory] = useState<{
    catId: string;
    subIndex: number;
    value: string;
  } | null>(null);

  // Deletion confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Expanded categories for subcategories view
  const [expandedCatIds, setExpandedCatIds] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const currentCategories = activeTab === 'expense' ? expenseCategories : incomeCategories;

  const filteredCategories = currentCategories.filter((cat) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    if (cat.name.toLowerCase().includes(q)) return true;
    if (cat.subcategories?.some((s) => s.toLowerCase().includes(q))) return true;
    return false;
  });

  const toggleExpand = (catId: string) => {
    setExpandedCatIds((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleStartCreate = () => {
    setIsCreating(true);
    setEditingCatId(null);
    setFormName('');
    setFormIcon(activeTab === 'expense' ? 'ShoppingBag' : 'Briefcase');
    setFormColor(activeTab === 'expense' ? '#10b981' : '#059669');
    setFormSubcategories([]);
    setNewSubInput('');
    setFormError(null);
  };

  const handleStartEdit = (cat: CategoryItem) => {
    setIsCreating(false);
    setEditingCatId(cat.id);
    setFormName(cat.name);
    setFormIcon(cat.icon);
    setFormColor(cat.color);
    setFormSubcategories(cat.subcategories ? [...cat.subcategories] : []);
    setNewSubInput('');
    setFormError(null);
  };

  const handleCancelForm = () => {
    setIsCreating(false);
    setEditingCatId(null);
    setFormName('');
    setFormSubcategories([]);
    setFormError(null);
  };

  // Add subcategory to creation/editing form
  const handleAddFormSubcategory = () => {
    const trimmed = newSubInput.trim();
    if (!trimmed) return;
    if (formSubcategories.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setFormError('Такая подкатегория уже добавлена');
      return;
    }
    setFormSubcategories([...formSubcategories, trimmed]);
    setNewSubInput('');
    setFormError(null);
  };

  const handleRemoveFormSubcategory = (index: number) => {
    setFormSubcategories(formSubcategories.filter((_, i) => i !== index));
  };

  // Save creation or editing
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formName.trim();
    if (!cleanName) {
      setFormError('Укажите название категории');
      return;
    }

    // Check duplicate name
    const existing = currentCategories.find(
      (c) => c.name.toLowerCase() === cleanName.toLowerCase() && c.id !== editingCatId
    );
    if (existing) {
      setFormError('Категория с таким названием уже существует');
      return;
    }

    if (isCreating) {
      const newCat: CategoryItem = {
        id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: cleanName,
        type: activeTab,
        icon: formIcon,
        color: formColor,
        subcategories: formSubcategories.length > 0 ? formSubcategories : undefined,
      };
      onSaveCategory(newCat);
    } else if (editingCatId) {
      const originalCat = currentCategories.find((c) => c.id === editingCatId);
      if (!originalCat) return;

      const updatedCat: CategoryItem = {
        ...originalCat,
        name: cleanName,
        icon: formIcon,
        color: formColor,
        subcategories: formSubcategories.length > 0 ? formSubcategories : undefined,
      };
      onSaveCategory(updatedCat, originalCat.name);
    }

    handleCancelForm();
  };

  // Inline subcategory addition on an existing category card
  const handleAddQuickSubcategory = (cat: CategoryItem) => {
    const inputVal = quickSubInputs[cat.id]?.trim();
    if (!inputVal) return;

    const currentSubs = cat.subcategories || [];
    if (currentSubs.some((s) => s.toLowerCase() === inputVal.toLowerCase())) {
      return;
    }

    const updatedCat: CategoryItem = {
      ...cat,
      subcategories: [...currentSubs, inputVal],
    };
    onSaveCategory(updatedCat, cat.name);
    setQuickSubInputs((prev) => ({ ...prev, [cat.id]: '' }));
    // Ensure expanded
    setExpandedCatIds((prev) => ({ ...prev, [cat.id]: true }));
  };

  // Inline subcategory deletion
  const handleDeleteSubcategory = (cat: CategoryItem, subIndex: number) => {
    const currentSubs = cat.subcategories || [];
    const updatedSubs = currentSubs.filter((_, i) => i !== subIndex);
    const updatedCat: CategoryItem = {
      ...cat,
      subcategories: updatedSubs.length > 0 ? updatedSubs : undefined,
    };
    onSaveCategory(updatedCat, cat.name);
  };

  // Inline subcategory rename
  const handleSaveSubcategoryRename = (cat: CategoryItem) => {
    if (!editingSubcategory) return;
    const clean = editingSubcategory.value.trim();
    if (!clean) {
      setEditingSubcategory(null);
      return;
    }

    const currentSubs = [...(cat.subcategories || [])];
    currentSubs[editingSubcategory.subIndex] = clean;

    const updatedCat: CategoryItem = {
      ...cat,
      subcategories: currentSubs,
    };
    onSaveCategory(updatedCat, cat.name);
    setEditingSubcategory(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Категории и подкатегории
              </h2>
              <p className="text-xs text-slate-500">
                Создавайте и изменяйте названия категорий и структуру подкатегорий
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher & Search Bar */}
        <div className="px-5 sm:px-6 pt-4 pb-2 space-y-3 border-b border-slate-100">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Segmented control for Expense / Income */}
            <div className="p-1 bg-slate-100 rounded-xl grid grid-cols-2 gap-1 w-full sm:w-64">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('expense');
                  handleCancelForm();
                }}
                className={`flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'expense'
                    ? 'bg-white text-rose-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingDown className="w-3.5 h-3.5" />
                <span>Расходы ({expenseCategories.length})</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('income');
                  handleCancelForm();
                }}
                className={`flex items-center justify-center gap-2 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'income'
                    ? 'bg-white text-emerald-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Доходы ({incomeCategories.length})</span>
              </button>
            </div>

            {/* Add New Category Button */}
            {!isCreating && !editingCatId && (
              <button
                type="button"
                onClick={handleStartCreate}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 rounded-xl shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Новая категория</span>
              </button>
            )}
          </div>

          {/* Search filter */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск категории или подкатегории..."
              className="w-full text-xs text-slate-800 pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Create / Edit Form Overlay */}
          {(isCreating || editingCatId) && (
            <form
              onSubmit={handleSaveForm}
              className="p-4 sm:p-5 rounded-2xl border-2 border-indigo-200 bg-indigo-50/20 space-y-4 mb-4 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                <span className="text-sm font-bold text-slate-900">
                  {isCreating ? 'Создание новой категории' : 'Редактирование категории'}
                </span>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  Отмена
                </button>
              </div>

              {/* Category Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Название категории <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                    style={{ backgroundColor: formColor }}
                  >
                    <CategoryIcon name={formIcon} className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => {
                      setFormName(e.target.value);
                      setFormError(null);
                    }}
                    placeholder="Например: Домашние животные, Кафе..."
                    className="flex-1 text-sm font-semibold text-slate-900 px-3.5 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Иконка категории
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-white rounded-xl border border-slate-200">
                  {AVAILABLE_CATEGORY_ICONS.map((ic) => {
                    const isSelected = formIcon === ic.name;
                    return (
                      <button
                        key={ic.name}
                        type="button"
                        onClick={() => setFormIcon(ic.name)}
                        title={ic.label}
                        className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-indigo-600 text-white ring-2 ring-indigo-600/30 shadow-2xs'
                            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <CategoryIcon name={ic.name} className="w-4 h-4" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Цвет индикатора
                </label>
                <div className="flex items-center gap-1.5 flex-wrap p-1.5 bg-white rounded-xl border border-slate-200">
                  {AVAILABLE_CATEGORY_COLORS.map((c) => {
                    const isSelected = formColor.toLowerCase() === c.toLowerCase();
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setFormColor(c)}
                        className={`w-6 h-6 rounded-lg transition-transform ${
                          isSelected
                            ? 'ring-2 ring-offset-2 ring-slate-800 scale-110 shadow-xs'
                            : 'hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                        aria-label={`Выбрать цвет ${c}`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Subcategories Editor within Form */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Подкатегории (необязательно)
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={newSubInput}
                    onChange={(e) => {
                      setNewSubInput(e.target.value);
                      setFormError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFormSubcategory();
                      }
                    }}
                    placeholder="Название подкатегории..."
                    className="flex-1 text-xs text-slate-800 px-3 py-1.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddFormSubcategory}
                    className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors shrink-0"
                  >
                    + Добавить
                  </button>
                </div>

                {formSubcategories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-xl border border-slate-200">
                    {formSubcategories.map((sub, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-100 text-slate-700 rounded-lg group"
                      >
                        <span>{sub}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFormSubcategory(idx)}
                          className="text-slate-400 hover:text-rose-600 transition-colors"
                          title="Удалить подкатегорию"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {formError && (
                <div className="text-xs font-medium text-rose-600 bg-rose-50 border border-rose-100 p-2 rounded-xl flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-indigo-100">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-white rounded-xl transition-colors"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isCreating ? 'Создать категорию' : 'Сохранить изменения'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Categories List */}
          {filteredCategories.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              {searchQuery ? 'Категорий по вашему запросу не найдено' : 'Список категорий пуст'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredCategories.map((cat) => {
                const isExpanded = expandedCatIds[cat.id] ?? true;
                const subs = cat.subcategories || [];
                const isConfirmingDelete = confirmDeleteId === cat.id;

                return (
                  <div
                    key={cat.id}
                    className="p-3.5 rounded-2xl border border-slate-200/90 bg-white hover:border-slate-300 transition-all shadow-2xs space-y-2.5"
                  >
                    {/* Top Row: Category Header */}
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0 shadow-2xs"
                          style={{ backgroundColor: cat.color }}
                        >
                          <CategoryIcon name={cat.icon} className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 truncate">
                              {cat.name}
                            </span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 shrink-0">
                              {subs.length}{' '}
                              {subs.length === 1
                                ? 'подкатегория'
                                : subs.length >= 2 && subs.length <= 4
                                ? 'подкатегории'
                                : 'подкатегорий'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Category Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleStartEdit(cat)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Редактировать категорию"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            if (isConfirmingDelete) {
                              onDeleteCategory(cat);
                              setConfirmDeleteId(null);
                            } else {
                              setConfirmDeleteId(cat.id);
                              setTimeout(() => setConfirmDeleteId(null), 4000);
                            }
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isConfirmingDelete
                              ? 'bg-rose-600 text-white text-[11px] font-semibold px-2 flex items-center gap-1'
                              : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                          }`}
                          title="Удалить категорию"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          {isConfirmingDelete && <span>Точно удалить?</span>}
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleExpand(cat.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                          title={isExpanded ? 'Свернуть подкатегории' : 'Развернуть подкатегории'}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Subcategories View and Management */}
                    {isExpanded && (
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        {/* Chips list */}
                        <div className="flex flex-wrap gap-1.5 items-center">
                          {subs.map((sub, sIdx) => {
                            const isEditingThisSub =
                              editingSubcategory?.catId === cat.id &&
                              editingSubcategory?.subIndex === sIdx;

                            if (isEditingThisSub) {
                              return (
                                <div
                                  key={sIdx}
                                  className="inline-flex items-center gap-1 bg-white border border-indigo-400 rounded-lg px-2 py-0.5 shadow-2xs"
                                >
                                  <input
                                    type="text"
                                    autoFocus
                                    value={editingSubcategory.value}
                                    onChange={(e) =>
                                      setEditingSubcategory({
                                        ...editingSubcategory,
                                        value: e.target.value,
                                      })
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        handleSaveSubcategoryRename(cat);
                                      } else if (e.key === 'Escape') {
                                        setEditingSubcategory(null);
                                      }
                                    }}
                                    className="text-xs text-slate-800 bg-transparent outline-none w-28"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => handleSaveSubcategoryRename(cat)}
                                    className="text-indigo-600 hover:text-indigo-800"
                                    title="Сохранить"
                                  >
                                    <Check className="w-3 h-3 stroke-[3]" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingSubcategory(null)}
                                    className="text-slate-400 hover:text-slate-600"
                                    title="Отмена"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            }

                            return (
                              <span
                                key={sIdx}
                                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 hover:bg-slate-200/80 transition-colors group"
                              >
                                <span>{sub}</span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingSubcategory({
                                      catId: cat.id,
                                      subIndex: sIdx,
                                      value: sub,
                                    })
                                  }
                                  className="text-slate-400 hover:text-indigo-600 opacity-60 group-hover:opacity-100 transition-opacity"
                                  title="Переименовать подкатегорию"
                                >
                                  <Edit2 className="w-2.5 h-2.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSubcategory(cat, sIdx)}
                                  className="text-slate-400 hover:text-rose-600 opacity-60 group-hover:opacity-100 transition-opacity ml-0.5"
                                  title="Удалить подкатегорию"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            );
                          })}

                          {subs.length === 0 && (
                            <span className="text-[11px] text-slate-400 italic">
                              Подкатегории пока не добавлены
                            </span>
                          )}
                        </div>

                        {/* Inline Quick Add Subcategory */}
                        <div className="flex items-center gap-1.5 pt-1">
                          <input
                            type="text"
                            value={quickSubInputs[cat.id] || ''}
                            onChange={(e) =>
                              setQuickSubInputs({
                                ...quickSubInputs,
                                [cat.id]: e.target.value,
                              })
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddQuickSubcategory(cat);
                              }
                            }}
                            placeholder="+ Новая подкатегория..."
                            className="text-xs text-slate-800 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44"
                          />
                          <button
                            type="button"
                            onClick={() => handleAddQuickSubcategory(cat)}
                            disabled={!quickSubInputs[cat.id]?.trim()}
                            className="px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 disabled:opacity-40 disabled:hover:bg-indigo-50 rounded-lg transition-colors"
                          >
                            Добавить
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-t border-slate-100 bg-slate-50/50">
          <span className="text-[11px] text-slate-500">
            Изменения автоматически сохраняются и применяются ко всем операциям
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-xl shadow-2xs hover:bg-slate-50 transition-colors"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
