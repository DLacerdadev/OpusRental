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
  // Create HTML table that Excel can open
  let html = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
  html += '<head><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>';
  html += '<x:Name>Relatório</x:Name>';
  html += '<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>';
  html += '</x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->';
  html += '<meta charset="UTF-8"></head><body>';
  html += '<table border="1">';
  
  // Add headers
  html += '<thead><tr style="background-color: #2196F3; color: white; font-weight: bold;">';
  headers.forEach(header => {
    html += `<th style="padding: 8px;">${header}</th>`;
  });
  html += '</tr></thead>';
  
  // Add data
  html += '<tbody>';
  data.forEach(row => {
    html += '<tr>';
    row.forEach(cell => {
      html += `<td style="padding: 8px;">${cell}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table></body></html>';
  
  const blob = new Blob([html], { type: "application/vnd.ms-excel" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.xls`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
