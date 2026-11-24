import { useState } from "react";
import { ExamPackage } from "@/types/exam";
import { useAdminExam } from "@/context/AdminExamContext";
import {
  emptyExam, newExamId, saveExam, deleteExam, getExamStatus, statusLabel, formatSchedule,
} from "@/lib/exams";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Loader2, CalendarClock, CheckCircle2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const statusClass: Record<string, string> = {
  open: "bg-success/10 text-success",
  upcoming: "bg-accent/10 text-accent",
  closed: "bg-muted text-muted-foreground",
  blocked: "bg-destructive/10 text-destructive",
};

const AdminExams = () => {
  const { exams, examId, setExamId, loading, refreshExams } = useAdminExam();
  const { toast } = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ExamPackage>(emptyExam());
  const [isNew, setIsNew] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState<ExamPackage | null>(null);
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setForm({ ...emptyExam(), exam_id: newExamId() });
    setIsNew(true);
    setDialogOpen(true);
  };

  const openEdit = (exam: ExamPackage) => {
    setForm({ ...exam });
    setIsNew(false);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: "Nama ujian wajib diisi", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await saveExam({
        ...form,
        name: form.name.trim(),
        duration_minutes: Number(form.duration_minutes) || 90,
        review_duration: Number(form.review_duration) || 60,
      });
      await refreshExams();
      if (isNew) setExamId(form.exam_id);
      setDialogOpen(false);
      toast({ title: "Berhasil", description: `Ujian "${form.name}" tersimpan` });
    } catch {
      toast({ title: "Gagal menyimpan", variant: "destructive" });
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    await deleteExam(confirmDelete.exam_id);
    setConfirmDelete(null);
    await refreshExams();
    toast({ title: "Berhasil", description: "Paket ujian dihapus" });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-primary" /> Paket Ujian & Jadwal
          </CardTitle>
          <Button size="sm" onClick={openNew} className="gap-1.5">
            <Plus className="w-4 h-4" /> Tambah Ujian
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">No</TableHead>
                <TableHead>Nama Ujian</TableHead>
                <TableHead>Jadwal</TableHead>
                <TableHead className="text-center">Durasi</TableHead>
                <TableHead className="text-center">Review</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {exams.map((e, i) => {
                const st = getExamStatus(e);
                return (
                  <TableRow key={e.exam_id} className={e.exam_id === examId ? "bg-primary/5" : ""}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {e.name}
                        {e.exam_id === examId && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5">
                            <CheckCircle2 className="w-3 h-3" /> Aktif
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{formatSchedule(e)}</TableCell>
                    <TableCell className="text-center">{e.duration_minutes} menit</TableCell>
                    <TableCell className="text-center">{e.review_duration} detik</TableCell>
                    <TableCell className="text-center">
                      <span className={`rounded-full px-2 py-0.5 ${statusClass[st]}`}>{statusLabel[st]}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5 justify-center">
                        <Button size="sm" variant="outline" onClick={() => setExamId(e.exam_id)} disabled={e.exam_id === examId}>
                          Pilih
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => openEdit(e)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setConfirmDelete(e)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {exams.length === 0 && (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Belum ada paket ujian</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-muted-foreground">
        Soal, hasil, analisis, dan reset pada dashboard mengikuti paket ujian yang dipilih (Aktif).
      </p>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{isNew ? "Tambah Paket Ujian" : "Edit Paket Ujian"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="block mb-1 text-muted-foreground">Nama Ujian</label>
              <Input
                placeholder="Contoh: Ulangan Harian 1 / Asesmen Tengah Semester"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block mb-1 text-muted-foreground">Waktu Mulai</label>
                <Input
                  type="datetime-local"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                />
              </div>
              <div>
                <label className="block mb-1 text-muted-foreground">Waktu Selesai</label>
                <Input
                  type="datetime-local"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                />
              </div>
              <div>
                <label className="block mb-1 text-muted-foreground">Durasi Pengerjaan (menit)</label>
                <Input
                  type="number"
                  min={1}
                  value={form.duration_minutes}
                  onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })}
                />
              </div>
              <div>
                <label className="block mb-1 text-muted-foreground">Durasi Review (detik)</label>
                <Input
                  type="number"
                  min={10}
                  value={form.review_duration}
                  onChange={(e) => setForm({ ...form, review_duration: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
              <div>
                <p>Blokir Ujian</p>
                <p className="text-muted-foreground">Jika aktif, siswa tidak dapat mengakses ujian ini.</p>
              </div>
              <Switch checked={form.blocked} onCheckedChange={(v) => setForm({ ...form, blocked: v })} />
            </div>
          </div>
          <DialogFooter className="flex-row gap-2 justify-end">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />} Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(open) => !open && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex justify-center mb-3">
              <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-7 h-7 text-destructive" />
              </div>
            </div>
            <AlertDialogTitle className="text-center">Hapus Paket Ujian?</AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Paket <strong>{confirmDelete?.name}</strong> beserta seluruh soal dan hasil ujiannya akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2 sm:justify-center">
            <AlertDialogCancel className="flex-1">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminExams;
