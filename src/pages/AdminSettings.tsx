import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, ref, get, set } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { KeyRound, Loader2, Save, UserCog } from "lucide-react";

const AdminSettings = () => {
  const navigate = useNavigate();
  const [adminKey, setAdminKey] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState("");
  const [username, setUsername] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const raw = sessionStorage.getItem("cbt_admin");
      if (!raw) {
        navigate("/admin/login");
        return;
      }
      const session = JSON.parse(raw);
      try {
        const snapshot = await get(ref(db, "admin"));
        if (snapshot.exists()) {
          const val = snapshot.val();
          const entries = Array.isArray(val)
            ? val.map((v, i) => [String(i), v] as [string, any])
            : Object.entries(val as Record<string, any>);
          const found = entries.find(([, v]) => v?.username === session.username);
          if (found) {
            setAdminKey(found[0]);
            setCurrentUsername(found[1].username || "");
            setUsername(found[1].username || "");
          } else {
            setError("Akun admin tidak ditemukan di database.");
          }
        } else {
          setError("Data admin belum tersedia.");
        }
      } catch {
        setError("Gagal terhubung ke server.");
      }
      setLoading(false);
    };
    load();
  }, [navigate]);

  const handleSave = async () => {
    setError("");
    const uname = username.trim();
    if (!adminKey) return;
    if (uname.length < 3 || uname.length > 50) {
      setError("Username harus 3–50 karakter.");
      return;
    }
    if (!oldPassword.trim()) {
      setError("Masukkan password saat ini untuk konfirmasi.");
      return;
    }
    if (newPassword && (newPassword.length < 6 || newPassword.length > 100)) {
      setError("Password baru minimal 6 karakter.");
      return;
    }
    if (newPassword && newPassword !== confirmPassword) {
      setError("Konfirmasi password baru tidak sama.");
      return;
    }

    setSaving(true);
    try {
      const snapshot = await get(ref(db, `admin/${adminKey}`));
      const data = snapshot.val() || {};
      if (String(data.password) !== oldPassword.trim()) {
        setError("Password saat ini salah.");
        setSaving(false);
        return;
      }
      const updated = {
        ...data,
        username: uname,
        password: newPassword ? newPassword : String(data.password),
      };
      await set(ref(db, `admin/${adminKey}`), updated);
      sessionStorage.setItem("cbt_admin", JSON.stringify(updated));
      setCurrentUsername(uname);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({ title: "Berhasil", description: "Data akun admin berhasil diperbarui." });
    } catch {
      setError("Gagal menyimpan perubahan.");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <UserCog className="w-5 h-5 text-primary" />
            Pengaturan Akun Admin
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Akun aktif: <span className="text-foreground">{currentUsername || "-"}</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm text-foreground mb-1.5 block">Username</label>
            <Input value={username} maxLength={50} onChange={(e) => setUsername(e.target.value)} className="h-11" />
          </div>
          <div>
            <label className="text-sm text-foreground mb-1.5 block">Password Saat Ini</label>
            <Input
              type="password"
              value={oldPassword}
              maxLength={100}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Wajib untuk konfirmasi"
              className="h-11"
            />
          </div>
          <div>
            <label className="text-sm text-foreground mb-1.5 block">Password Baru</label>
            <Input
              type="password"
              value={newPassword}
              maxLength={100}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Kosongkan jika tidak diubah"
              className="h-11"
            />
          </div>
          <div>
            <label className="text-sm text-foreground mb-1.5 block">Konfirmasi Password Baru</label>
            <Input
              type="password"
              value={confirmPassword}
              maxLength={100}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Ulangi password baru"
              className="h-11"
            />
          </div>
          {error && (
            <p className="text-destructive text-sm text-center bg-destructive/10 rounded-lg p-2">{error}</p>
          )}
          <Button className="w-full h-11 gap-2" onClick={handleSave} disabled={saving || !adminKey}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
          <p className="text-xs text-muted-foreground flex items-start gap-2">
            <KeyRound className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            Setelah username atau password diubah, gunakan data terbaru saat login berikutnya.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSettings;
