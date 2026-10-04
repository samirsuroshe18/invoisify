// Makes a PDF of an invoice from how it looks on screen and saves it as <name>.pdf.
// The PDF maker is large, so it is fetched only when a PDF is asked for.
export const downloadPdf = async (element, name) => {
  const { default: html2pdf } = await import('html2pdf.js');

  await html2pdf()
    .from(element)
    .set({
      filename: `${name}.pdf`,
      margin: 8,
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .save();
};
