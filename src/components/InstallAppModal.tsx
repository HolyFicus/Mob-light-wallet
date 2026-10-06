import React, { useState } from 'react';
import {
  X,
  Download,
  Smartphone,
  Monitor,
  Share2,
  MoreVertical,
  CheckCircle2,
  PlusSquare,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

interface InstallAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInstallable: boolean;
  isIOS: boolean;
  onInstall: () => Promise<boolean>;
}

export const InstallAppModal: React.FC<InstallAppModalProps> = ({
  isOpen,
  onClose,
  isInstallable,
  isIOS,
  onInstall,
}) => {
  const [activeTab, setActiveTab] = useState<'phone' | 'pc'>(() =>
    isIOS || /mobile|android|iphone/i.test(navigator.userAgent) ? 'phone' : 'pc'
  );
  const [isInstalling, setIsInstalling] = useState(false);

  if (!isOpen) return null;

  const handleDirectInstall = async () => {
    setIsInstalling(true);
    const success = await onInstall();
    setIsInstalling(false);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
                Установить приложение
              </h2>
              <p className="text-xs text-slate-500">
                Добавьте «Семейный кошелёк» на рабочий стол телефона или ПК
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

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Direct Install CTA Button (when browser supports BeforeInstallPrompt) */}
          {isInstallable && (
            <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
              <div>
                <span className="text-xs font-bold text-indigo-950 block">
                  Быстрая установка в 1 клик
                </span>
                <span className="text-[11px] text-indigo-700/90 block mt-0.5">
                  Ваш браузер поддерживает прямую установку на рабочий стол
                </span>
              </div>
              <button
                onClick={handleDirectInstall}
                disabled={isInstalling}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>{isInstalling ? 'Установка...' : 'Установить сейчас'}</span>
              </button>
            </div>
          )}

          {/* Device Tabs (Телефон / Компьютер) */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setActiveTab('phone')}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeTab === 'phone'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-4 h-4 text-indigo-600" />
              <span>На телефоне (Android / iPhone)</span>
            </button>
            <button
              onClick={() => setActiveTab('pc')}
              className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition-all ${
                activeTab === 'pc'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor className="w-4 h-4 text-indigo-600" />
              <span>На компьютере (ПК / Mac)</span>
            </button>
          </div>

          {/* Guide for Phone */}
          {activeTab === 'phone' && (
            <div className="space-y-4">
              {/* iOS Safari */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <span className="text-base">🍏</span>
                  <span>Для iPhone и iPad (в Safari):</span>
                </div>
                <ol className="text-xs text-slate-600 space-y-2 pl-1">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      В нижней панели Safari нажмите кнопку <strong>«Поделиться»</strong>{' '}
                      (иконка <Share2 className="w-3.5 h-3.5 inline text-indigo-600" /> квадрат со стрелочкой вверх).
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Прокрутите меню вниз и выберите <strong>«На экран «Домой»»</strong>{' '}
                      (значок <PlusSquare className="w-3.5 h-3.5 inline text-indigo-600" />).
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      Нажмите <strong>«Добавить»</strong> в правом верхнем углу. Иконка приложения появится на вашем экране!
                    </span>
                  </li>
                </ol>
              </div>

              {/* Android Chrome */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <span className="text-base">🤖</span>
                  <span>Для Android (Chrome / Яндекс / Samsung):</span>
                </div>
                <ol className="text-xs text-slate-600 space-y-2 pl-1">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      Нажмите меню браузера{' '}
                      (кнопка с тремя точками <MoreVertical className="w-3.5 h-3.5 inline text-slate-600" /> в верхнем правом углу).
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Выберите пункт <strong>«Добавить на главный экран»</strong> или <strong>«Установить приложение»</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      Подтвердите установку — приложение будет запускаться без браузерных рамок.
                    </span>
                  </li>
                </ol>
              </div>
            </div>
          )}

          {/* Guide for PC */}
          {activeTab === 'pc' && (
            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Monitor className="w-4 h-4 text-indigo-600" />
                  <span>В браузерах Google Chrome, Яндекс, Microsoft Edge:</span>
                </div>
                <ol className="text-xs text-slate-600 space-y-2.5 pl-1">
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      1
                    </span>
                    <span>
                      В адресной строке браузера справа найдите иконку установки{' '}
                      (монитор со стрелкой или круглая кнопка <strong>«Установить приложение»</strong>).
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      2
                    </span>
                    <span>
                      Либо откройте меню браузера (три точки <MoreVertical className="w-3.5 h-3.5 inline text-slate-600" /> справа вверху) → выберите <strong>«Установить Семейный кошелёк»</strong>.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      3
                    </span>
                    <span>
                      Приложение появится на вашем рабочем столе и в меню «Пуск» (Windows) или Launchpad (Mac), открываясь в отдельном удобном окне!
                    </span>
                  </li>
                </ol>
              </div>

              {/* Benefits Banner */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2.5 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  Работает быстрее, сохраняет все данные локально и доступно даже без интернета!
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Понятно, закрыть
          </button>
        </div>
      </div>
    </div>
  );
};
