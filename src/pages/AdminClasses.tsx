import { useState, useEffect, useMemo } from "react";
import { db, ref, get } from "@/lib/firebase";
import { Student } from "@/types/exam";
import { exportToExcel } from "@/lib/excelUtils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Download, Loader2, RefreshCw, CheckCircle2, Clock, Users, CalendarClock } from "lucide-react";
import { useAdminExam } from "@/context/AdminExamContext";
import { scoresPath, getExamStatus, statusLabel, formatSchedule } from "@/lib/exams";

const AdminClasses = () => {
  const { exams, loading: examsLoading } = useAdminExam();
  const [students, setStudents] = useState<Student[]>([]);
  const [scoreMap, setScoreMap] = useState<Record<string, Record<string, any>>>({});
  const [loading, setLoading] = useState(true);
  const [cls, setCls] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const studSnap = await get(ref(db, "students"));
      if (studSnap.exists()) {
        const d = studSnap.val();
        setStudents(Array.isArray(d) ? d.filter(Boolean) : Object.values(d));
      } else setStudents([]);

      const entries = await Promise.all(
        exams.map(async (e) => {
          const snap = await get(ref(db, scoresPath(e.exam_id)));
          const map: Record<string, any> = {};
          if (snap.exists()) {
            const d = snap.val();
            const list = Array.isArray(d) ? d.filter(Boolean) : Object.values(d);
            (list as any[]).forEach((s) => { if (s?.student_id) map[s.student_id] = s; });
          }
          return [e.exam_id, map] as const;
        })
      );
      setScoreMap(Object.fromEntries(entries));
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    if (!examsLoading) fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [examsLoading, exams.length]);

  const classes = useMemo(
    () => [...new Set(students.map((s) => s.class).filter(Boolean))].sort(),
    [students]
  );

  useEffect(() => {
    if (classes.length && !classes.includes(cls)) setCls(classes[0]);
  }, [classes, cls]);

  const classStudents = useMemo(
    () =>
      students
        .filter((s) => s.class === cls)
        .sort((a, b) => (Number(a.absen) || 0) - (Number(b.absen) || 0)),
    [students, cls]
  );

  const doneCount = (examId: string) =>
    classStudents.filter((s) => scoreMap[examId]?.[s.student_id]).length;

  const totalSlots = classStudents.length * exams.length;
  const totalDone = exams.reduce((sum, e) => sum + doneCount(e.exam_id), 0);
  const progressPct = totalSlots > 0 ? Math.round((totalDone / totalSlots) * 100) : 0;

  const handleExport = () => {
    const rows = classStudents.map((s, i) => {
      const row: Record<string, any> = {
        No: i + 1,
        Absen: s.absen,
        NIS: s.nis,
        Nama: s.name,
        Kelas: s.class,
      };
      exams.forEach((e) => {
        const sc = scoreMap[e.exam_id]?.[s.student_id];
        row[e.name] = sc ? parseInt(sc.total_score) || 0 : "Belum";
      });
      return row;
    });
    exportToExcel(rows, `Progres_Kelas_${cls || "Semua"}`);
  };

  if (examsLoading || loading)
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground shrink-0" />
          <Select value={cls} onValueChange={setCls}>
            <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Pilih kelas" /></SelectTrigger>
            <SelectContent>
              {classes.map((c) => <SelectItem key={c} value={c}>Kelas {c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={fetchData} className="gap-1.5">
            <RefreshCw className="w-4 h-4" />Segarkan
          </Button>
          <Button size="sm" variant="outline" onClick={handleExport} className="gap-1.5">
            <Download className="w-4 h-4" />Ekspor
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[
          { label: "Jumlah Siswa", value: `${classStudents.length}` },
          { label: "Paket Ujian", value: `${exams.length}` },
          { label: "Progres Pengerjaan", value: `${totalDone}/${totalSlots} (${progressPct})` },
        ].map((item) => (
          <Card key={item.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className="text-xl font-bold">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Exam schedule */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="w-4 h-4" />Jadwal Ujian
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Paket Ujian</TableHead>
                <TableHead>Jadwal</TableHead>
                <TableHead className="text-center">Durasi</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Sudah Mengerjakan</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((e) => (
                <TableRow key={e.exam_id}>
                  <TableCell>{e.name}</TableCell>
                  <TableCell>{formatSchedule(e)}</TableCell>
                  <TableCell className="text-center">{e.duration_minutes} menit</TableCell>
                  <TableCell className="text-center">{statusLabel[getExamStatus(e)]}</TableCell>
                  <TableCell className="text-center">{doneCount(e.exam_id)}/{classStudents.length}</TableCell>
                </TableRow>
              ))}
              {exams.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Belum ada paket ujian</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Per student progress */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Progres Per Siswa {cls && `— Kelas ${cls}`}</CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>NIS</TableHead>
                <TableHead>Nama</TableHead>
                {exams.map((e) => (
                  <TableHead key={e.exam_id} className="text-center min-w-40">{e.name}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {classStudents.map((s, i) => (
                <TableRow key={s.student_id}>
                  <TableCell>{i + 1}</TableCell>
                  <TableCell>{s.nis}</TableCell>
                  <TableCell>{s.name}</TableCell>
                  {exams.map((e) => {
                    const sc = scoreMap[e.exam_id]?.[s.student_id];
                    return (
                      <TableCell key={e.exam_id} className="text-center">
                        {sc ? (
                          <span className="inline-flex items-center gap-1 text-success bg-success/10 px-2 py-1 rounded-full">
                            <CheckCircle2 className="w-3 h-3" />{parseInt(sc.total_score) || 0}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-warning bg-warning/10 px-2 py-1 rounded-full">
                            <Clock className="w-3 h-3" />Belum
                          </span>
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
              {classStudents.length === 0 && (
                <TableRow><TableCell colSpan={3 + exams.length} className="text-center text-muted-foreground py-8">Tidak ada siswa pada kelas ini</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminClasses;
