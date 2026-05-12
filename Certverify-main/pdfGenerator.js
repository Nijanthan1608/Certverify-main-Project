import { jsPDF } from 'jspdf';

// Helper function scoped to this file to format dates specifically for the PDF
const fmtDate = (d) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Helper function scoped to this file to format duration nicely
const calcDuration = (start, end) => {
  if (!start || !end) return '—';
  const days = Math.round((new Date(end) - new Date(start)) / 86400000);
  if (days <= 0) return '—';
  const months = Math.floor(days / 30);
  const rem = days % 30;
  if (months === 0) return `${days} day${days !== 1 ? 's' : ''}`;
  if (rem === 0) return `${months} month${months !== 1 ? 's' : ''}`;
  return `${months} month${months !== 1 ? 's' : ''}, ${rem} day${rem !== 1 ? 's' : ''}`;
};

// The heavy lifter function that draws out the Certificate PDF programmatically.
// It bypasses the DOM entirely, meaning we get crystal clear vector graphics that look amazing when printed.
export const generateCertificatePDF = (cert) => {
  // Create a new landscape A4 sized document
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const W = 297, H = 210; // Dimensions in mm for A4 landscape

  // ── 1. The Background Paper Texture ──
  doc.setFillColor(248, 246, 240); // A very warm, off-white cream color
  doc.rect(0, 0, W, H, 'F'); // Draw a rectangle filling the entire page

  // ── 2. The Gold Borders ──
  // The outer, thicker gold border
  doc.setDrawColor(200, 169, 110); // Standard Gold theme color
  doc.setLineWidth(0.8); // Thick
  doc.rect(10, 10, W - 20, H - 20); // Placed 10mm off the edge

  // The inner, thinner gold border
  doc.setLineWidth(0.3); // Thin
  doc.rect(14, 14, W - 28, H - 28); // Placed 14mm off the edge

  // Cute little circular dots in all four corners of the border
  const corners = [[10,10],[W-10,10],[10,H-10],[W-10,H-10]];
  corners.forEach(([cx,cy]) => {
    doc.setFillColor(200, 169, 110);
    doc.circle(cx, cy, 1.5, 'F');
  });

  // ── 3. The Certificate Header ──
  doc.setFontSize(8);
  doc.setTextColor(138, 122, 90);
  doc.setFont('helvetica', 'normal');
  doc.text('INTERNSHIP PROGRAMME  ·  CERTIFICATE OF COMPLETION', W / 2, 26, { align: 'center' });

  // ── 4. Main Title ──
  doc.setFontSize(38);
  doc.setFont('times', 'bold'); // Uses standard times-new-roman because it creates an academic, serious look
  doc.setTextColor(42, 34, 24);
  doc.text('Certificate of Internship', W / 2, 52, { align: 'center' });

  // Divider line under title
  doc.setDrawColor(200, 169, 110);
  doc.setLineWidth(1.2);
  doc.line(W / 2 - 35, 70, W / 2 + 35, 70);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(138, 122, 90);
  doc.text('THIS IS TO CERTIFY THAT', W / 2, 82, { align: 'center' });

  // ── 5. The Student's Name ──
  doc.setFontSize(28);
  doc.setFont('times', 'bold');
  doc.setTextColor(42, 34, 24);
  doc.text(cert.studentName, W / 2, 95, { align: 'center' });

  // ── 6. Description Text ──
  // Calculating the exact wording automatically so everything reads like natural english
  const dur = calcDuration(cert.startDate, cert.endDate);
  const bodyLines = [
    `has successfully completed an internship in ${cert.domain}${cert.institution ? ' at ' + cert.institution : ''},`,
    `from ${fmtDate(cert.startDate)} to ${fmtDate(cert.endDate)}, a total duration of ${dur}.`,
    cert.notes ? cert.notes : 'During this period, the intern demonstrated commendable dedication and professional conduct.',
  ];

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90, 80, 64);
  // Loop through our lines array and draw them one line lower each time
  bodyLines.forEach((line, i) => {
    doc.text(line, W / 2, 108 + i * 7, { align: 'center' });
  });

  // ── 7. Footer / Signatures Section ──
  const footY = H - 38; // Give ourselves 38mm of space from the bottom

  // Full-width faint line separating footer from body
  doc.setDrawColor(200, 169, 110);
  doc.setLineWidth(0.4);
  doc.line(20, footY - 10, W - 20, footY - 10);

  // Left side: The unique Database Certificate ID
  doc.setFontSize(8);
  doc.setTextColor(138, 122, 90);
  doc.setFont('helvetica', 'normal');
  doc.text('CERTIFICATE ID', 28, footY - 3);
  doc.setFont('courier', 'bold'); // Monospaced font so the IDs look like codes
  doc.setFontSize(11);
  doc.setTextColor(42, 34, 24);
  doc.text(cert.certificateId, 28, footY + 4);
  
  // Blank signature line
  doc.setDrawColor(200, 169, 110);
  doc.setLineWidth(0.6);
  doc.line(28, footY + 16, 90, footY + 16);
  
  // Title under signature line
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(138, 122, 90);
  doc.text('Authorised Signatory', 28, footY + 21);

  // Center: The decorative simulated "Wax Seal" or crest
  doc.setDrawColor(200, 169, 110);
  doc.setLineWidth(0.8);
  doc.circle(W / 2, footY + 10, 12);
  doc.setLineWidth(0.4);
  doc.circle(W / 2, footY + 10, 9);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(138, 122, 90);
  doc.text('VERIFIED', W / 2, footY + 11, { align: 'center' });

  // Right side: Director's Signature Line
  doc.setFontSize(6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(138, 122, 90);
  doc.text('ISSUE DATE', W - 28, footY - 3, { align: 'right' }); // align right pushes the text all the way to the edge of X
  doc.setFont('courier', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(42, 34, 24);
  doc.text(fmtDate(new Date().toISOString()), W - 28, footY + 4, { align: 'right' });
  
  doc.setDrawColor(200, 169, 110);
  doc.setLineWidth(0.6);
  doc.line(W - 90, footY + 16, W - 28, footY + 16);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(138, 122, 90);
  doc.text('Programme Director', W - 28, footY + 21, { align: 'right' });

  // Trigger the browser's download manager, using a clean filename with no weird spaces
  doc.save(`${cert.certificateId}_${cert.studentName.replace(/\s+/g, '_')}_Certificate.pdf`);
};
