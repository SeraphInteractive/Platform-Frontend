import React, { useState, useEffect } from 'react';

export interface DevicePreset {
  id: string;
  name: string;
  width: number;
  height: number;
  type: 'mobile' | 'tablet' | 'desktop';
}

export const DEVICE_PRESETS: DevicePreset[] = [
  { id: 'desktop', name: 'Desktop (100%)', width: 0, height: 0, type: 'desktop' },
  { id: 'iphone-se', name: 'iPhone SE (375×667)', width: 375, height: 667, type: 'mobile' },
  { id: 'iphone-15', name: 'iPhone 15 Pro (393×852)', width: 393, height: 852, type: 'mobile' },
  { id: 'pixel-7', name: 'Pixel 7 (412×915)', width: 412, height: 915, type: 'mobile' },
  { id: 'ipad-mini', name: 'iPad Mini (768×1024)', width: 768, height: 1024, type: 'tablet' },
];

interface DevViewportSimulatorProps {
  children: React.ReactNode;
}

export const DevViewportSimulator: React.FC<DevViewportSimulatorProps> = ({ children }) => {
  const isDev = Boolean(
    (import.meta as unknown as { env?: { DEV?: boolean } }).env?.DEV ||
    (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
  );

  const [activePresetId, setActivePresetId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dev_viewport_preset') || 'desktop';
    }
    return 'desktop';
  });

  const [isLandscape, setIsLandscape] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dev_viewport_landscape') === 'true';
    }
    return false;
  });

  const [zoomScale, setZoomScale] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = Number(localStorage.getItem('dev_viewport_scale'));
      return saved >= 0.5 && saved <= 1.25 ? saved : 1.0;
    }
    return 1.0;
  });

  const [isToolbarOpen, setIsToolbarOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dev_viewport_toolbar_open') !== 'false';
    }
    return true;
  });

  const currentPreset = DEVICE_PRESETS.find((p) => p.id === activePresetId) || DEVICE_PRESETS[0]!;

  const handleSelectPreset = (presetId: string) => {
    setActivePresetId(presetId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dev_viewport_preset', presetId);
    }
  };

  const handleToggleOrientation = () => {
    const next = !isLandscape;
    setIsLandscape(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dev_viewport_landscape', String(next));
    }
  };

  const handleScaleChange = (scale: number) => {
    setZoomScale(scale);
    if (typeof window !== 'undefined') {
      localStorage.setItem('dev_viewport_scale', String(scale));
    }
  };

  // Keyboard shortcut: Cmd/Ctrl + Shift + M toggles between Desktop and Mobile simulator
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        setActivePresetId((prev) => (prev === 'desktop' ? 'iphone-15' : 'desktop'));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!isDev) {
    return <>{children}</>;
  }

  const isSimulating = activePresetId !== 'desktop';
  const effectiveWidth = isLandscape && isSimulating ? currentPreset.height : currentPreset.width;
  const effectiveHeight = isLandscape && isSimulating ? currentPreset.width : currentPreset.height;

  return (
    <div className="dev-viewport-root" style={{ width: '100%', height: '100%' }}>
      {/* 1. Floating Dev Viewport Toolbar */}
      <div
        className={`dev-viewport-toolbar ${isToolbarOpen ? 'open' : 'minimized'}`}
        role="region"
        aria-label="Dev Viewport Simulator Toolbar"
      >
        {isToolbarOpen ? (
          <div className="dev-toolbar-inner">
            <div className="dev-toolbar-header">
              <div className="dev-toolbar-brand">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
                <span className="dev-toolbar-title mono">VIEWPORT SIMULATOR</span>
              </div>
              <button
                className="dev-toolbar-close-btn"
                onClick={() => setIsToolbarOpen(false)}
                title="Minimize toolbar"
                aria-label="Minimize Viewport Toolbar"
              >
                ✕
              </button>
            </div>

            {/* Presets Button Row */}
            <div className="dev-presets-row">
              {DEVICE_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  className={`dev-preset-btn ${activePresetId === preset.id ? 'active' : ''}`}
                  onClick={() => handleSelectPreset(preset.id)}
                  title={`${preset.name} (${preset.width ? `${preset.width}×${preset.height}` : 'Full'})`}
                >
                  {preset.id === 'desktop' ? 'Full' : preset.name.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Controls Row (Scale, Orientation, Dimensions) */}
            {isSimulating && (
              <div className="dev-controls-row">
                <button
                  className={`dev-icon-control-btn ${isLandscape ? 'active' : ''}`}
                  onClick={handleToggleOrientation}
                  title="Toggle Portrait / Landscape"
                  aria-label="Toggle Orientation"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="4" y="2" width="16" height="20" rx="2" style={{ transformOrigin: 'center', transform: isLandscape ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                  </svg>
                  <span style={{ fontSize: '10px' }}>{isLandscape ? 'Land' : 'Port'}</span>
                </button>

                <div className="dev-scale-control">
                  <span className="mono" style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Zoom</span>
                  <select
                    value={zoomScale}
                    onChange={(e) => handleScaleChange(Number(e.target.value))}
                    className="dev-scale-select mono"
                  >
                    <option value="0.67">67%</option>
                    <option value="0.75">75%</option>
                    <option value="0.85">85%</option>
                    <option value="1.0">100%</option>
                    <option value="1.1">110%</option>
                  </select>
                </div>

                <div className="dev-dimension-badge mono">
                  {effectiveWidth}×{effectiveHeight}
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            className="dev-toolbar-minimized-trigger"
            onClick={() => setIsToolbarOpen(true)}
            title="Open Mobile Viewport Simulator (Ctrl+Shift+M)"
            aria-label="Open Mobile Viewport Simulator"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
              <line x1="12" y1="18" x2="12.01" y2="18" />
            </svg>
            <span className="mono">{isSimulating ? `${effectiveWidth}px` : 'Dev Viewport'}</span>
          </button>
        )}
      </div>

      {/* 2. Workspace Viewport Stage */}
      {isSimulating ? (
        <div className="dev-viewport-stage">
          <div
            className="dev-device-frame"
            style={{
              width: effectiveWidth,
              height: effectiveHeight,
              transform: `scale(${zoomScale})`,
              transformOrigin: 'top center',
            }}
          >
            {/* Top Hardware Bezel / Dynamic Island */}
            <div className="dev-device-notch-bar">
              <div className="dev-device-dynamic-island" />
            </div>

            {/* Inner Interactive Viewport Content */}
            <div className="dev-device-screen">
              {children}
            </div>

            {/* Bottom Hardware Home Indicator */}
            <div className="dev-device-home-bar">
              <div className="dev-device-home-pill" />
            </div>
          </div>
        </div>
      ) : (
        children
      )}
    </div>
  );
};
