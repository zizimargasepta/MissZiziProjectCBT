import jsPDF from "jspdf";
import { ScoreRecord, Student } from "@/types/exam";

export const generateCertificatePdf = (student: Student, score: ScoreRecord, scoreValue: number | string) => {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const w = 297;
  const h = 210;
  const today = new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });

  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, w, h, "F");
  doc.setFillColor(226, 232, 240);
  doc.rect(0, h * 0.6, w, h * 0.4, "F");

  doc.setDrawColor(26, 68, 128);
  doc.setLineWidth(1.2);
  doc.roundedRect(8, 8, w - 16, h - 16, 4, 4, "S");

  doc.setDrawColor(212, 160, 23);
  doc.setLineWidth(0.4);
  doc.roundedRect(12, 12, w - 24, h - 24, 3, 3, "S");

  const cx = w / 2;

  doc.setFontSize(11);
  doc.setTextColor(26, 68, 128);
  doc.setFont("helvetica", "normal");
  doc.text("SMP NEGERI 1 PURBALINGGA", cx, 35, { align: "center" });

  doc.setFontSize(28);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(26, 68, 128);
  doc.text("SERTIFIKAT", cx, 50, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(score.exam_name ? `Computer Based Test — ${score.exam_name}` : "Computer Based Test", cx, 58, { align: "center" });

  doc.setDrawColor(212, 160, 23);
  doc.setLineWidth(0.5);
  doc.line(cx - 40, 63, cx + 40, 63);

  doc.setFontSize(11);
  doc.setTextColor(71, 85, 105);
  doc.text("Diberikan kepada:", cx, 73, { align: "center" });

  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(student.name, cx, 85, { align: "center" });

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`NIS: ${student.nis}   |   Kelas: ${student.class}`, cx, 93, { align: "center" });

  const boxW = 60;
  const boxH = 36;
  const boxX = cx - boxW / 2;
  const boxY = 100;
  doc.setFillColor(26, 68, 128);
  doc.roundedRect(boxX, boxY, boxW, boxH, 4, 4, "F");

  doc.setFontSize(30);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(String(scoreValue), cx, boxY + 22, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(203, 213, 225);
  doc.text("Nilai Ujian", cx, boxY + 31, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(`Status: ${score.status}`, cx, 148, { align: "center" });
  doc.text(`Durasi: ${score.duration}`, cx, 155, { align: "center" });

  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text("Tanggal", 30, 172);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(today, 30, 179);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184);
  doc.text("Guru Bahasa Inggris", w - 75, 172, { align: "left" });

doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("Didik Kamseno, S. Pd.", w - 75, 190, { align: "left" });

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text("NIP. 198612282022211008", w - 75, 195, { align: "left" });

  doc.save(`Sertifikat_CBT_${student.name.replace(/\s+/g, "_")}.pdf`);
};
