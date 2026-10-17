// src/utils/ExportarPDF.js
import jsPDF from 'jspdf';

export const exportarPacientesPDF = (pacientes, nombreArchivo = 'reporte_pacientes.pdf') => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPosition = 20;

  // Logo y encabezado
  pdf.setFontSize(20);
  pdf.setTextColor(40, 40, 40);
  pdf.text('HOSPITAL ADMODEL', pageWidth / 2, yPosition, { align: 'center' });
  
  pdf.setFontSize(14);
  pdf.setTextColor(100, 100, 100);
  yPosition += 10;
  pdf.text('Reporte de Pacientes', pageWidth / 2, yPosition, { align: 'center' });
  
  pdf.setFontSize(10);
  yPosition += 8;
  pdf.text(`Generado el: ${new Date().toLocaleDateString()}`, pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 20;

  // Encabezados de tabla
  pdf.setFillColor(44, 62, 80);
  pdf.setTextColor(255, 255, 255);
  pdf.rect(10, yPosition, pageWidth - 20, 10, 'F');
  pdf.text('ID', 15, yPosition + 7);
  pdf.text('Nombre', 30, yPosition + 7);
  pdf.text('Apellido', 70, yPosition + 7);
  pdf.text('Fecha Nac.', 110, yPosition + 7);
  pdf.text('Sexo', 150, yPosition + 7);
  pdf.text('Tipo Sangre', 170, yPosition + 7);
  
  yPosition += 10;

  // Datos de pacientes
  pdf.setFontSize(10);
  pdf.setTextColor(0, 0, 0);

  pacientes.forEach((paciente, index) => {
    if (index % 2 === 0) {
      pdf.setFillColor(245, 245, 245);
      pdf.rect(10, yPosition, pageWidth - 20, 8, 'F');
    }

    pdf.text(paciente.id_paciente.toString(), 15, yPosition + 6);
    pdf.text(paciente.nombre, 30, yPosition + 6);
    pdf.text(paciente.apellido, 70, yPosition + 6);
    pdf.text(paciente.fecha_nacimiento, 110, yPosition + 6);
    pdf.text(paciente.sexo, 150, yPosition + 6);
    pdf.text(paciente.tipo_sangre, 170, yPosition + 6);

    yPosition += 8;

    if (yPosition > 270) {
      pdf.addPage();
      yPosition = 20;
    }
  });

  const totalPacientes = pacientes.length;
  yPosition += 10;
  pdf.setFontSize(10);
  pdf.setTextColor(100, 100, 100);
  pdf.text(`Total de pacientes: ${totalPacientes}`, pageWidth / 2, yPosition, { align: 'center' });

  pdf.save(nombreArchivo);
};

export const exportarPacienteIndividualPDF = (paciente) => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  let yPosition = 30;

  pdf.setFontSize(20);
  pdf.setTextColor(44, 62, 80);
  pdf.text('HOSPITAL ADMODEL', pageWidth / 2, yPosition, { align: 'center' });
  
  pdf.setFontSize(16);
  yPosition += 10;
  pdf.text('EXPEDIENTE MÉDICO', pageWidth / 2, yPosition, { align: 'center' });
  
  yPosition += 20;

  pdf.setFontSize(12);
  pdf.setTextColor(0, 0, 0);

  pdf.setDrawColor(44, 62, 80);
  pdf.setLineWidth(0.5);
  pdf.rect(20, yPosition, pageWidth - 40, 80);

  pdf.setFontSize(14);
  pdf.text(`${paciente.nombre} ${paciente.apellido}`, pageWidth / 2, yPosition + 15, { align: 'center' });
  
  pdf.setFontSize(10);
  pdf.text(`ID: ${paciente.id_paciente}`, pageWidth / 2, yPosition + 25, { align: 'center' });

  const leftColumn = 30;
  const rightColumn = 110;

  pdf.text(`Fecha de Nacimiento: ${paciente.fecha_nacimiento}`, leftColumn, yPosition + 45);
  pdf.text(`Sexo: ${paciente.sexo}`, leftColumn, yPosition + 55);
  pdf.text(`Tipo de Sangre: ${paciente.tipo_sangre}`, leftColumn, yPosition + 65);

  pdf.text(`Estado: Activo`, rightColumn, yPosition + 45);
  pdf.text(`Expediente: COMPLETO`, rightColumn, yPosition + 55);
  pdf.text(`Última actualización: ${new Date().toLocaleDateString()}`, rightColumn, yPosition + 65);

  yPosition += 100;

  pdf.setFontSize(8);
  pdf.setTextColor(100, 100, 100);
  pdf.text('Documento generado automáticamente - Hospital ADMODEL', pageWidth / 2, 280, { align: 'center' });

  pdf.save(`expediente_${paciente.nombre}_${paciente.apellido}.pdf`);
};