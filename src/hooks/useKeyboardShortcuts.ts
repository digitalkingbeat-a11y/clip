import { useEffect, useRef, useMemo } from "react";

export type ShortcutCategory = "playback" | "editing" | "navigation" | "view" | "system";

export type ShortcutHandler = (e: KeyboardEvent) => void;

export interface ShortcutConfig {
  /** Unique identifier for the shortcut */
  id: string;
  /** Primary key or keys to trigger (e.g., ' ', 'Space', 's', 'z', 'Escape', ['Delete', 'Backspace']) */
  key: string | string[];
  /** Require Meta on macOS or Ctrl on Windows/Linux */
  cmdOrCtrl?: boolean;
  /** Require explicit Ctrl key */
  ctrl?: boolean;
  /** Require explicit Meta key */
  meta?: boolean;
  /** Require Shift key */
  shift?: boolean;
  /** Require Alt/Option key */
  alt?: boolean;
  /** Function to execute when triggered */
  handler: ShortcutHandler;
  /** Human-readable description for UI tooltips and cheatsheets */
  description: string;
  /** Functional category */
  category?: ShortcutCategory;
  /** Automatically call e.preventDefault() if shortcut matches. Default: true */
  preventDefault?: boolean;
  /** Allow triggering even if an input/textarea/editable element is focused. Default: false */
  allowInInput?: boolean;
  /** Whether this shortcut is active. Default: true */
  enabled?: boolean;
}

export interface UseKeyboardShortcutsOptions {
  /** Master enable toggle for all shortcuts in this hook instance. Default: true */
  enabled?: boolean;
  /** Optional target element to attach listener to instead of global window */
  target?: HTMLElement | null;
}

/** Check if current runtime platform is macOS / iOS */
export const isMacPlatform = (): boolean => {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPod|iPhone|iPad/.test(navigator.platform || "");
};

/** Normalize key string for comparison */
const normalizeKey = (key: string): string => {
  if (key === " " || key.toLowerCase() === "space") return "space";
  return key.toLowerCase();
};

/**
 * Custom hook for managing global keyboard event listeners with modifier handling,
 * input element filtering, and prevention of stale closures.
 */
export function useKeyboardShortcuts(
  shortcuts: ShortcutConfig[],
  options: UseKeyboardShortcutsOptions = {}
) {
  const { enabled = true, target } = options;
  const isMac = useMemo(() => isMacPlatform(), []);

  // Use a ref for shortcuts to avoid re-attaching event listeners on every render
  // while ensuring handlers always access the freshest component state.
  const shortcutsRef = useRef<ShortcutConfig[]>(shortcuts);
  shortcutsRef.current = shortcuts;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Detect if user is typing in a form input, textarea, select, or contenteditable
      const targetElement = e.target as HTMLElement | null;
      const tagName = targetElement?.tagName?.toLowerCase();
      const isTyping =
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        Boolean(targetElement?.isContentEditable) ||
        Boolean(
          targetElement?.closest(
            "input, textarea, select, [contenteditable='true'], [role='textbox']"
          )
        );

      const eventCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey;
      const eventKey = normalizeKey(e.key === " " ? "space" : e.key);
      const eventCode = normalizeKey(e.code === "Space" ? "space" : e.code);

      const currentShortcuts = shortcutsRef.current;

      for (const config of currentShortcuts) {
        // Skip disabled shortcuts
        if (config.enabled === false) continue;

        // Skip if user is typing and shortcut does not explicitly allow inputs
        if (isTyping && !config.allowInInput) continue;

        // Check modifier keys
        if (config.cmdOrCtrl && !eventCmdOrCtrl) continue;
        if (!config.cmdOrCtrl && (config.meta === undefined && config.ctrl === undefined)) {
          // If cmdOrCtrl not requested, make sure neither Meta nor Ctrl is pressed (unless explicitly specified)
          if (e.metaKey || e.ctrlKey) continue;
        }

        if (config.ctrl !== undefined && e.ctrlKey !== config.ctrl) continue;
        if (config.meta !== undefined && e.metaKey !== config.meta) continue;

        // Shift modifier check
        const requireShift = Boolean(config.shift);
        if (e.shiftKey !== requireShift) continue;

        // Alt modifier check
        const requireAlt = Boolean(config.alt);
        if (e.altKey !== requireAlt) continue;

        // Check key match
        const targetKeys = Array.isArray(config.key) ? config.key : [config.key];
        const keyMatched = targetKeys.some((k) => {
          const normK = normalizeKey(k);
          return normK === eventKey || normK === eventCode;
        });

        if (keyMatched) {
          if (config.preventDefault !== false) {
            e.preventDefault();
          }
          config.handler(e);
          break; // Stop after first matched shortcut to prevent conflicts
        }
      }
    };

    const element = target || window;
    element.addEventListener("keydown", handleKeyDown as EventListener);

    return () => {
      element.removeEventListener("keydown", handleKeyDown as EventListener);
    };
  }, [enabled, target, isMac]);

  /** Formatter for rendering keyboard combos in tooltips and modals */
  const formatKeyCombo = (config: ShortcutConfig): string => {
    const parts: string[] = [];
    if (config.cmdOrCtrl) {
      parts.push(isMac ? "⌘" : "Ctrl");
    } else {
      if (config.ctrl) parts.push("Ctrl");
      if (config.meta) parts.push(isMac ? "⌘" : "Win");
    }
    if (config.alt) parts.push(isMac ? "⌥" : "Alt");
    if (config.shift) parts.push(isMac ? "⇧" : "Shift");

    const primaryKey = Array.isArray(config.key) ? config.key[0] : config.key;
    if (primaryKey === " " || primaryKey.toLowerCase() === "space") {
      parts.push("Space");
    } else if (primaryKey.length === 1) {
      parts.push(primaryKey.toUpperCase());
    } else {
      parts.push(primaryKey);
    }

    return isMac ? parts.join("") : parts.join("+");
  };

  return {
    isMac,
    formatKeyCombo,
  };
}
