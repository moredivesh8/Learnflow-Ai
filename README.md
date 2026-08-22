# LearnFlow AI

> Turn your own study material into an adaptive learning journey.

LearnFlow AI is an AI-powered adaptive learning platform that transforms a student's study material into a personalized learning experience.

Instead of generating a generic AI study plan, LearnFlow analyzes the student's uploaded material, extracts a grounded curriculum, creates a study roadmap, generates source-grounded quizzes, identifies knowledge gaps, and adapts the roadmap based on actual performance.

## Features

- Study Material Analysis - Upload educational PDFs and extract the actual curriculum.
- Source-Grounded AI - Topics and assessments are grounded in the uploaded material.
- Adaptive Study Roadmap - Creates a personalized learning sequence from the student's material.
- AI-Generated Quizzes - Generates multiple-choice questions from the source content.
- Knowledge-Gap Detection - Identifies topics where the student is struggling.
- Adaptive Remediation - Re-prioritizes weak topics after quiz performance.
- Mastery Tracking - Tracks learning progress across topics.
- AI Tutor Feedback - Explains incorrect answers and provides learning guidance.

## How It Works

1. Upload study material.
2. LearnFlow analyzes the source.
3. The AI extracts a canonical curriculum.
4. A personalized study roadmap is generated.
5. Source-grounded quizzes are generated.
6. Student performance is evaluated.
7. Knowledge gaps are identified.
8. The roadmap adapts to weak topics.
9. Targeted remediation is provided.

## AI and Grounding

LearnFlow uses Google's Gemini API for curriculum analysis, quiz generation, answer evaluation, and adaptive learning.

A key design principle is source grounding.

When study material is uploaded:

1. The document is extracted and analyzed.
2. Topics are derived from the uploaded material.
3. Topics require supporting source evidence.
4. Quiz questions are restricted to canonical source topics.
5. Quiz evidence must be traceable to the uploaded material.
6. Unvalidated questions are discarded rather than replaced with general-knowledge questions.
7. Adaptive roadmap changes remain tied to canonical source topics.

This prevents the system from silently turning a student's PDF into a generic subject syllabus.

## Tech Stack

- React
- TypeScript
- Vite
- Express
- Google Gemini API
- PDF.js
- Tailwind CSS
- Lucide React
- Motion

## Run Locally

### Prerequisites

- Node.js
- Google Gemini API key

### Installation

Run:

    npm install

Create a `.env` file containing:

    GEMINI_API_KEY=your_gemini_api_key

Then run:

    npm run dev

The application runs at:

    http://localhost:3000

## Production Build

Run:

    npm run lint
    npm run build
    npm start

## Environment Variables

| Variable | Description |
|---|---|
| GEMINI_API_KEY | Google Gemini API key used by the server |

Never commit your `.env` file or API keys to the repository.

## Project Structure

- src/
- src/components/
- src/services/
- server.ts
- package.json
- vite.config.ts

## Hackathon

Built for the Pixel Forge AI Hackathon.

LearnFlow AI focuses on using AI to solve a practical education problem: turning static study material into an adaptive, personalized learning experience.

## License

MIT License.

See [LICENSE](LICENSE).

---

Made for the Pixel Forge AI Hackathon.
