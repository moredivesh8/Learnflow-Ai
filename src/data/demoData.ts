import { StudyPlan, Topic, RoadmapDay, QuizQuestion } from '../types';

export const DEMO_TOPICS_NETWORKS: Topic[] = [
  {
    id: 'top-1',
    name: 'OSI Model & 7 Layers',
    unit: 'Unit 1: Fundamentals',
    difficulty: 'medium',
    prerequisites: [],
    summary: 'Hierarchical 7-layer framework standardizing network communication from Physical to Application layer.',
    keyConcepts: ['Encapsulation', 'Layer abstraction', 'PDU formats', 'Header vs Payload'],
    masteryScore: 85,
    quizAttempts: 8,
    correctAnswers: 7,
    status: 'strong',
    trend: 'up',
  },
  {
    id: 'top-2',
    name: 'TCP/IP Protocol Suite & Handshake',
    unit: 'Unit 1: Fundamentals',
    difficulty: 'hard',
    prerequisites: ['OSI Model & 7 Layers'],
    summary: 'Core 4-layer internet model, SYN-SYN/ACK-ACK 3-way handshake, sequence numbers, and congestion control.',
    keyConcepts: ['3-Way Handshake', 'Window Sizing', 'Slow Start', 'TCP vs UDP checksums'],
    masteryScore: 42,
    quizAttempts: 10,
    correctAnswers: 4,
    status: 'weak',
    trend: 'down',
  },
  {
    id: 'top-3',
    name: 'Transmission Media & Modulation',
    unit: 'Unit 2: Physical & Data Link',
    difficulty: 'easy',
    prerequisites: [],
    summary: 'Guided vs unguided transmission media, copper vs fiber, QAM, PSK, and signal attenuation.',
    keyConcepts: ['Attenuation', 'Nyquist Theorem', 'Shannon Capacity', 'Baud rate'],
    masteryScore: 78,
    quizAttempts: 6,
    correctAnswers: 5,
    status: 'developing',
    trend: 'up',
  },
  {
    id: 'top-4',
    name: 'Data Link Layer & Error Detection (CRC/Parity)',
    unit: 'Unit 2: Physical & Data Link',
    difficulty: 'medium',
    prerequisites: ['Transmission Media & Modulation'],
    summary: 'Framing, flow control (Stop-and-Wait, Go-Back-N), MAC addressing, and Cyclic Redundancy Checks (CRC).',
    keyConcepts: ['CRC Polynomial Division', 'Hamming Distance', 'Sliding Window', 'CSMA/CD'],
    masteryScore: 68,
    quizAttempts: 7,
    correctAnswers: 5,
    status: 'developing',
    trend: 'neutral',
  },
  {
    id: 'top-5',
    name: 'IP Addressing, Subnetting & CIDR',
    unit: 'Unit 3: Network Layer',
    difficulty: 'hard',
    prerequisites: ['TCP/IP Protocol Suite & Handshake'],
    summary: 'IPv4 vs IPv6 addressing, subnet masks, CIDR notation /24, route aggregation, and NAT translation.',
    keyConcepts: ['Subnet calculation', 'CIDR prefix', 'Default Gateway', 'Network vs Host ID'],
    masteryScore: 36,
    quizAttempts: 5,
    correctAnswers: 2,
    status: 'needs_attention',
    trend: 'down',
  },
  {
    id: 'top-6',
    name: 'Routing Algorithms (Dijkstra, Distance Vector)',
    unit: 'Unit 3: Network Layer',
    difficulty: 'hard',
    prerequisites: ['IP Addressing, Subnetting & CIDR'],
    summary: 'Link-state (OSPF/Dijkstra shortest path) vs Distance Vector (RIP, Bellman-Ford) routing paradigms.',
    keyConcepts: ['Bellman-Ford', 'Count to Infinity', 'Split Horizon', 'Dijkstra Cost'],
    masteryScore: 54,
    quizAttempts: 4,
    correctAnswers: 2,
    status: 'weak',
    trend: 'neutral',
  },
  {
    id: 'top-7',
    name: 'Application Layer Protocols (HTTP/HTTPS, DNS)',
    unit: 'Unit 4: Application Layer',
    difficulty: 'easy',
    prerequisites: ['TCP/IP Protocol Suite & Handshake'],
    summary: 'DNS hierarchical resolution, HTTP/1.1 vs HTTP/2 vs HTTP/3, TLS handshakes, and caching.',
    keyConcepts: ['Authoritative Nameserver', 'TLS Record Protocol', 'Keep-Alive', 'DNS TTL'],
    masteryScore: 92,
    quizAttempts: 9,
    correctAnswers: 8,
    status: 'strong',
    trend: 'up',
  }
];

export const DEMO_ROADMAP_NETWORKS: RoadmapDay[] = [
  {
    dayNumber: 1,
    date: 'Day 1 (Today)',
    focusUnit: 'Urgent Remediation & Core Protocols',
    allocatedHours: 3,
    topicIds: ['top-2', 'top-5'],
    topicNames: ['TCP/IP Protocol Suite & Handshake', 'IP Addressing, Subnetting & CIDR'],
    isCompleted: false,
    isAdapted: true,
    adaptationReason: 'AI Adaptive Re-allocation: Boosted TCP/IP and Subnetting due to weak quiz scores (<50%).',
    notes: 'Prioritize TCP 3-way handshake mechanics and practice 4 subnetting problems.',
    activities: [
      {
        id: 'act-1',
        type: 'review',
        description: 'Deep Dive: TCP Handshake flags (SYN, SYN-ACK, ACK) and state transitions',
        topicId: 'top-2',
        topicName: 'TCP/IP Protocol Suite',
        estimatedMinutes: 45,
        priority: 'urgent',
      },
      {
        id: 'act-2',
        type: 'quiz',
        description: 'Targeted Remediation Quiz: 5 TCP Sequence & Windowing questions',
        topicId: 'top-2',
        topicName: 'TCP/IP Protocol Suite',
        estimatedMinutes: 20,
        priority: 'urgent',
      },
      {
        id: 'act-3',
        type: 'study',
        description: 'CIDR Subnet Math: Practice splitting a /24 network into 4 subnets',
        topicId: 'top-5',
        topicName: 'IP Addressing & Subnetting',
        estimatedMinutes: 55,
        priority: 'urgent',
      },
      {
        id: 'act-4',
        type: 'flashcard',
        description: 'Quick check: OSI 7-layer PDU types and encapsulation recap',
        topicId: 'top-1',
        topicName: 'OSI Model',
        estimatedMinutes: 15,
        priority: 'normal',
      }
    ]
  },
  {
    dayNumber: 2,
    date: 'Day 2',
    focusUnit: 'Network Layer Routing & Data Link',
    allocatedHours: 3,
    topicIds: ['top-5', 'top-6', 'top-4'],
    topicNames: ['IP Addressing, Subnetting & CIDR', 'Routing Algorithms', 'Data Link Layer & Error Detection'],
    isCompleted: false,
    isAdapted: true,
    adaptationReason: 'Adapted to connect Subnetting directly with Routing Tables before moving to transport.',
    notes: 'Master Bellman-Ford count-to-infinity problem and calculate CRC checksums.',
    activities: [
      {
        id: 'act-5',
        type: 'study',
        description: 'Dijkstra vs Bellman-Ford: Convergence times and loop prevention (Split Horizon)',
        topicId: 'top-6',
        topicName: 'Routing Algorithms',
        estimatedMinutes: 60,
        priority: 'high',
      },
      {
        id: 'act-6',
        type: 'study',
        description: 'CRC Polynomial Long Division error checking walkthrough',
        topicId: 'top-4',
        topicName: 'Data Link Layer',
        estimatedMinutes: 45,
        priority: 'normal',
      },
      {
        id: 'act-7',
        type: 'quiz',
        description: 'Practice Quiz: Network & Data Link layers combined',
        topicId: 'top-6',
        topicName: 'Routing Algorithms',
        estimatedMinutes: 25,
        priority: 'high',
      }
    ]
  },
  {
    dayNumber: 3,
    date: 'Day 3',
    focusUnit: 'Physical Layer & Full System Integration',
    allocatedHours: 2.5,
    topicIds: ['top-3', 'top-7', 'top-2'],
    topicNames: ['Transmission Media & Modulation', 'Application Layer Protocols', 'TCP/IP Protocol Suite'],
    isCompleted: false,
    isAdapted: false,
    notes: 'Review bandwidth constraints (Nyquist vs Shannon) and DNS recursion trace.',
    activities: [
      {
        id: 'act-8',
        type: 'study',
        description: 'Nyquist max data rate vs Shannon noiseless channel capacity formulas',
        topicId: 'top-3',
        topicName: 'Transmission Media',
        estimatedMinutes: 40,
        priority: 'normal',
      },
      {
        id: 'act-9',
        type: 'study',
        description: 'DNS recursive resolution trace and HTTPS TLS 1.3 handshake sequence',
        topicId: 'top-7',
        topicName: 'Application Layer Protocols',
        estimatedMinutes: 40,
        priority: 'normal',
      },
      {
        id: 'act-10',
        type: 'quiz',
        description: 'Comprehensive Mock Exam: All 7 units with timed adaptive scoring',
        topicId: 'top-2',
        topicName: 'Comprehensive',
        estimatedMinutes: 35,
        priority: 'high',
      }
    ]
  }
];

export const DEMO_SAMPLE_QUESTIONS: Record<string, QuizQuestion[]> = {
  'top-2': [
    {
      id: 'q-tcp-1',
      topicId: 'top-2',
      topicName: 'TCP/IP Protocol Suite & Handshake',
      question: 'During the TCP 3-way handshake, what flags are set in the second packet sent from Server to Client?',
      options: [
        'SYN only',
        'ACK only',
        'SYN and ACK',
        'FIN and ACK'
      ],
      correctAnswer: 'SYN and ACK',
      explanation: 'In the 3-way handshake: (1) Client sends SYN, (2) Server responds with SYN-ACK (acknowledging client sequence + proposing server sequence), (3) Client sends ACK.',
      difficulty: 'medium',
      conceptKey: 'TCP 3-Way Handshake'
    },
    {
      id: 'q-tcp-2',
      topicId: 'top-2',
      topicName: 'TCP/IP Protocol Suite & Handshake',
      question: 'What mechanism does TCP use during "Slow Start" to probe available network capacity?',
      options: [
        'Increases Congestion Window (cwnd) by 1 MSS for every RTT linearly',
        'Doubles the Congestion Window (cwnd) every Round Trip Time (exponential growth)',
        'Immediately transmits at the maximum Receiver Advertised Window (rwnd)',
        'Halves the transmission rate upon receiving duplicated ACKs'
      ],
      correctAnswer: 'Doubles the Congestion Window (cwnd) every Round Trip Time (exponential growth)',
      explanation: 'Slow Start increases cwnd exponentially (doubling each RTT) until it reaches ssthresh (slow start threshold), where it transitions to additive congestion avoidance.',
      difficulty: 'hard',
      conceptKey: 'TCP Congestion Control'
    },
    {
      id: 'q-tcp-3',
      topicId: 'top-2',
      topicName: 'TCP/IP Protocol Suite & Handshake',
      question: 'Which of the following is a fundamental difference between TCP and UDP at the transport layer?',
      options: [
        'UDP provides byte-stream ordering while TCP is message-oriented',
        'TCP guarantees delivery and order with connection overhead; UDP is connectionless and best-effort',
        'UDP uses 32-bit port numbers while TCP uses 16-bit port numbers',
        'TCP cannot detect packet corruption while UDP uses obligatory 64-bit parity'
      ],
      correctAnswer: 'TCP guarantees delivery and order with connection overhead; UDP is connectionless and best-effort',
      explanation: 'TCP is connection-oriented, reliable, ordered, and error-checked, whereas UDP is lightweight, connectionless, and has minimal protocol overhead.',
      difficulty: 'easy',
      conceptKey: 'TCP vs UDP'
    }
  ],
  'top-5': [
    {
      id: 'q-ip-1',
      topicId: 'top-5',
      topicName: 'IP Addressing, Subnetting & CIDR',
      question: 'Given the network IP address 192.168.10.0/26, how many usable host IP addresses are available per subnet?',
      options: [
        '64',
        '62',
        '30',
        '128'
      ],
      correctAnswer: '62',
      explanation: 'A /26 mask leaves 32 - 26 = 6 host bits. Total addresses = 2^6 = 64. Usable host addresses = 64 - 2 (subtracting network address and broadcast address) = 62.',
      difficulty: 'hard',
      conceptKey: 'Subnet Usable Host Calculation'
    },
    {
      id: 'q-ip-2',
      topicId: 'top-5',
      topicName: 'IP Addressing, Subnetting & CIDR',
      question: 'What is the standard subnet mask corresponding to the CIDR prefix /28?',
      options: [
        '255.255.255.224',
        '255.255.255.240',
        '255.255.255.248',
        '255.255.255.192'
      ],
      correctAnswer: '255.255.255.240',
      explanation: '/28 means 28 consecutive 1 bits. In the last octet: 11110000 in binary = 128 + 64 + 32 + 16 = 240. So mask is 255.255.255.240.',
      difficulty: 'medium',
      conceptKey: 'CIDR to Subnet Mask'
    }
  ]
};

export const INITIAL_DEMO_PLAN: StudyPlan = {
  id: 'plan-cn-01',
  subjectName: 'Computer Networks & Internet Protocols',
  examDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  dailyHours: 3,
  learningGoal: 'Score >90% on Final Exam with high mastery of TCP/IP, Subnetting, and Layer Architectures',
  materialTextSnippet: 'Comprehensive Course Syllabus: Computer Networks (CS-401). Includes OSI 7 Layer Reference Model, TCP/IP Suite, Flow/Congestion Control, Subnetting and CIDR calculation, Distance Vector & Link State Routing, CRC error detection, DNS/HTTP application protocols.',
  uploadedFiles: [
    {
      name: 'Computer_Networks_Complete_Lecture_Notes.pdf',
      size: 4280192,
      pageCount: 38,
      extractedChars: 48920,
      uploadedAt: 'Today, 09:15 AM'
    },
    {
      name: 'Syllabus_and_Exam_Guide_2026.pdf',
      size: 891240,
      pageCount: 6,
      extractedChars: 9140,
      uploadedAt: 'Today, 09:16 AM'
    }
  ],
  topics: DEMO_TOPICS_NETWORKS,
  roadmap: DEMO_ROADMAP_NETWORKS,
  quizHistory: [
    {
      id: 'quiz-hist-1',
      createdAt: 'Yesterday, 4:30 PM',
      title: 'Diagnostic Pre-Assessment Quiz',
      topicIds: ['top-1', 'top-2', 'top-5', 'top-7'],
      score: 3,
      totalQuestions: 6,
      percentage: 50,
      questions: [],
      masteryChanges: [
        { topicId: 'top-2', topicName: 'TCP/IP Protocol Suite', oldScore: 70, newScore: 42, change: -28 },
        { topicId: 'top-5', topicName: 'IP Addressing & Subnetting', oldScore: 60, newScore: 36, change: -24 },
        { topicId: 'top-1', topicName: 'OSI Model', oldScore: 75, newScore: 85, change: +10 }
      ],
      weakTopicsIdentified: ['top-2', 'top-5']
    }
  ],
  overallMastery: 65,
  lastAdaptedAt: 'Today at 09:30 AM',
  adaptationCount: 2
};

export const sampleStudyPlan: StudyPlan = INITIAL_DEMO_PLAN;

