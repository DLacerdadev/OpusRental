import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export function exportToPDF(title: string, headers: string[], data: any[][]) {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  const pageWidth = doc.internal.pageSize.getWidth();
  const textWidth = doc.getTextWidth(title);
  const textX = (pageWidth - textWidth) / 2;
  doc.text(title, textX, 22);
  
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
      halign: 'center',
      valign: 'middle',
    },
    headStyles: {
      fillColor: [33, 150, 243],
      textColor: 255,
      fontStyle: "bold",
      halign: 'center',
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
  // Create workbook and worksheet using SheetJS
  const workbook = XLSX.utils.book_new();
  
  // Combine headers and data
  const worksheetData = [headers, ...data];
  
  // Create worksheet from array of arrays
  const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
  
  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(workbook, worksheet, "Relatório");
  
  // Export to XLSX file
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}
