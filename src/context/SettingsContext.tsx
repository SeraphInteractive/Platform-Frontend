import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

import { sounds } from '../utils/soundEffects.ts';

export type AppTheme = 'light' | 'dark';
export type AppDensity = 'cozy' | 'normal' | 'compact' | 'ultra-compact';

export interface UserSettings {
  theme: AppTheme;
  fontSize: number;
  compactness: AppDensity;
  highContrast: boolean;
  reducedMotion: boolean;
  soundEffects: boolean;
  pushNotifications: boolean;
}

interface SettingsContextType {
  settings: UserSettings;
  setTheme: (theme: AppTheme) => void;
  toggleTheme: () => void;
  setFontSize: (size: number) => void;
  setCompactness: (density: AppDensity) => void;
  setHighContrast: (enabled: boolean) => void;
  setReducedMotion: (enabled: boolean) => void;
  setSoundEffects: (enabled: boolean) => void;
  setPushNotifications: (enabled: boolean) => Promise<boolean>;
  resetDefaults: () => void;
  lastSavedAt: Date | null;
}

const STORAGE_KEYS = {
  theme: 'mcs_theme',
  fontSize: 'mcs_font_size',
  compactness: 'mcs_compactness',
  highContrast: 'mcs_high_contrast',
  reducedMotion: 'mcs_reduced_motion',
  soundEffects: 'mcs_sound_effects',
  pushNotifications: 'mcs_push_notifications',
} as const;

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  fontSize: 13,
  compactness: 'normal',
  highContrast: false,
  reducedMotion: false,
  soundEffects: false,
  pushNotifications: false,
};

function getInitialSettings(): UserSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;

  try {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
    const savedFontSize = localStorage.getItem(STORAGE_KEYS.fontSize);
    const savedCompactness = localStorage.getItem(STORAGE_KEYS.compactness);
    const savedHighContrast = localStorage.getItem(STORAGE_KEYS.highContrast);
    const savedReducedMotion = localStorage.getItem(STORAGE_KEYS.reducedMotion);
    const savedSounds = localStorage.getItem(STORAGE_KEYS.soundEffects);
    const savedPush = localStorage.getItem(STORAGE_KEYS.pushNotifications);

    return {
      theme: savedTheme === 'light' ? 'light' : 'dark',
      fontSize: savedFontSize ? parseInt(savedFontSize, 10) : DEFAULT_SETTINGS.fontSize,
      compactness: (savedCompactness as AppDensity) || DEFAULT_SETTINGS.compactness,
      highContrast: savedHighContrast === 'true',
      reducedMotion: savedReducedMotion === 'true',
      soundEffects: savedSounds === 'true',
      pushNotifications: savedPush === 'true',
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<UserSettings>(getInitialSettings);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  // Apply attributes immediately to document element and persist
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Theme
    if (settings.theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.setAttribute('data-theme', 'light');
    }
    localStorage.setItem(STORAGE_KEYS.theme, settings.theme);

    // 2. Font Size
    document.documentElement.style.fontSize = `${settings.fontSize}px`;
    document.documentElement.style.setProperty('--app-font-size', `${settings.fontSize}px`);
    localStorage.setItem(STORAGE_KEYS.fontSize, settings.fontSize.toString());

    // 3. Compactness
    document.documentElement.setAttribute('data-compactness', settings.compactness);
    localStorage.setItem(STORAGE_KEYS.compactness, settings.compactness);

    // 4. High Contrast
    if (settings.highContrast) {
      document.documentElement.setAttribute('data-high-contrast', 'true');
    } else {
      document.documentElement.removeAttribute('data-high-contrast');
    }
    localStorage.setItem(STORAGE_KEYS.highContrast, settings.highContrast ? 'true' : 'false');

    // 5. Reduced Motion
    if (settings.reducedMotion) {
      document.documentElement.setAttribute('data-reduced-motion', 'true');
    } else {
      document.documentElement.removeAttribute('data-reduced-motion');
    }
    localStorage.setItem(STORAGE_KEYS.reducedMotion, settings.reducedMotion ? 'true' : 'false');

    // 6. Sound Effects
    sounds.setEnabled(settings.soundEffects);
    localStorage.setItem(STORAGE_KEYS.soundEffects, settings.soundEffects ? 'true' : 'false');

    // 7. Push Notifications
    localStorage.setItem(STORAGE_KEYS.pushNotifications, settings.pushNotifications ? 'true' : 'false');

    setLastSavedAt(new Date());
  }, [settings]);

  const setTheme = (theme: AppTheme) => {
    setSettings((prev) => ({ ...prev, theme }));
  };

  const toggleTheme = () => {
    setSettings((prev) => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  };

  const setFontSize = (fontSize: number) => {
    setSettings((prev) => ({ ...prev, fontSize }));
  };

  const setCompactness = (compactness: AppDensity) => {
    setSettings((prev) => ({ ...prev, compactness }));
  };

  const setHighContrast = (highContrast: boolean) => {
    setSettings((prev) => ({ ...prev, highContrast }));
  };

  const setReducedMotion = (reducedMotion: boolean) => {
    setSettings((prev) => ({ ...prev, reducedMotion }));
  };

  const setSoundEffects = (soundEffects: boolean) => {
    sounds.setEnabled(soundEffects);
    setSettings((prev) => ({ ...prev, soundEffects }));
  };

  const setPushNotifications = async (enabled: boolean): Promise<boolean> => {
    if (!enabled) {
      setSettings((prev) => ({ ...prev, pushNotifications: false }));
      return false;
    }

    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        setSettings((prev) => ({ ...prev, pushNotifications: true }));
        return true;
      } else if (Notification.permission !== 'denied') {
        const result = await Notification.requestPermission();
        if (result === 'granted') {
          setSettings((prev) => ({ ...prev, pushNotifications: true }));
          return true;
        }
      }
      setSettings((prev) => ({ ...prev, pushNotifications: false }));
      return false;
    }

    setSettings((prev) => ({ ...prev, pushNotifications: true }));
    return true;
  };

  const resetDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return (
    <SettingsContext.Provider
      value={{
        settings,
        setTheme,
        toggleTheme,
        setFontSize,
        setCompactness,
        setHighContrast,
        setReducedMotion,
        setSoundEffects,
        setPushNotifications,
        resetDefaults,
        lastSavedAt,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = (): SettingsContextType => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
