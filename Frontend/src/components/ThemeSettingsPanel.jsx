import React, { useState } from 'react';
import { Settings, X, Upload } from 'lucide-react';
import { useAdaptiveTheme } from '../hooks/useAdaptiveTheme';
import { themePresets } from '../config/themePresets';

export default function ThemeSettingsPanel({ isOpen, onClose }) {
  const { isProcessing, previewPalette, processImage, confirmTheme, cancelTheme, resetTheme } = useAdaptiveTheme();
  const [activeTab, setActiveTab] = useState('presets');

  if (!isOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      processImage(file);
    }
  };

  const handlePresetSelect = (preset) => {
    processImage(preset.image);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative w-96 bg-[var(--theme-surface)] border-l border-[var(--theme-border)] shadow-2xl h-full flex flex-col p-6 animate-in slide-in-from-right">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[var(--theme-text)] flex items-center gap-2">
            <Settings className="w-5 h-5 text-[var(--theme-primary)]" />
            Dashboard Theme
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-[var(--theme-muted)]/20 rounded-full text-[var(--theme-text)]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 p-1 bg-black/20 rounded-lg">
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'presets' ? 'bg-[var(--theme-primary)] text-white' : 'text-[var(--theme-text)]/70 hover:text-[var(--theme-text)]'}`}
          >
            Presets
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === 'custom' ? 'bg-[var(--theme-primary)] text-white' : 'text-[var(--theme-text)]/70 hover:text-[var(--theme-text)]'}`}
          >
            Custom Image
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2">
          {activeTab === 'presets' ? (
            <div className="grid grid-cols-2 gap-4">
              {themePresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset)}
                  className="group relative aspect-video rounded-lg overflow-hidden border-2 border-transparent hover:border-[var(--theme-primary)] focus:outline-none focus:border-[var(--theme-primary)] transition-all"
                >
                  <img src={preset.image} alt={preset.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-white text-xs font-semibold">{preset.name}</span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-[var(--theme-border)] rounded-xl bg-black/10 hover:bg-black/20 transition-colors relative cursor-pointer">
              <input 
                type="file" 
                accept="image/jpeg, image/png, image/webp" 
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload className="w-8 h-8 text-[var(--theme-muted)] mb-3" />
              <p className="text-sm text-[var(--theme-text)] font-medium">Click or drag to upload</p>
              <p className="text-xs text-[var(--theme-text)]/50 mt-1">JPG, PNG, WEBP</p>
            </div>
          )}

          {isProcessing && (
            <div className="mt-8 text-center p-4">
              <div className="w-8 h-8 border-4 border-[var(--theme-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-[var(--theme-text)] animate-pulse">Extracting color palette...</p>
            </div>
          )}

          {previewPalette && !isProcessing && (
            <div className="mt-8 p-4 bg-black/20 rounded-xl border border-[var(--theme-border)]">
              <h3 className="text-sm font-semibold text-[var(--theme-text)] mb-3">Live Preview</h3>
              <div className="flex gap-2 mb-4">
                <div className="w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: previewPalette.primary }} title="Primary" />
                <div className="w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: previewPalette.accent }} title="Accent" />
                <div className="w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: previewPalette.surface }} title="Surface" />
                <div className="w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: previewPalette.border }} title="Border" />
                <div className="w-8 h-8 rounded-full shadow-sm" style={{ backgroundColor: previewPalette.text }} title="Text" />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={confirmTheme}
                  className="flex-1 bg-[var(--theme-primary)] hover:opacity-90 text-white py-2 rounded-md text-sm font-medium transition-opacity"
                >
                  Apply Theme
                </button>
                <button 
                  onClick={cancelTheme}
                  className="flex-1 bg-transparent border border-[var(--theme-border)] text-[var(--theme-text)] hover:bg-black/10 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="pt-6 mt-6 border-t border-[var(--theme-border)]">
          <button 
            onClick={resetTheme}
            className="w-full py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-md transition-colors"
          >
            Reset to Default Theme
          </button>
        </div>
      </div>
    </div>
  );
}
