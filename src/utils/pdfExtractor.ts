import * as pdfjsLib from 'pdfjs-dist';

// Set up pdf.js worker using unpkg or cdnjs if needed, or fallback gracefully
try {
  if (typeof window !== 'undefined' && !(pdfjsLib as any).GlobalWorkerOptions?.workerSrc) {
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${(pdfjsLib as any).version || '3.11.174'}/pdf.worker.min.js`;
  }
} catch (e) {
  console.warn('PDF Worker setup note:', e);
}

export interface ExtractedPdfResult {
  text: string;
  pageCount: number;
  charCount: number;
  fileName: string;
  fileSize: number;
  suggestedTitle: string;
}

/**
 * Derives a human-readable title from a file name
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
 * Cleans and normalizes extracted raw PDF text
 */
export function cleanExtractedText(raw: string): string {
  return raw
    // Normalize unicode spaces
    .replace(/[\u00A0\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]/g, ' ')
    // Replace non-printable characters except newlines/tabs
    .replace(/[^\x20-\x7E\n\r\t\u00A0-\u024F\u1E00-\u1EFF]/g, ' ')
    // Collapse horizontal whitespace
    .replace(/[ \t]+/g, ' ')
    // Collapse excessive blank lines
    .replace(/\n\s*\n\s*\n+/g, '\n\n')
    .trim();
}

/**
 * Extracts structured textual content from a PDF file using pdfjs-dist
 */
export async function extractTextFromPdf(file: File): Promise<ExtractedPdfResult> {
  const arrayBuffer = await file.arrayBuffer();
  const suggestedTitle = deriveTitleFromFileName(file.name);
  
  try {
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    const pageCount = pdfDoc.numPages;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      // Preserve line breaks based on item position or newlines
      let lastY: number | null = null;
      let pageLines: string[] = [];
      let currentLine = '';

      for (const item of textContent.items as any[]) {
        if (!item || !('str' in item)) continue;
        const str = item.str;
        const y = item.transform ? item.transform[5] : null;

        if (lastY !== null && y !== null && Math.abs(y - lastY) > 8) {
          if (currentLine.trim()) {
            pageLines.push(currentLine.trim());
          }
          currentLine = str;
        } else {
          currentLine += (currentLine.length > 0 ? ' ' : '') + str;
        }
        lastY = y;
      }
      if (currentLine.trim()) {
        pageLines.push(currentLine.trim());
      }

      const pageText = pageLines.join('\n');
      fullText += `\n--- Page ${pageNum} ---\n` + pageText;
    }

    const cleanedText = cleanExtractedText(fullText);
    
    // Check if extracted text has enough usable content
    const letterCount = (cleanedText.match(/[a-zA-Z]/g) || []).length;
    if (letterCount < 40) {
      throw new Error("LearnFlow couldn't extract enough content from this PDF to generate a grounded quiz. The document may be scanned images, password-protected, or empty.");
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
    if (error.message && error.message.includes("couldn't extract enough content")) {
      throw error;
    }
    
    console.error('Failed to parse PDF via pdfjs:', error);
    // If binary parsing fails, check if plain text file was uploaded with .pdf or text
    const textDecoder = new TextDecoder('utf-8');
    const rawText = textDecoder.decode(arrayBuffer);
    const readableText = cleanExtractedText(rawText);
    const letterCount = (readableText.match(/[a-zA-Z]/g) || []).length;
    
    if (letterCount > 50) {
      return {
        text: readableText,
        pageCount: 1,
        charCount: readableText.length,
        fileName: file.name,
        fileSize: file.size,
        suggestedTitle,
      };
    }
    
    throw new Error("LearnFlow couldn't extract enough content from this PDF to generate a grounded quiz. The document may be scanned images or password protected.");
  }
}
