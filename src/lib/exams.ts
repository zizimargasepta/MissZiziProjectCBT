import { db, ref, get, set } from "@/lib/firebase";
import { ExamPackage, Question } from "@/types/exam";

export const questionsPath = (examId: string) => `exam_questions/${examId}`;
export const scoresPath = (examId: string) => `exam_scores/${examId}`;

export const emptyExam = (): ExamPackage => {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  return {
    exam_id: "",
    name: "",
    start_time: fmt(now),
    end_time: fmt(end),
    duration_minutes: 90,
    review_duration: 60,
    blocked: false,
  };
};

export const newExamId = () =>
  `exam_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export type ExamStatus = "blocked" | "upcoming" | "open" | "closed";

export const getExamStatus = (exam: ExamPackage, now: number = Date.now()): ExamStatus => {
  if (exam.blocked) return "blocked";
  const start = exam.start_time ? new Date(exam.start_time).getTime() : NaN;
  const end = exam.end_time ? new Date(exam.end_time).getTime() : NaN;
  if (!isNaN(start) && now < start) return "upcoming";
  if (!isNaN(end) && now > end) return "closed";
  return "open";
};

export const statusLabel: Record<ExamStatus, string> = {
  blocked: "Diblokir",
  upcoming: "Belum Dibuka",
  open: "Sedang Berlangsung",
  closed: "Sudah Ditutup",
};

export const formatSchedule = (exam: ExamPackage) => {
  const f = (v: string) => {
    const d = new Date(v);
    if (isNaN(d.getTime())) return "-";
    return d.toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  return `${f(exam.start_time)} — ${f(exam.end_time)}`;
};

const normalizeList = <T,>(val: unknown): T[] =>
  Array.isArray(val) ? (val.filter(Boolean) as T[]) : val ? (Object.values(val as object) as T[]) : [];

/**
 * Reads all exam packages. On first run it migrates legacy data
 * (`questions` + `scores` root nodes) into the first exam package
 * so that existing data is never lost.
 */
export const fetchExams = async (): Promise<ExamPackage[]> => {
  const snap = await get(ref(db, "exams"));
  const list = normalizeList<ExamPackage>(snap.exists() ? snap.val() : null);
  if (list.length > 0) {
    return list
      .map((e) => ({
        ...e,
        duration_minutes: Number(e.duration_minutes) || 90,
        review_duration: Number(e.review_duration) || 60,
        blocked: e.blocked === true,
      }))
      .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
  }

  // --- migration of legacy data ---
  const [qSnap, sSnap, blockSnap, reviewSnap] = await Promise.all([
    get(ref(db, "questions")),
    get(ref(db, "scores")),
    get(ref(db, "config/exam_blocked")),
    get(ref(db, "config/review_duration")),
  ]);

  const base = emptyExam();
  const legacy: ExamPackage = {
    ...base,
    exam_id: newExamId(),
    name: "Ulangan Harian 1",
    review_duration: reviewSnap.exists() ? Number(reviewSnap.val()) || 60 : 60,
    blocked: blockSnap.exists() ? blockSnap.val() === true : false,
  };

  await set(ref(db, `exams/${legacy.exam_id}`), legacy);

  if (qSnap.exists()) {
    const questions = normalizeList<Question>(qSnap.val());
    if (questions.length) await set(ref(db, questionsPath(legacy.exam_id)), questions);
  }
  if (sSnap.exists()) {
    await set(ref(db, scoresPath(legacy.exam_id)), sSnap.val());
  }

  return [legacy];
};

export const saveExam = async (exam: ExamPackage) => {
  await set(ref(db, `exams/${exam.exam_id}`), exam);
};

export const deleteExam = async (examId: string) => {
  await set(ref(db, `exams/${examId}`), null);
  await set(ref(db, questionsPath(examId)), null);
  await set(ref(db, scoresPath(examId)), null);
};
