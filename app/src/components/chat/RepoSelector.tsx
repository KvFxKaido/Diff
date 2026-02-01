import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Lock, GitPullRequest } from 'lucide-react';
import type { RepoWithActivity, ActiveRepo } from '@/types';

interface RepoSelectorProps {
  repos: RepoWithActivity[];
  activeRepo: ActiveRepo;
  onSelect: (repo: RepoWithActivity) => void;
}

export function RepoSelector({ repos, activeRepo, onSelect }: RepoSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm transition-colors duration-200 hover:bg-[#111113]"
      >
        <span className="text-[#a1a1aa] font-medium truncate max-w-[140px]">
          {activeRepo.name}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-[#52525b] transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 w-64 rounded-xl border border-[#1a1a1e] bg-[#0f0f11] shadow-xl shadow-black/40 overflow-hidden">
          <div className="max-h-64 overflow-y-auto py-1">
            {repos.map((repo) => {
              const isActive = repo.id === activeRepo.id;
              return (
                <button
                  key={repo.id}
                  onClick={() => {
                    onSelect(repo);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors duration-150 ${
                    isActive
                      ? 'bg-[#0070f3]/10 text-[#0070f3]'
                      : 'text-[#a1a1aa] hover:bg-[#111113]'
                  }`}
                >
                  <span className="flex-1 truncate font-medium">{repo.name}</span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {repo.private && <Lock className="h-3 w-3 text-[#3f3f46]" />}
                    {repo.activity.open_prs > 0 && (
                      <span className="flex items-center gap-0.5 text-xs text-[#3f3f46]">
                        <GitPullRequest className="h-3 w-3" />
                        {repo.activity.open_prs}
                      </span>
                    )}
                    {isActive && <Check className="h-3.5 w-3.5" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
