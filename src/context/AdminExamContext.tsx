import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { ExamPackage } from "@/types/exam";
import { fetchExams } from "@/lib/exams";

interface AdminExamContextType {
  exams: ExamPackage[];
  examId: string;
  setExamId: (id: string) => void;
  activeExam: ExamPackage | null;
  loading: boolean;
  refreshExams: () => Promise<void>;
}

const AdminExamContext = createContext<AdminExamContextType | undefined>(undefined);

export const AdminExamProvider = ({ children }: { children: ReactNode }) => {
  const [exams, setExams] = useState<ExamPackage[]>([]);
  const [examId, setExamIdState] = useState<string>(() => localStorage.getItem("cbt_admin_exam") || "");
  const [loading, setLoading] = useState(true);

  const setExamId = (id: string) => {
    setExamIdState(id);
    localStorage.setItem("cbt_admin_exam", id);
  };

  const refreshExams = useCallback(async () => {
    setLoading(true);
    try {
      const list = await fetchExams();
      setExams(list);
      setExamIdState((prev) => {
        const valid = prev && list.some((e) => e.exam_id === prev);
        const next = valid ? prev : list[0]?.exam_id || "";
        localStorage.setItem("cbt_admin_exam", next);
        return next;
      });
    } catch {
      setExams([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    refreshExams();
  }, [refreshExams]);

  const activeExam = exams.find((e) => e.exam_id === examId) || null;

  return (
    <AdminExamContext.Provider value={{ exams, examId, setExamId, activeExam, loading, refreshExams }}>
      {children}
    </AdminExamContext.Provider>
  );
};

export const useAdminExam = () => {
  const ctx = useContext(AdminExamContext);
  if (!ctx) throw new Error("useAdminExam must be within AdminExamProvider");
  return ctx;
};
