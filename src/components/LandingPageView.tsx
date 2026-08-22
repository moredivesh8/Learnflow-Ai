import React from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  UploadCloud, 
  Brain, 
  Calendar, 
  HelpCircle, 
  Zap, 
  Target, 
  CheckCircle2, 
  Flame, 
  BookOpen, 
  ShieldCheck, 
  Layers 
} from 'lucide-react';
import { ViewState } from '../types';

interface LandingPageViewProps {
  onNavigate: (view: ViewState) => void;
  onLoadDemo: () => void;
  onOpenWalkthrough: () => void;
}

export const LandingPageView: React.FC<LandingPageViewProps> = ({
  onNavigate,
  onLoadDemo,
  onOpenWalkthrough,
}) => {
  return (
    <div className="w-full space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-16 md:pt-20 md:pb-24">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Next-Generation Adaptive Learning Architecture</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            LearnFlow <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">AI</span>
          </h1>

          {/* The Central Product Message */}
          <div className="max-w-3xl mx-auto p-6 rounded-2xl bg-gradient-to-b from-slate-50 to-blue-50/50 dark:from-slate-800/80 dark:to-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100 leading-snug">
              &ldquo;LearnFlow AI doesn&apos;t just tell you what to study.
            </p>
            <p className="text-lg sm:text-xl md:text-2xl font-bold text-blue-600 dark:text-blue-400 leading-snug mt-1">
              It learns what you don&apos;t know and changes what you should study next.&rdquo;
            </p>
          </div>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Upload textbooks, syllabus, lecture notes, or slides. LearnFlow AI extracts prerequisite graphs, builds an exam-targeted study roadmap, evaluates your quiz results, identifies weak topics, and dynamically reconfigures your daily schedule in real-time.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              id="hero-start-learning-btn"
              onClick={() => onNavigate('setup')}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer"
            >
              <span>Start Learning — Upload Material</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              id="hero-load-demo-btn"
              onClick={onLoadDemo}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <Flame className="w-4 h-4 text-orange-500" />
              <span>Explore Live Demo (Computer Networks)</span>
            </button>

            <button
              id="hero-walkthrough-btn"
              onClick={onOpenWalkthrough}
              className="w-full sm:w-auto px-4 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-semibold text-xs border border-amber-500/30 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Hackathon Demo Guide</span>
            </button>
          </div>
        </div>
      </section>

      {/* Core Adaptive Loop: How it Works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            The Closed-Loop Adaptive Intelligence
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            A continuous feedback loop that ensures no student prepares with a static, blind study plan.
          </p>
        </div>

        {/* Step Progression Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold uppercase text-blue-600 dark:text-blue-400">Step 1</div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Upload Material</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Upload PDF lecture slides, syllabus, or textbooks. Text is parsed securely on the client and server.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Brain className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold uppercase text-indigo-600 dark:text-indigo-400">Step 2</div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">AI Concept Extraction</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Gemini maps units, topics, subtopics, difficulty estimates, and prerequisite dependency sequences.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div className="text-xs font-bold uppercase text-purple-600 dark:text-purple-400">Step 3</div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Targeted Quizzing</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Test your understanding with rigorous, grounded MCQs, deep explanations, and error diagnosis.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-b from-amber-50 to-orange-50/40 dark:from-amber-950/30 dark:to-slate-900 border border-amber-200 dark:border-amber-800/60 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5 text-amber-600" />
            </div>
            <div className="text-xs font-bold uppercase text-amber-700 dark:text-amber-400">Step 4 (Core)</div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">⚡ Dynamic Roadmap Adaptation</h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Weak topics are boosted into immediate review slots, while already mastered areas receive less repetitive practice.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Highlights Bento */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
            Engineered for Real Student Success
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Works for any academic subject — from Computer Science to Biochemistry, Organic Chemistry, Law, or Finance.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Prerequisite-Aware Scheduling
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              LearnFlow never schedules advanced topics before you have mastered their foundations. Subnetting comes after the OSI model; routing comes after IP addressing.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Instant AI Tutor Explanations
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Click &quot;Explain this&quot; on any topic or question. Receive plain-English intuitions, real-world analogies, and warnings about common exam traps.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white">
              Grounded AI &amp; No Hallucinations
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Questions and study roadmaps are strictly generated from your uploaded curriculum and materials, ensuring 100% exam relevance.
            </p>
          </div>
        </div>
      </section>

      {/* Footer Pitch & Final CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
        <div className="p-8 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-xl shadow-blue-500/15 space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold">
            Ready to Ace Your Next Exam?
          </h2>
          <p className="text-blue-100 text-sm max-w-xl mx-auto leading-relaxed">
            Create your personalized adaptive study plan in under 60 seconds with your course notes.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              id="footer-start-plan-btn"
              onClick={() => onNavigate('setup')}
              className="px-6 py-3 rounded-xl bg-white text-blue-700 font-bold text-xs hover:bg-blue-50 transition-colors shadow-sm cursor-pointer"
            >
              Upload Material &amp; Build Plan
            </button>
            <button
              id="footer-demo-btn"
              onClick={onLoadDemo}
              className="px-6 py-3 rounded-xl bg-blue-800/60 hover:bg-blue-800 text-white font-semibold text-xs border border-blue-400/30 transition-colors cursor-pointer"
            >
              Load Demo Subject
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-500">
          LearnFlow AI • Open Source MIT License • Built with Google Gemini 3.7 Flash &amp; Vite React
        </p>
      </section>
    </div>
  );
};
