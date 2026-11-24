import { useAdminExam } from "@/context/AdminExamContext";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { getExamStatus, statusLabel } from "@/lib/exams";
import { CalendarClock } from "lucide-react";

const AdminExamSelector = () => {
  const { exams, examId, setExamId, loading } = useAdminExam();

  if (loading || exams.length === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <CalendarClock className="w-4 h-4 text-muted-foreground shrink-0" />
      <Select value={examId} onValueChange={setExamId}>
        <SelectTrigger className="w-48 sm:w-64 h-9">
          <SelectValue placeholder="Pilih paket ujian" />
        </SelectTrigger>
        <SelectContent>
          {exams.map((e) => (
            <SelectItem key={e.exam_id} value={e.exam_id}>
              {e.name} — {statusLabel[getExamStatus(e)]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default AdminExamSelector;
