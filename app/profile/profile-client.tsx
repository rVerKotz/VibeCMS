'use client'

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/app/utils/supabase/client";
import Link from "next/link";
import { 
  ChevronLeft, 
  User, 
  Lock, 
  Camera, 
  Loader2, 
  Trash2, 
  AlertTriangle,
  Menu,
  X
} from "lucide-react";

export default function ProfileClient({ user, profile }: { user: any, profile: any }) {
  const router = useRouter();
  const supabase = createClient();
  console.log("Profile data from server:", profile);
  console.log("User data from server:", user);

  // Navigation States
  const [activeTab, setActiveTab] = useState("profil");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Form States (Diinisialisasi dari props jika ada)
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [username, setUsername] = useState(profile?.username?.replace('@', '') || "");
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || "");
  const [newPassword, setNewPassword] = useState("");

  // Efek ini memastikan jika data 'profile' dari server berubah/baru selesai dimuat, 
  // form akan otomatis terisi dengan data tersebut (berfungsi sebagai placeholder/value).
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setUsername(profile.username?.replace('@', '') || "");
      setAvatarUrl(profile.avatar_url || "");
    }
  }, [profile]);

  // Delete Account States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const REQUIRED_DELETE_TEXT = "HAPUS AKUN SAYA";

  // Loading States
  const [isUploading, setIsUploading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Avatar Image Upload Handler (Supabase Storage)
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      
      // 1. Bersihkan gambar lama di Root folder '/' (jika ada sisa dari bug lama)
      const { data: rootFiles } = await supabase.storage.from('images').list('', { search: user.id });
      if (rootFiles && rootFiles.length > 0) {
        const rootFilesToRemove = rootFiles
          .filter(f => f.name.includes(user.id))
          .map(f => f.name);
        if (rootFilesToRemove.length > 0) {
          await supabase.storage.from('images').remove(rootFilesToRemove);
        }
      }

      // 2. Bersihkan gambar lama di folder 'avatars/'
      const { data: avatarFiles } = await supabase.storage.from('images').list('avatars', { search: user.id });
      if (avatarFiles && avatarFiles.length > 0) {
        const avatarFilesToRemove = avatarFiles
          .filter(f => f.name.includes(user.id))
          .map(f => `avatars/${f.name}`);
        if (avatarFilesToRemove.length > 0) {
          await supabase.storage.from('images').remove(avatarFilesToRemove);
        }
      }

      // 3. Upload gambar yang baru
      const fileExt = file.name.split('.').pop();
      // Gunakan string acak agar browser tidak memunculkan gambar dari cache lama
      const fileName = `avatars/${user.id}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      // 4. Dapatkan Public URL & set state dengan timestamp
      const { data } = supabase.storage.from('images').getPublicUrl(fileName);
      setAvatarUrl(`${data.publicUrl}?t=${new Date().getTime()}`);
      
    } catch (error: any) {
      console.error("Error uploading:", error.message);
      alert("Gagal mengupload gambar. Pastikan bucket 'images' sudah dibuat dan di-set Public.");
    } finally {
      setIsUploading(false);
    }
  };

  // Save Profile Handler
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);

    try {
      let formattedUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (formattedUsername && !formattedUsername.startsWith('@')) {
        formattedUsername = '@' + formattedUsername;
      }

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: fullName,
        username: formattedUsername,
        avatar_url: avatarUrl, // URL gambar terbaru akan disimpan ke database di sini
      });

      if (error) throw error;
      
      setUsername(formattedUsername.replace('@', ''));
      alert("Profil berhasil disimpan!");
      router.refresh();
    } catch (error: any) {
      console.error(error);
      alert("Gagal menyimpan profil: " + error.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Save Password Handler
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) return alert("Kata sandi minimal 6 karakter");
    
    setIsSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      
      setNewPassword("");
      alert("Kata sandi berhasil diperbarui!");
    } catch (error: any) {
      console.error(error);
      alert("Gagal memperbarui kata sandi.");
    } finally {
      setIsSavingPassword(false);
    }
  };

  // Delete Account Handler
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== REQUIRED_DELETE_TEXT) return;
    
    setIsDeleting(true);
    try {
      const { error: rpcError } = await supabase.rpc('delete_user'); 
      if (rpcError) throw rpcError;
      
      await supabase.auth.signOut();
      router.push("/login");
    } catch (error: any) {
      console.error("Gagal menghapus akun:", error);
      alert("Terjadi kesalahan saat mencoba menghapus akun.");
      setIsDeleting(false);
    }
  };

  // Helper to change tabs and close mobile menu
  const navigateTab = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans selection:bg-zinc-200 dark:selection:bg-zinc-800">
      
      {/* Top Navigation */}
      <nav className="border-b border-zinc-200 dark:border-zinc-800 sticky top-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors">
            <ChevronLeft size={16} />
            Kembali ke Dashboard
          </Link>

          {/* Mobile Hamburger Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 -mr-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
            aria-label="Menu navigasi"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 shadow-xl py-4 px-4 flex flex-col gap-2 z-20 animate-in slide-in-from-top-2 duration-200">
            <button 
              onClick={() => navigateTab("profil")}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                activeTab === "profil" ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-white" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
              }`}
            >
              <User size={18} /> Profil Publik
            </button>
            <button 
              onClick={() => navigateTab("keamanan")}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                activeTab === "keamanan" ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-white" : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
              }`}
            >
              <Lock size={18} /> Keamanan Akun
            </button>
            <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1" />
            <button 
              onClick={() => navigateTab("hapus")}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-colors ${
                activeTab === "hapus" ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-500" : "text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
              }`}
            >
              <Trash2 size={18} /> Hapus Akun
            </button>
          </div>
        )}
      </nav>

      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 flex flex-col md:flex-row gap-8 md:gap-16">
        
        {/* Desktop Sidebar Navigation (Hidden on Mobile) */}
        <aside className="hidden md:block w-64 shrink-0">
          <div className="sticky top-28">
            <h2 className="text-2xl font-bold tracking-tight mb-6">Pengaturan</h2>
            <nav className="flex flex-col gap-2">
              <button 
                onClick={() => setActiveTab("profil")}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors text-left ${
                  activeTab === "profil" 
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-white" 
                  : "bg-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <User size={18} /> Profil Publik
              </button>
              <button 
                onClick={() => setActiveTab("keamanan")}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors text-left ${
                  activeTab === "keamanan" 
                  ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-900 dark:text-white" 
                  : "bg-transparent text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                <Lock size={18} /> Keamanan Akun
              </button>
              <button 
                onClick={() => setActiveTab("hapus")}
                className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors text-left ${
                  activeTab === "hapus" 
                  ? "bg-red-500 text-white dark:bg-red-600 dark:text-white" 
                  : "bg-transparent text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50"
                }`}
              >
                <Trash2 size={18} /> Hapus Akun
              </button>
            </nav>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 max-w-2xl pb-24">
          
          {/* TAB 1: Profil Publik */}
          {activeTab === "profil" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white mb-1">Profil Publik</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">Informasi ini akan ditampilkan secara publik di artikel Anda.</p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-8">
                {/* Avatar Upload Feature & Input */}
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden shrink-0 relative group">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={36} className="text-zinc-400" />
                    )}
                    
                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer flex items-center justify-center transition-opacity">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleAvatarUpload} 
                        disabled={isUploading} 
                      />
                      {isUploading ? <Loader2 size={24} className="text-white animate-spin" /> : <Camera size={24} className="text-white" />}
                    </label>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">URL Foto Profil</label>
                    <input 
                      type="url" 
                      value={avatarUrl}
                      onChange={(e) => setAvatarUrl(e.target.value)}
                      className="w-full px-4 py-2.5 bg-transparent border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 text-zinc-900 dark:text-white text-sm"
                      placeholder="https://example.com/foto.jpg"
                    />
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Klik gambar untuk mengunggah, atau tempel URL secara manual.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">Nama Lengkap <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full px-4 py-2.5 bg-transparent border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 text-zinc-900 dark:text-white text-sm"
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">Username <span className="text-red-500">*</span></label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-zinc-500 font-medium text-sm">@</span>
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                      className="w-full pl-9 pr-4 py-2.5 bg-transparent border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 text-zinc-900 dark:text-white text-sm"
                      placeholder="johndoe"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={isSavingProfile || isUploading}
                    className="px-6 py-2.5 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-full text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSavingProfile && <Loader2 size={16} className="animate-spin" />}
                    Simpan Profil
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: Keamanan Akun */}
          {activeTab === "keamanan" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
                <h3 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white mb-1">Keamanan Akun</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">Kelola kredensial login Anda.</p>
              </div>

              <form onSubmit={handleSavePassword} className="space-y-8">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">Email Terdaftar</label>
                  <input 
                    type="email" 
                    value={user.email || ""}
                    disabled
                    className="w-full px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-500 cursor-not-allowed outline-none text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-900 dark:text-zinc-100">Ubah Kata Sandi</label>
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={6}
                    required
                    className="w-full px-4 py-2.5 bg-transparent border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 text-zinc-900 dark:text-white text-sm"
                    placeholder="Masukkan kata sandi baru (min. 6 karakter)"
                  />
                </div>

                <div className="pt-2">
                  <button 
                    type="submit" 
                    disabled={isSavingPassword}
                    className="px-6 py-2.5 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 bg-transparent rounded-full text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isSavingPassword && <Loader2 size={16} className="animate-spin" />}
                    Perbarui Kata Sandi
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: Hapus Akun */}
          {activeTab === "hapus" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="border-b border-red-200 dark:border-red-900/30 pb-4">
                <h3 className="text-xl font-bold tracking-tight text-red-600 dark:text-red-500 mb-1">Zona Berbahaya</h3>
                <p className="text-zinc-500 dark:text-zinc-400 text-sm">Tindakan di bawah ini bersifat permanen dan tidak dapat dibatalkan.</p>
              </div>

              <div className="p-6 border border-red-200 dark:border-red-900/50 rounded-2xl bg-red-50 dark:bg-red-950/20">
                <h4 className="text-lg font-bold text-red-700 dark:text-red-400 mb-2">Hapus Akun Permanen</h4>
                <p className="text-sm text-red-600/80 dark:text-red-400/80 mb-6">
                  Setelah Anda menghapus akun, seluruh data profil, artikel, dan komentar Anda akan dihapus selamanya. Pastikan Anda sudah membackup data yang diperlukan.
                </p>
                <button 
                  onClick={() => setShowDeleteModal(true)}
                  className="px-6 py-2.5 bg-red-600 text-white rounded-full text-sm font-bold hover:bg-red-700 transition-colors shadow-sm"
                >
                  Hapus Akun Saya
                </button>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm transition-opacity">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-md rounded-2xl p-6 md:p-8 shadow-xl border border-red-200 dark:border-red-900/50 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-center mb-5 text-red-600 dark:text-red-500">
              <AlertTriangle size={48} strokeWidth={1.5} />
            </div>
            
            <h3 className="text-xl font-bold text-center text-zinc-900 dark:text-white mb-2 tracking-tight">
              Apakah Anda Yakin?
            </h3>
            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mb-6 leading-relaxed">
              Tindakan ini tidak dapat dibatalkan. Seluruh data Anda akan dihapus secara permanen.
            </p>

            <div className="mb-6 space-y-2">
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 text-center">
                Ketik <span className="font-mono font-bold text-red-600 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded">HAPUS AKUN SAYA</span> untuk melanjutkan.
              </label>
              <input 
                type="text" 
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="w-full text-center px-4 py-3 bg-transparent border border-zinc-300 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 focus:border-red-500 transition-colors font-mono font-bold text-zinc-900 dark:text-white"
                placeholder="HAPUS AKUN SAYA"
              />
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== REQUIRED_DELETE_TEXT || isDeleting}
                className="w-full py-3 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isDeleting && <Loader2 size={16} className="animate-spin" />}
                Hapus Permanen
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmText("");
                }}
                disabled={isDeleting}
                className="w-full py-3 bg-transparent border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}