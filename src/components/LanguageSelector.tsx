/**
 * LanguageSelector.tsx
 *
 * Interactive language switcher dropdown supporting English, Spanish, and French.
 */

import React, { useState, useRef, useEffect } from "react";
import { Globe, Check, ChevronDown } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";
import { SupportedLanguage } from "../i18n/translations";

interface LanguageSelectorProps {
  variant?: "header" | "sidebar" | "compact";
  className?: string;
  onLanguageChanged?: (lang: SupportedLanguage) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = "header",
  className = "",
  onLanguageChanged,
}) => {
  const { language, setLanguage, languages, currentLanguageMeta, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener("mousedown", handleOutsideClick);
      return () => window.removeEventListener("mousedown", handleOutsideClick);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen]);

  const handleSelect = (code: SupportedLanguage) => {
    setLanguage(code);
    setIsOpen(false);
    onLanguageChanged?.(code);
  };

  if (variant === "sidebar") {
    return (
      <div className={`relative w-full ${className}`} ref={containerRef}>
        <button
          id="btn-sidebar-language-selector"
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium bg-[#11151E] hover:bg-[#171C27] text-gray-300 hover:text-white border border-[#272D3A] transition-all cursor-pointer shadow-xs"
          title={t("common.selectLanguage")}
          aria-expanded={isOpen}
          aria-label={t("common.selectLanguage")}
        >
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-[#16D9F5]" />
            <span className="text-gray-300">{currentLanguageMeta.nativeName}</span>
            <span className="text-[11px]">{currentLanguageMeta.flag}</span>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>

        {isOpen && (
          <div className="absolute left-0 right-0 bottom-full mb-1.5 bg-[#121622] border border-[#272D3A] rounded-xl shadow-2xl p-1 z-50 text-xs backdrop-blur-md animate-in fade-in-50 zoom-in-95">
            <div className="px-2 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#1E2536] mb-1">
              {t("common.language")}
            </div>
            {languages.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  id={`btn-lang-option-${lang.code}`}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[#168CFF]/20 text-[#16D9F5] font-semibold border border-[#16D9F5]/30"
                      : "text-gray-300 hover:bg-[#1C2230] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{lang.flag}</span>
                    <span>{lang.nativeName}</span>
                    <span className="text-[10px] text-gray-500 font-mono">({lang.name})</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#16D9F5]" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Header variant (compact button with clean popover)
  return (
    <div className={`relative inline-flex items-center ${className}`} ref={containerRef}>
      <button
        id="btn-header-language-selector"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#171C27] hover:bg-[#1C222E] border border-[#272D3A] hover:border-[#16D9F5]/40 text-xs font-medium text-gray-200 hover:text-white transition-all cursor-pointer shadow-xs active:scale-95"
        title={`${t("common.language")}: ${currentLanguageMeta.nativeName} (${currentLanguageMeta.shortLabel})`}
        aria-expanded={isOpen}
        aria-label={t("common.selectLanguage")}
      >
        <Globe className="w-3.5 h-3.5 text-[#16D9F5]" />
        <span className="text-sm leading-none">{currentLanguageMeta.flag}</span>
        <span className="text-[11px] font-bold font-mono tracking-wider">{currentLanguageMeta.shortLabel}</span>
        <ChevronDown
          className={`w-3 h-3 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-48 bg-[#121622] border border-[#272D3A] rounded-xl shadow-2xl p-1.5 z-50 text-xs backdrop-blur-md animate-in fade-in-50 zoom-in-95">
          <div className="px-2.5 py-1 text-[10px] font-semibold text-gray-400 uppercase tracking-wider border-b border-[#1E2536] mb-1 flex items-center justify-between">
            <span>{t("common.selectLanguage")}</span>
            <span className="text-[#16D9F5] font-mono text-[9px]">i18n</span>
          </div>

          <div className="space-y-0.5">
            {languages.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <button
                  key={lang.code}
                  id={`btn-header-lang-opt-${lang.code}`}
                  type="button"
                  onClick={() => handleSelect(lang.code)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[#168CFF]/20 text-[#16D9F5] font-semibold border border-[#16D9F5]/30"
                      : "text-gray-300 hover:bg-[#1C2230] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none">{lang.flag}</span>
                    <div className="text-left leading-tight">
                      <div className="font-medium text-white">{lang.nativeName}</div>
                      <div className="text-[10px] text-gray-400 font-normal">{lang.name}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#16D9F5]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;

