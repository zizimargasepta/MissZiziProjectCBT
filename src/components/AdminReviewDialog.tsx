import { Question, ScoreRecord } from "@/types/exam";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, XCircle } from "lucide-react";

const clean = (s: string) => s.replace(/^\*/, "");

const typeLabels: Record<string, string> = {
  TF: "Benar / Salah", MC: "Pilihan Ganda", MR: "Jawaban Ganda",
  TI: "Jawaban Singkat", MG: "Menjodohkan", SEQ: "Urutan", NUMG: "Numerik",
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  questions: Question[];
  score: ScoreRecord | null;
  studentName?: string;
}

const AdminReviewDialog = ({ open, onOpenChange, questions, score, studentName }: Props) => {
  const format = (r: string | string[] | undefined) =>
    r === undefined || r === "" ? "-" : Array.isArray(r) ? r.join(", ") : r;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Review Jawaban {studentName ? `— ${studentName}` : ""}</DialogTitle>
        </DialogHeader>

        {!score ? (
          <p className="text-muted-foreground">Tidak ada data jawaban.</p>
        ) : (
          <div className="space-y-3">
            {questions.map((q, i) => {
              const ans = (score.answers || []).find((a) => a.question_id === q.question_id);
              const isCorrect = ans?.correct || false;
              const response = ans?.response;
              const opts = [q.answer_1, q.answer_2, q.answer_3, q.answer_4].filter(Boolean);
              const correctAnswers = opts.filter((o) => o.startsWith("*")).map((o) => o.slice(1));

              let correctDisplay = "";
              if (["TF", "MC", "TI", "NUMG"].includes(q.question_type)) correctDisplay = correctAnswers.join(" / ");
              else if (q.question_type === "MR") correctDisplay = correctAnswers.join(", ");
              else if (q.question_type === "MG") correctDisplay = opts.map(clean).join(", ");
              else if (q.question_type === "SEQ") correctDisplay = opts.map(clean).join(" → ");

              return (
                <div
                  key={q.question_id || i}
                  className={`rounded-lg border border-l-4 p-4 ${isCorrect ? "border-l-success" : "border-l-destructive"}`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {isCorrect ? (
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-destructive shrink-0" />
                    )}
                    <span className="text-muted-foreground">Soal {i + 1}</span>
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs">
                      {typeLabels[q.question_type] || q.question_type}
                    </span>
                  </div>

                  {q.image && <img src={q.image} alt={`Media soal ${i + 1}`} className="max-w-full max-h-40 rounded-lg mb-2" />}
                  {q.video && (
                    <video controls className="max-w-full max-h-40 rounded-lg mb-2">
                      <source src={q.video} type="video/mp4" />
                    </video>
                  )}
                  {q.audio && (
                    <audio controls className="w-full mb-2">
                      <source src={q.audio} type="audio/mpeg" />
                    </audio>
                  )}

                  {q.question_paragraph && (
                    <div
                      className="bg-secondary/50 rounded-lg p-3 mb-2 leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: q.question_paragraph }}
                    />
                  )}

                  <p className="mb-2">{q.question_text}</p>

                  {["TF", "MC", "MR"].includes(q.question_type) && (
                    <div className="space-y-1.5 mb-2">
                      {(q.question_type === "TF" ? ["True", "False"] : opts.map(clean)).map((opt, oi) => {
                        const isSelected = Array.isArray(response) ? response.includes(opt) : response === opt;
                        const isCorrectOpt = correctAnswers.includes(opt);
                        return (
                          <div
                            key={oi}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
                              isSelected && isCorrectOpt
                                ? "border-success bg-success/10 text-success"
                                : isSelected
                                ? "border-destructive bg-destructive/10 text-destructive"
                                : isCorrectOpt
                                ? "border-success/50 bg-success/5 text-success"
                                : "border-border text-muted-foreground"
                            }`}
                          >
                            <span>{opt}</span>
                            {isSelected && <span className="ml-auto text-xs opacity-70">(Jawaban Siswa)</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <span className="text-muted-foreground min-w-[120px]">Jawaban Siswa:</span>
                      <span className={isCorrect ? "text-success" : "text-destructive"}>{format(response)}</span>
                    </div>
                    {!isCorrect && (
                      <div className="flex gap-2">
                        <span className="text-muted-foreground min-w-[120px]">Jawaban Benar:</span>
                        <span className="text-success">{correctDisplay}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AdminReviewDialog;
