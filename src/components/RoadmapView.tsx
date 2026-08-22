import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Zap, 
  CheckCircle2, 
  Circle, 
  BookOpen, 
  HelpCircle, 
  AlertTriangle, 
  ArrowRight, 
  Sparkles, 
  Lightbulb, 
  Layers 
} from 'lucide-react';
import { StudyPlan, RoadmapDay, Topic, ViewState } from '../types';

interface RoadmapViewProps {
  plan: StudyPlan;
  onNavigate: (view: ViewState) => void;
  onStartQuiz: (options?: { topicIds?: string[]; weakFocus?: boolean }) => void;
  onExplainTopic: (topic: Topic) => void;
  onTriggerAdaptationDemo: () => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  plan,
  onNavigate,
  onStartQuiz,
  onExplainTopic,
  onTriggerAdaptationDemo,
}) => {
  const [completedActivities, setCompletedActivities] = useState<Record<string, boolean>>({});
  const [showComparison, setShowComparison] = useState(false);

  const toggleActivity = (id: string) => {
    setCompletedActivities(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const adaptedDaysCount = plan.roadmap.filter(d => d.isAdapted).length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Controls */}
      <div className="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
              Visual Study Roadmap
            </h2>
            <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded text-[10px] font-bold uppercase border border-indigo-200 dark:border-indigo-800">
              {plan.dailyHours} Hours/Day Target
            </span>
            {adaptedDaysCount > 0 && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" />
                Adapted ({adaptedDaysCount} Days)
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Subject: <strong className="text-slate-800 dark:text-slate-200">{plan.subjectName}</strong> • Targeted before {plan.examDate}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="roadmap-compare-toggle-btn"
            onClick={() => setShowComparison(!showComparison)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-indigo-600" />
            <span>{showComparison ? 'Hide Notes' : 'Adaptation Notes'}</span>
          </button>

          <button
            id="roadmap-trigger-adaptation-btn"
            onClick={onTriggerAdaptationDemo}
            className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            title="Simulate student quiz score drop and let AI re-adapt the schedule"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>⚡ Re-Adapt to Weak Areas</span>
          </button>
        </div>
      </div>

      {/* Adaptation Insight Card */}
      {(showComparison || adaptedDaysCount > 0) && (
        <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h3 className="font-bold text-xs uppercase tracking-wider text-amber-900 dark:text-amber-200">
                AI Adaptive Engine Strategy
              </h3>
            </div>
            <span className="text-[10px] text-amber-800 dark:text-amber-300 font-mono">
              Auto-reconfigured {plan.lastAdaptedAt || 'recently'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/60">
              <div className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Detected Knowledge Gaps</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                {(() => {
                  const weak = plan.topics.filter(t => t.masteryScore < 60);
                  if (weak.length > 0) {
                    return `Quiz scores indicated diagnostic gaps in ${weak.map(t => t.name).slice(0, 2).join(' & ')}.`;
                  }
                  return 'Active diagnostic assessment detected foundational topic areas needing reinforcement.';
                })()}
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-emerald-200 dark:border-emerald-900/60">
              <div className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Adaptive Resequencing Applied</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed mt-0.5">
                {(() => {
                  const firstAdapted = plan.roadmap.find(d => d.isAdapted);
                  if (firstAdapted?.adaptationReason) {
                    return firstAdapted.adaptationReason;
                  }
                  return 'Reprioritized high-urgency review sessions into immediate timeline while pacing mastered material.';
                })()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Connected Timeline Days */}
      <div className="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
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
              {/* Node Circle */}
              <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-4 border-white dark:border-slate-900 shadow-xs ${
                isCompleted ? 'bg-emerald-500' : isCurrent ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
              }`} />

              {/* Day Header */}
              <div className="mb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`text-xs font-bold uppercase ${
                      isCompleted ? 'text-emerald-600 dark:text-emerald-400' : isCurrent ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'
                    }`}>
                      Day {day.dayNumber} • {day.date}
                    </p>
                    {day.isAdapted && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800">
                        ⚡ AI Adapted
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">
                    {day.focusUnit} ({day.allocatedHours} Hours)
                  </h3>
                </div>

                <button
                  id={`roadmap-take-day-quiz-${dIdx}`}
                  onClick={() => onStartQuiz({ topicIds: day.topicIds })}
                  className="self-start sm:self-center px-3 py-1 rounded text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Day {day.dayNumber} Quiz</span>
                </button>
              </div>

              {/* Coach Note */}
              {day.notes && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                  <strong className="text-slate-700 dark:text-slate-300">Coach Guidance:</strong> {day.notes}
                </p>
              )}

              {/* Activity Cards 2-col Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {day.activities.map((act, aIdx) => {
                  const isDone = completedActivities[act.id || `${dIdx}-${aIdx}`] || false;
                  const topic = plan.topics.find(t => t.id === act.topicId);
                  const isUrgent = act.priority === 'urgent';

                  return (
                    <div
                      key={act.id || aIdx}
                      className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${
                        isDone
                          ? 'opacity-60 bg-slate-50 dark:bg-slate-800/20 border-slate-200 dark:border-slate-800'
                          : isUrgent
                          ? 'border-2 border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-xs'
                          : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <div className="flex items-center gap-2">
                            <button
                              id={`act-toggle-btn-${dIdx}-${aIdx}`}
                              onClick={() => toggleActivity(act.id || `${dIdx}-${aIdx}`)}
                              className="text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                            >
                              {isDone ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Circle className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <span className={`text-xs font-bold ${isDone ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-200'}`}>
                              {act.topicName}
                            </span>
                          </div>

                          {isUrgent && !isDone ? (
                            <span className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded font-bold uppercase">
                              Priority
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              ~{act.estimatedMinutes}m
                            </span>
                          )}
                        </div>

                        <p className={`text-[10px] leading-tight mb-2 pl-5 ${isDone ? 'text-slate-400 line-through' : 'text-slate-600 dark:text-slate-400'}`}>
                          {act.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50 pl-5">
                        {topic && (
                          <button
                            id={`roadmap-explain-act-${dIdx}-${aIdx}`}
                            onClick={() => onExplainTopic(topic)}
                            className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                          >
                            Explain
                          </button>
                        )}

                        {act.type === 'quiz' && (
                          <button
                            id={`roadmap-act-quiz-${dIdx}-${aIdx}`}
                            onClick={() => onStartQuiz({ topicIds: topic ? [topic.id] : undefined })}
                            className="text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-0.5 rounded cursor-pointer shadow-xs"
                          >
                            Start Task Quiz
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
    </div>
  );
};
