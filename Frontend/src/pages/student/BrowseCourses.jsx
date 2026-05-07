import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import useFilters from '../../hooks/useFilters';
import {
  SearchInput, FilterSidebar, FilterMobileDrawer, MobileFilterButton,
  FilterGroup, FilterOption, SortDropdown, ActiveFilterBadges,
  EmptyState, SkeletonGrid,
} from '../../components/FilterSystem/FilterComponents';
import './BrowseCourses.css';

// ── Constants ─────────────────────────────────────────────────────────────────

const FILTER_DEFAULTS = {
  search: '',
  category: '',
  level: '',
  duration: '',
  language: '',
  is_free: '',
  has_certification: '',
  min_rating: '',
  ordering: '-created_at',
};

const SORT_OPTIONS = [
  { value: '-created_at',       label: 'Newest First',    icon: '🆕' },
  { value: 'created_at',        label: 'Oldest First',    icon: '📅' },
  { value: '-popularity_score', label: 'Most Popular',    icon: '🔥' },
  { value: '-rating',           label: 'Highest Rated',   icon: '⭐' },
  { value: 'name',              label: 'A → Z',           icon: '🔤' },
  { value: '-name',             label: 'Z → A',           icon: '🔡' },
  { value: 'price',             label: 'Price: Low → High', icon: '💰' },
  { value: '-price',            label: 'Price: High → Low', icon: '💸' },
];

const LEVEL_OPTIONS = [
  { value: 'beginner',     label: 'Beginner',     icon: '🌱' },
  { value: 'intermediate', label: 'Intermediate', icon: '🚀' },
  { value: 'advanced',     label: 'Advanced',     icon: '🏆' },
];

const DURATION_OPTIONS = [
  { value: 'short',  label: 'Short (< 5 hrs)',    icon: '⚡' },
  { value: 'medium', label: 'Medium (5–20 hrs)',   icon: '⏱️' },
  { value: 'long',   label: 'Long (> 20 hrs)',     icon: '📚' },
];

const RATING_OPTIONS = [
  { value: '4', label: '4★ & above', icon: '⭐' },
  { value: '3', label: '3★ & above', icon: '⭐' },
];

const LABEL_MAP = {
  level:            { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' },
  duration:         { short: 'Short', medium: 'Medium', long: 'Long' },
  is_free:          { true: 'Free', false: 'Paid' },
  has_certification: { true: 'With Certificate' },
  min_rating:       { '4': '4★ & above', '3': '3★ & above' },
};

// ── Course Card ───────────────────────────────────────────────────────────────

function CourseCard({ course, onEnroll }) {
  const levelColors = { beginner: 'success', intermediate: 'info', advanced: 'warning' };
  const badge = levelColors[course.level] || 'info';

  return (
    <div className="bc-card glass-card">
      {/* Thumbnail / Placeholder */}
      <div className="bc-card-thumb">
        {course.thumbnail ? (
          <img src={course.thumbnail} alt={course.name} />
        ) : (
          <div className="bc-card-thumb-placeholder">
            {course.category_icon || '📘'}
          </div>
        )}
        {course.has_certification && (
          <span className="bc-cert-badge" title="Includes Certificate">🏅</span>
        )}
      </div>

      {/* Body */}
      <div className="bc-card-body">
        <div className="bc-card-meta-top">
          {course.category_name && (
            <span className="bc-category-chip">{course.category_icon} {course.category_name}</span>
          )}
          {course.level && (
            <span className={`badge badge-${badge} bc-level-badge`}>
              {LEVEL_OPTIONS.find(l => l.value === course.level)?.icon} {course.level}
            </span>
          )}
        </div>

        <h3 className="bc-card-title">{course.name}</h3>
        <p className="bc-card-desc">{course.description?.slice(0, 110)}{course.description?.length > 110 ? '…' : ''}</p>

        <div className="bc-card-stats">
          <span className="bc-stat">👨‍🎓 {course.enrolled_count || 0}</span>
          {course.rating > 0 && (
            <span className="bc-stat">⭐ {Number(course.rating).toFixed(1)}</span>
          )}
          {course.duration && (
            <span className="bc-stat">
              {DURATION_OPTIONS.find(d => d.value === course.duration)?.icon} {course.duration}
            </span>
          )}
          {course.language && course.language !== 'English' && (
            <span className="bc-stat">🌐 {course.language}</span>
          )}
        </div>

        <div className="bc-card-footer">
          <div className="bc-card-price">
            {Number(course.price) === 0
              ? <span className="bc-free-badge">🆓 Free</span>
              : <span className="bc-paid-badge">₹{Number(course.price).toFixed(0)}</span>
            }
          </div>
          <div className="bc-card-actions">
            <Link to={`/student/courses/${course.id}`} className="btn btn-secondary btn-sm">
              Details
            </Link>
            {course.is_enrolled ? (
              <span className="badge badge-success bc-enrolled-badge">✓ Enrolled</span>
            ) : (
              <button className="btn btn-primary btn-sm" onClick={() => onEnroll(course.id)}>
                Enroll
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function BrowseCourses() {
  const [courses, setCourses]       = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [total, setTotal]           = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const {
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
  } = useFilters(FILTER_DEFAULTS);

  // ── Fetch categories (once) ─────────────────────────────────────────────
  useEffect(() => {
    api.get('/categories/')
      .then(res => setCategories(res.data.results || res.data))
      .catch(() => {});
  }, []);

  // ── Fetch courses (re-runs on filter change) ────────────────────────────
  const fetchCourses = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQueryString();
      const res = await api.get(`/courses/?${qs}`);
      const data = res.data;
      setCourses(data.results || data);
      setTotal(data.count ?? (data.results || data).length);
    } catch {
      setCourses([]);
    } finally {
      setLoading(false);
    }
  }, [buildQueryString]);

  useEffect(() => { fetchCourses(); }, [fetchCourses]);

  // ── Enroll ──────────────────────────────────────────────────────────────
  const handleEnroll = async (courseId) => {
    try {
      await api.post(`/courses/${courseId}/enroll/`);
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to enroll');
    }
  };

  // ── Active filter chips ─────────────────────────────────────────────────
  const activeFilters = getActiveFilters(LABEL_MAP);

  // ── Shared filter panel (used in both sidebar & drawer) ─────────────────
  const FilterPanel = () => (
    <>
      {/* Category */}
      {categories.length > 0 && (
        <FilterGroup label="Category">
          {categories.map(cat => (
            <FilterOption
              key={cat.id}
              label={cat.name}
              icon={cat.icon}
              count={cat.course_count}
              selected={filters.category === String(cat.id)}
              onClick={() => setFilter('category', filters.category === String(cat.id) ? '' : String(cat.id))}
              multi={false}
            />
          ))}
        </FilterGroup>
      )}

      {/* Level */}
      <FilterGroup label="Level">
        {LEVEL_OPTIONS.map(opt => (
          <FilterOption
            key={opt.value}
            label={opt.label}
            icon={opt.icon}
            selected={filters.level === opt.value}
            onClick={() => setFilter('level', filters.level === opt.value ? '' : opt.value)}
            multi={false}
          />
        ))}
      </FilterGroup>

      {/* Duration */}
      <FilterGroup label="Duration">
        {DURATION_OPTIONS.map(opt => (
          <FilterOption
            key={opt.value}
            label={opt.label}
            icon={opt.icon}
            selected={filters.duration === opt.value}
            onClick={() => setFilter('duration', filters.duration === opt.value ? '' : opt.value)}
            multi={false}
          />
        ))}
      </FilterGroup>

      {/* Rating */}
      <FilterGroup label="Rating" defaultOpen={false}>
        {RATING_OPTIONS.map(opt => (
          <FilterOption
            key={opt.value}
            label={opt.label}
            icon={opt.icon}
            selected={filters.min_rating === opt.value}
            onClick={() => setFilter('min_rating', filters.min_rating === opt.value ? '' : opt.value)}
            multi={false}
          />
        ))}
      </FilterGroup>

      {/* Price */}
      <FilterGroup label="Price" defaultOpen={false}>
        <FilterOption
          label="Free"
          icon="🆓"
          selected={filters.is_free === 'true'}
          onClick={() => setFilter('is_free', filters.is_free === 'true' ? '' : 'true')}
          multi={false}
        />
        <FilterOption
          label="Paid"
          icon="💳"
          selected={filters.is_free === 'false'}
          onClick={() => setFilter('is_free', filters.is_free === 'false' ? '' : 'false')}
          multi={false}
        />
      </FilterGroup>

      {/* Certification */}
      <FilterGroup label="Certification" defaultOpen={false}>
        <FilterOption
          label="With Certificate"
          icon="🏅"
          selected={filters.has_certification === 'true'}
          onClick={() => setFilter('has_certification', filters.has_certification === 'true' ? '' : 'true')}
          multi={false}
        />
      </FilterGroup>
    </>
  );

  return (
    <div className="fade-in bc-page">
      {/* Page Header */}
      <div className="page-header">
        <h1>Browse Courses</h1>
        <p>Discover, filter, and enroll in courses tailored to you</p>
      </div>

      {/* Active filter chips */}
      <ActiveFilterBadges
        filters={activeFilters}
        onRemove={(key, value) => {
          if (Array.isArray(filters[key])) toggleFilter(key, value);
          else clearFilter(key);
        }}
        onClearAll={clearAll}
      />

      {/* Top bar: search + mobile filter button + sort */}
      <div className="fs-topbar">
        <SearchInput
          value={searchInput}
          onChange={handleSearchChange}
          placeholder="Search courses by name, description..."
        />
        <MobileFilterButton onClick={() => setDrawerOpen(true)} activeCount={activeCount} />
        <SortDropdown
          options={SORT_OPTIONS}
          value={filters.ordering}
          onChange={val => setFilter('ordering', val)}
        />
        {!loading && (
          <span className="fs-result-count">
            {total} course{total !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Layout: Sidebar + Content */}
      <div className="fs-layout">
        <FilterSidebar activeCount={activeCount} onClearAll={clearAll}>
          <FilterPanel />
        </FilterSidebar>

        <div className="fs-content">
          {loading ? (
            <SkeletonGrid count={6} />
          ) : courses.length === 0 ? (
            <EmptyState
              icon="🎓"
              title="No courses match your filters"
              subtitle="Try removing some filters or search with different keywords."
              action={activeCount > 0 ? clearAll : null}
              actionLabel="Clear Filters"
            />
          ) : (
            <div className="bc-grid">
              {courses.map(course => (
                <CourseCard key={course.id} course={course} onEnroll={handleEnroll} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
      <FilterMobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        activeCount={activeCount}
        onClearAll={clearAll}
      >
        <FilterPanel />
      </FilterMobileDrawer>
    </div>
  );
}
