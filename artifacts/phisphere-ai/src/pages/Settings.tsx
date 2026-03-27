import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import {
  ArrowLeft, User, Lock, Shield, Palette, Check, AlertCircle, LogOut,
  ChevronRight, Camera, AtSign, CreditCard, Trash2, AlertTriangle,
} from "lucide-react";

import { useAuth, getStoredUser, getStoredToken } from "@/hooks/use-auth";

type SettingsTab = "profile" | "security" | "plan" | "danger";

const AVATAR_COLORS = [
  { id: "blue", from: "from-blue-600", to: "to-indigo-600" },
  { id: "violet", from: "from-violet-600", to: "to-purple-600" },
  { id: "emerald", from: "from-emerald-500", to: "to-teal-600" },
  { id: "rose", from: "from-rose-500", to: "to-pink-600" },
  { id: "amber", from: "from-amber-500", to: "to-orange-600" },
  { id: "cyan", from: "from-cyan-500", to: "to-blue-600" },
];

const AVATAR_COLOR_KEY = "phisphere_avatar_color";
const DISPLAY_NAME_KEY = "phisphere_display_name";
const AVATAR_IMAGE_KEY = "phisphere_avatar_image";

export default function Settings() {
  const [, navigate] = useLocation();
  const { logout } = useAuth();
  const [user, setUser] = useState(getStoredUser());
  const [activeTab, setActiveTab] = useState<SettingsTab>("profile");

  const [avatarColor, setAvatarColor] = useState(() => localStorage.getItem(AVATAR_COLOR_KEY) ?? "blue");
  const [avatarImage, setAvatarImage] = useState<string | null>(() => localStorage.getItem(AVATAR_IMAGE_KEY));
  const [displayName, setDisplayName] = useState(() => localStorage.getItem(DISPLAY_NAME_KEY) ?? "");
  const [displayNameSaved, setDisplayNameSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);

  const [newUsername, setNewUsername] = useState("");
  const [usernamePw, setUsernamePw] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState(false);
  const [usernameLoading, setUsernameLoading] = useState(false);

  const [deleteConfirmUsername, setDeleteConfirmUsername] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const selectedColor = AVATAR_COLORS.find((c) => c.id === avatarColor) ?? AVATAR_COLORS[0];
  const displayInitial = (displayName || user?.username || "?").charAt(0).toUpperCase();
  const effectiveName = displayName.trim() || user?.username || "Researcher";

  useEffect(() => {
    localStorage.setItem(AVATAR_COLOR_KEY, avatarColor);
  }, [avatarColor]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be under 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setAvatarImage(base64);
      localStorage.setItem(AVATAR_IMAGE_KEY, base64);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatarImage = () => {
    setAvatarImage(null);
    localStorage.removeItem(AVATAR_IMAGE_KEY);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveDisplayName = () => {
    localStorage.setItem(DISPLAY_NAME_KEY, displayName);
    setDisplayNameSaved(true);
    setTimeout(() => setDisplayNameSaved(false), 2500);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess(false);
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError("All password fields are required.");
      return;
    }
    if (newPassword.length < 6) {
      setPwError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match.");
      return;
    }
    setPwLoading(true);
    try {
      const token = localStorage.getItem("phisphere_auth_token");
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setPwError(data.error ?? "Password change failed.");
        return;
      }
      setPwSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => setPwSuccess(false), 3000);
    } catch {
      setPwError("Network error. Please try again.");
    } finally {
      setPwLoading(false);
    }
  };

  const handleChangeUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError("");
    setUsernameSuccess(false);
    if (!newUsername.trim()) {
      setUsernameError("New username is required.");
      return;
    }
    if (!usernamePw) {
      setUsernameError("Current password is required.");
      return;
    }
    setUsernameLoading(true);
    try {
      const token = localStorage.getItem("phisphere_auth_token");
      const res = await fetch("/api/auth/change-username", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ newUsername: newUsername.trim(), currentPassword: usernamePw }),
      });
      const data = await res.json() as { error?: string; username?: string };
      if (!res.ok) {
        setUsernameError(data.error ?? "Username change failed.");
        return;
      }
      const updated = { ...user!, username: data.username! };
      localStorage.setItem("phisphere_auth_user", JSON.stringify(updated));
      setUser(updated);
      setUsernameSuccess(true);
      setNewUsername("");
      setUsernamePw("");
      setTimeout(() => setUsernameSuccess(false), 3000);
    } catch {
      setUsernameError("Network error. Please try again.");
    } finally {
      setUsernameLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/landing");
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError("");
    if (deleteConfirmUsername !== user?.username) {
      setDeleteError("Username does not match. Please type your exact username to confirm.");
      return;
    }
    if (!deletePassword) {
      setDeleteError("Password is required to delete your account.");
      return;
    }
    setDeleteLoading(true);
    try {
      const token = getStoredToken();
      const res = await fetch("/api/auth/account", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: deletePassword }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) {
        setDeleteError(data.error ?? "Account deletion failed.");
        return;
      }
      localStorage.clear();
      navigate("/landing");
    } catch {
      setDeleteError("Network error. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const planLabels: Record<string, { label: string; color: string }> = {
    monthly: { label: "Monthly Plan · $29/mo", color: "text-blue-400" },
    annual: { label: "Annual Plan · $199/yr", color: "text-indigo-400" },
    free: { label: "Free Plan", color: "text-slate-400" },
  };
  const planInfo = planLabels[user?.plan ?? "free"] ?? planLabels.free;

  const fadeUp = {
    hidden: { opacity: 0, y: 16 },
    show: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.06 } }),
  };

  return (
    <div className="min-h-screen bg-[#040B16] text-foreground overflow-y-auto">
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-blue-600/4 rounded-full blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-2xl px-6 py-10">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-10">
          <button onClick={() => navigate("/")} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Control Panel
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <h1 className="text-2xl font-display font-bold text-white mb-1">Account Settings</h1>
          <p className="text-slate-500 text-sm">Manage your profile, appearance, and security</p>
        </motion.div>

        {/* Tab navigation */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex gap-1 rounded-2xl border border-white/6 bg-white/[0.02] p-1 mb-6">
          {([
            { id: "profile", label: "Profile", icon: User },
            { id: "security", label: "Security", icon: Lock },
            { id: "plan", label: "Subscription", icon: Shield },
            { id: "danger", label: "Danger Zone", icon: AlertTriangle },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold transition-all ${
                activeTab === id
                  ? id === "danger"
                    ? "bg-red-500/15 text-red-400 border border-red-500/25"
                    : "bg-primary/15 text-primary border border-primary/25"
                  : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.04]"
              }`}
            >
              <Icon className="h-3 w-3" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </motion.div>

        {/* Profile Card */}
        {activeTab === "profile" && <motion.div custom={0} variants={fadeUp} initial="hidden" animate="show" className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 mb-4">
          <div className="flex items-center gap-3 mb-5">
            <User className="h-4 w-4 text-blue-400" />
            <h2 className="text-sm font-bold text-white">Profile</h2>
          </div>

          {/* Avatar with upload */}
          <div className="flex items-center gap-5 mb-6">
            <div className="relative group">
              <button
                onClick={handleAvatarClick}
                className="relative h-20 w-20 shrink-0 rounded-2xl overflow-hidden cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                title="Change profile photo"
              >
                {avatarImage ? (
                  <img src={avatarImage} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${selectedColor.from} ${selectedColor.to} text-2xl font-bold text-white`}>
                    {displayInitial}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="h-5 w-5 text-white" />
                  <span className="text-[10px] font-bold text-white mt-1">Change</span>
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarFileChange}
                className="hidden"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-semibold text-white truncate">{effectiveName}</p>
              <p className="text-sm text-slate-500">@{user?.username}</p>
              <span className={`text-xs font-bold ${planInfo.color}`}>{planInfo.label}</span>
              {avatarImage && (
                <button
                  onClick={handleRemoveAvatarImage}
                  className="block text-xs text-slate-600 hover:text-red-400 transition-colors mt-1"
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>

          {/* Display Name */}
          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-400 mb-2 uppercase tracking-wider">Display Name</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={displayName}
                onChange={(e) => { setDisplayName(e.target.value); setDisplayNameSaved(false); }}
                placeholder={user?.username ?? "Enter display name"}
                maxLength={40}
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
              />
              <button
                onClick={handleSaveDisplayName}
                className="flex items-center gap-1.5 rounded-xl border border-blue-500/30 bg-blue-600/20 px-4 py-2.5 text-sm font-semibold text-blue-400 hover:bg-blue-600/30 transition-colors"
              >
                {displayNameSaved ? <><Check className="h-4 w-4" /> Saved</> : "Save"}
              </button>
            </div>
            <p className="text-xs text-slate-600 mt-1.5">Shown in the app instead of your username</p>
          </div>

          {/* Avatar Color (only when no image) */}
          {!avatarImage && (
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5" /> Avatar Color
              </label>
              <div className="flex gap-2 flex-wrap">
                {AVATAR_COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setAvatarColor(c.id)}
                    className={`relative h-9 w-9 rounded-xl bg-gradient-to-br ${c.from} ${c.to} transition-all hover:scale-110 ${avatarColor === c.id ? "ring-2 ring-white ring-offset-2 ring-offset-[#040B16] scale-110" : "opacity-70 hover:opacity-100"}`}
                  >
                    {avatarColor === c.id && <Check className="absolute inset-0 m-auto h-4 w-4 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>}

        {/* Security Card */}
        {activeTab === "security" && <motion.div custom={1} variants={fadeUp} initial="hidden" animate="show" className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 mb-4">
          <div className="flex items-center gap-3 mb-5">
            <Lock className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">Security</h2>
          </div>

          {/* Username info */}
          <div className="mb-5 rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-300">Current Username</p>
              <p className="text-xs text-slate-500">@{user?.username} · used for login</p>
            </div>
            <Shield className="h-4 w-4 text-slate-600" />
          </div>

          {/* Change Username */}
          <form onSubmit={handleChangeUsername} className="space-y-3 pb-5 mb-5 border-b border-white/5">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <AtSign className="h-3.5 w-3.5" /> Change Username
            </p>
            <input
              type="text"
              value={newUsername}
              onChange={(e) => { setNewUsername(e.target.value); setUsernameError(""); }}
              placeholder="New username (letters, numbers, _ -)"
              maxLength={30}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
            <input
              type="password"
              value={usernamePw}
              onChange={(e) => { setUsernamePw(e.target.value); setUsernameError(""); }}
              placeholder="Confirm with current password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
            {usernameError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {usernameError}
              </div>
            )}
            {usernameSuccess && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-400">
                <Check className="h-4 w-4 shrink-0" />
                Username updated successfully. Please log in again if you sign out.
              </div>
            )}
            <button
              type="submit"
              disabled={usernameLoading}
              className="w-full rounded-xl border border-emerald-500/30 bg-emerald-600/15 py-2.5 text-sm font-bold text-emerald-400 hover:bg-emerald-600/25 transition-colors disabled:opacity-50"
            >
              {usernameLoading ? "Saving..." : "Update Username"}
            </button>
          </form>

          {/* Change Password */}
          <form onSubmit={handleChangePassword} className="space-y-3">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Change Password</p>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password (min 6 characters)"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm new password"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-all"
            />
            {pwError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2.5 text-xs text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {pwError}
              </div>
            )}
            {pwSuccess && (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-xs text-emerald-400">
                <Check className="h-4 w-4 shrink-0" />
                Password changed successfully.
              </div>
            )}
            <button
              type="submit"
              disabled={pwLoading}
              className="w-full rounded-xl border border-blue-500/30 bg-blue-600/20 py-2.5 text-sm font-bold text-blue-400 hover:bg-blue-600/30 transition-colors disabled:opacity-50"
            >
              {pwLoading ? "Changing..." : "Change Password"}
            </button>
          </form>
        </motion.div>}

        {/* Plan Card */}
        {activeTab === "plan" && <motion.div custom={2} variants={fadeUp} initial="hidden" animate="show" className="rounded-2xl border border-white/8 bg-white/[0.03] p-6 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-4 w-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">Subscription</h2>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <p className={`text-base font-bold ${planInfo.color}`}>{planInfo.label}</p>
              <p className="text-xs text-slate-500 mt-0.5">Unlimited sessions · All AI features · Priority support</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/billing")}
            className="mt-4 w-full flex items-center justify-between rounded-xl border border-white/8 bg-white/[0.02] px-4 py-3 text-sm text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-indigo-400" />
              <span>Billing, promo codes &amp; invoices</span>
            </div>
            <ChevronRight className="h-4 w-4" />
          </button>
        </motion.div>}

        {/* Danger Zone + Sign Out */}
        {activeTab === "danger" && <motion.div custom={3} variants={fadeUp} initial="hidden" animate="show">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/[0.03] py-3.5 text-sm font-bold text-slate-300 hover:text-white hover:bg-white/[0.06] hover:border-white/12 transition-all mb-4"
          >
            <LogOut className="h-4 w-4 text-slate-400" />
            Sign Out
          </button>
        </motion.div>}

        {activeTab === "danger" && <motion.div custom={4} variants={fadeUp} initial="hidden" animate="show" className="mt-0">
          <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.03] p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <h2 className="text-sm font-bold text-red-400">Danger Zone</h2>
            </div>

            {!showDeleteConfirm ? (
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-slate-300">Delete Account</p>
                  <p className="text-xs text-slate-500 mt-0.5">Permanently delete your account and all your data. This action cannot be undone.</p>
                </div>
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="shrink-0 flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/20 hover:border-red-500/40 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete Account
                </button>
              </div>
            ) : (
              <form onSubmit={handleDeleteAccount} className="space-y-3">
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5">
                  <p className="text-xs text-red-400 font-semibold">This will permanently delete your account, all lab sessions, and all data.</p>
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1.5 block">
                    Type your username <span className="text-red-400 font-bold">"{user?.username}"</span> to confirm
                  </label>
                  <input
                    value={deleteConfirmUsername}
                    onChange={(e) => setDeleteConfirmUsername(e.target.value)}
                    placeholder={user?.username ?? "username"}
                    className="w-full rounded-xl border border-red-500/20 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-red-500/40"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-semibold mb-1.5 block">Current password</label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-red-500/20 bg-white/[0.03] px-3 py-2 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-red-500/40"
                  />
                </div>
                {deleteError && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />{deleteError}
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setShowDeleteConfirm(false); setDeleteConfirmUsername(""); setDeletePassword(""); setDeleteError(""); }}
                    className="flex-1 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={deleteLoading || deleteConfirmUsername !== user?.username}
                    className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-red-500/30 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed py-2.5 text-xs font-bold text-white transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deleteLoading ? "Deleting..." : "Delete Forever"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>}
      </div>
    </div>
  );
}
