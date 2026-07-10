import React, { useState, useEffect } from 'react';
import { ApiClient } from '../../api/client';
import { useAuthStore } from '../../store/useAuthStore';
import { Modal } from '../ui/Modal';
import { 
  ShieldCheck, 
  UserPlus, 
  Search, 
  Trash2, 
  Edit3, 
  Mail, 
  Building2, 
  Loader2, 
  X, 
  CheckCircle2, 
  Fingerprint,
  Users,
  Lock,
  Smartphone
} from 'lucide-react';
import toast from 'react-hot-toast';
import { haptics } from '../../utils/haptics';
import { cn } from '@/lib/utils';

interface UserAccount {
  Email: string;
  FullName: string;
  Role: string;
  Department: string;
}

export const UserManagementPage = () => {
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'CREATE' | 'EDIT'>('CREATE');
  const [processing, setProcessing] = useState(false);

  // Form State
  const [formEmail, setFormEmail] = useState('');
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('User');
  const [formDept, setFormDept] = useState('');
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);

  const fetchUsers = async () => {
    try {
      const res = await ApiClient.admin.getUsers();
      setUsers(Array.isArray(res) ? res : (res.data || []));
    } catch (_e) {
      toast.error('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
    }
  };

  const fetchDepts = async () => {
    try {
      const res = await ApiClient.admin.getDepartments();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setDepartments(list.map((d: any) => ({
        id: d.DeptID || d.id || '',
        name: d.DeptName || d.name || d.DeptID || d.id || ''
      })));
    } catch (_e) { /* departments loaded on demand */ }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    Promise.all([fetchUsers(), fetchDepts()]).finally(() => setLoading(false));
  }, []);

  const openCreateModal = () => {
    setModalMode('CREATE');
    setFormEmail('');
    setFormName('');
    setFormRole('User');
    setFormDept('');
    setIsModalOpen(true);
    haptics.light();
  };

  const openEditModal = (u: UserAccount) => {
    setModalMode('EDIT');
    setFormEmail(u.Email);
    setFormName(u.FullName);
    setFormRole(u.Role || 'User');
    setFormDept(u.Department || '');
    setIsModalOpen(true);
    haptics.light();
  };

  const handleDelete = async (email: string) => {
    // [Security] Client-side self-delete guard (backend enforces too)
    const currentUser = useAuthStore.getState().user;
    if (currentUser && String(currentUser.email).toLowerCase() === String(email).toLowerCase()) {
      toast.error('ไม่สามารถลบบัญชีตัวเองได้');
      haptics.error();
      return;
    }
    if (!window.confirm(`ยืนยันการระงับสิทธิ์เข้าใช้งานของ ${email}?`)) return;
    haptics.medium();
    const t = toast.loading('กำลังประมวลผล...');
    try {
      const res = await ApiClient.admin.deleteUser(email);
      if (res.success) {
        toast.success('ระงับสิทธิ์สำเร็จ', { id: t });
        haptics.success();
        fetchUsers();
      } else { throw new Error(res.error); }
    } catch (_e) {
      toast.error('ไม่สามารถดำเนินการได้', { id: t });
      haptics.error();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // [Security] Client-side self-demotion guard (backend enforces too)
    const currentUser = useAuthStore.getState().user;
    if (
      modalMode === 'EDIT' &&
      currentUser &&
      String(currentUser.email).toLowerCase() === String(formEmail).toLowerCase() &&
      formRole !== 'Admin'
    ) {
      toast.error('ไม่สามารถลดสิทธิ์ตัวเองได้ กรุณาให้ผู้ดูแลคนอื่นดำเนินการ');
      haptics.error();
      return;
    }
    setProcessing(true);
    const t = toast.loading('กำลังบันทึกข้อมูล...');
    try {
      const res = modalMode === 'CREATE'
        ? await ApiClient.admin.addUser({ email: formEmail, fullName: formName, role: formRole, department: formDept })
        : await ApiClient.admin.updateUser({ email: formEmail, newRole: formRole, newDepartment: formDept });

      if (res.success) {
        toast.success('สำเร็จ!', { id: t });
        haptics.success();
        setIsModalOpen(false);
        fetchUsers();
      } else { throw new Error(res.error); }
    } catch (e: any) {
      toast.error(e.message || 'บันทึกไม่สำเร็จ', { id: t });
      haptics.error();
    } finally { setProcessing(false); }
  };

  const filteredUsers = users.filter(u => 
    String(u.Email).toLowerCase().includes(searchQuery.toLowerCase()) || 
    String(u.FullName).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in pb-24">
      {/* ─── Hero Header ─── */}
      <section className="clay-card-deep !bg-zinc-950 p-8 lg:p-12 shadow-2xl relative overflow-hidden border-none !rounded-[3rem]">
        <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
           <Lock className="w-64 h-64 text-white rotate-12" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
           <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-[0.2em] border border-emerald-500/20">
                 <ShieldCheck className="w-3.5 h-3.5" /> ระบบบริหารสิทธิ์ผู้ใช้งาน (Access Control)
              </div>
              <h1 className="text-4xl lg:text-5xl font-heading font-black text-white tracking-tighter uppercase leading-none">
                จัดการสิทธิ์ <span className="text-emerald-500">ผู้ใช้งานระบบ</span>
              </h1>
              <p className="text-zinc-400 text-sm max-w-md font-body font-bold leading-relaxed">กำหนดขอบเขตการเข้าถึงข้อมูลและบทบาทของเจ้าหน้าที่ภายในองค์กร</p>
           </div>
           
           <button
             onClick={openCreateModal}
             aria-label="เพิ่มผู้ใช้งานใหม่"
             className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-10 py-6 rounded-3xl font-heading font-black text-sm uppercase tracking-widest flex items-center gap-4 transition-all active:scale-95 shadow-[0_20px_40px_-12px_rgba(16,185,129,0.3)] group"
           >
             <UserPlus className="w-5 h-5 transition-transform group-hover:scale-110" /> เพิ่มผู้ใช้งานใหม่
           </button>
        </div>
      </section>

      {/* ─── Statistics Bento Box ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="clay-card p-6 flex items-center gap-5 !rounded-3xl">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500">
               <Users className="w-7 h-7" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">ผู้ใช้ทั้งหมด</p>
               <p className="text-3xl font-heading font-black text-zinc-900 dark:text-white leading-none">{users.length}</p>
            </div>
         </div>
         <div className="clay-card p-6 flex items-center gap-5 !rounded-3xl">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-500">
               <Fingerprint className="w-7 h-7" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">แอดมินระบบ</p>
               <p className="text-3xl font-heading font-black text-zinc-900 dark:text-white leading-none">{users.filter(u => u.Role === 'Admin').length}</p>
            </div>
         </div>
         <div className="clay-card p-6 flex items-center gap-5 !rounded-3xl">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center text-sky-500">
               <Smartphone className="w-7 h-7" />
            </div>
            <div>
               <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">สถานะระบบ</p>
               <div className="flex items-center gap-2 mt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-xs font-bold text-emerald-500">ออนไลน์และปลอดภัย</p>
               </div>
            </div>
         </div>
      </div>

      {/* ─── Data Table ─── */}
      <div className="space-y-6">
         <div className="relative group max-w-md">
            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
               <Search className="h-5 w-5 text-zinc-400 group-focus-within:text-emerald-500 transition-colors" />
            </div>
            <input 
               type="text" 
               placeholder="ค้นหาด้วยชื่อ หรือ อีเมล..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="block w-full pl-16 pr-8 py-5 bg-zinc-100/50 dark:bg-zinc-950/50 border-2 border-zinc-100 dark:border-zinc-800 rounded-[2rem] text-sm font-body font-bold focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all shadow-sm dark:text-white placeholder:text-zinc-300"
            />
         </div>

         <div className="clay-card !p-0 overflow-hidden shadow-2xl backdrop-blur-xl border-none !rounded-[3rem]">
            {loading ? (
               <div className="p-24 flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-400 animate-pulse">กำลังซิงค์ฐานข้อมูลความปลอดภัย...</p>
               </div>
            ) : (
               <div className="overflow-x-auto">
                  <table className="w-full text-left font-body">
                     <thead>
                        <tr className="bg-zinc-50/50 dark:bg-zinc-800/20 border-b border-zinc-100 dark:border-zinc-800">
                           <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">สมาชิกผู้ใช้งาน</th>
                           <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">บทบาทสิทธิ์</th>
                           <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">หน่วยงานต้นสังกัด</th>
                           <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 text-right">ดำเนินการ</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                        {filteredUsers.length === 0 ? (
                           <tr>
                              <td colSpan={4} className="px-8 py-20 text-center space-y-4">
                                 <Users className="w-12 h-12 mx-auto text-zinc-200 dark:text-zinc-800" />
                                 <p className="text-sm font-bold text-zinc-400">ไม่พบข้อมูลผู้ใช้งานที่ค้นหา</p>
                              </td>
                           </tr>
                        ) : (
                           filteredUsers.map((u, i) => (
                              <tr key={i} className="group hover:bg-zinc-50 dark:hover:bg-indigo-500/5 transition-all">
                                 <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                       <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-black text-indigo-500 shadow-sm">
                                          {u.FullName?.charAt(0) || 'U'}
                                       </div>
                                       <div>
                                          <p className="text-sm font-black text-zinc-900 dark:text-white line-clamp-1">{u.FullName}</p>
                                          <p className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5"><Mail className="w-3 h-3" /> {u.Email}</p>
                                       </div>
                                    </div>
                                 </td>
                                  <td className="px-8 py-5">
                                    <span className={cn(
                                       "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                                       u.Role === 'Admin' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                                       u.Role === 'Staff' ? "bg-sky-500/10 text-sky-600 border-sky-500/20" :
                                       "bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:border-zinc-700"
                                    )}>
                                       {u.Role}
                                    </span>
                                  </td>
                                 <td className="px-8 py-5">
                                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 text-sm font-bold">
                                       <Building2 className="w-4 h-4 opacity-40" /> {u.Department || <span className="opacity-30 italic">ไม่ระบุ</span>}
                                    </div>
                                 </td>
                                 <td className="px-8 py-5 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                       <button onClick={() => openEditModal(u)} aria-label="แก้ไขข้อมูลผู้ใช้" className="p-3 rounded-xl hover:bg-white dark:hover:bg-zinc-800 shadow-sm border border-transparent hover:border-zinc-100 dark:hover:border-zinc-700 transition-all text-zinc-400 hover:text-indigo-500">
                                          <Edit3 className="w-4 h-4" />
                                       </button>
                                       <button onClick={() => handleDelete(u.Email)} aria-label="ระงับสิทธิ์ผู้ใช้" className="p-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all text-zinc-400 hover:text-rose-500">
                                          <Trash2 className="w-4 h-4" />
                                       </button>
                                    </div>
                                 </td>
                              </tr>
                           ))
                        )}
                     </tbody>
                  </table>
               </div>
            )}
         </div>
      </div>

      {/* ─── Modal จัดการผู้ใช้ ─── */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !processing && setIsModalOpen(false)}
        label="จัดการผู้ใช้งาน"
        contentClassName="w-full max-w-lg"
      >
         <div className="w-full max-w-lg clay-card-deep p-10 shadow-2xl animate-in zoom-in-95 overflow-hidden border-none !rounded-[3rem]">
               <button onClick={() => setIsModalOpen(false)} aria-label="ปิดหน้าต่าง" className="absolute top-8 right-8 p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 transition-colors">
                  <X className="w-6 h-6" />
               </button>
               
               <div className="mb-10 space-y-2">
                  <h3 className="text-3xl font-heading font-black tracking-tighter text-zinc-900 dark:text-white uppercase leading-none">
                     {modalMode === 'CREATE' ? 'ลงทะเบียนผู้ใช้' : 'ปรับเปลี่ยนสิทธิ์'}
                  </h3>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">การจัดการบัญชีและสิทธิ์เข้าถึง</p>
               </div>

               <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">บัญชีอีเมล Google</label>
                        <div className="relative">
                           <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                           <input 
                              type="email" 
                              value={formEmail} 
                              onChange={e => setFormEmail(e.target.value)} 
                              disabled={modalMode === 'EDIT'}
                              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 disabled:opacity-50 dark:text-white"
                              required
                           />
                        </div>
                     </div>

                     <div className="grid grid-cols-1 gap-6">
                        {modalMode === 'CREATE' && (
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">ชื่อ-นามสกุล</label>
                              <input 
                                 type="text" 
                                 value={formName} 
                                 onChange={e => setFormName(e.target.value)} 
                                 className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 dark:text-white"
                              />
                           </div>
                        )}

                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">สิทธิ์การเข้าใช้งาน</label>
                           <select
                              value={formRole}
                              onChange={e => setFormRole(e.target.value)}
                              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 cursor-pointer dark:text-white"
                           >
                              <option value="Admin">Admin (ผู้ดูแลระบบ)</option>
                              <option value="Postal">Postal (เจ้าหน้าที่นำจ่าย)</option>
                              <option value="Staff">Staff (เจ้าหน้าที่ ปณ.)</option>
                              <option value="User">User (ผู้ใช้งานทั่วไป)</option>
                           </select>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-zinc-400 tracking-widest ml-1">หน่วยงาน</label>
                           <select
                              value={formDept}
                              onChange={e => setFormDept(e.target.value)}
                              className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 cursor-pointer dark:text-white"
                           >
                              <option value="">-- เลือกหน่วยงาน --</option>
                              {departments.map(d => (
                                 <option key={d.id} value={d.name}>{d.name}</option>
                              ))}
                           </select>
                        </div>
                     </div>
                  </div>

                  <button 
                     type="submit" 
                     disabled={processing}
                     aria-label="บันทึกข้อมูลผู้ใช้งาน"
                     className="w-full h-20 bg-emerald-500 hover:bg-emerald-400 text-zinc-900 font-black font-heading text-lg uppercase tracking-[0.2em] rounded-[2rem] shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-50"
                  >
                     {processing ? <Loader2 className="w-8 h-8 animate-spin" /> : <CheckCircle2 className="w-8 h-8" />}
                     {modalMode === 'CREATE' ? 'เปิดบัญชีผู้ใช้ใหม่' : 'ยืนยันการเปลี่ยนแปลง'}
                  </button>
               </form>
            </div>
      </Modal>
    </div>
  );
};
