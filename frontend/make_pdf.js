import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';

async function createPdf() {
  const pdfDoc = await PDFDocument.create();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const fontSize = 12;

  page.drawText('Jordan Lee', { x: 50, y: height - 4 * fontSize, size: 24, font: timesRomanFont });
  page.drawText('Senior Java Backend Developer with 6 years of experience.', { x: 50, y: height - 8 * fontSize, size: fontSize, font: timesRomanFont });
  page.drawText('Education: B.S. Computer Science, University of Technology', { x: 50, y: height - 10 * fontSize, size: fontSize, font: timesRomanFont });
  page.drawText('Skills: Java, Spring Boot, PostgreSQL, AWS, Docker, Kubernetes', { x: 50, y: height - 12 * fontSize, size: fontSize, font: timesRomanFont });
  
  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync('test_resume.pdf', pdfBytes);
  console.log('test_resume.pdf created!');
}

createPdf();