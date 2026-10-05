import React, { useState, useEffect } from 'react';
import { Command } from 'cmdk';
import { Search } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import { useSmartSearch } from '../hooks/queries';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  const debouncedQuery = useDebounce(inputValue, 300);
  const { data: searchResults, isLoading } = useSmartSearch(debouncedQuery);
  const [recentSearches, setRecentSearches] = useState(() => {
    const stored = localStorage.getItem('studyhub_recent_searches');
    if (stored) {
      try { return JSON.parse(stored); } catch { return []; }
    }
    return [];
  });

  const saveRecentSearch = (term) => {
    if (!term) return;
    const newRecent = [term, ...recentSearches.filter(t => t !== term)].slice(0, 5);
    setRecentSearches(newRecent);
    localStorage.setItem('studyhub_recent_searches', JSON.stringify(newRecent));
  };

  useEffect(() => {
    const down = (e) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
      <div 
        className="absolute inset-0 bg-[var(--theme-surface)]/40 backdrop-blur-[4px]" 
        onClick={() => setOpen(false)}
      />
      
      <div className="relative w-full max-w-xl mx-4 bg-[var(--theme-surface)] shadow-2xl rounded-xl border border-[var(--theme-border)] overflow-hidden" role="dialog" aria-modal="true" aria-label="Search StudyHub">
        <Command 
          label="Search StudyHub"
          shouldFilter={false}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
          }}
        >
          <div className="flex items-center border-b border-[var(--theme-border)] px-4">
            <Search className="w-5 h-5 text-[var(--theme-muted)] mr-3" />
            <Command.Input 
              value={inputValue}
              onValueChange={setInputValue}
              placeholder="Search courses, notes, teachers..." 
              className="w-full bg-transparent text-[var(--theme-text)] placeholder:text-[var(--theme-muted)] h-14 outline-none text-base"
              autoFocus
            />
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto p-2">
            {isLoading && <Command.Loading className="p-4 text-sm text-[var(--theme-muted)]">Searching...</Command.Loading>}
            
            {!isLoading && !debouncedQuery && recentSearches.length > 0 && (
              <Command.Group heading="Recent Searches" className="text-xs font-medium text-[var(--theme-muted)] px-2 py-2">
                {recentSearches.map((term, idx) => (
                  <Command.Item 
                    key={idx} 
                    onSelect={() => {
                      setInputValue(term);
                    }}
                    className="flex items-center px-3 py-2 text-sm text-[var(--theme-text)] rounded-md cursor-pointer hover:bg-black/10 data-[selected=true]:bg-[var(--theme-primary)]/20 data-[selected=true]:text-[var(--theme-text)]"
                  >
                    {term}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {!isLoading && searchResults?.length === 0 && debouncedQuery && (
              <Command.Empty className="p-4 text-sm text-center text-[var(--theme-muted)]">
                No results found.
              </Command.Empty>
            )}

            {!isLoading && searchResults?.map((group) => (
              <Command.Group 
                key={group.category} 
                heading={group.category} 
                className="text-xs font-medium text-[var(--theme-muted)] px-2 py-2"
              >
                {group.items.map(item => {
                  const index = item.title.toLowerCase().indexOf(debouncedQuery.toLowerCase());
                  const before = item.title.slice(0, index);
                  const match = item.title.slice(index, index + debouncedQuery.length);
                  const after = item.title.slice(index + debouncedQuery.length);

                  return (
                    <Command.Item 
                      key={item.id} 
                      onSelect={() => {
                        saveRecentSearch(item.title);
                        setOpen(false);
                      }}
                      className="flex items-center px-3 py-2 text-sm text-[var(--theme-text)] rounded-md cursor-pointer data-[selected=true]:bg-[var(--theme-primary)]/20 data-[selected=true]:text-[var(--theme-text)] transition-colors"
                    >
                      {index >= 0 ? (
                        <span>
                          {before}
                          <mark className="bg-[var(--theme-accent)]/30 text-[var(--theme-accent)] rounded-sm px-0.5 font-semibold bg-transparent">
                            {match}
                          </mark>
                          {after}
                        </span>
                      ) : (
                        item.title
                      )}
                    </Command.Item>
                  );
                })}
              </Command.Group>
            ))}
          </Command.List>
        </Command>
      </div>
    </div>
  );
}
