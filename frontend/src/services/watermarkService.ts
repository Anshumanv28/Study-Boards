// Watermarking service for PDF and DOCX files
import { PDFDocument, rgb, degrees } from "pdf-lib";

const DEFAULT_WATERMARK_TEXT = "StudyBoards - Confidential";

/**
 * Get watermark text from environment variable or use default
 */
function getWatermarkText(): string {
  return process.env.REACT_APP_WATERMARK_TEXT || DEFAULT_WATERMARK_TEXT;
}

/**
 * Add diagonal watermark to a PDF
 * @param pdfBytes - The PDF file as Uint8Array
 * @param watermarkText - Optional custom watermark text
 * @returns Watermarked PDF as Uint8Array
 */
export async function addWatermarkToPDF(
  pdfBytes: Uint8Array,
  watermarkText?: string
): Promise<Uint8Array> {
  try {
    const text = watermarkText || getWatermarkText();

    // Load the PDF document
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    const font = await pdfDoc.embedFont("Helvetica-Bold");

    // Get page dimensions for positioning
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();

    // Calculate diagonal position
    // Position watermark diagonally across the page
    const fontSize = Math.min(width, height) * 0.06; // 6% of smaller dimension
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    const textHeight = fontSize;

    // Calculate angle and position for diagonal watermark
    const angle = -45; // 45 degrees counter-clockwise

    // Add watermark to all pages
    pages.forEach((page) => {
      const { width: pageWidth, height: pageHeight } = page.getSize();

      // Calculate spacing for full page coverage
      // Diagonal spacing to cover the entire page - reduced multiplier for more watermarks
      const diagonalSpacing =
        Math.sqrt(textWidth * textWidth + textHeight * textHeight) * 0.7;
      const horizontalSpacing =
        diagonalSpacing * Math.cos((45 * Math.PI) / 180);
      const verticalSpacing = diagonalSpacing * Math.sin((45 * Math.PI) / 180);

      // Calculate how many watermarks we need to cover the page
      // Add extra padding to ensure full coverage
      const padding = Math.max(pageWidth, pageHeight) * 0.1;
      const cols = Math.ceil((pageWidth + padding * 2) / horizontalSpacing) + 1;
      const rows = Math.ceil((pageHeight + padding * 2) / verticalSpacing) + 1;

      // Draw watermark across the entire page in a grid pattern
      for (let row = -1; row <= rows; row++) {
        for (let col = -1; col <= cols; col++) {
          // Calculate position with diagonal offset
          const x = col * horizontalSpacing - padding;
          const y = row * verticalSpacing - padding;

          // Only draw if the watermark would be visible on the page
          if (
            x + textWidth > -padding &&
            x < pageWidth + padding &&
            y + textHeight > -padding &&
            y < pageHeight + padding
          ) {
            page.drawText(text, {
              x: x - textWidth / 2,
              y: y - textHeight / 2,
              size: fontSize,
              font: font,
              color: rgb(0.7, 0.7, 0.7), // Light gray color
              opacity: 0.3, // Semi-transparent
              rotate: degrees(angle),
            });
          }
        }
      }
    });

    // Save the watermarked PDF
    const watermarkedPdfBytes = await pdfDoc.save();
    return watermarkedPdfBytes;
  } catch (error) {
    console.error("Error adding watermark to PDF:", error);
    throw new Error("Failed to add watermark to PDF");
  }
}

/**
 * Add watermark to DOCX file
 * Note: DOCX watermarking is complex. This function converts DOCX to PDF first,
 * then applies watermark, and returns the watermarked PDF.
 *
 * For now, we'll return the original file and log a warning.
 * Full DOCX watermarking would require a server-side solution or more complex libraries.
 *
 * @param docxBytes - The DOCX file as Uint8Array
 * @param watermarkText - Optional custom watermark text
 * @returns Watermarked file (currently returns original DOCX, future: converted PDF with watermark)
 */
export async function addWatermarkToDOCX(
  docxBytes: Uint8Array,
  watermarkText?: string
): Promise<Uint8Array> {
  // TODO: Implement DOCX watermarking
  // Options:
  // 1. Convert DOCX to PDF using a library, then watermark
  // 2. Use server-side API for DOCX watermarking
  // 3. Add watermark as header/footer in DOCX (limited functionality)

  console.warn(
    "DOCX watermarking not yet implemented. Returning original file."
  );
  console.warn(
    "Consider converting DOCX to PDF first, or implement server-side DOCX watermarking."
  );

  // For now, return the original file
  // In a production environment, you might want to:
  // 1. Convert DOCX to PDF using a service/library
  // 2. Apply watermark to the PDF
  // 3. Return the watermarked PDF

  return docxBytes;
}

/**
 * Download a file with watermark applied
 * @param fileUrl - URL of the file to download
 * @param fileName - Name for the downloaded file
 * @param fileType - Type of file ('pdf' or 'docx')
 * @param watermarkText - Optional custom watermark text
 */
export async function downloadWithWatermark(
  fileUrl: string,
  fileName: string,
  fileType: "pdf" | "docx",
  watermarkText?: string
): Promise<void> {
  try {
    // Fetch the file
    const response = await fetch(fileUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const fileBytes = new Uint8Array(arrayBuffer);

    let watermarkedBytes: Uint8Array;
    let downloadFileName = fileName;

    // Apply watermark based on file type
    if (fileType === "pdf") {
      watermarkedBytes = await addWatermarkToPDF(fileBytes, watermarkText);
    } else if (fileType === "docx") {
      // For DOCX, we'll try to handle it, but it may not be fully implemented
      watermarkedBytes = await addWatermarkToDOCX(fileBytes, watermarkText);
      // If DOCX watermarking isn't implemented, we might want to convert to PDF
      // For now, we'll download the original DOCX
    } else {
      throw new Error(`Unsupported file type: ${fileType}`);
    }

    // Create blob and download
    const blob = new Blob([watermarkedBytes as BlobPart], {
      type:
        fileType === "pdf"
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = downloadFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error downloading file with watermark:", error);
    throw error;
  }
}
