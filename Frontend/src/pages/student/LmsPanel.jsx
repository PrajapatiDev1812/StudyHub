import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Search, Bell, User, Menu, X, ChevronRight, ChevronDown, CheckCircle, 
  Home, BookOpen, Book, Folder, Pin, FileText, Video, ClipboardList, PenTool, Code, Link, Presentation, 
  Play, Download, Copy, ExternalLink, Bookmark, Star
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const DATA = {
  courses: [
    {
      id: 'ds',
      title: 'Data Science',
      instructor: 'Dr. Alan Turing',
      description: 'Master the fundamentals of data science, from Python to Machine Learning.',
      thumbnail: 'bg-blue-500',
      subjects: [
        {
          id: 'python-basics',
          title: 'Python Basics',
          description: 'Learn the core concepts of Python programming.',
          time: '5h 30m',
          topics: [
            {
              id: 'functions',
              title: 'Functions & Scope',
              objectives: [
                'Understand how to define and call functions.',
                'Learn about parameters, arguments, and return values.',
                'Explore variable scope and lambda functions.'
              ],
              materials: [
                { id: 'notes-pdf', title: 'Official Python Functions Guide', type: 'pdf', duration: '2MB', filename: 'python_functions_official.pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
                { id: 'video-lecture', title: 'Deep Dive: Python Functions', type: 'video', duration: '45m', description: 'In-depth video covering *args, **kwargs, and closures.', url: 'https://www.youtube.com/embed/kqtD5dpn9C8' },
                { id: 'quiz', title: 'Functions Knowledge Check', type: 'quiz', duration: '15m' }
              ]
            },
            {
              id: 'data-structures',
              title: 'Lists & Dictionaries',
              objectives: [
                'Master list comprehensions and tuple unpacking.',
                'Understand dictionary methods and iteration.',
                'Apply data structures to solve complex algorithms.'
              ],
              materials: [
                { id: 'dict-video', title: 'Mastering Dictionaries', type: 'video', duration: '28m', description: 'How to efficiently map keys to values in Python.', url: 'https://www.youtube.com/embed/XCcpzWs-CI4' },
                { id: 'lists-code', title: 'List Comprehensions Demo', type: 'code', duration: '2KB', code: 'squares = [x**2 for x in range(10)]\nprint(squares)' },
                { id: 'ds-assignment', title: 'Inventory Management Assignment', type: 'assignment', duration: '2h', brief: 'Build a small script using dictionaries to track shop inventory.' }
              ]
            }
          ]
        },
        {
          id: 'data-vis',
          title: 'Data Visualization',
          description: 'Visualize data using popular Python libraries.',
          time: '3h 15m',
          topics: [
            {
              id: 'matplotlib-intro',
              title: 'Matplotlib Intro',
              objectives: [
                'Learn the basics of Matplotlib.',
                'Create line plots, scatter plots, and bar charts.',
                'Customize plot aesthetics.'
              ],
              materials: [
                { id: 'matplotlib-video', title: 'Building your first Plot', type: 'video', duration: '30m', description: 'Introduction to figures and axes in Matplotlib.', url: 'https://www.youtube.com/embed/3Xc3CA655Ls' },
                { id: 'matplotlib-code', title: 'Scatter Plot Example', type: 'code', duration: '5KB', code: 'import matplotlib.pyplot as plt\nimport numpy as np\n\nx = np.random.rand(50)\ny = np.random.rand(50)\nplt.scatter(x, y, c="blue", alpha=0.5)\nplt.title("Random Scatter")\nplt.show()' },
                { id: 'matplotlib-link', title: 'Matplotlib Documentation', type: 'link', duration: 'Read', url: 'https://matplotlib.org/stable/tutorials/introductory/pyplot.html', linkDesc: 'Official Pyplot tutorial' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'webdev',
      title: 'Web Development',
      instructor: 'Ada Lovelace',
      description: 'Build modern, responsive websites from scratch.',
      thumbnail: 'bg-green-500',
      subjects: [
        {
          id: 'html-css',
          title: 'Advanced CSS',
          description: 'Modern CSS layouts and animations.',
          time: '8h 0m',
          topics: [
            {
              id: 'flexbox',
              title: 'Flexbox Architecture',
              objectives: [
                'Understand the Flexbox layout model.',
                'Align and distribute items within a container.',
                'Build responsive layouts without floats.'
              ],
              materials: [
                { id: 'flexbox-video', title: 'Flexbox in 50 Minutes', type: 'video', duration: '50m', description: 'A complete video guide to mastering Flexbox containers and items.', url: 'https://www.youtube.com/embed/fYq5JZgSks0' },
                { id: 'flexbox-notes', title: 'Flexbox Cheat Sheet', type: 'pdf', duration: '3MB', filename: 'flexbox_cheatsheet_2024.pdf', url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf' },
                { id: 'flexbox-link', title: 'CSS-Tricks Flexbox Guide', type: 'link', duration: 'Read', url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/', linkDesc: 'The ultimate complete guide to Flexbox by CSS-Tricks' }
              ]
            },
            {
              id: 'css-grid',
              title: 'CSS Grid Layout',
              objectives: [
                'Define grid templates and tracks.',
                'Place items explicitly on the grid.',
                'Combine Grid with Flexbox for macro and micro layouts.'
              ],
              materials: [
                { id: 'grid-link', title: 'MDN Web Docs: CSS Grid', type: 'link', duration: 'Read', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Grid_Layout', linkDesc: 'Official MDN documentation on CSS Grid' },
                { id: 'grid-code', title: 'Holy Grail Layout', type: 'code', duration: '1KB', code: '.container {\n  display: grid;\n  grid-template-columns: 200px 1fr 200px;\n  grid-template-rows: auto 1fr auto;\n  height: 100vh;\n}' },
                { id: 'grid-quiz', title: 'Grid vs Flexbox Quiz', type: 'quiz', duration: '20m' }
              ]
            }
          ]
        },
        {
          id: 'react-js',
          title: 'React Fundamentals',
          description: 'Component-based UI development.',
          time: '12h 30m',
          topics: [
            {
              id: 'hooks-state',
              title: 'State & Hooks',
              objectives: [
                'Master useState and useEffect hooks.',
                'Understand component lifecycle.',
                'Manage complex state objects.'
              ],
              materials: [
                { id: 'react-video', title: 'React Hooks Explained', type: 'video', duration: '1h 15m', description: 'Deep dive into how React Hooks work under the hood.', url: 'https://www.youtube.com/embed/dpw9EHDh2bM' },
                { id: 'react-link', title: 'React Dev Docs', type: 'link', duration: 'Read', url: 'https://react.dev/learn', linkDesc: 'The new official React documentation' },
                { id: 'react-assignment', title: 'Build a Todo App', type: 'assignment', duration: '3h', brief: 'Create a fully functional Todo list app using React hooks, handling additions, deletions, and persistence.' }
              ]
            }
          ]
        }
      ]
    }
  ]
};

// Flat list of all materials for easy lookup
const ALL_MATERIALS = DATA.courses.flatMap(c => 
  c.subjects.flatMap(s => 
    s.topics.flatMap(t => 
      t.materials.map(m => ({ ...m, topicId: t.id, subjectId: s.id, courseId: c.id, topicTitle: t.title, subjectTitle: s.title, courseTitle: c.title }))
    )
  )
);

const getMaterialById = id => ALL_MATERIALS.find(m => m.id === id);

// --- LocalStorage Helpers ---
const safeGet = (key, defaultVal) => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultVal;
  } catch { return defaultVal; }
};
const safeSet = (key, val) => {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
};

// --- Icons Mapping ---
const ICONS = {
  Home: Home,
  CoursesRoot: BookOpen,
  Course: Book,
  Subject: Folder,
  Topic: Pin,
  pdf: FileText,
  video: Video,
  quiz: ClipboardList,
  assignment: PenTool,
  code: Code,
  link: Link,
  ppt: Presentation
};

// --- Components ---

function SkeletonLoader() {
  return (
    <div className="animate-pulse space-y-6 p-6">
      <div className="h-8 bg-[var(--bg-input)] rounded w-1/3 border border-[var(--border-color)]"></div>
      <div className="h-4 bg-[var(--bg-input)] rounded w-1/2 border border-[var(--border-color)]"></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <div className="h-40 bg-[var(--bg-input)] rounded border border-[var(--border-color)]"></div>
        <div className="h-40 bg-[var(--bg-input)] rounded border border-[var(--border-color)]"></div>
        <div className="h-40 bg-[var(--bg-input)] rounded border border-[var(--border-color)]"></div>
      </div>
    </div>
  );
}

function ProgressBar({ pct, color = 'bg-lms-accent' }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setWidth(pct), 50);
    return () => clearTimeout(timer);
  }, [pct]);

  return (
    <div className="w-full bg-[var(--bg-input)] rounded-full h-2 overflow-hidden border border-[var(--border-color)]">
      <div className={`h-2 rounded-full transition-all duration-700 ease-out ${color}`} style={{ width: `${width}%` }}></div>
    </div>
  );
}

// --- Main App Component ---

export default function LmsPanel() {
  const { user } = useAuth();
  const [navState, setNavState] = useState({
    currentPage: 'home', // 'home' | 'courses' | 'course' | 'subject' | 'topic' | 'material'
    selectedCourse: null,
    selectedSubject: null,
    selectedTopic: null,
    selectedMaterial: null,
    breadcrumbs: [{ label: 'Home', page: 'home' }]
  });

  const activeActivity = useMemo(() => {
    if (navState.currentPage === 'home') {
      return {
        name: 'Dashboard Overview',
        color: 'var(--accent-primary, #6c63ff)',
        gradient: 'var(--accent-gradient, linear-gradient(135deg, #6c63ff 0%, #3b82f6 100%))',
        bgGlow: 'rgba(108, 99, 255, 0.15)'
      };
    }
    if (navState.currentPage === 'material' && navState.selectedMaterial) {
      const type = navState.selectedMaterial.type;
      switch (type) {
        case 'video':
          return {
            name: 'Watching Lecture Video',
            color: '#ef4444',
            gradient: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
            bgGlow: 'rgba(239, 68, 68, 0.15)'
          };
        case 'pdf':
          return {
            name: 'Reading Course Notes',
            color: '#0d9488',
            gradient: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
            bgGlow: 'rgba(13, 148, 136, 0.15)'
          };
        case 'quiz':
          return {
            name: 'Taking Topic Quiz',
            color: '#a855f7',
            gradient: 'linear-gradient(135deg, #a855f7 0%, #ec4899 100%)',
            bgGlow: 'rgba(168, 85, 247, 0.15)'
          };
        case 'assignment':
          return {
            name: 'Completing Assignment',
            color: '#d97706',
            gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
            bgGlow: 'rgba(217, 119, 6, 0.15)'
          };
        case 'code':
          return {
            name: 'Analyzing Code',
            color: '#059669',
            gradient: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            bgGlow: 'rgba(5, 150, 105, 0.15)'
          };
        default:
          return {
            name: 'Browsing Resources',
            color: '#2563eb',
            gradient: 'linear-gradient(135deg, #2563eb 0%, #6366f1 100%)',
            bgGlow: 'rgba(37, 99, 235, 0.15)'
          };
      }
    }
    return {
      name: 'Curriculum Browsing',
      color: 'var(--accent-primary, #6c63ff)',
      gradient: 'var(--accent-gradient, linear-gradient(135deg, #6c63ff 0%, #3b82f6 100%))',
      bgGlow: 'rgba(108, 99, 255, 0.15)'
    };
  }, [navState.currentPage, navState.selectedMaterial]);

  const [expandedNodes, setExpandedNodes] = useState(() => safeGet('lms_sidebar_expanded', ['courses-root']));
  const [completedMats, setCompletedMats] = useState(() => safeGet('lms_completed', []));
  const [bookmarkedMats, setBookmarkedMats] = useState(() => safeGet('lms_bookmarks', []));
  const [lastMaterialId, setLastMaterialId] = useState(() => safeGet('lms_last_material', null));
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Persistence effects
  useEffect(() => { safeSet('lms_sidebar_expanded', expandedNodes); }, [expandedNodes]);
  useEffect(() => { safeSet('lms_completed', completedMats); }, [completedMats]);
  useEffect(() => { safeSet('lms_bookmarks', bookmarkedMats); }, [bookmarkedMats]);
  useEffect(() => { if (lastMaterialId) safeSet('lms_last_material', lastMaterialId); }, [lastMaterialId]);

  // Navigation action
  const navigateTo = useCallback((page, ctx = {}) => {
    setIsLoading(true);
    setMobileMenuOpen(false);
    
    setTimeout(() => {
      setNavState(prev => {
        const nextState = { ...prev, currentPage: page };
        
        if (page === 'home' || page === 'courses') {
          nextState.selectedCourse = null;
          nextState.selectedSubject = null;
          nextState.selectedTopic = null;
          nextState.selectedMaterial = null;
        } else if (page === 'course') {
          nextState.selectedSubject = null;
          nextState.selectedTopic = null;
          nextState.selectedMaterial = null;
        } else if (page === 'subject') {
          nextState.selectedTopic = null;
          nextState.selectedMaterial = null;
        } else if (page === 'topic') {
          nextState.selectedMaterial = null;
        }

        Object.assign(nextState, ctx);
        nextState.currentPage = page; // Ensure currentPage is never overwritten by ctx
        
        let crumbs = [{ label: 'Home', page: 'home', context: {} }];
        if (page !== 'home') {
          crumbs.push({ label: 'Courses', page: 'courses', context: {} });
          if (nextState.selectedCourse) crumbs.push({ label: nextState.selectedCourse.title, page: 'course', context: { selectedCourse: nextState.selectedCourse } });
          if (nextState.selectedSubject) crumbs.push({ label: nextState.selectedSubject.title, page: 'subject', context: { selectedCourse: nextState.selectedCourse, selectedSubject: nextState.selectedSubject } });
          if (nextState.selectedTopic) crumbs.push({ label: nextState.selectedTopic.title, page: 'topic', context: { selectedCourse: nextState.selectedCourse, selectedSubject: nextState.selectedSubject, selectedTopic: nextState.selectedTopic } });
          if (nextState.selectedMaterial) crumbs.push({ label: nextState.selectedMaterial.title, page: 'material', context: { selectedCourse: nextState.selectedCourse, selectedSubject: nextState.selectedSubject, selectedTopic: nextState.selectedTopic, selectedMaterial: nextState.selectedMaterial } });
        }
        nextState.breadcrumbs = crumbs;

        // Auto-expand sidebar to reveal current item
        setExpandedNodes(prevNodes => {
          const newNodes = new Set(prevNodes);
          newNodes.add('courses-root');
          if (nextState.selectedCourse) newNodes.add(`c-${nextState.selectedCourse.id}`);
          if (nextState.selectedSubject) newNodes.add(`s-${nextState.selectedSubject.id}`);
          if (nextState.selectedTopic) newNodes.add(`t-${nextState.selectedTopic.id}`);
          return Array.from(newNodes);
        });

        if (page === 'material' && ctx.selectedMaterial) {
          setLastMaterialId(ctx.selectedMaterial.id);
        }

        return nextState;
      });
      setIsLoading(false);
    }, 600);
  }, []);

  // Completion helpers
  const toggleCompletion = useCallback((matId) => {
    setCompletedMats(prev => prev.includes(matId) ? prev.filter(id => id !== matId) : [...prev, matId]);
  }, []);

  const markTopicComplete = useCallback((topic) => {
    const ids = topic.materials.map(m => m.id);
    setCompletedMats(prev => {
      const next = new Set(prev);
      ids.forEach(id => next.add(id));
      return Array.from(next);
    });
  }, []);

  const toggleBookmark = useCallback((matId) => {
    setBookmarkedMats(prev => prev.includes(matId) ? prev.filter(id => id !== matId) : [...prev, matId]);
  }, []);

  // Progress calculations
  const getProgress = useCallback((items) => {
    if (!items || items.length === 0) return 0;
    const ids = items.map(m => m.id);
    const completed = ids.filter(id => completedMats.includes(id)).length;
    return Math.round((completed / ids.length) * 100);
  }, [completedMats]);

  const getCourseProgress = useCallback((course) => {
    const mats = course.subjects.flatMap(s => s.topics.flatMap(t => t.materials));
    return getProgress(mats);
  }, [getProgress]);

  const getSubjectProgress = useCallback((subject) => {
    const mats = subject.topics.flatMap(t => t.materials);
    return getProgress(mats);
  }, [getProgress]);

  const getTopicProgress = useCallback((topic) => {
    return getProgress(topic.materials);
  }, [getProgress]);

  const toggleNode = useCallback((e, nodeId) => {
    e.stopPropagation();
    setExpandedNodes(prev => prev.includes(nodeId) ? prev.filter(id => id !== nodeId) : [...prev, nodeId]);
  }, []);


  // --- Sub-components ---

  const SidebarNode = ({ id, label, icon: Icon, isExpanded, onToggle, onClick, isActive, children, level = 0 }) => (
    <div className="w-full">
      <div 
        className={`flex items-center px-3 py-2 cursor-pointer transition-colors group
          ${isActive ? 'bg-[var(--bg-card-hover)] text-lms-accent border-l-4 border-lms-accent' : 'lms-text-secondary hover:bg-[var(--bg-card-hover)] hover:text-lms-text-primary border-l-4 border-transparent'}
        `}
        style={{ paddingLeft: `${(level * 16) + 12}px` }}
        onClick={onClick}
      >
        <button 
          onClick={(e) => onToggle(e, id)}
          className={`p-1 mr-1 rounded hover:bg-[var(--bg-card-hover)] transition-transform duration-200 ${children ? (isExpanded ? 'rotate-90' : '') : 'invisible'} lms-btn-transparent`}
          style={{ background: 'transparent', border: 'none', outline: 'none', boxShadow: 'none', cursor: 'pointer' }}
        >
          <ChevronRight size={14} />
        </button>
        <Icon size={16} className={`mr-2 ${isActive ? 'text-lms-accent' : 'lms-text-muted group-hover:text-lms-text-primary'}`} />
        <span className="text-[13px] font-medium truncate select-none">{label}</span>
      </div>
      {isExpanded && children && (
        <div className="flex flex-col">
          {children}
        </div>
      )}
    </div>
  );

  const Breadcrumbs = () => (
    <div className="flex items-center text-sm mb-6 flex-wrap gap-2">
      {navState.breadcrumbs.map((crumb, idx) => {
        const isLast = idx === navState.breadcrumbs.length - 1;
        return (
          <React.Fragment key={idx}>
            {idx > 0 && <span className="lms-text-muted font-medium">›</span>}
            <button 
              onClick={() => !isLast && navigateTo(crumb.page, crumb.context)}
              className={`font-medium hover:underline transition-colors ${isLast ? 'lms-text-primary font-bold cursor-default hover:no-underline' : 'text-lms-accent'} lms-btn-transparent`}
              style={{ background: 'transparent', border: 'none', outline: 'none', boxShadow: 'none', padding: 0, margin: 0, cursor: isLast ? 'default' : 'pointer' }}
            >
              {crumb.label}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );

  // --- Pages ---

  const HomePage = () => {
    const lastMaterial = lastMaterialId ? getMaterialById(lastMaterialId) : null;
    const lastMatCourse = lastMaterial ? DATA.courses.find(c => c.id === lastMaterial.courseId) : null;
    const overallProgress = lastMatCourse ? getCourseProgress(lastMatCourse) : 40; // mock 40 if none

    return (
      <div className="animate-fade-in space-y-8">
        <div className="lms-card p-6 rounded-xl flex items-center gap-4">
          <Search className="lms-text-secondary" size={24} />
          <input type="text" placeholder="Search across courses, topics, or materials..." className="w-full text-lg outline-none bg-transparent lms-text-primary placeholder:text-[var(--text-muted)]" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Continue Learning */}
            <section>
              <h2 className="text-xl font-bold lms-text-primary mb-4 flex items-center gap-2"><Play size={20} className="text-lms-accent"/> Continue Learning</h2>
              <div 
                className="lms-card lms-card-hover rounded-xl p-6 cursor-pointer hover:-translate-y-1 transition-all group"
                onClick={() => {
                  if (lastMaterial) {
                    const c = DATA.courses.find(c=>c.id===lastMaterial.courseId);
                    const s = c.subjects.find(s=>s.id===lastMaterial.subjectId);
                    const t = s.topics.find(t=>t.id===lastMaterial.topicId);
                    navigateTo('material', { selectedCourse: c, selectedSubject: s, selectedTopic: t, selectedMaterial: lastMaterial });
                  } else {
                    navigateTo('courses');
                  }
                }}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-lms-accent mb-1">{lastMatCourse ? lastMatCourse.title : 'No Recent Course'}</h3>
                    <p className="text-lg font-bold lms-text-primary">{lastMaterial ? lastMaterial.title : 'Browse Courses to start learning'}</p>
                  </div>
                  {lastMaterial && <div className="bg-[var(--lms-accent-glow)] text-lms-accent border border-[var(--lms-accent)]/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">{lastMaterial.type}</div>}
                </div>
                <div className="flex items-center gap-4 mt-6">
                  <div className="flex-1"><ProgressBar pct={overallProgress} /></div>
                  <span className="text-sm font-bold lms-text-secondary">{overallProgress}%</span>
                </div>
              </div>
            </section>

            {/* My Courses */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold lms-text-primary flex items-center gap-2"><BookOpen size={20} className="text-lms-accent"/> My Courses</h2>
                <button onClick={() => navigateTo('courses')} className="text-lms-accent text-sm font-semibold hover:underline bg-transparent border-none">View All</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {DATA.courses.map(course => {
                  const pct = getCourseProgress(course);
                  return (
                    <div 
                      key={course.id} 
                      className="lms-card lms-card-hover rounded-xl overflow-hidden cursor-pointer hover:-translate-y-1 transition-all"
                      onClick={() => navigateTo('course', { selectedCourse: course })}
                    >
                      <div className={`h-24 ${course.thumbnail}`}></div>
                      <div className="p-5">
                        <h3 className="font-bold lms-text-primary mb-1">{course.title}</h3>
                        <p className="text-sm lms-text-secondary mb-4">{course.instructor}</p>
                        <div className="flex items-center gap-3">
                          <div className="flex-1"><ProgressBar pct={pct} /></div>
                          <span className="text-xs font-bold lms-text-secondary">{pct}%</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Categories */}
            <section>
              <h2 className="text-xl font-bold lms-text-primary mb-4">Categories</h2>
              <div className="flex flex-wrap gap-3">
                {['Data Science', 'Web Dev', 'Design', 'Business'].map(cat => (
                  <button key={cat} className="px-5 py-2.5 lms-card rounded-full text-sm font-medium lms-text-secondary hover:border-lms-accent hover:text-lms-accent transition-colors shadow-sm">{cat}</button>
                ))}
              </div>
            </section>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Upcoming Assignments */}
            <section className="lms-card p-6 rounded-xl">
              <h2 className="text-lg font-bold lms-text-primary mb-4 flex items-center gap-2"><Bell size={18} className="text-lms-accent"/> Upcoming</h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--danger)]/15 flex items-center justify-center text-[var(--danger)] shrink-0"><PenTool size={18}/></div>
                  <div>
                    <h4 className="text-sm font-bold lms-text-primary">Python Basics Quiz</h4>
                    <p className="text-xs font-semibold mt-1" style={{ color: 'var(--danger)' }}>Due in 2 days</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[var(--warning)]/15 flex items-center justify-center text-[var(--warning)] shrink-0"><PenTool size={18}/></div>
                  <div>
                    <h4 className="text-sm font-bold lms-text-primary">Loops Assignment</h4>
                    <p className="text-xs font-semibold mt-1" style={{ color: 'var(--warning)' }}>Due in 5 days</p>
                  </div>
                </div>
              </div>
            </section>

            {/* Announcements */}
            <section className="p-6 rounded-xl text-white gradient-lms-accent shadow-lg lms-pulse">
              <h2 className="text-lg font-bold mb-2 flex items-center gap-2"><Star size={18} className="text-yellow-300"/> New Update</h2>
              <p className="text-sm text-indigo-100 mb-4">Welcome to the new StudyHub LMS! Check out the updated Python course material for this semester.</p>
              <button className="px-4 py-2 bg-white text-slate-900 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-100 transition-colors w-full border-none">View Details</button>
            </section>

            {/* Recently Viewed */}
            <section>
              <h2 className="text-sm font-bold lms-text-muted uppercase tracking-wider mb-3">Recently Viewed</h2>
              <div className="flex flex-wrap gap-2">
                <div className="px-3 py-1.5 lms-input lms-text-secondary text-xs font-semibold rounded hover:bg-[var(--bg-card-hover)] hover:text-lms-text-primary cursor-pointer transition-colors">Functions Video</div>
                <div className="px-3 py-1.5 lms-input lms-text-secondary text-xs font-semibold rounded hover:bg-[var(--bg-card-hover)] hover:text-lms-text-primary cursor-pointer transition-colors">Matplotlib Intro</div>
                <div className="px-3 py-1.5 lms-input lms-text-secondary text-xs font-semibold rounded hover:bg-[var(--bg-card-hover)] hover:text-lms-text-primary cursor-pointer transition-colors">HTML & CSS PDF</div>
              </div>
            </section>
          </div>
        </div>
      </div>
    );
  };

  const CoursesPage = () => (
    <div className="animate-fade-in">
      <h1 className="text-3xl font-bold lms-text-primary mb-8">All Courses</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DATA.courses.map(course => {
          const pct = getCourseProgress(course);
          return (
            <div key={course.id} className="lms-card lms-card-hover rounded-xl overflow-hidden flex flex-col group hover:-translate-y-1 transition-all">
              <div className={`h-32 ${course.thumbnail}`}></div>
              <div className="p-6 flex flex-col flex-1">
                <h2 className="text-xl font-bold lms-text-primary mb-2">{course.title}</h2>
                <p className="text-sm lms-text-secondary mb-4 line-clamp-2">{course.description}</p>
                <div className="flex items-center gap-2 text-xs font-semibold lms-text-secondary mb-6 lms-input w-fit px-3 py-1 rounded-md">
                  <Folder size={14}/> {course.subjects.length} Subjects
                </div>
                <div className="mt-auto">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-bold lms-text-secondary">Progress</span>
                    <span className="text-xs font-bold text-lms-accent">{pct}%</span>
                  </div>
                  <ProgressBar pct={pct} />
                  <button 
                    onClick={() => navigateTo('course', { selectedCourse: course })}
                    className="w-full mt-6 py-2.5 bg-[var(--bg-input)] text-lms-accent font-bold rounded-lg group-hover:gradient-lms-accent group-hover:text-white transition-colors border-none cursor-pointer"
                  >
                    Continue Learning
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const CoursePage = () => {
    const course = navState.selectedCourse;
    const pct = getCourseProgress(course);
    
    // Auto-expand logic for accordion
    const [expandedSubjects, setExpandedSubjects] = useState([course.subjects[0]?.id]);

    const toggleSubject = (id) => {
      setExpandedSubjects(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
    };

    return (
      <div className="animate-fade-in max-w-4xl">
        <div className="lms-card rounded-2xl overflow-hidden mb-8">
          <div className={`h-40 ${course.thumbnail}`}></div>
          <div className="p-8">
            <h1 className="text-3xl font-bold lms-text-primary mb-4">{course.title}</h1>
            <p className="lms-text-secondary mb-6 leading-relaxed">{course.description}</p>
            
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-full lms-input flex items-center justify-center text-lg font-bold lms-text-primary">
                {course.instructor.split(' ').map(n=>n[0]).join('')}
              </div>
              <div>
                <p className="text-sm font-semibold lms-text-muted uppercase tracking-wider">Instructor</p>
                <p className="font-bold lms-text-primary">{course.instructor}</p>
              </div>
            </div>

            <div className="lms-input p-5 rounded-xl border border-[var(--border-color)]">
              <div className="flex justify-between items-end mb-3">
                <div>
                  <p className="text-sm font-semibold lms-text-muted mb-1">Course Progress</p>
                  <p className="text-2xl font-bold lms-text-primary">{pct}% <span className="text-sm font-medium lms-text-secondary">Completed</span></p>
                </div>
                <button 
                  onClick={() => {
                    const firstSub = course.subjects[0];
                    const firstTop = firstSub?.topics[0];
                    const firstMat = firstTop?.materials[0];
                    if (firstMat) navigateTo('material', { selectedCourse: course, selectedSubject: firstSub, selectedTopic: firstTop, selectedMaterial: firstMat });
                  }}
                  className="px-6 py-2.5 gradient-lms-accent text-white font-bold rounded-lg hover:opacity-90 transition-all shadow-sm flex items-center gap-2 border-none cursor-pointer"
                >
                  <Play size={16}/> Continue
                </button>
              </div>
              <ProgressBar pct={pct} />
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-bold lms-text-primary mb-6">Course Curriculum</h2>
        <div className="space-y-4">
          {course.subjects.map((sub, idx) => {
            const isExp = expandedSubjects.includes(sub.id);
            const subPct = getSubjectProgress(sub);
            return (
              <div key={sub.id} className="lms-card rounded-xl overflow-hidden">
                <button 
                  className="w-full px-6 py-5 flex items-center justify-between hover:bg-[var(--bg-card-hover)] transition-colors border-none bg-transparent cursor-pointer"
                  onClick={() => toggleSubject(sub.id)}
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className="w-10 h-10 rounded-lg bg-[var(--bg-input)] text-lms-accent border border-[var(--border-color)] flex items-center justify-center font-bold">{idx + 1}</div>
                    <div>
                      <h3 className="text-lg font-bold lms-text-primary">{sub.title}</h3>
                      <p className="text-sm lms-text-secondary mt-1">{sub.topics.length} Topics • {sub.time}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="hidden sm:block text-right">
                      <span className="text-xs font-bold lms-text-secondary">{subPct}%</span>
                      <div className="w-24 mt-1"><ProgressBar pct={subPct} color="bg-emerald-500" /></div>
                    </div>
                    <ChevronDown size={20} className={`lms-text-secondary transition-transform ${isExp ? 'rotate-180' : ''}`} />
                  </div>
                </button>
                
                {isExp && (
                  <div className="border-t lms-border-color bg-[var(--bg-primary)]/20">
                    {sub.topics.map(topic => {
                      const topicPct = getTopicProgress(topic);
                      const isDone = topicPct === 100;
                      return (
                        <div 
                          key={topic.id} 
                          className="px-6 py-4 flex items-center justify-between hover:bg-[var(--bg-card-hover)] cursor-pointer border-b lms-border-color last:border-0 transition-colors"
                          onClick={() => navigateTo('topic', { selectedCourse: course, selectedSubject: sub, selectedTopic: topic })}
                        >
                          <div className="flex items-center gap-3">
                            {isDone ? <CheckCircle size={18} className="text-emerald-400" /> : <div className="w-[18px] h-[18px] border-2 lms-border-color rounded-full" />}
                            <span className="font-medium lms-text-primary">{topic.title}</span>
                          </div>
                          <span className="text-xs font-semibold lms-text-secondary lms-input px-2 py-1 rounded">{topic.materials.length} Items</span>
                        </div>
                      );
                    })}
                    <div className="p-4 bg-[var(--bg-card)] border-t lms-border-color">
                      <button 
                        className="w-full py-2 text-sm font-bold text-lms-accent hover:bg-[var(--bg-card-hover)] rounded-lg transition-colors border-none bg-transparent cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); navigateTo('subject', { selectedCourse: course, selectedSubject: sub }); }}
                      >
                        Go to Subject Dashboard →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const SubjectPage = () => {
    const subject = navState.selectedSubject;
    const pct = getSubjectProgress(subject);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTopics = subject.topics.filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
      <div className="animate-fade-in max-w-4xl">
        <div className="lms-card p-8 rounded-xl mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-[var(--lms-accent-glow)] text-lms-accent border border-[var(--lms-accent)]/20 text-xs font-bold uppercase tracking-wider rounded-md">Subject</span>
            <span className="text-sm font-medium lms-text-secondary flex items-center gap-1"><Folder size={14}/> {subject.time}</span>
          </div>
          <h1 className="text-3xl font-bold lms-text-primary mb-4">{subject.title}</h1>
          <p className="lms-text-secondary mb-8">{subject.description}</p>
          
          <div className="flex items-center gap-4">
            <div className="flex-1"><ProgressBar pct={pct} color="bg-emerald-500" /></div>
            <span className="text-sm font-bold lms-text-secondary">{pct}% Completed</span>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold lms-text-primary">Topics ({filteredTopics.length})</h2>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 lms-text-muted" />
            <input 
              type="text" 
              placeholder="Filter topics..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 lms-input rounded-lg text-sm focus:outline-none focus:border-[var(--lms-accent)] w-64 shadow-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTopics.map(topic => {
            const topicPct = getTopicProgress(topic);
            const isDone = topicPct === 100;
            return (
              <div 
                key={topic.id} 
                className="lms-card lms-card-hover p-5 rounded-xl cursor-pointer transition-all group"
                onClick={() => navigateTo('topic', { ...navState, selectedTopic: topic })}
              >
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-bold lms-text-primary group-hover:text-lms-accent transition-colors">{topic.title}</h3>
                  {isDone && <span className="text-emerald-400 p-1 rounded-full"><CheckCircle size={14} /></span>}
                </div>
                <div className="flex items-center justify-between mt-6">
                  <span className="text-xs font-semibold lms-text-secondary lms-input px-2 py-1 rounded">{topic.materials.length} Materials</span>
                  <span className="text-xs font-bold text-lms-accent flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">View Topic <ChevronRight size={14}/></span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const TopicPage = () => {
    const topic = navState.selectedTopic;
    const isDone = getTopicProgress(topic) === 100;

    return (
      <div className="animate-fade-in max-w-4xl">
        <div className="lms-card p-8 rounded-xl mb-8 relative overflow-hidden">
          {isDone && <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600 rotate-45 translate-x-12 -translate-y-12"></div>}
          {isDone && <CheckCircle size={20} className="absolute top-4 right-4 text-white z-10" />}
          
          <h1 className="text-3xl font-bold lms-text-primary mb-6">{topic.title}</h1>
          <div className="bg-[var(--bg-input)] p-6 rounded-xl border lms-border-color">
            <h3 className="text-sm font-bold text-lms-accent uppercase tracking-wider mb-4 flex items-center gap-2"><BookOpen size={16}/> Learning Objectives</h3>
            <ul className="space-y-3">
              {topic.objectives.map((obj, i) => (
                <li key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-lms-accent mt-2 shrink-0"></div>
                  <span className="lms-text-secondary">{obj}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="flex justify-between items-end mb-6">
          <h2 className="text-xl font-bold lms-text-primary">Learning Materials</h2>
          {!isDone && (
            <button 
              onClick={() => markTopicComplete(topic)}
              className="text-sm font-bold text-emerald-400 bg-emerald-950/40 px-4 py-2 rounded-lg hover:bg-emerald-900/40 transition-colors flex items-center gap-2 border-none cursor-pointer"
            >
              <CheckCircle size={16}/> Mark All Complete
            </button>
          )}
        </div>

        <div className="space-y-3">
          {topic.materials.map(mat => {
            const Icon = ICONS[mat.type] || FileText;
            const matDone = completedMats.includes(mat.id);
            return (
              <div 
                key={mat.id} 
                className={`p-4 rounded-xl transition-all flex items-center gap-4 group cursor-pointer
                  ${matDone 
                    ? 'border border-emerald-800/40 bg-emerald-950/10' 
                    : 'lms-card lms-card-hover'}`}
                onClick={() => navigateTo('material', { ...navState, selectedMaterial: mat })}
              >
                <div 
                  className={`p-3 rounded-lg flex items-center justify-center shrink-0 transition-colors
                    ${matDone ? 'bg-emerald-950/40 text-emerald-400' : 'lms-input lms-text-secondary group-hover:bg-[var(--bg-card-hover)] group-hover:text-lms-accent'}`}
                >
                  <Icon size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold truncate transition-colors ${matDone ? 'lms-text-muted line-through decoration-slate-600' : 'lms-text-primary group-hover:text-lms-accent'}`}>
                    {mat.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs font-semibold lms-text-secondary uppercase tracking-wide">{mat.type}</span>
                    <span className="text-xs lms-text-muted">•</span>
                    <span className="text-xs lms-text-secondary">{mat.duration}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <button 
                    onClick={(e) => { e.stopPropagation(); toggleCompletion(mat.id); }}
                    className={`p-2 rounded-full transition-colors bg-transparent border-none cursor-pointer ${matDone ? 'text-emerald-400 hover:bg-emerald-950/30' : 'lms-text-muted hover:text-lms-text-primary'}`}
                  >
                    <CheckCircle size={22} className={matDone ? "fill-current text-[var(--bg-card)]" : ""} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const MaterialViewer = () => {
    const mat = navState.selectedMaterial;
    const isDone = completedMats.includes(mat.id);
    const isBookmarked = bookmarkedMats.includes(mat.id);
    const Icon = ICONS[mat.type] || FileText;

    const [quizState, setQuizState] = useState({ current: 0, answers: {}, submitted: false, score: 0 });

    const handleQuizSubmit = () => {
      const s = Object.values(quizState.answers).filter(v => v === 0).length; // Mock correct answer is always index 0
      setQuizState(p => ({ ...p, submitted: true, score: s }));
      if (!isDone) toggleCompletion(mat.id);
    };

    return (
      <div className="animate-fade-in max-w-5xl mx-auto pb-12">
        {/* Top Action Bar */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b lms-border-color">
          <button 
            onClick={() => navigateTo('topic')}
            className="flex items-center gap-2 text-sm font-semibold lms-text-secondary hover:text-lms-accent transition-colors bg-transparent border-none cursor-pointer"
          >
            <ChevronRight size={16} className="rotate-180" /> Back to Topic
          </button>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={() => toggleBookmark(mat.id)}
              className={`p-2 rounded-lg border flex items-center justify-center transition-colors bg-transparent cursor-pointer
                ${isBookmarked ? 'border-yellow-400 bg-yellow-950/15 text-yellow-500' : 'lms-border-color lms-text-secondary hover:bg-[var(--bg-card-hover)] hover:text-lms-accent'}`}
              title="Bookmark"
            >
              <Star size={18} className={isBookmarked ? 'fill-current' : ''} />
            </button>
            <button 
              onClick={() => toggleCompletion(mat.id)}
              className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors border cursor-pointer
                ${isDone ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-400' : 'lms-input lms-text-primary hover:bg-[var(--bg-card-hover)]'}`}
            >
              <CheckCircle size={18} className={isDone ? 'text-emerald-400 fill-current' : 'lms-text-muted'} />
              {isDone ? 'Completed' : 'Mark Complete'}
            </button>
          </div>
        </div>

        {/* Title Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-[var(--lms-accent-glow)] text-lms-accent border border-[var(--lms-accent)]/20 rounded-xl flex items-center justify-center"><Icon size={24}/></div>
          <div>
            <h1 className="text-2xl font-bold lms-text-primary">{mat.title}</h1>
            <p className="text-sm font-medium lms-text-secondary uppercase tracking-wider mt-1">{mat.type} • {mat.duration}</p>
          </div>
        </div>

        {/* Viewers */}
        <div className="lms-card rounded-2xl overflow-hidden">
          
          {/* VIDEO VIEWER */}
          {mat.type === 'video' && (
            <div>
              {mat.url ? (
                <div className="aspect-video bg-black relative w-full">
                  <iframe 
                    width="100%" 
                    height="100%" 
                    src={mat.url} 
                    title={mat.title} 
                    frameBorder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                  ></iframe>
                </div>
              ) : (
                <div className="aspect-video bg-slate-950 relative group flex items-center justify-center">
                  <button className="w-16 h-16 rounded-full bg-lms-accent text-white flex items-center justify-center pl-1 hover:opacity-90 transition-all shadow-lg scale-100 group-hover:scale-110 duration-200 border-none cursor-pointer">
                    <Play size={32} />
                  </button>
                  {/* Fake player controls */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/80 to-transparent flex items-end p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-full flex items-center gap-4">
                      <Play size={16} className="text-white"/>
                      <div className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden cursor-pointer">
                        <div className="w-1/3 h-full bg-lms-accent rounded-full"></div>
                      </div>
                      <span className="text-xs text-white font-medium font-mono">15:20 / {mat.duration}</span>
                    </div>
                  </div>
                </div>
              )}
              <div className="p-6 border-t lms-border-color">
                <h3 className="font-bold lms-text-primary mb-2">Description</h3>
                <p className="lms-text-secondary">{mat.description || 'Watch the lecture video carefully.'}</p>
              </div>
            </div>
          )}

          {/* PDF VIEWER */}
          {mat.type === 'pdf' && (
            <div className="p-6 bg-[var(--bg-primary)]/10">
              <div className="max-w-4xl mx-auto lms-card rounded-lg h-[750px] flex flex-col overflow-hidden">
                <div className="p-3 border-b lms-border-color lms-input flex justify-between items-center lms-text-secondary">
                  <div className="text-sm font-medium">{mat.filename}</div>
                  <div className="flex items-center gap-4">
                    {mat.url ? (
                      <a href={mat.url} download={mat.filename || "document.pdf"} target="_blank" rel="noreferrer" className="p-1.5 hover:bg-[var(--bg-card-hover)] rounded lms-text-primary transition-colors bg-transparent border-none cursor-pointer flex items-center" title="Download PDF"><Download size={16}/></a>
                    ) : (
                      <button className="p-1.5 hover:bg-[var(--bg-card-hover)] rounded lms-text-primary transition-colors bg-transparent border-none cursor-pointer" title="Download PDF"><Download size={16}/></button>
                    )}
                  </div>
                </div>
                <div className="flex-1 w-full h-full relative bg-[var(--bg-card)]">
                  {mat.url ? (
                    <iframe src={mat.url} className="w-full h-full border-none bg-white" title={mat.filename} />
                  ) : (
                    <div className="flex-1 p-8 overflow-hidden relative h-full flex flex-col">
                      {/* Mock PDF Content */}
                      <div className="space-y-4 opacity-10 pointer-events-none">
                        <div className="h-8 bg-slate-400 rounded w-1/2 mb-8"></div>
                        <div className="h-4 bg-slate-400 rounded w-full"></div>
                        <div className="h-4 bg-slate-400 rounded w-full"></div>
                        <div className="h-4 bg-slate-400 rounded w-5/6"></div>
                        <div className="h-32 bg-slate-300 rounded w-full mt-6"></div>
                        <div className="h-4 bg-slate-400 rounded w-full mt-6"></div>
                        <div className="h-4 bg-slate-400 rounded w-4/6"></div>
                      </div>
                      <div className="absolute inset-0 flex items-center justify-center">
                         <span className="px-4 py-2 lms-input lms-text-primary font-bold rounded shadow-lg">Document Preview</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* QUIZ VIEWER */}
          {mat.type === 'quiz' && (
            <div className="p-8">
              <div className="mb-6 pb-6 border-b lms-border-color flex justify-between items-center">
                <h2 className="text-xl font-bold lms-text-primary">Knowledge Check</h2>
                <div className="text-sm font-bold lms-text-secondary lms-input px-3 py-1 rounded-full">3 Questions</div>
              </div>
              
              {!quizState.submitted ? (
                <div className="space-y-8">
                  {[1,2,3].map((q, i) => (
                    <div key={i} className="space-y-4">
                      <p className="font-bold lms-text-primary">Q{i+1}: What is the correct definition of a placeholder concept in Python?</p>
                      <div className="space-y-2 pl-4">
                        {['Correct Concept Answer', 'Completely wrong answer', 'Slightly wrong answer', 'Syntax Error'].map((opt, oIdx) => (
                          <label key={oIdx} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                            ${quizState.answers[i] === oIdx ? 'border-lms-accent bg-[var(--lms-accent-glow)]' : 'lms-border-color hover:bg-[var(--bg-card-hover)]'}`}>
                            <input 
                              type="radio" 
                              name={`q${i}`} 
                              checked={quizState.answers[i] === oIdx}
                              onChange={() => setQuizState(p => ({ ...p, answers: { ...p.answers, [i]: oIdx } }))}
                              className="accent-[var(--lms-accent)]" 
                            />
                            <span className="text-sm font-medium lms-text-secondary">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                  <button 
                    onClick={handleQuizSubmit}
                    disabled={Object.keys(quizState.answers).length < 3}
                    className="w-full py-3 gradient-lms-accent text-white font-bold rounded-lg disabled:opacity-30 transition-colors mt-8 border-none cursor-pointer"
                  >
                    Submit Answers
                  </button>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-6 
                    ${quizState.score >= 2 ? 'bg-emerald-950/30 text-emerald-400' : 'bg-amber-950/30 text-amber-400'}`}>
                    <CheckCircle size={48} />
                  </div>
                  <h2 className="text-3xl font-bold lms-text-primary mb-2">You scored {quizState.score} / 3</h2>
                  <p className="lms-text-secondary mb-8">{quizState.score >= 2 ? 'Great job! You mastered this topic.' : 'Review the materials and try again.'}</p>
                  <button onClick={() => setQuizState({ current: 0, answers: {}, submitted: false, score: 0 })} className="px-6 py-2 bg-transparent border lms-border-color rounded-lg text-sm font-bold lms-text-primary hover:bg-[var(--bg-card-hover)] cursor-pointer">Retake Quiz</button>
                </div>
              )}
            </div>
          )}

          {/* ASSIGNMENT VIEWER */}
          {mat.type === 'assignment' && (
            <div className="p-8">
              <div className="bg-amber-950/20 border border-amber-800/40 rounded-xl p-6 mb-8">
                <h3 className="font-bold text-amber-400 mb-2 flex items-center gap-2"><PenTool size={18}/> Assignment Brief</h3>
                <p className="text-amber-300 text-sm leading-relaxed">{mat.brief || 'Complete the assignment and upload your work below.'}</p>
              </div>

              <div className="border-2 border-dashed lms-border-color rounded-2xl p-12 text-center hover:border-[var(--lms-accent)] hover:bg-[var(--lms-accent-glow)] transition-colors cursor-pointer group">
                <div className="w-16 h-16 lms-input lms-text-secondary rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[var(--bg-card-hover)] group-hover:text-lms-accent transition-colors">
                  <Download size={28} className="rotate-180" />
                </div>
                <h4 className="text-lg font-bold lms-text-primary group-hover:text-lms-accent mb-1">Drag & drop files here</h4>
                <p className="text-sm lms-text-secondary">or click to browse from your computer</p>
                <p className="text-xs lms-text-muted mt-4">Supports PDF, DOCX, ZIP up to 50MB</p>
              </div>
              <div className="mt-6 flex justify-end">
                <button className="px-8 py-3 gradient-lms-accent text-white font-bold rounded-lg hover:opacity-90 shadow-sm border-none cursor-pointer" onClick={() => toggleCompletion(mat.id)}>Submit Assignment</button>
              </div>
            </div>
          )}

          {/* LINK VIEWER */}
          {mat.type === 'link' && (
            <div className="p-12 text-center">
              <div className="w-20 h-20 bg-blue-950/40 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-6 transform -rotate-6">
                <ExternalLink size={36} />
              </div>
              <h2 className="text-2xl font-bold lms-text-primary mb-3">{mat.linkDesc || 'External Resource'}</h2>
              <p className="lms-text-secondary mb-8 max-w-md mx-auto">This material is hosted outside the LMS. Clicking the button below will open a new tab.</p>
              <a href={mat.url || '#'} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-8 py-3 gradient-lms-accent text-white font-bold rounded-xl hover:opacity-90 hover:shadow-lg hover:-translate-y-1 transition-all">
                Open Resource <ExternalLink size={18} />
              </a>
            </div>
          )}

          {/* CODE VIEWER */}
          {mat.type === 'code' && (
            <div>
              <div className="bg-slate-950 p-4 border-b lms-border-color flex justify-between items-center">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                </div>
                <button className="text-slate-400 hover:text-white transition-colors flex items-center gap-2 text-xs font-mono lms-input px-3 py-1.5 rounded border-none cursor-pointer"><Copy size={14}/> Copy</button>
              </div>
              <div className="p-6 bg-[#0d1117] overflow-x-auto">
                <pre className="font-mono text-sm leading-relaxed">
                  {/* Extremely basic syntax highlighting simulator */}
                  {mat.code ? mat.code.split('\n').map((line, i) => (
                    <div key={i} className="flex">
                      <span className="text-slate-600 select-none pr-4 w-8 text-right shrink-0">{i+1}</span>
                      <span className="text-slate-300">
                        {line.replace(/import|as|plt/g, match => `<span class="text-pink-400">${match}</span>`).replace(/'.*?'/g, match => `<span class="text-green-400">${match}</span>`)}
                        {/* We use dangerouslySetInnerHTML safely with hardcoded mock data */}
                        <span dangerouslySetInnerHTML={{__html: line.replace(/\b(import|as|def|for|while|if|else|return)\b/g, '<span class="text-pink-400">$1</span>').replace(/\b(plt|show|plot)\b/g, '<span class="text-blue-400">$1</span>')}} />
                      </span>
                    </div>
                  )) : (
                    <div className="text-slate-500 italic">No code provided.</div>
                  )}
                </pre>
              </div>
            </div>
          )}

          {/* PPT VIEWER */}
          {mat.type === 'ppt' && (
            <div className="p-6 bg-[var(--bg-primary)]/20">
              <div className="aspect-video lms-card shadow-md rounded-xl relative flex items-center justify-center max-w-3xl mx-auto overflow-hidden">
                <div className="absolute top-6 left-6 text-2xl font-bold lms-text-primary tracking-tight opacity-20">Slide Presentation</div>
                <div className="w-2/3 h-1/2 bg-[var(--bg-input)] border-2 border-dashed lms-border-color rounded-xl flex items-center justify-center lms-text-muted font-bold text-lg">
                  Slide 1
                </div>
                <button className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full lms-input shadow-md flex items-center justify-center lms-text-secondary hover:text-lms-accent transition-colors border-none cursor-pointer"><ChevronRight size={24} className="rotate-180"/></button>
                <button className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full lms-input shadow-md flex items-center justify-center lms-text-secondary hover:text-lms-accent transition-colors border-none cursor-pointer"><ChevronRight size={24}/></button>
              </div>
              <div className="max-w-3xl mx-auto mt-4 flex justify-between items-center text-sm font-semibold lms-text-secondary">
                <span>Slide 1 of 24</span>
                <button className="flex items-center gap-2 hover:text-lms-accent transition-colors bg-transparent border-none cursor-pointer"><Download size={16}/> Download PPTX</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // --- Render ---
  return (
    <div 
      className="flex text-[var(--text-primary)] font-sans overflow-hidden lms-panel-root bg-transparent"
      style={{
        '--lms-accent': activeActivity.color,
        '--lms-accent-gradient': activeActivity.gradient,
        '--lms-accent-glow': activeActivity.bgGlow,
      }}
    >
      {/* Dynamic Style Block for custom requirements */}
      <style>{`
        .lms-panel-root {
          margin: -24px -32px;
          height: calc(100vh - var(--navbar-height, 0px));
          background: transparent;
          color: var(--text-primary, #f0f0ff);
        }
        
        .lms-sidebar {
          background-color: var(--bg-sidebar, rgba(15, 15, 40, 0.95)) !important;
          border-right: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
          backdrop-filter: blur(12px);
        }
        
        .lms-header {
          background-color: rgba(15, 15, 40, 0.4) !important;
          border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.08)) !important;
          backdrop-filter: blur(12px);
          color: var(--text-primary, #f0f0ff) !important;
        }

        .lms-content-bg {
          background: transparent;
        }

        .lms-card {
          background-color: var(--bg-card, rgba(25, 25, 60, 0.6)) !important;
          border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08)) !important;
          color: var(--text-primary, #f0f0ff) !important;
          backdrop-filter: blur(8px);
        }

        .lms-card-hover:hover {
          background-color: var(--bg-card-hover, rgba(35, 35, 80, 0.8)) !important;
          border-color: var(--lms-accent) !important;
          box-shadow: 0 0 15px var(--lms-accent-glow) !important;
        }

        .text-lms-accent {
          color: var(--lms-accent) !important;
        }

        .bg-lms-accent {
          background-color: var(--lms-accent) !important;
        }

        .border-lms-accent {
          border-color: var(--lms-accent) !important;
        }

        .gradient-lms-accent {
          background: var(--lms-accent-gradient) !important;
        }

        .lms-text-primary {
          color: var(--text-primary, #f0f0ff) !important;
        }

        .lms-text-secondary {
          color: var(--text-secondary, #a0a0c0) !important;
        }

        .lms-text-muted {
          color: var(--text-muted, #606080) !important;
        }

        .lms-border-color {
          border-color: var(--border-color, rgba(255, 255, 255, 0.08)) !important;
        }

        .lms-input {
          background-color: var(--bg-input, rgba(255, 255, 255, 0.06)) !important;
          border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08)) !important;
          color: var(--text-primary, #f0f0ff) !important;
        }

        .lms-pulse {
          animation: pulseGlow 2s infinite alternate;
        }

        @keyframes pulseGlow {
          0% { box-shadow: 0 0 5px var(--lms-accent-glow); }
          100% { box-shadow: 0 0 15px var(--lms-accent); }
        }
        
        .lms-btn-transparent {
          background: transparent !important;
          background-color: transparent !important;
          border: none !important;
          border-width: 0 !important;
          box-shadow: none !important;
          outline: none !important;
          cursor: pointer;
        }
        
        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* MOBILE OVERLAY */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/75 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-[260px] flex flex-col transition-transform duration-300 lg:relative lg:translate-x-0 overflow-hidden lms-sidebar
          ${mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
        `}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b lms-border-color shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-lms-accent rounded-lg flex items-center justify-center">
              <BookOpen size={18} className="text-white" />
            </div>
            <span className="font-bold text-white tracking-wide">StudyHub LMS</span>
          </div>
          <button className="lg:hidden text-slate-400 hover:text-white bg-transparent border-none cursor-pointer" onClick={() => setMobileMenuOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          <SidebarNode 
            id="home" 
            label="Home Dashboard" 
            icon={ICONS.Home} 
            isActive={navState.currentPage === 'home'}
            onClick={() => navigateTo('home')}
            onToggle={()=>{}}
          />
          
          <div className="mt-4 mb-2 px-6 text-xs font-bold uppercase tracking-wider lms-text-muted">Curriculum</div>
          
          <SidebarNode 
            id="courses-root" 
            label="All Courses" 
            icon={ICONS.CoursesRoot}
            isExpanded={expandedNodes.includes('courses-root')}
            isActive={navState.currentPage === 'courses'}
            onToggle={toggleNode}
            onClick={() => navigateTo('courses')}
          >
            {DATA.courses.map(course => (
              <SidebarNode 
                key={`c-${course.id}`}
                id={`c-${course.id}`}
                label={course.title}
                icon={ICONS.Course}
                level={1}
                isExpanded={expandedNodes.includes(`c-${course.id}`)}
                isActive={navState.selectedCourse?.id === course.id && navState.currentPage === 'course'}
                onToggle={toggleNode}
                onClick={() => navigateTo('course', { selectedCourse: course })}
              >
                {course.subjects.map(subject => (
                  <SidebarNode
                    key={`s-${subject.id}`}
                    id={`s-${subject.id}`}
                    label={subject.title}
                    icon={ICONS.Subject}
                    level={2}
                    isExpanded={expandedNodes.includes(`s-${subject.id}`)}
                    isActive={navState.selectedSubject?.id === subject.id && navState.currentPage === 'subject'}
                    onToggle={toggleNode}
                    onClick={() => navigateTo('subject', { selectedCourse: course, selectedSubject: subject })}
                  >
                    {subject.topics.map(topic => (
                      <SidebarNode
                        key={`t-${topic.id}`}
                        id={`t-${topic.id}`}
                        label={topic.title}
                        icon={ICONS.Topic}
                        level={3}
                        isExpanded={expandedNodes.includes(`t-${topic.id}`)}
                        isActive={navState.selectedTopic?.id === topic.id && navState.currentPage === 'topic'}
                        onToggle={toggleNode}
                        onClick={() => navigateTo('topic', { selectedCourse: course, selectedSubject: subject, selectedTopic: topic })}
                      >
                        {topic.materials.map(mat => (
                          <SidebarNode
                            key={`m-${mat.id}`}
                            id={`m-${mat.id}`}
                            label={mat.title}
                            icon={ICONS[mat.type] || FileText}
                            level={4}
                            isActive={navState.selectedMaterial?.id === mat.id && navState.currentPage === 'material'}
                            onClick={() => navigateTo('material', { selectedCourse: course, selectedSubject: subject, selectedTopic: topic, selectedMaterial: mat })}
                          />
                        ))}
                      </SidebarNode>
                    ))}
                  </SidebarNode>
                ))}
              </SidebarNode>
            ))}
          </SidebarNode>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-0 lms-content-bg">
        {/* TOP NAVBAR */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 shrink-0 z-10 lms-header">
          <div className="flex items-center gap-4">
            <button className="lg:hidden p-2 -ml-2 text-slate-500 hover:bg-[var(--bg-card-hover)] rounded-lg bg-transparent border-none cursor-pointer" onClick={() => setMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="hidden md:flex items-center gap-2 lms-input px-3 py-1.5 rounded-lg focus-within:border-[var(--lms-accent)] transition-colors w-64 lg:w-96">
              <Search size={16} className="lms-text-secondary" />
              <input type="text" placeholder="Quick Search..." className="bg-transparent border-none outline-none text-sm w-full lms-text-primary" />
            </div>
            
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4">
            <button className="flex items-center gap-3 p-1 pr-3 hover:bg-[var(--bg-card-hover)] rounded-full transition-colors bg-transparent border-none cursor-pointer">
              <div className="w-8 h-8 rounded-full bg-[var(--lms-accent-glow)] text-lms-accent border border-[var(--lms-accent)]/20 flex items-center justify-center font-bold text-sm uppercase">
                {user?.username ? user.username[0] : 'U'}
              </div>
              <span className="text-sm font-semibold lms-text-primary hidden sm:block">
                {user?.username || 'User'}
              </span>
              <ChevronDown size={14} className="lms-text-secondary hidden sm:block" />
            </button>
          </div>
        </header>

        {/* SCROLLABLE PAGE CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar relative">
          <div className="max-w-7xl mx-auto h-full">
            <Breadcrumbs />
            
            {isLoading ? (
              <SkeletonLoader />
            ) : (
              <>
                {navState.currentPage === 'home' && <HomePage />}
                {navState.currentPage === 'courses' && <CoursesPage />}
                {navState.currentPage === 'course' && <CoursePage />}
                {navState.currentPage === 'subject' && <SubjectPage />}
                {navState.currentPage === 'topic' && <TopicPage />}
                {navState.currentPage === 'material' && <MaterialViewer />}
              </>
            )}
          </div>
        </div>
      </main>

    </div>
  );
}
