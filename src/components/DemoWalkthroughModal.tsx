import React from 'react';
import { 
  X, 
  Sparkles, 
  UploadCloud, 
  Network, 
  Calendar, 
  HelpCircle, 
  TrendingDown, 
  Zap, 
  CheckCircle2, 
  ArrowRight,
  Play
} from 'lucide-react';
import { ViewState } from '../types';

interface DemoWalkthroughModalProps {
  onClose: () => void;
  onNavigate: (view: ViewState) => void;
  onTriggerAdaptationDemo: () => void;
}

export const DemoWalkthroughModal: React.FC<DemoWalkthroughModalProps> = ({
  onClose,
  onNavigate,
  onTriggerAdaptationDemo,
}) => {
  const steps = [
    {
      num: 1,
      title: 'Study Material Ingestion',
      desc: 'Upload PDF lecture notes or syllabus. Client & AI extract raw text, page count, and key subject metadata.',
      icon: <UploadCloud className="w-5 h-5 text-blue-500" />,
      actionLabel: 'View Setup / Upload',
      action: () => {
        onNavigate('setup');
        onClose();
      }
    },
    {
      num: 2,
      title: 'AI Unit & Prerequisite Graph',
      desc: 'Gemini analyzes the material, structured units, difficulty rankings, and prerequisite dependencies.',
      icon: <Network className="w-5 h-5 text-indigo-500" />,
      actionLabel: 'View Topic Mastery',
      action: () => {
        onNavigate('progress');
        onClose();
      }
    },
    {
      num: 3,
      title: 'Personalized Initial Roadmap',
      desc: 'Generates a day-by-day schedule respecting prerequisites, available daily hours, and target exam date.',
      icon: <Calendar className="w-5 h-5 text-cyan-500" />,
      actionLabel: 'View Study Roadmap',
      action: () => {
        onNavigate('roadmap');
        onClose();
      }
    },
    {
      num: 4,
      title: 'Interactive Adaptive Quiz',
      desc: 'Tests comprehension on selected topics. Provides instant explanations, memory aids, and error feedback.',
      icon: <HelpCircle className="w-5 h-5 text-purple-500" />,
      actionLabel: 'Start Practice Quiz',
      action: () => {
        onNavigate('quiz');
        onClose();
      }
    },
    {
      num: 5,
      title: 'Mastery Update & Weak Topic Detection',
      desc: 'Recency-weighted algorithm updates score (e.g. TCP/IP drops from 70% ➔ 42%). Identifies gaps.',
      icon: <TrendingDown className="w-5 h-5 text-rose-500" />,
      actionLabel: 'View Dashboard Metrics',
      action: () => {
        onNavigate('dashboard');
        onClose();
      }
    },
    {
      num: 6,
      title: '⚡ Automatic Roadmap Adaptation (Core Innovation)',
      desc: 'LearnFlow AI re-schedules upcoming days to prioritize weak topics immediately, reducing redundant study for mastered areas.',
      icon: <Zap className="w-5 h-5 text-amber-500" />,
      actionLabel: '⚡ Trigger Live Adaptation',
      highlight: true,
      action: () => {
        onTriggerAdaptationDemo();
        onClose();
      }
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
        id="demo-walkthrough-card"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                LearnFlow AI — Adaptive Architecture Demo
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                The continuous closed-loop: Material ➔ Roadmap ➔ Quiz ➔ Evaluation ➔ Adaptation
              </p>
            </div>
          </div>
          <button
            id="close-walkthrough-btn"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pitch Statement */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border-b border-blue-100 dark:border-blue-900/50">
          <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 leading-relaxed text-center">
            &ldquo;LearnFlow AI doesn't just tell you what to study.<br />
            It learns what you don&apos;t know and changes what you should study next.&rdquo;
          </p>
        </div>

        {/* Steps Grid */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {steps.map((step) => (
              <div
                key={step.num}
                className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                  step.highlight
                    ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/60 shadow-sm'
                    : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center">
                        {step.num}
                      </span>
                      <h4 className="font-semibold text-xs text-slate-900 dark:text-white">
                        {step.title}
                      </h4>
                    </div>
                    {step.icon}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                    {step.desc}
                  </p>
                </div>

                <button
                  id={`demo-step-btn-${step.num}`}
                  onClick={step.action}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    step.highlight
                      ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm'
                      : 'bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {step.highlight ? <Zap className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{step.actionLabel}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Real-time closed adaptive loop supported</span>
          </div>
          <button
            id="start-demo-flow-btn"
            onClick={() => {
              onNavigate('dashboard');
              onClose();
            }}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span>Open Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
