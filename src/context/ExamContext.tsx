import { createContext, useContext, useState, ReactNode } from "react";
import { Student, ExamPackage } from "@/types/exam";

interface ExamContextType {
  student: Student | null;
  setStudent: (student: Student | null) => void;
  exam: ExamPackage | null;
  setExam: (exam: ExamPackage | null) => void;
}

const ExamContext = createContext<ExamContextType | undefined>(undefined);

const read = <T,>(key: string): T | null => {
  try {
    const saved = sessionStorage.getItem(key);
    return saved ? (JSON.parse(saved) as T) : null;
  } catch {
    return null;
  }
};

export const ExamProvider = ({ children }: { children: ReactNode }) => {
  const [student, setStudentState] = useState<Student | null>(() => read<Student>("cbt_student"));
  const [exam, setExamState] = useState<ExamPackage | null>(() => read<ExamPackage>("cbt_exam"));

  const setStudent = (s: Student | null) => {
    setStudentState(s);
    if (s) sessionStorage.setItem("cbt_student", JSON.stringify(s));
    else sessionStorage.removeItem("cbt_student");
  };

  const setExam = (e: ExamPackage | null) => {
    setExamState(e);
    if (e) sessionStorage.setItem("cbt_exam", JSON.stringify(e));
    else sessionStorage.removeItem("cbt_exam");
  };

  return (
    <ExamContext.Provider value={{ student, setStudent, exam, setExam }}>
      {children}
    </ExamContext.Provider>
  );
};

export const useExam = () => {
  const ctx = useContext(ExamContext);
  if (!ctx) throw new Error("useExam must be within ExamProvider");
  return ctx;
};
