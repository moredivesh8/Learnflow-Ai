import React from 'react';
import { 
  Compass, 
  Calendar, 
  HelpCircle, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingDown, 
  TrendingUp, 
  Zap, 
  Clock, 
  BookOpen, 
  ArrowRight, 
  Sparkles, 
  Lightbulb, 
  Target,
  Flame,
  Layers
} from 'lucide-react';
import { StudyPlan, Topic, ViewState } from '../types';
import { getMasteryBadgeDetails } from '../utils/masteryCalculator';

interface DashboardViewProps {
  plan: StudyPlan;
  onNavigate: (view: ViewState) => void;
  onStartQuiz: (options?: { topicIds?: string[]; weakFocus?: boolean }) => void;
  onExplainTopic: (topic: Topic) => void;
  onTriggerAdaptationDemo: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  plan,
  onNavigate,
  onStartQuiz,
  onExplainTopic,
  onTriggerAdaptationDemo,
}) => {
  // Sort topics by mastery
  const sortedTopics = [...plan.topics].sort((a, b) => b.masteryScore - a.masteryScore);
  const strongestTopic = sortedTopics[0] || plan.topics[0];
  
  const weakTopics = plan.topics
    .filter(t => t.masteryScore < 60)
    .sort((a, b) => a.masteryScore - b.masteryScore);

  const topWeakTopics = weakTopics.slice(0, 3);
  const masteredTopics = plan.topics.filter(t => t.masteryScore >= 80);

  // Calculate days & hours remaining to exam
  const examDateObj = new Date(plan.examDate);
  const today = new Date();
  const diffDays = Math.max(1, Math.ceil((examDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  const diffHours = diffDays * 24;

  const todayRoadmap = plan.roadmap.find(d => !d.isCompleted) || plan.roadmap[0];

  return (
    <div className="space-y-6 pb-12">
      {/* 4 Stat Metric Cards (High Density Top Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Overall Mastery */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Overall Mastery
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-bold text-slate-800 dark:text-white">
              {plan.overallMastery}%
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
              {plan.overallMastery >= 70 ? '+5% this week' : 'Active diagnostic'}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-indigo-600 dark:bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${plan.overallMastery}%` }}
            />
          </div>
        </div>

        {/* Card 2: Time Remaining */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Time Remaining
          </span>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
            {diffHours} Hours
          </p>
          <p className="text-xs text-rose-500 dark:text-rose-400 font-medium">
            Exam Target: {plan.examDate} ({diffDays} days)
          </p>
        </div>

        {/* Card 3: Strongest Topic */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-center">
          <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Strongest Topic
          </span>
          <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1 truncate" title={strongestTopic?.name}>
            {strongestTopic?.name || 'OSI Model'}
          </p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            {strongestTopic?.masteryScore || 85}% Mastery (Solid)
          </p>
        </div>

        {/* Card 4: Next Action */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-indigo-100 dark:border-indigo-900/60 shadow-xs bg-indigo-50/30 dark:bg-indigo-950/20 flex flex-col justify-center">
          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
            Next Action
          </span>
          <p className="text-lg font-bold text-slate-800 dark:text-white mt-1 leading-tight truncate">
            {weakTopics.length > 0 ? `${weakTopics[0].name.split('&')[0]} Remediation` : `${todayRoadmap?.focusUnit || 'Unit 2 Quiz'}`}
          </p>
          <button
            id="dash-next-action-start-btn"
            onClick={() => onStartQuiz({ weakFocus: weakTopics.length > 0 })}
            className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-colors w-full uppercase tracking-wider cursor-pointer shadow-xs"
          >
            {weakTopics.length > 0 ? 'Practice Weak Topic' : 'Start Today’s Quiz'}
          </button>
        </div>
      </div>

      {/* Adaptive Alert Strip if adapted */}
      {plan.adaptationCount > 0 && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <span className="text-amber-900 dark:text-amber-200">
              <strong>Adaptive Engine Active:</strong> Schedule adapted ({plan.adaptationCount} updates). Weak concepts like <span className="font-semibold">{weakTopics.map(w => w.name).slice(0, 2).join(' & ')}</span> have been re-allocated to immediate review slots.
            </span>
          </div>
          <button
            id="dash-view-adapted-schedule-btn"
            onClick={() => onNavigate('roadmap')}
            className="text-[11px] font-bold text-amber-800 dark:text-amber-300 hover:underline shrink-0 cursor-pointer"
          >
            View Roadmap Timeline →
          </button>
        </div>
      )}

      {/* Main High Density 12-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8-Columns: Visual Study Roadmap */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h2 className="font-bold text-sm sm:text-base text-slate-800 dark:text-white">
                Visual Study Roadmap
              </h2>
              <span className="px-2 py-0.5 bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 rounded text-[10px] font-bold uppercase border border-indigo-200 dark:border-indigo-800">
                Auto-Adjusting
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                id="dash-re-adapt-btn"
                onClick={onTriggerAdaptationDemo}
                className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 cursor-pointer transition-colors"
                title="Trigger simulated quiz performance adaptation"
              >
                ⚡ Test Re-Adapt
              </button>

              <button
                id="dash-expand-roadmap-btn"
                onClick={() => onNavigate('roadmap')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <span>Full View</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Timeline Body */}
          <div className="flex-1 p-5 sm:p-6 space-y-6 overflow-y-auto">
            {plan.roadmap.map((day, dIdx) => {
              const isCompleted = day.isCompleted;
              const isCurrent = dIdx === 0;

              return (
                <div 
                  key={day.dayNumber || dIdx}
                  className={`relative pl-8 border-l-2 ${
                    isCompleted 
                      ? 'border-emerald-200 dark:border-emerald-900/60' 
                      : isCurrent 
                      ? 'border-indigo-300 dark:border-indigo-700' 
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  {/* Circle Node on line */}
                  <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900 shadow-xs ${
                    isCompleted
                      ? 'bg-emerald-500'
                      : isCurrent
                      ? 'bg-indigo-600'
                      : 'bg-slate-300 dark:bg-slate-700'
                  }`} />

                  {/* Day Header */}
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className={`text-xs font-bold uppercase ${
                        isCompleted
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isCurrent
                          ? 'text-indigo-600 dark:text-indigo-400'
                          : 'text-slate-400 dark:text-slate-500'
                      }`}>
                        Day {day.dayNumber} - {isCompleted ? 'Completed' : isCurrent ? "Today's Focus" : 'Upcoming'}
                      </p>
                      <h3 className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">
                        {day.focusUnit}
                      </h3>
                    </div>

                    {day.isAdapted && (
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                        ⚡ AI Adapted
                      </span>
                    )}
                  </div>

                  {/* Task Tiles 2-column Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                    {day.activities.map((act, aIdx) => {
                      const topic = plan.topics.find(t => t.id === act.topicId);
                      const isUrgent = act.priority === 'urgent';

                      return (
                        <div
                          key={act.id || aIdx}
                          className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${
                            isUrgent
                              ? 'border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40'
                              : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-start mb-1.5">
                              <span className={`text-xs font-bold ${
                                isUrgent ? 'text-indigo-950 dark:text-indigo-200' : 'text-slate-800 dark:text-slate-200'
                              }`}>
                                {act.topicName}
                              </span>
                              
                              {isUrgent ? (
                                <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                  Priority
                                </span>
                              ) : isCompleted ? (
                                <span className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                                  PASS
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">
                                  ~{act.estimatedMinutes}m
                                </span>
                              )}
                            </div>

                            <p className="text-[10px] text-slate-600 dark:text-slate-400 leading-tight mb-2 line-clamp-2">
                              {act.description}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                            {topic && (
                              <button
                                id={`dash-act-explain-${dIdx}-${aIdx}`}
                                onClick={() => onExplainTopic(topic)}
                                className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                              >
                                Explain Concept
                              </button>
                            )}

                            {act.type === 'quiz' && (
                              <button
                                id={`dash-act-quiz-${dIdx}-${aIdx}`}
                                onClick={() => onStartQuiz({ topicIds: topic ? [topic.id] : undefined })}
                                className="text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-0.5 rounded cursor-pointer"
                              >
                                Quiz
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer Note */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium italic">
              ✨ Roadmap automatically adjusted based on your performance in recent quizzes.
            </p>
            <span className="text-[10px] text-slate-400 font-mono">
              {plan.roadmap.length} Days Planned
            </span>
          </div>
        </div>

        {/* Right 4-Columns: Topic Mastery & Needs Attention */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
          {/* Card A: Topic Mastery */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h2 className="font-bold text-slate-800 dark:text-white text-xs uppercase tracking-tight">
                Topic Mastery
              </h2>
              <button
                id="dash-view-matrix-btn"
                onClick={() => onNavigate('progress')}
                className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold hover:underline cursor-pointer"
              >
                All Topics →
              </button>
            </div>

            <div className="p-4 space-y-3.5">
              {plan.topics.slice(0, 5).map((topic, tIdx) => {
                const isHigh = topic.masteryScore >= 80;
                const isLow = topic.masteryScore < 60;

                return (
                  <div key={topic.id || tIdx}>
                    <div className="flex justify-between text-xs mb-1 font-medium">
                      <span className="text-slate-700 dark:text-slate-300 truncate max-w-[170px]" title={topic.name}>
                        {topic.name}
                      </span>
                      <span className={`font-bold ${
                        isHigh ? 'text-emerald-600 dark:text-emerald-400' : isLow ? 'text-rose-500 dark:text-rose-400' : 'text-amber-500 dark:text-amber-400'
                      }`}>
                        {topic.masteryScore}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          isHigh ? 'bg-emerald-500' : isLow ? 'bg-rose-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${topic.masteryScore}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card B: Needs Attention (High Density Alert) */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900/60 shadow-xs flex flex-col flex-1">
            <div className="p-3.5 border-b border-rose-100 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/30 flex justify-between items-center">
              <h2 className="font-bold text-rose-800 dark:text-rose-200 text-xs uppercase tracking-tight flex items-center gap-1.5">
                <span>Needs Attention</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-200 dark:bg-rose-900/80 text-rose-800 dark:text-rose-200 font-bold">
                  {weakTopics.length}
                </span>
              </h2>
              <span className="animate-pulse w-2 h-2 bg-rose-500 rounded-full" />
            </div>

            <div className="p-3.5 flex-1 space-y-3">
              {topWeakTopics.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-500">
                  🎉 No weak topics detected! High comprehension across all units.
                </div>
              ) : (
                topWeakTopics.map((wt, wtIdx) => (
                  <div 
                    key={wt.id || wtIdx}
                    className="p-3 border border-rose-200 dark:border-rose-900/60 rounded-lg bg-white dark:bg-slate-800/80 shadow-xs space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start space-x-2">
                        <span className="text-base leading-none">⚠️</span>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-100">
                            {wt.name}
                          </p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">
                            Mastery at <span className="font-bold text-rose-600 dark:text-rose-400">{wt.masteryScore}%</span>. Recommend immediate concept drill.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-700">
                      <button
                        id={`dash-explain-now-btn-${wtIdx}`}
                        onClick={() => onExplainTopic(wt)}
                        className="text-rose-600 dark:text-rose-400 text-[10px] font-bold uppercase tracking-wider hover:underline cursor-pointer"
                      >
                        Explain This Now →
                      </button>

                      <button
                        id={`dash-quiz-weak-btn-${wtIdx}`}
                        onClick={() => onStartQuiz({ topicIds: [wt.id], weakFocus: true })}
                        className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100 cursor-pointer"
                      >
                        Quiz
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
