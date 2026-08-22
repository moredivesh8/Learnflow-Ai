import React, { useState } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Sparkles, 
  Calendar, 
  Clock, 
  Target, 
  AlertCircle, 
  CheckCircle2, 
  Loader2, 
  ArrowRight, 
  FileCheck, 
  Trash2, 
  Flame 
} from 'lucide-react';
import { StudyPlan, UploadedFileSummary, ViewState } from '../types';
import { extractTextFromPdf } from '../utils/pdfExtractor';
import { analyzeStudyMaterial, generateStudyRoadmap } from '../services/api';
import { calculateOverallMastery } from '../utils/masteryCalculator';

interface UploadSetupViewProps {
  onPlanCreated: (plan: StudyPlan) => void;
  onNavigate: (view: ViewState) => void;
  onLoadDemo: () => void;
}

export const UploadSetupView: React.FC<UploadSetupViewProps> = ({
  onPlanCreated,
  onNavigate,
  onLoadDemo,
}) => {
  // Form state
  const [subjectName, setSubjectName] = useState('Cyber Ethics');
  const [examDate, setExamDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 5);
    return d.toISOString().split('T')[0];
  });
  const [dailyHours, setDailyHours] = useState(3);
  const [learningGoal, setLearningGoal] = useState('Master core exam topics and eliminate knowledge gaps');
  
  // File & Text state
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFileSummary[]>([]);
  const [extractedText, setExtractedText] = useState('');
  const [pastedText, setPastedText] = useState('');
  const [useTextInput, setUseTextInput] = useState(false);

  // Processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sample material presets
  const samplePresets = [
    {
      title: 'Cyber Ethics',
      text: `Course Curriculum & Study Notes: Cyber Ethics & Digital Governance
Unit 1: Vulnerability Disclosure & Responsible Research
- Responsible Disclosure: Coordinated vulnerability disclosure vs full disclosure, bug bounty mechanisms, 90-day grace period standard.
- Dual-Use Technologies: Security tools that can be used for defense or offense (e.g. penetration testing software vs exploit kits).
- Ethical Hacking: White hat vs black hat vs grey hat boundaries, Computer Fraud and Abuse Act (CFAA) compliance, authorization scope.

Unit 2: Surveillance, Privacy & Digital Rights
- Mass Surveillance vs Targeted Interception: Fourth Amendment implications, Warrant requirements, Foreign Intelligence Surveillance.
- Data Ownership & Minimization: Principle of least privilege for user data, consent paradigms, right to be forgotten.
- Encryption Backdoors: Key escrow debate, end-to-end encryption ethics, exceptional access trade-offs.

Unit 3: Cyber Warfare & Autonomous Cyber Systems
- Just War Theory in Cyberspace: Jus ad bellum and Jus in bello application, Tallinn Manual cyber operations thresholds.
- Attribution Problem: Technical spoofing, false flag operations, political consequences of imperfect attribution.
- Autonomous Defense Systems: Algorithmic countermeasures, AI in threat detection, collateral damage ethics.`
    },
    {
      title: 'Computer Networks',
      text: `Course Syllabus & Study Notes: Computer Networks (CS 401)
Unit 1: Fundamentals of Networking and Layered Architectures
- OSI 7-Layer Reference Model: Physical, Data Link, Network, Transport, Session, Presentation, Application layers. Encapsulation and PDU structures.
- TCP/IP Protocol Suite: 4-layer architectural model, comparison with OSI.
- TCP 3-Way Handshake: SYN, SYN-ACK, ACK packet flags, sequence numbers, connection teardown (FIN/ACK).
- TCP Flow and Congestion Control: Sliding window mechanism, Slow Start, Congestion Avoidance, Fast Retransmit, Fast Recovery.

Unit 2: Physical & Data Link Layers
- Transmission Media: Guided media (twisted pair, coaxial, fiber optics) vs unguided wireless. Modulation techniques: QAM, PSK, FSK.
- Channel Capacity: Nyquist theorem for noiseless channels, Shannon capacity theorem for noisy channels.
- Error Detection and Correction: Parity bits, Checksums, Cyclic Redundancy Check (CRC) polynomial division, Hamming distance.
- Medium Access Control: CSMA/CD and CSMA/CA protocols.

Unit 3: Network Layer and Routing
- IP Addressing: IPv4 32-bit addresses, Classful vs Classless Inter-Domain Routing (CIDR), Subnet masks, Subnetting calculations and host address allocation.
- Network Address Translation (NAT) and IPv6 header structure.
- Routing Algorithms: Link-State Routing (Dijkstra shortest path algorithm, OSPF), Distance-Vector Routing (Bellman-Ford, RIP, count-to-infinity problem, split horizon).

Unit 4: Transport and Application Layers
- UDP: Connectionless transport, lightweight header, checksum calculation, use cases (DNS, streaming, VoIP).
- DNS (Domain Name System): Hierarchical namespace, recursive vs iterative queries, authoritative servers, TTL caching.
- HTTP/1.1 vs HTTP/2 vs HTTP/3: Keep-Alive, multiplexing, header compression (HPACK), QUIC transport.`
    }
  ];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorMessage(null);
    setIsProcessing(true);
    setCurrentStep('Extracting text from PDF document...');

    try {
      const file = files[0];
      if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
        throw new Error('Please upload a valid PDF document (.pdf).');
      }

      const result = await extractTextFromPdf(file);
      
      const fileSummary: UploadedFileSummary = {
        name: result.fileName,
        size: result.fileSize,
        pageCount: result.pageCount,
        extractedChars: result.charCount,
        uploadedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setUploadedFiles([fileSummary]);
      setExtractedText(result.text);
      // Auto-set subject title from PDF filename if default or empty
      if (result.suggestedTitle) {
        setSubjectName(result.suggestedTitle);
      }
      // When uploading a PDF, prioritize PDF text and clear unselected pasted text
      if (!useTextInput) {
        setPastedText('');
      }
    } catch (err: any) {
      console.error('File extraction failed:', err);
      setErrorMessage(err.message || "LearnFlow couldn't extract enough content from this PDF to generate a grounded quiz.");
    } finally {
      setIsProcessing(false);
      setCurrentStep('');
    }
  };

  const handleCreatePlan = async () => {
    const materialText = (extractedText || pastedText).trim();

    if (!materialText || materialText.length < 30) {
      setErrorMessage("LearnFlow couldn't extract enough content from this PDF to generate a grounded quiz. Please upload a readable PDF or paste study notes.");
      return;
    }

    const letterCount = (materialText.match(/[a-zA-Z]/g) || []).length;
    if (letterCount < 30) {
      setErrorMessage("LearnFlow couldn't extract enough content from this PDF to generate a grounded quiz.");
      return;
    }

    if (!subjectName.trim()) {
      setErrorMessage('Please enter a Subject Name.');
      return;
    }

    setErrorMessage(null);
    setIsProcessing(true);

    try {
      // Step 1: AI Analyzes Material & Extracts Topics + Prerequisites
      setCurrentStep('Extracting canonical topics strictly from your PDF material...');
      const analysisResult = await analyzeStudyMaterial({
        subjectName,
        materialText,
        examDate,
        dailyHours,
        learningGoal,
      });

      if (!analysisResult.topics || analysisResult.topics.length === 0) {
        throw new Error("LearnFlow couldn't extract enough structured content from this PDF to generate a grounded quiz.");
      }

      // Step 2: AI Builds Personalized Study Roadmap
      setCurrentStep('Generating prerequisite-aware study roadmap strictly grounded in your material...');
      const roadmap = await generateStudyRoadmap({
        subjectName: analysisResult.subjectIdentified || subjectName,
        topics: analysisResult.topics,
        examDate,
        dailyHours,
        learningGoal,
        materialText,
      });

      // Step 3: Construct Complete Study Plan
      const initialMastery = calculateOverallMastery(analysisResult.topics);

      const newPlan: StudyPlan = {
        id: `plan-${Date.now()}`,
        subjectName: analysisResult.subjectIdentified || subjectName,
        examDate,
        dailyHours,
        learningGoal,
        materialTextSnippet: materialText,
        sourceCurriculum: analysisResult.sourceCurriculum,
        uploadedFiles: uploadedFiles.length > 0 ? uploadedFiles : [
          {
            name: `${subjectName}_Document.pdf`,
            size: materialText.length,
            pageCount: Math.ceil(materialText.length / 1500),
            extractedChars: materialText.length,
            uploadedAt: 'Just now'
          }
        ],
        topics: analysisResult.topics,
        roadmap,
        quizHistory: [],
        overallMastery: initialMastery,
        adaptationCount: 0,
      };

      onPlanCreated(newPlan);
      onNavigate('dashboard');
    } catch (err: any) {
      console.error('Plan generation failed:', err);
      setErrorMessage(err.message || "LearnFlow couldn't extract enough content from this PDF to generate a grounded quiz.");
    } finally {
      setIsProcessing(false);
      setCurrentStep('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Intelligent Study Plan Setup</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Create Your Adaptive Learning Plan
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-xl mx-auto">
          Input your study parameters, upload materials or lecture notes, and let LearnFlow AI build your personalized roadmap.
        </p>
      </div>

      {/* Preset Fast Picker */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
          <Flame className="w-4 h-4 text-orange-500 shrink-0" />
          <span>Quick Hackathon presets:</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {samplePresets.map((preset, pIdx) => (
            <button
              key={pIdx}
              id={`preset-btn-${pIdx}`}
              onClick={() => {
                setSubjectName(preset.title);
                setPastedText(preset.text);
                setUseTextInput(true);
              }}
              className="px-3 py-1 rounded-lg text-xs font-medium bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
            >
              Load {preset.title}
            </button>
          ))}
          <button
            id="preset-demo-instant-btn"
            onClick={onLoadDemo}
            className="px-3 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800 cursor-pointer"
          >
            Explore Preloaded Demo →
          </button>
        </div>
      </div>

      {/* Main Setup Card */}
      <div className="p-6 sm:p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
        {/* Step 1: Study Parameters */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
              1
            </span>
            <span>Study Parameters</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Subject Name */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Subject or Course Name *
              </label>
              <input
                id="setup-subject-name-input"
                type="text"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="e.g., Computer Networks, Organic Chemistry, Corporate Finance"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Target Exam Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-500" />
                <span>Target Exam Date *</span>
              </label>
              <input
                id="setup-exam-date-input"
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Daily Hours Slider */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Available Time Per Day</span>
                </label>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                  {dailyHours} Hours/Day
                </span>
              </div>
              <input
                id="setup-daily-hours-slider"
                type="range"
                min="1"
                max="8"
                step="0.5"
                value={dailyHours}
                onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                className="w-full accent-blue-600 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
              />
            </div>

            {/* Optional Goal */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-cyan-500" />
                <span>Learning Goal (Optional)</span>
              </label>
              <input
                id="setup-learning-goal-input"
                type="text"
                value={learningGoal}
                onChange={(e) => setLearningGoal(e.target.value)}
                placeholder="e.g., Score >90% on Final Exam, focus on conceptual problem solving"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <hr className="border-slate-200 dark:border-slate-800" />

        {/* Step 2: Upload Study Material */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-bold flex items-center justify-center">
                2
              </span>
              <span>Upload Study Material (PDF or Notes)</span>
            </h2>

            <button
              id="toggle-text-input-btn"
              onClick={() => setUseTextInput(!useTextInput)}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              {useTextInput ? 'Switch to PDF Upload' : 'Or Paste Syllabus / Notes'}
            </button>
          </div>

          {!useTextInput ? (
            /* PDF Upload Box */
            <div className="space-y-3">
              <label 
                htmlFor="pdf-upload-input"
                className="p-8 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-400 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 flex flex-col items-center justify-center text-center cursor-pointer transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                  Click to browse or drag &amp; drop PDF study material
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Supports lecture slides, course textbooks, syllabi, and assignment guides (.pdf)
                </p>
                <input
                  id="pdf-upload-input"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {/* Uploaded File Pill */}
              {uploadedFiles.map((f, fIdx) => (
                <div 
                  key={fIdx}
                  className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 flex items-center justify-between gap-3 animate-fadeIn"
                >
                  <div className="flex items-center gap-3">
                    <FileCheck className="w-5 h-5 text-blue-600 shrink-0" />
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-sm">
                        {f.name}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {(f.size / 1024 / 1024).toFixed(2)} MB • {f.pageCount || 1} pages • {f.extractedChars} characters extracted
                      </p>
                    </div>
                  </div>
                  <button
                    id="remove-file-btn"
                    onClick={() => {
                      setUploadedFiles([]);
                      setExtractedText('');
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            /* Text Paste Box */
            <div className="space-y-2">
              <textarea
                id="setup-pasted-text"
                rows={8}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste your course syllabus, lecture outline, unit breakdown, or notes here..."
                className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Characters: {pastedText.length}</span>
                <span>Tip: Include unit titles and key topics for best AI prerequisite accuracy.</span>
              </div>
            </div>
          )}
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Processing State Indicator */}
        {isProcessing && (
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 flex items-center gap-3 animate-pulse">
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
            <div>
              <p className="text-xs font-bold text-blue-900 dark:text-blue-200">
                LearnFlow AI Architect in progress
              </p>
              <p className="text-[11px] text-blue-700 dark:text-blue-300">
                {currentStep || 'Synthesizing knowledge graph...'}
              </p>
            </div>
          </div>
        )}

        {/* Submit CTA */}
        <div className="pt-2">
          <button
            id="setup-generate-plan-btn"
            disabled={isProcessing}
            onClick={handleCreatePlan}
            className="w-full py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analyzing &amp; Building Study Roadmap...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Generate Adaptive Study Roadmap</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
