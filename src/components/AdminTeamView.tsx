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
    const safeRole: UserRole = role === 'support' ? 'support' : 'moderator';
    setNewRole(safeRole);
    if (safeRole === 'support') {
      setPermOrders(true);
      setPermChat(true);
      setPermProducts(false);
      setPermKnowledge(false);
    } else {
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

    if (!newEmail.trim() || !newPassword.trim()) {
      setErrorMsg('Please enter both a Gmail/Email and a Password.');
      return;
    }

    if (newPassword.trim().length < 4) {
      setErrorMsg('Password must be at least 4 characters long.');
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
          password: newPassword.trim(),
          role: newRole === 'support' ? 'support' : 'moderator',
          permissions: {
            canManageOrders: permOrders,
            canChat: permChat,
            canManageProducts: newRole === 'moderator' ? permProducts : false,
            canManageKnowledge: newRole === 'moderator' ? permKnowledge : false,
            canManageSettings: false, // never allow staff
            canManageTeam: false,     // never allow staff
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccessMsg(`Team member ${data.member.name} (${data.member.email}) added successfully!`);
        showToast(`Team member added: ${data.member.email}`);
        setNewEmail('');
        setNewName('');
        setNewPassword('');
        setNewRole('moderator');
        handleRoleChange('moderator');
        onRefreshTeam();
      } else {
        setErrorMsg(data.error || 'Failed to add team member');
      }
    } catch (err) {
      setErrorMsg('Connection error while adding team member');
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
            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Member Full Name
              </label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Tanvir Ahmed (Support Agent)"
                className="w-full bg-gray-50 border border-[#ECECEC] rounded-xl px-3.5 py-2.5 text-[#262626] focus:outline-none focus:border-[#ECA548] focus:bg-white"
              />
            </div>

            <div>
              <label className="block font-semibold text-gray-700 mb-1">
                Gmail / Email Address <span className="text-rose-500">*</span>
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
                  placeholder="Set password (min 4 characters)"
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

            <div>
              <label className="block font-semibold text-gray-700 mb-1.5">
                Staff Role & Access Level
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleRoleChange('support')}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    newRole === 'support'
                      ? 'bg-[#FDF7EE] border-[#ECA548] text-[#ECA548] font-bold shadow-xs'
                      : 'border-[#ECECEC] text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-semibold text-xs">Customer Support</span>
                  <span className="text-[10px] text-gray-400 font-normal">Orders & Live Chat only</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleRoleChange('moderator')}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                    newRole === 'moderator'
                      ? 'bg-[#FDF7EE] border-[#ECA548] text-[#ECA548] font-bold shadow-xs'
                      : 'border-[#ECECEC] text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <span className="font-semibold text-xs">Moderator</span>
                  <span className="text-[10px] text-gray-400 font-normal">Chat, Orders, Products & AI</span>
                </button>
              </div>
            </div>

            {/* Granular Permission Checkboxes */}
            <div className="p-3.5 bg-gray-50 rounded-xl border border-[#ECECEC] space-y-2">
              <span className="text-[11px] font-bold text-gray-700 block">
                Allowed Permissions:
              </span>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permOrders}
                    onChange={(e) => setPermOrders(e.target.checked)}
                    className="rounded text-[#ECA548] focus:ring-[#ECA548]"
                  />
                  <span>Manage Orders</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permChat}
                    onChange={(e) => setPermChat(e.target.checked)}
                    className="rounded text-[#ECA548] focus:ring-[#ECA548]"
                  />
                  <span>Live Chat Reply</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permProducts}
                    onChange={(e) => setPermProducts(e.target.checked)}
                    disabled={newRole === 'support'}
                    className="rounded text-[#ECA548] focus:ring-[#ECA548] disabled:opacity-40"
                  />
                  <span className={newRole === 'support' ? 'text-gray-400' : ''}>Product Catalog</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={permKnowledge}
                    onChange={(e) => setPermKnowledge(e.target.checked)}
                    disabled={newRole === 'support'}
                    className="rounded text-[#ECA548] focus:ring-[#ECA548] disabled:opacity-40"
                  />
                  <span className={newRole === 'support' ? 'text-gray-400' : ''}>Knowledge / AI</span>
                </label>
              </div>
              <p className="text-[10px] text-gray-500 italic mt-1">
                🔒 Note: Staff accounts never have access to master settings, API integrations, or team user management.
              </p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-xl font-bold text-white shadow-sm flex items-center justify-center gap-1.5 transition-all hover:opacity-95 disabled:opacity-50"
              style={{ backgroundColor: '#ECA548' }}
            >
              <UserPlus className="w-4 h-4" />
              <span>{isSubmitting ? 'Creating User...' : 'Add Team Member'}</span>
            </button>
          </form>
        </div>

        {/* Right Column: Existing Team Members List */}
        <div className="lg:col-span-7 space-y-4">
          {/* Master Admin Card */}
          <div className="bg-white rounded-2xl border border-[#ECECEC] p-4 shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#ECA548] font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-xs text-[#262626]">Master Store Admin</h4>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
                    SUPERADMIN (OWNER)
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                  admin • Full System Control • Cloud Firestore Synced
                </p>
              </div>
            </div>

            <div className="text-right">
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Primary Master Key
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
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-[#262626]">{member.name}</span>
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

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 self-end sm:self-center">
                        {/* Toggle Status (Active / Suspended) */}
                        <button
                          onClick={() => handleToggleStatus(member)}
                          title={member.status === 'active' ? 'Suspend Access' : 'Activate Access'}
                          className={`p-1.5 rounded-lg text-xs font-semibold border transition-all ${
                            member.status === 'active'
                              ? 'bg-white border-[#ECECEC] text-gray-600 hover:text-amber-600 hover:bg-amber-50'
                              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          }`}
                        >
                          {member.status === 'active' ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                        </button>

                        {/* Edit Permissions / Password */}
                        <button
                          onClick={() => {
                            setEditingMember(member);
                            setEditPassword('');
                          }}
                          title="Edit Permissions & Password"
                          className="p-1.5 rounded-lg bg-white border border-[#ECECEC] text-gray-600 hover:text-[#ECA548] hover:bg-[#FDF7EE] transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete User */}
                        <button
                          onClick={() => handleDeleteMember(member.id, member.name)}
                          title="Permanently Delete Access"
                          className="p-1.5 rounded-lg bg-white border border-[#ECECEC] text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
