import React, { useState } from 'react';
import { 
  BarChart3, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  BookOpen, 
  HelpCircle, 
  Sparkles, 
  Layers, 
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Activity
} from 'lucide-react';
import { StudyPlan, Topic, ViewState } from '../types';
import { getMasteryBadgeDetails } from '../utils/masteryCalculator';

interface ProgressViewProps {
  plan: StudyPlan;
  onNavigate: (view: ViewState) => void;
  onStartQuiz: (options?: { topicIds?: string[]; weakFocus?: boolean }) => void;
  onExplainTopic: (topic: Topic) => void;
}

export const ProgressView: React.FC<ProgressViewProps> = ({
  plan,
  onNavigate,
  onStartQuiz,
  onExplainTopic,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterUnit, setFilterUnit] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const units = Array.from(new Set(plan.topics.map(t => t.unit))).filter(Boolean);

  const filteredTopics = plan.topics.filter(topic => {
    const matchesSearch = topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.keyConcepts.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesUnit = filterUnit === 'all' || topic.unit === filterUnit;
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'weak' && topic.masteryScore < 60) ||
      (filterStatus === 'developing' && topic.masteryScore >= 60 && topic.masteryScore < 80) ||
      (filterStatus === 'mastered' && topic.masteryScore >= 80);

    return matchesSearch && matchesUnit && matchesStatus;
  });

  const weakCount = plan.topics.filter(t => t.masteryScore < 60).length;
  const devCount = plan.topics.filter(t => t.masteryScore >= 60 && t.masteryScore < 80).length;
  const masterCount = plan.topics.filter(t => t.masteryScore >= 80).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Stat Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Curriculum Total
          </span>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
            {plan.topics.length} Topics
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {units.length} Modules &amp; Units
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 shadow-xs bg-rose-50/20">
          <span className="text-xs font-bold text-rose-500 uppercase tracking-wider">
            Needs Drill (Weak)
          </span>
          <p className="text-2xl font-bold text-rose-700 dark:text-rose-400 mt-1">
            {weakCount} Topics
          </p>
          <p className="text-xs text-rose-600 dark:text-rose-400">
            Score &lt; 60% • High Priority
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 shadow-xs bg-amber-50/20">
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
            Developing
          </span>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-400 mt-1">
            {devCount} Topics
          </p>
          <p className="text-xs text-amber-600 dark:text-amber-400">
            Score 60-79% • Stabilizing
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 shadow-xs bg-emerald-50/20">
          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            Mastered
          </span>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">
            {masterCount} Topics
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400">
            Score 80%+ • Exam Ready
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="progress-search-input"
            type="text"
            placeholder="Search concepts, key terms, or prerequisites..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            id="progress-filter-unit-select"
            value={filterUnit}
            onChange={(e) => setFilterUnit(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Units ({units.length})</option>
            {units.map((u, i) => (
              <option key={i} value={u}>{u}</option>
            ))}
          </select>

          <select
            id="progress-filter-status-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="all">All Mastery Levels</option>
            <option value="weak">Needs Attention (&lt;60%)</option>
            <option value="developing">Developing (60-79%)</option>
            <option value="mastered">Mastered (80%+)</option>
          </select>

          <button
            id="progress-quiz-filtered-btn"
            onClick={() => onStartQuiz({ topicIds: filteredTopics.map(t => t.id) })}
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Quiz Filtered ({filteredTopics.length})</span>
          </button>
        </div>
      </div>

      {/* High Density Topic Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTopics.map((topic, idx) => {
          const isHigh = topic.masteryScore >= 80;
          const isLow = topic.masteryScore < 60;

          return (
            <div
              key={topic.id || idx}
              className={`bg-white dark:bg-slate-900 rounded-xl border p-4 shadow-xs flex flex-col justify-between transition-all ${
                isLow 
                  ? 'border-rose-200 dark:border-rose-900/60' 
                  : isHigh 
                  ? 'border-slate-200 dark:border-slate-800' 
                  : 'border-slate-200 dark:border-slate-800'
              }`}
            >
              <div>
                {/* Top Badge Row */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {topic.unit} • {topic.difficulty}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    isHigh
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                      : isLow
                      ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                      : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                  }`}>
                    {topic.masteryScore}% Mastery
                  </span>
                </div>

                {/* Topic Name & Summary */}
                <h3 className="text-sm font-bold text-slate-800 dark:text-white leading-snug">
                  {topic.name}
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {topic.summary}
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isHigh ? 'bg-emerald-500' : isLow ? 'bg-rose-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${topic.masteryScore}%` }}
                  />
                </div>

                {/* Key Concepts Chips */}
                <div className="flex flex-wrap gap-1 mt-3">
                  {topic.keyConcepts.slice(0, 3).map((concept, cIdx) => (
                    <span
                      key={cIdx}
                      className="px-1.5 py-0.5 rounded text-[10px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  id={`progress-explain-btn-${idx}`}
                  onClick={() => onExplainTopic(topic)}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Explain Concept</span>
                </button>

                <button
                  id={`progress-quiz-btn-${idx}`}
                  onClick={() => onStartQuiz({ topicIds: [topic.id], weakFocus: isLow })}
                  className="px-2.5 py-1 rounded text-xs font-bold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer"
                >
                  Quiz Now
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
