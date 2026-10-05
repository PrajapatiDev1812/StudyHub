import React from 'react';
import { Info } from 'lucide-react';

export default function ThemeInfoBanner() {
  return (
    <div className="theme-info-banner">
      <Info size={24} color="var(--accent-primary)" />
      <div>
        <strong>Pro Tip:</strong> Theme changes applied here are isolated to your admin dashboard and will not affect the student panel. Your preferences are saved automatically across devices.
      </div>
    </div>
  );
}
