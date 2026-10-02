import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Key,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck,
  Mail,
  UserX,
  Lock,
  Edit2,
  Clock,
} from 'lucide-react';
import { TeamMember, UserRole } from '../types';

interface AdminTeamViewProps {
  authToken: string;
  teamMembers: TeamMember[];
  onRefreshTeam: () => void;
  showToast: (msg: string) => void;
  currentUser?: {
    id: string;
    name: string;
    email: string;
    role: string;
    permissions?: any;
  } | null;
}

export const AdminTeamView: React.FC<AdminTeamViewProps> = ({
  authToken,
  teamMembers,
  onRefreshTeam,
  showToast,
  currentUser,
}) => {
  // Access Guard: If not superadmin, show restricted access banner
  if (currentUser && currentUser.role !== 'superadmin') {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center space-y-4 max-w-xl mx-auto my-12 shadow-xs">
        <div className="w-14 h-14 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h3 className="font-bold text-lg text-gray-900">টিম ম্যানেজমেন্ট শুধুমাত্র সুপার অ্যাডমিনের জন্য সংরক্ষিত</h3>
        <p className="text-xs text-gray-600 leading-relaxed">
          আপনার অ্যাকাউন্টটি <strong>{currentUser.role === 'moderator' ? 'মডারেটর (Moderator)' : 'কাস্টমার সাপোর্ট (Support)'}</strong> হিসেবে অ্যাক্সেসপ্রাপ্ত। নতুন টিম মেম্বার যুক্ত করা, মেম্বার ডিলিট করা বা একাউন্ট অ্যাক্সেস কন্ট্রোল শুধুমাত্র মূল <strong>সুপার অ্যাডমিন (Super Admin)</strong>-এর রয়েছে।
        </p>
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-800 text-left">
          💡 আপনার নির্দিষ্ট কাজের জন্য নির্ধারিত অপশনসমূহ (যেমন: Orders & Leads অথবা Live Chat Inbox) ব্যবহার করুন।
        </div>
      </div>
    );
  }

  // New User Form State
  const [authMethod, setAuthMethod] = useState<'google' | 'password'>('google');
  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('moderator');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editing state
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editPassword, setEditPassword] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Custom permissions for new user
  const [permOrders, setPermOrders] = useState(true);
  const [permChat, setPermChat] = useState(true);
  const [permProducts, setPermProducts] = useState(true);
  const [permKnowledge, setPermKnowledge] = useState(false);

  const handleRoleChange = (role: UserRole) => {
    setNewRole(role);
    if (role === 'support') {
      setPermOrders(true);
      setPermChat(true);
      setPermProducts(false);
      setPermKnowledge(false);
    } else if (role === 'moderator') {
      setPermOrders(true);
      setPermChat(true);
      setPermProducts(true);
      setPermKnowledge(true);
    } else {
      // superadmin
      setPermOrders(true);
      setPermChat(true);
      setPermProducts(true);
      setPermKnowledge(true);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!newEmail.trim()) {
      setErrorMsg('অনুগ্রহ করে অনুমোদিত Gmail / Email দিন।');
      return;
    }

    if (authMethod === 'password' && newPassword.trim().length < 4) {
      setErrorMsg('পাসওয়ার্ড ন্যূনতম ৪ অক্ষরের হতে হবে।');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: newName.trim() || newEmail.split('@')[0],
          email: newEmail.trim().toLowerCase(),
          password: authMethod === 'password' ? newPassword.trim() : undefined,
          authProvider: authMethod,
          role: newRole,
          permissions: {
            canManageOrders: permOrders,
            canChat: permChat,
            canManageProducts: newRole === 'support' ? false : permProducts,
            canManageKnowledge: newRole === 'support' ? false : permKnowledge,
            canManageSettings: newRole === 'superadmin',
            canManageTeam: newRole === 'superadmin',
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`টিম মেম্বার ${data.member.name} (${data.member.email}) সফলভাবে অনুমোদিত হয়েছে!`);
        showToast(`অ্যাক্সেস প্রদান করা হয়েছে: ${data.member.email}`);
        setNewEmail('');
        setNewName('');
        setNewPassword('');
        setNewRole('moderator');
        handleRoleChange('moderator');
        onRefreshTeam();
      } else {
        setErrorMsg(data.error || 'টিম মেম্বার যুক্ত করতে ব্যর্থ হয়েছে');
      }
    } catch (err) {
      setErrorMsg('সার্ভারে যোগাযোগ করতে সমস্যা হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete access for ${name}? They will no longer be able to log in.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/team/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Access removed for ${name}`);
        onRefreshTeam();
      } else {
        showToast(data.error || 'Failed to delete member');
      }
    } catch (e) {
      showToast('Error deleting team member');
    }
  };

  const handleToggleStatus = async (member: TeamMember) => {
    const nextStatus = member.status === 'active' ? 'suspended' : 'active';
    try {
      const res = await fetch(`/api/admin/team/${member.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`${member.name} is now ${nextStatus}`);
        onRefreshTeam();
      } else {
        showToast(data.error || 'Failed to update member status');
      }
    } catch (e) {
      showToast('Error updating status');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    setIsUpdating(true);

    try {
      const payload: any = {
        name: editingMember.name,
        role: editingMember.role,
        permissions: editingMember.permissions,
        status: editingMember.status,
      };
      if (editPassword.trim().length >= 4) {
        payload.password = editPassword.trim();
      }

      const res = await fetch(`/api/admin/team/${editingMember.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`Updated ${editingMember.name}'s permissions!`);
        setEditingMember(null);
        setEditPassword('');
        onRefreshTeam();
      } else {
        showToast(data.error || 'Failed to update member');
      }
    } catch (e) {
      showToast('Error updating team member');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-[#ECECEC] p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-lg text-[#262626] flex items-center gap-2">
              <Users className="w-5 h-5 text-[#ECA548]" />
              Team Access & User Management
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FDF7EE] text-[#ECA548] border border-[#ECA548]/30">
              Role-Based Control
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Add your team members using their Gmail address and a dedicated password. Grant limited access so they can only manage orders, live chat, or products without accessing master passwords.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <div className="text-xs font-bold text-[#262626]">{teamMembers.length + 1} Total Accounts</div>
            <div className="text-[11px] text-gray-400">1 Master Admin • {teamMembers.length} Staff</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Add New User Form + Active Users List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Add Team Member Form */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#ECECEC] p-5 shadow-xs h-fit space-y-4">
          <div className="border-b border-[#ECECEC] pb-3">
            <h3 className="font-bold text-sm text-[#262626] flex items-center gap-2">
              <UserPlus className="w-4 h-4 text-[#ECA548]" />
              Add New Team Member
            </h3>
            <p className="text-[11px] text-gray-500 mt-0.5">
              Enter their Gmail and assign a login password with specific permissions.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleAddMember} className="space-y-4 text-xs">
            {/* Auth Method Selector */}
            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">
                লগইন অথেন্টিকেশন মাধ্যম
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAuthMethod('google')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    authMethod === 'google'
                      ? 'bg-blue-50/80 border-blue-400 text-blue-800 font-bold shadow-xs'
                      : 'border-[#ECECEC] text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Google Auth (1-Click)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setAuthMethod('password')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    authMethod === 'password'
                      ? 'bg-amber-50/80 border-[#ECA548] text-amber-800 font-bold shadow-xs'
                      : 'border-[#ECECEC] text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Password Login</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                সদস্যের পুরো নাম
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="যেমন: তানভীর আহমেদ (অ্যাসিস্ট্যান্ট)"
                className="w-full bg-gray-50 border border-[#ECECEC] rounded-xl px-3.5 py-2.5 text-[#262626] focus:outline-none focus:border-[#ECA548] focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                অনুমোদিত Gmail / Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                  placeholder="member@gmail.com"
                  className="w-full bg-gray-50 border border-[#ECECEC] rounded-xl pl-10 pr-3.5 py-2.5 text-[#262626] focus:outline-none focus:border-[#ECA548] focus:bg-white"
                />
              </div>
            </div>

            {authMethod === 'google' ? (
              <div className="p-3 bg-blue-50/60 border border-blue-200/80 rounded-xl text-[11px] text-blue-900 leading-relaxed">
                💡 <strong>পাসওয়ার্ড প্রয়োজন নেই:</strong> অনুমোদিত এই জিমেইল দিয়ে তিনি সরাসরি <em>'Sign in with Google'</em> বাটনে চাপ দিয়ে ১-ক্লিকে অ্যাডমিনে ঢুকতে পারবেন।
              </div>
            ) : (
              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Login Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="পাসওয়ার্ড নির্ধারণ করুন (কমপক্ষে ৪ অক্ষর)"
                    className="w-full bg-gray-50 border border-[#ECECEC] rounded-xl pl-10 pr-10 py-2.5 text-[#262626] focus:outline-none focus:border-[#ECA548] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            )}

            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">
                অ্যাকাউন্টের ভূমিকা (Role & Access Level)
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleRoleChange('support')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    newRole === 'support'
                      ? 'bg-[#FDF7EE] border-[#ECA548] text-[#ECA548] font-bold shadow-xs'
                      : 'border-[#ECECEC] text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-semibold text-[11px]">Support Staff</span>
                  <span className="text-[9px] text-gray-400 font-normal">অর্ডার ও চ্যাট</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange('moderator')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    newRole === 'moderator'
                      ? 'bg-[#FDF7EE] border-[#ECA548] text-[#ECA548] font-bold shadow-xs'
                      : 'border-[#ECECEC] text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-semibold text-[11px]">Moderator</span>
                  <span className="text-[9px] text-gray-400 font-normal">প্রোডাক্ট ও চ্যাট</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange('superadmin')}
                  className={`p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    newRole === 'superadmin'
                      ? 'bg-amber-100/80 border-amber-500 text-amber-900 font-bold shadow-xs'
                      : 'border-[#ECECEC] text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-semibold text-[11px]">Co-Superadmin</span>
                  <span className="text-[9px] text-gray-400 font-normal">সম্পূর্ণ এক্সেস</span>
                </button>
              </div>
            </div>

            {/* Granular Permission Checkboxes */}
            <div className="p-3.5 bg-gray-50 rounded-xl border border-[#ECECEC] space-y-2">
              <span className="text-[11px] font-bold text-gray-700 block">
                অনুমোদিত পারমিশনসমূহ:
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permOrders}
                    onChange={(e) => setPermOrders(e.target.checked)}
                    className="rounded text-[#ECA548] focus:ring-[#ECA548]"
                  />
                  <span>অর্ডার ও কুরিয়ার</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permChat}
                    onChange={(e) => setPermChat(e.target.checked)}
                    className="rounded text-[#ECA548] focus:ring-[#ECA548]"
                  />
                  <span>লাইভ চ্যাট ইনবক্স</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permProducts}
                    onChange={(e) => setPermProducts(e.target.checked)}
                    disabled={newRole === 'support'}
                    className="rounded text-[#ECA548] focus:ring-[#ECA548] disabled:opacity-40"
                  />
                  <span className={newRole === 'support' ? 'text-gray-400' : ''}>প্রোডাক্ট ক্যাটালগ</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permKnowledge}
                    onChange={(e) => setPermKnowledge(e.target.checked)}
                    disabled={newRole === 'support'}
                    className="rounded text-[#ECA548] focus:ring-[#ECA548] disabled:opacity-40"
                  />
                  <span className={newRole === 'support' ? 'text-gray-400' : ''}>এআই নলেজ বেস</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl font-bold text-white shadow-sm flex items-center justify-center gap-2 transition-all hover:opacity-95 disabled:opacity-50 cursor-pointer"
              style={{ backgroundColor: '#ECA548' }}
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'প্রসেসিং হচ্ছে...' : 'অ্যাকাউন্টে এক্সেস প্রদান করুন'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Existing Team Members List */}
        <div className="lg:col-span-7 space-y-4">
          {/* Master Admin Card */}
          <div className="bg-white rounded-2xl border border-amber-300/80 p-4.5 shadow-xs flex items-center justify-between bg-gradient-to-r from-amber-50/50 to-white">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/15 border border-amber-500/40 flex items-center justify-center text-[#ECA548] font-bold shadow-xs">
                <ShieldCheck className="w-6 h-6 text-amber-700" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-sm text-[#262626]">Jahidul Islam (Master Owner)</h4>
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500 text-white shadow-xs">
                    👑 প্রধান অ্যাডমিন
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 font-mono mt-0.5 flex items-center gap-1.5">
                  <span className="text-amber-800 font-semibold">jahidulislamyahoo01@gmail.com</span>
                  <span>•</span>
                  <span>Google OAuth লকড</span>
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="px-3 py-1 rounded-xl text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                স্থায়ী সুপার অ্যাডমিন
              </span>
            </div>
          </div>

          {/* Staff Members List */}
          <div className="bg-white rounded-2xl border border-[#ECECEC] p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#ECECEC] pb-3">
              <h3 className="font-bold text-sm text-[#262626] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#ECA548]" />
                Registered Team Members ({teamMembers.length})
              </h3>
              <span className="text-[11px] text-gray-400">
                Can log in directly from Admin Login
              </span>
            </div>

            {teamMembers.length === 0 ? (
              <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-[#ECECEC] space-y-2">
                <UserCheck className="w-8 h-8 text-gray-300 mx-auto" />
                <h5 className="font-semibold text-xs text-gray-700">No staff members added yet</h5>
                <p className="text-[11px] text-gray-400 max-w-sm mx-auto">
                  Add your employees or moderators using the form on the left. You can give them limited permissions to handle customer inquiries and courier shipments.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      member.status === 'suspended'
                        ? 'bg-rose-50/40 border-rose-200 opacity-75'
                        : 'bg-gray-50/50 border-[#ECECEC] hover:border-gray-300'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            member.role === 'superadmin'
                              ? 'bg-amber-100 text-amber-800'
                              : member.role === 'moderator'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-[#262626]">{member.name}</span>
                            {member.isOwner || member.email.toLowerCase() === 'jahidulislamyahoo01@gmail.com' ? (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500 text-white shadow-xs">
                                👑 OWNER
                              </span>
                            ) : (
                              <span
                                className={`text-[9px] font-bold px-2 py-0.2 rounded-full uppercase ${
                                  member.role === 'superadmin'
                                    ? 'bg-amber-100 text-amber-800'
                                    : member.role === 'moderator'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-emerald-100 text-emerald-800'
                                }`}
                              >
                                {member.role}
                              </span>
                            )}

                            {member.authProvider === 'google' || !member.authProvider ? (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24">
                                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                                </svg>
                                Google Auth
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" /> Password
                              </span>
                            )}

                            {member.status === 'suspended' && (
                              <span className="text-[9px] font-bold px-2 py-0.2 rounded-full bg-rose-100 text-rose-700">
                                SUSPENDED
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-500 font-mono flex items-center gap-2 mt-0.5">
                            <span>{member.email}</span>
                            <span>•</span>
                            <span className="text-gray-400">Added {new Date(member.createdAt).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons (Protected for Primary Owner) */}
                      {!(member.isOwner || member.email.toLowerCase() === 'jahidulislamyahoo01@gmail.com') ? (
                        <div className="flex items-center gap-1.5 self-end sm:self-center">
                          {/* Toggle Status (Active / Suspended) */}
                          <button
                            onClick={() => handleToggleStatus(member)}
                            title={member.status === 'active' ? 'অ্যাকাউন্ট স্থগিত করুন' : 'অ্যাকাউন্ট সক্রিয় করুন'}
                            className={`p-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              member.status === 'active'
                                ? 'bg-white border-[#ECECEC] text-gray-600 hover:text-amber-600 hover:bg-amber-50'
                                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            }`}
                          >
                            {member.status === 'active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                          </button>

                          {/* Edit Permissions */}
                          <button
                            onClick={() => {
                              setEditingMember(member);
                              setEditPassword('');
                            }}
                            title="পারমিশন এডিট করুন"
                            className="p-1.5 rounded-lg bg-white border border-[#ECECEC] text-gray-600 hover:text-[#ECA548] hover:bg-[#FDF7EE] transition-all cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete User */}
                          <button
                            onClick={() => handleDeleteMember(member.id, member.name)}
                            title="এক্সেস চিরতরে বাতিল করুন"
                            className="p-1.5 rounded-lg bg-white border border-[#ECECEC] text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                          👑 মূল মালিক (Protected)
                        </span>
                      )}
                    </div>

                    {/* Permissions Badges */}
                    <div className="mt-2.5 pt-2 border-t border-gray-200/60 flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="text-gray-400 mr-1">Access:</span>
                      {member.permissions?.canManageOrders && (
                        <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                          Orders
                        </span>
                      )}
                      {member.permissions?.canChat && (
                        <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                          Live Chat
                        </span>
                      )}
                      {member.permissions?.canManageProducts && (
                        <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded border border-purple-200">
                          Products
                        </span>
                      )}
                      {member.permissions?.canManageKnowledge && (
                        <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                          Knowledge AI
                        </span>
                      )}
                      {member.permissions?.canManageSettings && (
                        <span className="bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200">
                          Settings/API
                        </span>
                      )}
                      {member.permissions?.canManageTeam && (
                        <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded border border-gray-300">
                          Team Mgmt
                        </span>
                      )}
                      {member.lastLoginAt && (
                        <span className="ml-auto text-gray-400 font-mono flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" /> Last: {new Date(member.lastLoginAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Member Modal */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-[#ECECEC] p-5 shadow-2xl max-w-md w-full space-y-4">
            <div className="flex items-center justify-between border-b border-[#ECECEC] pb-3">
              <div>
                <h3 className="font-bold text-sm text-[#262626]">Edit Team Member</h3>
                <p className="text-xs text-gray-500 font-mono">{editingMember.email}</p>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="text-gray-400 hover:text-gray-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editingMember.name}
                  onChange={(e) =>
                    setEditingMember({ ...editingMember, name: e.target.value })
                  }
                  className="w-full bg-gray-50 border border-[#ECECEC] rounded-xl px-3.5 py-2 text-[#262626]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">
                  Change Password (Leave blank to keep current)
                </label>
                <input
                  type="password"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full bg-gray-50 border border-[#ECECEC] rounded-xl px-3.5 py-2 text-[#262626]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 mb-1">Role</label>
                <select
                  value={editingMember.role}
                  onChange={(e) => {
                    const r = e.target.value as UserRole;
                    setEditingMember({ ...editingMember, role: r });
                  }}
                  className="w-full bg-gray-50 border border-[#ECECEC] rounded-xl px-3.5 py-2 text-[#262626]"
                >
                  <option value="support">Support Agent (Orders & Live Chat only)</option>
                  <option value="moderator">Moderator (Orders, Live Chat & Products)</option>
                </select>
              </div>

              {/* Granular permissions */}
              <div className="p-3 bg-gray-50 rounded-xl border border-[#ECECEC] space-y-2">
                <span className="font-semibold text-gray-700 block text-[11px]">
                  Custom Permissions:
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={editingMember.permissions?.canManageOrders}
                      onChange={(e) =>
                        setEditingMember({
                          ...editingMember,
                          permissions: {
                            ...editingMember.permissions,
                            canManageOrders: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>Orders & Leads</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={editingMember.permissions?.canChat}
                      onChange={(e) =>
                        setEditingMember({
                          ...editingMember,
                          permissions: {
                            ...editingMember.permissions,
                            canChat: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>Live Chat Inbox</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={editingMember.permissions?.canManageProducts}
                      onChange={(e) =>
                        setEditingMember({
                          ...editingMember,
                          permissions: {
                            ...editingMember.permissions,
                            canManageProducts: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>Products</span>
                  </label>
                  <label className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={editingMember.permissions?.canManageKnowledge}
                      onChange={(e) =>
                        setEditingMember({
                          ...editingMember,
                          permissions: {
                            ...editingMember.permissions,
                            canManageKnowledge: e.target.checked,
                          },
                        })
                      }
                    />
                    <span>Knowledge Base</span>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="flex-1 py-2 rounded-xl border border-[#ECECEC] text-gray-600 font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2 rounded-xl text-white font-bold transition-all hover:opacity-95"
                  style={{ backgroundColor: '#ECA548' }}
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
