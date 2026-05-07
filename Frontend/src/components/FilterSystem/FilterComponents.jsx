import { useState, useRef, useEffect } from 'react';
import './FilterSystem.css';

// ── SearchInput ──────────────────────────────────────────────────────────────

export function SearchInput({ value, onChange, placeholder = 'Search...' }) {
  return (
    <div className="fs-search-wrap">
      <span className="fs-search-icon">🔍</span>
      <input
        type="text"
        className="fs-search-input"
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
      {value && (
        <button className="fs-search-clear" onClick={() => onChange('')} title="Clear search">
          ✕
        </button>
      )}
    </div>
  );
}

// ── FilterGroup ──────────────────────────────────────────────────────────────

export function FilterGroup({ label, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="fs-group">
      <div className="fs-group-header" onClick={() => setOpen(o => !o)}>
        <span className="fs-group-label">{label}</span>
        <span className={`fs-group-chevron ${open ? 'open' : ''}`}>▼</span>
      </div>
      {open && <div className="fs-group-body">{children}</div>}
    </div>
  );
}

// ── FilterOption — single or multi-select item ────────────────────────────────

export function FilterOption({ label, icon, count, selected, onClick, multi = true }) {
  return (
    <div className={`fs-option ${selected ? 'selected' : ''}`} onClick={onClick}>
      {multi ? (
        <span className="fs-option-check">{selected && '✓'}</span>
      ) : (
        <span className="fs-option-radio" />
      )}
      {icon && <span>{icon}</span>}
      <span>{label}</span>
      {count !== undefined && <span className="fs-option-count">{count}</span>}
    </div>
  );
}

// ── ActiveFilterBadges ────────────────────────────────────────────────────────

export function ActiveFilterBadges({ filters, onRemove, onClearAll }) {
  if (!filters || filters.length === 0) return null;

  return (
    <div className="fs-active-badges">
      {filters.map((f, i) => (
        <button
          key={i}
          className="fs-badge"
          onClick={() => onRemove(f.key, f.value)}
          title={`Remove "${f.label}"`}
        >
          {f.label}
          <span className="fs-badge-remove">✕</span>
        </button>
      ))}
      {filters.length > 1 && (
        <button className="fs-badge" onClick={onClearAll} style={{ opacity: 0.7 }}>
          Clear all <span className="fs-badge-remove">✕</span>
        </button>
      )}
    </div>
  );
}

// ── SortDropdown ─────────────────────────────────────────────────────────────

export function SortDropdown({ options, value, onChange, label = 'Sort' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handler = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selected = options.find(o => o.value === value) || options[0];

  return (
    <div className="fs-sort-wrap" ref={ref}>
      <button
        className={`fs-sort-btn ${open ? 'active' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        <span>{selected?.icon || '↕'}</span>
        <span>{selected?.label || label}</span>
        <span className="fs-sort-chevron">▼</span>
      </button>
      {open && (
        <div className="fs-sort-dropdown">
          {options.map(opt => (
            <div
              key={opt.value}
              className={`fs-sort-item ${opt.value === value ? 'selected' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              <span>{opt.icon}</span>
              <span>{opt.label}</span>
              {opt.value === value && <span style={{ marginLeft: 'auto' }}>✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── FilterSidebar — Desktop ───────────────────────────────────────────────────

export function FilterSidebar({ children, activeCount, onClearAll }) {
  return (
    <aside className="fs-sidebar">
      <div className="fs-sidebar-inner">
        <div className="fs-sidebar-header">
          <h3 className="fs-sidebar-title">
            <span>⚡</span> Filters
            {activeCount > 0 && (
              <span className="fs-filter-count-badge">{activeCount}</span>
            )}
          </h3>
          {activeCount > 0 && (
            <button className="fs-clear-all" onClick={onClearAll}>
              Clear all
            </button>
          )}
        </div>
        {children}
      </div>
    </aside>
  );
}

// ── FilterMobileDrawer ────────────────────────────────────────────────────────

export function FilterMobileDrawer({ open, onClose, children, activeCount, onClearAll }) {
  // Prevent body scroll when open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <div
        className={`fs-drawer-overlay ${open ? 'open' : ''}`}
        onClick={onClose}
      />
      <div className={`fs-drawer ${open ? 'open' : ''}`}>
        <div className="fs-drawer-header">
          <h3 className="fs-sidebar-title">
            <span>⚡</span> Filters
            {activeCount > 0 && (
              <span className="fs-filter-count-badge">{activeCount}</span>
            )}
          </h3>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {activeCount > 0 && (
              <button className="fs-clear-all" onClick={onClearAll}>
                Clear all
              </button>
            )}
            <button className="fs-drawer-close" onClick={onClose}>✕</button>
          </div>
        </div>
        {children}
      </div>
    </>
  );
}

// ── MobileFilterButton ────────────────────────────────────────────────────────

export function MobileFilterButton({ onClick, activeCount }) {
  return (
    <button className="fs-mobile-filter-btn" onClick={onClick}>
      <span>⚡</span>
      <span>Filters</span>
      {activeCount > 0 && (
        <span className="fs-filter-count-badge">{activeCount}</span>
      )}
    </button>
  );
}

// ── EmptyState ────────────────────────────────────────────────────────────────

export function EmptyState({
  icon = '🔍',
  title = 'No results found',
  subtitle = 'Try adjusting your filters or search terms.',
  action,
  actionLabel = 'Clear Filters',
}) {
  return (
    <div className="fs-empty">
      <div className="fs-empty-icon">{icon}</div>
      <h3 className="fs-empty-title">{title}</h3>
      <p className="fs-empty-sub">{subtitle}</p>
      {action && (
        <div className="fs-empty-action">
          <button className="btn btn-outline" onClick={action}>
            {actionLabel}
          </button>
        </div>
      )}
    </div>
  );
}

// ── SkeletonCard ──────────────────────────────────────────────────────────────

export function SkeletonCard({ lines = 3 }) {
  return (
    <div className="fs-skeleton-card">
      <div className="fs-skeleton-line" style={{ height: 18, width: '70%' }} />
      <div className="fs-skeleton-line" style={{ height: 13, width: '45%' }} />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="fs-skeleton-line"
          style={{ height: 12, width: `${85 - i * 10}%` }}
        />
      ))}
      <div
        className="fs-skeleton-line"
        style={{ height: 34, width: '60%', borderRadius: 8, marginTop: 8 }}
      />
    </div>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <div className="fs-skeleton-grid">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
