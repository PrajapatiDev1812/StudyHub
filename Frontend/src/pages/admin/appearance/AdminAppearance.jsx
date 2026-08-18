import React, { useState } from 'react';
import { useTheme } from '../../../theme/useTheme';
import { Check, AlertCircle } from 'lucide-react';

import ThemePageHeader from './ThemePageHeader';
import MyThemesSection from './MyThemesSection';
import BuiltInThemesSection from './BuiltInThemesSection';

import './AdminAppearance.css';

export default function AdminAppearance() {
  const { activeTheme, saveTheme, previewTheme, isSaving } = useTheme();
  const [toast, setToast] = useState(null); // { type: 'success'|'error', message: string }

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSelectTheme = async (theme) => {
    // Immediately preview it so the UI updates instantly
    previewTheme(theme);

    // Then persist to backend (pass full theme object so saveTheme can handle
    // both DB themes with integer ids and local builtin themes with slug ids)
    const result = await saveTheme(theme);
    if (result?.success) {
      showToast('success', `"${theme.name}" theme applied!`);
    } else {
      showToast('error', 'Failed to save theme. Please try again.');
    }
  };

  const handleDeleteTheme = async (theme) => {
    // Passed down to MyThemesSection -> ThemePreviewCard
    // Actual deletion logic is handled by MyThemesSection / useTheme
    showToast('success', `"${theme.name}" deleted successfully.`);
  };

  return (
    <div className="admin-appearance-page">
      <ThemePageHeader />
      <MyThemesSection
        activeTheme={activeTheme}
        onSelectTheme={handleSelectTheme}
        onUploadSuccess={(name) => showToast('success', `"${name}" uploaded and applied!`)}
        onUploadError={(msg) => showToast('error', msg || 'Upload failed. Please try again.')}
        onDeleteSuccess={(name) => showToast('success', `"${name}" deleted successfully.`)}
        onDeleteError={(msg) => showToast('error', msg || 'Failed to delete theme.')}
      />
      <BuiltInThemesSection activeTheme={activeTheme} onSelectTheme={handleSelectTheme} />

      {/* Toast Notification */}
      {toast && (
        <div className={`appearance-toast appearance-toast--${toast.type}`}>
          {toast.type === 'success'
            ? <Check size={18} strokeWidth={2.5} />
            : <AlertCircle size={18} strokeWidth={2.5} />}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
