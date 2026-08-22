import React from 'react';
import { 
  Flame, 
  Sparkles, 
  Sun, 
  Moon, 
  Zap, 
  FolderPlus, 
  HelpCircle,
  PlayCircle,
  Layers
} from 'lucide-react';
import { ViewState, StudyPlan } from '../types';

interface HeaderProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  activePlan: StudyPlan | null;
  isDarkMode: boolean;
  onToggleTheme: () => void;
  onOpenWalkthrough: () => void;
  onStartQuiz: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  activePlan,
  isDarkMode,
  onToggleTheme,
  onOpenWalkthrough,
  onStartQuiz,
}) => {
  const getTitle = () => {
    switch (currentView) {
      case 'dashboard': return 'Learning Dashboard';
      case 'roadmap': return 'Visual Study Roadmap';
      case 'quiz': return 'Practice Quizzes & Diagnostics';
      case 'results': return 'Quiz Performance & Adaptation';
      case 'progress': return 'Mastery Progress Matrix';
      case 'setup': return 'Study Material & Setup';
      default: return 'LearnFlow AI';
    }
  };

  return (
    <header className="h-14 sm:h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 shrink-0 transition-colors z-30">
      {/* View Title + Mode Badges */}
      <div className="flex items-center space-x-3 truncate">
        <h1 className="text-sm sm:text-base font-bold text-slate-800 dark:text-white truncate">
          {getTitle()}
        </h1>
        <span className="hidden sm:inline-flex items-center px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded text-[10px] font-mono font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-700">
          Adaptive Mode On
        </span>
        {activePlan?.adaptationCount ? (
          <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 rounded text-[10px] font-bold uppercase border border-amber-200 dark:border-amber-800">
            <Zap className="w-3 h-3 text-amber-500" />
            {activePlan.adaptationCount} Adapted
          </span>
        ) : null}
      </div>

      {/* Right Controls: Streak + Quick Actions + Dark Mode Toggle */}
      <div className="flex items-center space-x-3 sm:space-x-4">
        {/* Daily Streak Tile */}
        <div className="hidden lg:block text-right">
          <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mb-0.5">
            Daily Streak
          </p>
          <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
            14 Days 🔥
          </p>
        </div>

        <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-800" />

        {/* Demo Guide Button */}
        <button
          id="header-walkthrough-btn"
          onClick={onOpenWalkthrough}
          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <PlayCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span className="hidden md:inline">Demo Guide</span>
        </button>

        {/* Quick Quiz CTA */}
        {currentView !== 'quiz' && (
          <button
            id="header-quick-quiz-btn"
            onClick={onStartQuiz}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Start Quiz</span>
          </button>
        )}

        {/* Theme Toggle Button */}
        <button
          id="header-theme-toggle-btn"
          onClick={onToggleTheme}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>
    </header>
  );
};
