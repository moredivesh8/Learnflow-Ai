import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

export interface ExtractedPdfResult {
  text: string;
  pageCount: number;
  charCount: number;
  fileName: string;
  fileSize: number;
  suggestedTitle: string;
}

/**
 * Derives a human-readable title from a file name.
 */
export function deriveTitleFromFileName(fileName: string): string {
  const withoutExt = fileName.replace(/\.[^/.]+$/, '');

  const clean = withoutExt
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();

  return clean.length > 0 ? clean : 'Uploaded Study Document';
}

/**
 * Cleans extracted PDF text without destroying meaningful content.
 */
export function cleanExtractedText(raw: string): string {
  return raw
    .replace(
      /[\u00A0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]/g,
      ' '
    )
    .replace(/[^\x20-\x7E\n\r\t\u00A0-\u024F\u1E00-\u1EFF]/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

/**
 * Extract text from a real PDF using PDF.js.
 *
 * IMPORTANT:
 * We intentionally DO NOT decode the PDF binary as UTF-8 if PDF.js fails.
 * A PDF is a binary document, not a plain-text file.
 */
export async function extractTextFromPdf(
  file: File
): Promise<ExtractedPdfResult> {
  if (!file || file.size === 0) {
    throw new Error('The uploaded PDF is empty.');
  }

  const suggestedTitle = deriveTitleFromFileName(file.name);
  const arrayBuffer = await file.arrayBuffer();

  try {
    console.log(
      `[PDF] Starting extraction: ${file.name} (${file.size} bytes)`
    );

    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
    });

    const pdfDoc = await loadingTask.promise;
    const pageCount = pdfDoc.numPages;

    console.log(`[PDF] PDF.js detected ${pageCount} pages`);

    const pageTexts: string[] = [];

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();

      let lastY: number | null = null;
      let currentLine = '';
      const pageLines: string[] = [];

      for (const item of textContent.items as any[]) {
        if (!item || typeof item.str !== 'string') {
          continue;
        }

        const str = item.str.trim();
        if (!str) continue;

        const y =
          Array.isArray(item.transform) && item.transform.length >= 6
            ? Number(item.transform[5])
            : null;

        if (
          lastY !== null &&
          y !== null &&
          Math.abs(y - lastY) > 5
        ) {
          if (currentLine.trim()) {
            pageLines.push(currentLine.trim());
          }

          currentLine = str;
        } else {
          currentLine +=
            currentLine.length > 0 ? ` ${str}` : str;
        }

        if (y !== null) {
          lastY = y;
        }
      }

      if (currentLine.trim()) {
        pageLines.push(currentLine.trim());
      }

      const pageText = pageLines.join('\n').trim();

      pageTexts.push(
        `--- Page ${pageNum} ---\n${pageText}`
      );

      console.log(
        `[PDF] Page ${pageNum}/${pageCount}: ${pageText.length} characters`
      );
    }

    const cleanedText = cleanExtractedText(
      pageTexts.join('\n\n')
    );

    const letterCount =
      (cleanedText.match(/[a-zA-Z]/g) || []).length;

    console.log(
      `[PDF] Extraction complete: ${pageCount} pages, ${cleanedText.length} characters`
    );

    if (letterCount < 40) {
      throw new Error(
        "LearnFlow couldn't extract enough readable text from this PDF. Please upload a text-based educational PDF or paste your study notes."
      );
    }

    return {
      text: cleanedText,
      pageCount,
      charCount: cleanedText.length,
      fileName: file.name,
      fileSize: file.size,
      suggestedTitle,
    };
  } catch (error: any) {
    console.error(
      '[PDF] PDF.js extraction failed:',
      error?.message || error
    );

    /*
     * IMPORTANT:
     * Do NOT decode the PDF binary as UTF-8 here.
     *
     * The previous implementation did that and incorrectly turned
     * the binary PDF into 176,041 characters of garbage.
     */
    throw new Error(
      "LearnFlow couldn't extract readable text from this PDF. Please upload a text-based educational PDF or paste your study notes."
    );
  }
}
