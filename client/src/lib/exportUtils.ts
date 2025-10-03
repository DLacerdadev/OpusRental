import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export function exportToPDF(title: string, headers: string[], data: any[][]) {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.text(title, 14, 22);
  
  doc.setFontSize(11);
  doc.setTextColor(100);
  
  autoTable(doc, {
    head: [headers],
    body: data,
    startY: 30,
    theme: "grid",
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [33, 150, 243],
      textColor: 255,
      fontStyle: "bold",
    },
  });
  
  doc.save(`${title.toLowerCase().replace(/\s+/g, "-")}.pdf`);
}

export function exportToCSV(filename: string, headers: string[], data: any[][]) {
  const csvContent = [
    headers.join(","),
    ...data.map(row => row.map(cell => `"${cell}"`).join(","))
  ].join("\n");
  
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToExcel(filename: string, headers: string[], data: any[][]) {
  // Create a proper Excel XML format
  let excelContent = '<?xml version="1.0"?>\n';
  excelContent += '<?mso-application progid="Excel.Sheet"?>\n';
  excelContent += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"\n';
  excelContent += ' xmlns:o="urn:schemas-microsoft-com:office:office"\n';
  excelContent += ' xmlns:x="urn:schemas-microsoft-com:office:excel"\n';
  excelContent += ' xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"\n';
  excelContent += ' xmlns:html="http://www.w3.org/TR/REC-html40">\n';
  excelContent += ' <Worksheet ss:Name="Relatório">\n';
  excelContent += '  <Table>\n';
  
  // Add headers
  excelContent += '   <Row>\n';
  headers.forEach(header => {
    excelContent += `    <Cell><Data ss:Type="String">${header}</Data></Cell>\n`;
  });
  excelContent += '   </Row>\n';
  
  // Add data
  data.forEach(row => {
    excelContent += '   <Row>\n';
    row.forEach(cell => {
      excelContent += `    <Cell><Data ss:Type="String">${cell}</Data></Cell>\n`;
    });
    excelContent += '   </Row>\n';
  });
  
  excelContent += '  </Table>\n';
  excelContent += ' </Worksheet>\n';
  excelContent += '</Workbook>';
  
  const blob = new Blob([excelContent], { type: "application/vnd.ms-excel" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.xls`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
