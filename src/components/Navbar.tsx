import React from 'react';
import { 
  Sparkles, 
  Compass, 
  Calendar, 
  HelpCircle, 
  BarChart3, 
  PlusCircle, 
  Flame, 
  Zap, 
  PlayCircle 
} from 'lucide-react';
import { ViewState, StudyPlan } from '../types';

interface NavbarProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  activePlan: StudyPlan | null;
  onLoadDemo: () => void;
  onOpenWalkthrough: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  activePlan,
  onLoadDemo,
  onOpenWalkthrough,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <button
            id="nav-logo-btn"
            onClick={() => onNavigate('landing')}
            className="flex items-center gap-2.5 group text-left cursor-pointer focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                  LearnFlow<span className="text-blue-600 dark:text-blue-400">AI</span>
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800">
                  Adaptive
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
                AI Learning System
              </p>
            </div>
          </button>

          {/* Navigation Links */}
          {activePlan && (
            <nav className="hidden md:flex items-center gap-1">
              <button
                id="nav-dashboard-btn"
                onClick={() => onNavigate('dashboard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  currentView === 'dashboard'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                Dashboard
              </button>

              <button
                id="nav-roadmap-btn"
                onClick={() => onNavigate('roadmap')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  currentView === 'roadmap'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Study Roadmap
                {activePlan.adaptationCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Roadmap Adapted" />
                )}
              </button>

              <button
                id="nav-quiz-btn"
                onClick={() => onNavigate('quiz')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  currentView === 'quiz' || currentView === 'results'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                Take Quiz
              </button>

              <button
                id="nav-progress-btn"
                onClick={() => onNavigate('progress')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                  currentView === 'progress'
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Topic Mastery
              </button>
            </nav>
          )}
        </div>

        {/* Action Controls & Demo Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Hackathon Demo Walkthrough Button */}
          <button
            id="nav-walkthrough-btn"
            onClick={onOpenWalkthrough}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Open 90-Second Adaptive Loop Walkthrough"
          >
            <PlayCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span className="hidden sm:inline">Demo Guide</span>
          </button>

          {/* Quick Demo Switcher */}
          <button
            id="nav-load-demo-btn"
            onClick={onLoadDemo}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Load Sample Computer Networks Dataset"
          >
            <Flame className="w-3.5 h-3.5 text-orange-500" />
            <span className="hidden sm:inline">Load Sample</span>
            <span className="sm:hidden">Sample</span>
          </button>

          {/* New Plan / Upload Button */}
          <button
            id="nav-new-plan-btn"
            onClick={() => onNavigate('setup')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer ${
              currentView === 'setup'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 hover:shadow-md'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Upload Material</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation Strip */}
      {activePlan && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 px-3 py-1.5 flex items-center justify-around bg-slate-50 dark:bg-slate-900/90 text-xs">
          <button
            id="nav-mob-dash-btn"
            onClick={() => onNavigate('dashboard')}
            className={`p-1.5 flex flex-col items-center gap-0.5 ${
              currentView === 'dashboard' ? 'text-blue-600 font-semibold' : 'text-slate-500'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>Overview</span>
          </button>

          <button
            id="nav-mob-roadmap-btn"
            onClick={() => onNavigate('roadmap')}
            className={`p-1.5 flex flex-col items-center gap-0.5 ${
              currentView === 'roadmap' ? 'text-blue-600 font-semibold' : 'text-slate-500'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Roadmap</span>
          </button>

          <button
            id="nav-mob-quiz-btn"
            onClick={() => onNavigate('quiz')}
            className={`p-1.5 flex flex-col items-center gap-0.5 ${
              currentView === 'quiz' ? 'text-blue-600 font-semibold' : 'text-slate-500'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Quiz</span>
          </button>

          <button
            id="nav-mob-progress-btn"
            onClick={() => onNavigate('progress')}
            className={`p-1.5 flex flex-col items-center gap-0.5 ${
              currentView === 'progress' ? 'text-blue-600 font-semibold' : 'text-slate-500'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Mastery</span>
          </button>
        </div>
      )}
    </header>
  );
};
