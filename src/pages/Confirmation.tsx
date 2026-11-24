import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useExam } from "@/context/ExamContext";
import { db, ref, get } from "@/lib/firebase";
import { ExamPackage } from "@/types/exam";
import { fetchExams, getExamStatus, statusLabel, formatSchedule, scoresPath } from "@/lib/exams";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { User, BookOpen, ArrowRight, AlertTriangle, CalendarClock, Loader2, CheckCircle2 } from "lucide-react";

const statusClass: Record<string, string> = {
  open: "bg-success/10 text-success",
  upcoming: "bg-accent/10 text-accent",
  closed: "bg-muted text-muted-foreground",
  blocked: "bg-destructive/10 text-destructive",
};

const Confirmation = () => {
  const { student, setExam } = useExam();
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [checking, setChecking] = useState(true);
  const [exams, setExams] = useState<ExamPackage[]>([]);
  const [doneScores, setDoneScores] = useState<Record<string, number | null>>({});
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    if (!student) {
      navigate("/");
      return;
    }
    const load = async () => {
      try {
        const list = await fetchExams();
        setExams(list);
        const entries = await Promise.all(
          list.map(async (e) => {
            const snap = await get(ref(db, `${scoresPath(e.exam_id)}/${student.student_id}`));
            if (!snap.exists()) return [e.exam_id, undefined] as const;
            const val = parseFloat(snap.val()?.total_score);
            return [e.exam_id, isNaN(val) ? null : Math.round(val)] as const;
          })
        );
        const map: Record<string, number | null> = {};
        entries.forEach(([id, v]) => {
          if (v !== undefined) map[id] = v;
        });
        setDoneScores(map);
        const first = list.find((e) => getExamStatus(e) === "open" && !(e.exam_id in map));
        if (first) setSelectedId(first.exam_id);
      } catch {}
      setChecking(false);
    };
    load();
  }, [student]);

  if (!student) return null;

  const selected = exams.find((e) => e.exam_id === selectedId) || null;
  const canStart = !!selected && getExamStatus(selected) === "open" && !(selected.exam_id in doneScores) && agreed;

  const startExam = () => {
    if (!selected) return;
    setExam(selected);
    navigate("/exam");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-lg shadow-xl border-0 animate-fade-in">
        <CardHeader className="text-center pb-4 pt-8">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <User className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-xl font-normal text-primary">Konfirmasi Data</h1>
          <p className="text-muted-foreground text-sm font-normal">
            Periksa data Anda lalu pilih ujian yang akan dikerjakan
          </p>
        </CardHeader>
        <CardContent className="px-8 pb-8 space-y-6">
          {/* Identity */}
          <div className="bg-secondary/50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-normal">Nama</span>
              <span className="font-normal text-foreground">{student.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground font-normal">Kelas</span>
              <span className="font-normal text-foreground">{student.class}</span>
            </div>
            {selected && selected.exam_id in doneScores && doneScores[selected.exam_id] !== null && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground font-normal">Skor</span>
                <span className="font-normal text-foreground">{doneScores[selected.exam_id]}</span>
              </div>
            )}
          </div>

          {/* Exam list */}
          {checking ? (
            <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : exams.length === 0 ? (
            <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <p className="text-sm font-normal">Belum ada ujian yang tersedia. Hubungi guru Anda.</p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground font-normal">Daftar Ujian</p>
              {exams.map((e) => {
                const st = getExamStatus(e);
                const done = e.exam_id in doneScores;
                const selectable = st === "open" && !done;
                return (
                  <button
                    key={e.exam_id}
                    onClick={() => selectable && setSelectedId(e.exam_id)}
                    className={`w-full text-left rounded-xl border p-3 transition-colors ${
                      selectedId === e.exam_id ? "border-primary bg-primary/5" : "border-border"
                    } ${selectable ? "hover:border-primary" : "opacity-70 cursor-not-allowed"}`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-normal text-foreground">{e.name}</span>
                      <span className={`ml-auto text-xs rounded-full px-2 py-0.5 ${done ? "bg-success/10 text-success" : statusClass[st]}`}>
                        {done ? "Sudah Dikerjakan" : statusLabel[st]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground font-normal mt-1 flex items-center gap-1.5">
                      <CalendarClock className="w-3.5 h-3.5" /> {formatSchedule(e)}
                    </p>
                    <p className="text-xs text-muted-foreground font-normal mt-0.5">
                      Durasi pengerjaan: {e.duration_minutes} menit
                      {done && doneScores[e.exam_id] !== null && ` • Skor: ${doneScores[e.exam_id]}`}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

          {/* Already taken notice */}
          {!checking && selected && selected.exam_id in doneScores && (
            <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
              <div>
                <p className="font-normal text-sm text-foreground">Ujian Sudah Dikerjakan</p>
                <p className="text-xs text-muted-foreground mt-0.5 font-normal">
                  Anda hanya dapat mengerjakan ujian ini satu kali.
                </p>
              </div>
            </div>
          )}

          {!checking && selected && !(selected.exam_id in doneScores) && getExamStatus(selected) === "open" && (
            <>
              <div className="bg-accent/10 rounded-xl p-4 border border-accent/20">
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                  <p className="text-sm text-foreground leading-relaxed font-normal">
                    Saya menyatakan bahwa saya akan mengerjakan ujian ini dengan
                    <strong> jujur</strong>, <strong>mandiri</strong>, dan tidak akan
                    menyalin jawaban dari sumber manapun.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Checkbox id="agree" checked={agreed} onCheckedChange={(c) => setAgreed(c === true)} />
                <label htmlFor="agree" className="text-sm cursor-pointer text-foreground font-normal">
                  Saya menyetujui pernyataan kejujuran di atas
                </label>
              </div>

              <Button className="w-full h-12 text-base font-normal gap-2" disabled={!canStart} onClick={startExam}>
                Mulai {selected.name}
                <ArrowRight className="w-5 h-5" />
              </Button>
            </>
          )}

          {!checking && (!selected || selected.exam_id in doneScores || getExamStatus(selected) !== "open") && (
            <Button variant="outline" className="w-full font-normal gap-2" onClick={() => navigate("/")}>
              <CheckCircle2 className="w-4 h-4" /> Kembali ke Login
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Confirmation;
