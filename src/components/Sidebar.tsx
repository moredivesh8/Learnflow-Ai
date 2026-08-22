import React from 'react';
import { 
  Compass, 
  Calendar, 
  HelpCircle, 
  BarChart3, 
  Folder, 
  Flame, 
  Zap, 
  Sparkles, 
  PlayCircle,
  Clock,
  Layers,
  ArrowUpRight,
  Sun,
  Moon
} from 'lucide-react';
import { ViewState, StudyPlan } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  activePlan: StudyPlan | null;
  onLoadDemo: () => void;
  onOpenWalkthrough: () => void;
  isDarkMode?: boolean;
  onToggleTheme?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  activePlan,
  onLoadDemo,
  onOpenWalkthrough,
  isDarkMode = false,
  onToggleTheme,
}) => {
  // Navigation links matching the High Density theme specification
  const navItems = [
    { id: 'dashboard' as ViewState, label: 'Dashboard', icon: Compass, badge: activePlan?.adaptationCount ? '⚡' : undefined },
    { id: 'roadmap' as ViewState, label: 'Study Roadmap', icon: Calendar, badge: activePlan?.adaptationCount ? `${activePlan.adaptationCount}` : undefined },
    { id: 'quiz' as ViewState, label: 'Practice Quizzes', icon: HelpCircle },
    { id: 'progress' as ViewState, label: 'Mastery Progress', icon: BarChart3 },
    { id: 'setup' as ViewState, label: 'Study Materials', icon: Folder },
  ];

  // Calculate days remaining
  const examDateObj = activePlan ? new Date(activePlan.examDate) : new Date();
  const today = new Date();
  const diffDays = Math.max(1, Math.ceil((examDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
        <button
          id="sidebar-logo-btn"
          onClick={() => onNavigate('landing')}
          className="flex items-center space-x-2.5 group cursor-pointer focus:outline-none text-left"
        >
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white shadow-sm font-bold text-lg group-hover:bg-indigo-700 transition-colors">
            L
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white block leading-tight">
              LearnFlow <span className="text-indigo-600 dark:text-indigo-400">AI</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest block leading-none">
              High Density
            </span>
          </div>
        </button>

        <button
          id="sidebar-walkthrough-guide-btn"
          onClick={onOpenWalkthrough}
          className="p-1 rounded-md text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-colors cursor-pointer"
          title="Open Hackathon Demo Walkthrough"
        >
          <Sparkles className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Main Navigation
        </div>

        {navItems.map((item) => {
          const isActive = currentView === item.id || (item.id === 'quiz' && currentView === 'results');
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              id={`sidebar-nav-${item.id}`}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold border border-indigo-200/60 dark:border-indigo-800/60 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className="text-[10px] bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 px-1.5 py-0.2 rounded font-bold">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        <div className="pt-4 px-3 pb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
          Quick Tools
        </div>

        <button
          id="sidebar-demo-walkthrough-btn"
          onClick={onOpenWalkthrough}
          className="w-full flex items-center space-x-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg text-xs font-medium transition-colors cursor-pointer"
        >
          <PlayCircle className="w-4 h-4 text-amber-500" />
          <span>Demo Guide</span>
        </button>

        <button
          id="sidebar-home-landing-btn"
          onClick={() => onNavigate('landing')}
          className="w-full flex items-center space-x-3 px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg text-xs font-medium transition-colors cursor-pointer"
        >
          <Layers className="w-4 h-4 text-slate-400" />
          <span>Product Overview</span>
        </button>

        {onToggleTheme && (
          <button
            id="sidebar-theme-toggle-btn"
            onClick={onToggleTheme}
            className="w-full flex items-center justify-between px-3 py-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 rounded-lg text-xs font-medium transition-colors cursor-pointer"
          >
            <div className="flex items-center space-x-3">
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-500" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500" />
              )}
              <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
            </div>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 font-mono uppercase">
              {isDarkMode ? 'Dark' : 'Light'}
            </span>
          </button>
        )}
      </nav>

      {/* Active Subject Widget matching High Density spec */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800">
        <div className="bg-slate-900 dark:bg-slate-800 rounded-xl p-3.5 text-white shadow-xs">
          <p className="text-[10px] text-slate-400 mb-0.5 font-bold uppercase tracking-wider">
            Active Subject
          </p>
          <p className="font-bold text-xs truncate text-slate-100" title={activePlan?.subjectName || 'Computer Networks'}>
            {activePlan?.subjectName || 'Computer Networks'}
          </p>
          <div className="mt-2.5 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 italic">
              Exam in {diffDays} days
            </span>
            <button
              id="sidebar-switch-subject-btn"
              onClick={onLoadDemo}
              className="text-[10px] font-semibold bg-indigo-500/25 hover:bg-indigo-500/40 text-indigo-200 px-2 py-0.5 rounded transition-colors cursor-pointer"
            >
              Reset Demo
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
