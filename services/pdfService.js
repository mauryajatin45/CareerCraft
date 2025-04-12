const { jsPDF } = require('jspdf');
const html2canvas = require('html2canvas');

async function generatePDF(htmlContent) {
  // Create a temporary element to render HTML
  const element = document.createElement('div');
  element.innerHTML = htmlContent;
  document.body.appendChild(element);

  // Convert HTML to canvas
  const canvas = await html2canvas(element, {
    scale: 2,
    logging: false,
    useCORS: true
  });

  // Remove temporary element
  document.body.removeChild(element);

  // Create PDF
  const pdf = new jsPDF('p', 'mm', 'a4');
  const imgData = canvas.toDataURL('image/png');
  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
  return pdf.output('arraybuffer');
}

module.exports = { generatePDF };