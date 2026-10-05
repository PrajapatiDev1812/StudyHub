import { useState, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * useFilters — URL-synced filter state manager with debounced search.
 *
 * @param {Object} defaults  — default filter values (shape must match your filter schema)
 * @param {number} debounceMs — debounce delay for search input (default 400ms)
 * @returns filter state, setters, and helpers
 */
export default function useFilters(defaults = {}, debounceMs = 400) {
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Initialise from URL ────────────────────────────────────────────────
  const [filters, setFilters] = useState(() => {
    const result = { ...defaults };
    for (const key of Object.keys(defaults)) {
      const raw = searchParams.get(key);
      if (raw !== null) {
        // Try to parse booleans / arrays from URL
        if (raw === 'true')  { result[key] = true; continue; }
        if (raw === 'false') { result[key] = false; continue; }
        if (raw.startsWith('[')) {
          try { result[key] = JSON.parse(raw); } catch { result[key] = raw; }
          continue;
        }
        result[key] = raw;
      }
    }
    return result;
  });

  // Internal live search value (not debounced)
  const [searchInput, setSearchInput] = useState(filters.search || '');

  // Debounce timer ref
  const debounceRef = useRef(null);

  // ── Sync filters → URL ─────────────────────────────────────────────────
  useEffect(() => {
    const params = {};
    for (const [key, value] of Object.entries(filters)) {
      if (value === null || value === undefined || value === '') continue;
      if (Array.isArray(value) && value.length === 0) continue;
      if (value === defaults[key]) continue; // skip defaults to keep URL clean
      params[key] = Array.isArray(value) ? JSON.stringify(value) : String(value);
    }
    setSearchParams(params, { replace: true });
  }, [filters]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Debounced search ───────────────────────────────────────────────────
  const handleSearchChange = useCallback((value) => {
    setSearchInput(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: value, page: 1 }));
    }, debounceMs);
  }, [debounceMs]);

  // ── Set a single filter value ──────────────────────────────────────────
  const setFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  }, []);

  // ── Toggle a value in a multi-select array ─────────────────────────────
  const toggleFilter = useCallback((key, value) => {
    setFilters(prev => {
      const current = Array.isArray(prev[key]) ? prev[key] : [];
      const next = current.includes(value)
        ? current.filter(v => v !== value)
        : [...current, value];
      return { ...prev, [key]: next, page: 1 };
    });
  }, []);

  // ── Clear all filters ──────────────────────────────────────────────────
  const clearAll = useCallback(() => {
    setFilters({ ...defaults });
    setSearchInput('');
  }, [defaults]);

  // ── Clear a specific filter ────────────────────────────────────────────
  const clearFilter = useCallback((key) => {
    setFilters(prev => ({ ...prev, [key]: defaults[key] ?? '', page: 1 }));
    if (key === 'search') setSearchInput('');
  }, [defaults]);

  // ── Build query string for API call ───────────────────────────────────
  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(filters)) {
      if (value === null || value === undefined || value === '') continue;
      if (Array.isArray(value)) {
        if (value.length > 0) params.append(key, value.join(','));
      } else {
        params.append(key, String(value));
      }
    }
    return params.toString();
  }, [filters]);

  // ── Count active filters (for badge counter) ───────────────────────────
  const activeCount = Object.entries(filters).reduce((n, [key, value]) => {
    if (key === 'page' || key === 'ordering') return n;
    if (value === null || value === undefined || value === '') return n;
    if (value === defaults[key]) return n;
    if (Array.isArray(value) && value.length === 0) return n;
    return n + 1;
  }, 0);

  // ── Build list of active filter labels (for badge chips) ───────────────
  const getActiveFilters = useCallback((labelMap = {}) => {
    const active = [];
    for (const [key, value] of Object.entries(filters)) {
      if (key === 'page' || key === 'ordering' || key === 'search') continue;
      if (value === null || value === undefined || value === '') continue;
      if (value === defaults[key]) continue;
      if (Array.isArray(value)) {
        value.forEach(v => active.push({ key, value: v, label: labelMap[key]?.[v] || v }));
      } else {
        active.push({ key, value, label: labelMap[key]?.[value] || String(value) });
      }
    }
    return active;
  }, [filters, defaults]);

  return {
    filters,
    searchInput,
    setFilter,
    toggleFilter,
    clearAll,
    clearFilter,
    handleSearchChange,
    buildQueryString,
    activeCount,
    getActiveFilters,
  };
}
