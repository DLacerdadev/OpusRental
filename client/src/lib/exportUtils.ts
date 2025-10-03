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
  // Create simple tab-delimited content that Excel opens natively
  const rows = [headers, ...data];
  const content = rows.map(row => row.join('\t')).join('\n');
  
  // Use text/csv MIME type with .xls extension - Excel opens this without warnings
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.xls`);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
