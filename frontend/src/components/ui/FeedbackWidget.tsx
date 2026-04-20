import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { MessageSquareWarning, X, Send, AlertCircle, Smile, Meh, Frown, Star } from 'lucide-react';
import { ApiClient } from '../../api/client';
import toast from 'react-hot-toast';
import { haptics } from '../../utils/haptics';
import { cn } from '@/lib/utils';

export const FeedbackWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: 'Bug',
    rating: 0,
    comment: ''
  });

  const categories = [
    { id: 'Bug', label: 'แจ้งปัญหาขัดข้อง' },
    { id: 'Feature', label: 'เสนอแนะฟีเจอร์ใหม่' },
    { id: 'Other', label: 'อื่นๆ' }
  ];

  const toggleModal = () => {
    haptics.light();
    setIsOpen(!isOpen);
    if (!isOpen) {
      setFormData({ category: 'Bug', rating: 0, comment: '' });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.comment.trim()) {
      toast.error('กรุณาระบุรายละเอียดเพิ่มเติม');
      return;
    }

    setLoading(true);
    try {
      // Default to guest if no user is found, as Service_Feedback requires userEmail
      const userStr = localStorage.getItem('epostal_user');
      const email = userStr ? JSON.parse(userStr).email : 'guest@epostal.app';

      const res = await ApiClient.feedback.submit({
        category: formData.category,
        rating: formData.rating,
        comment: formData.comment,
        url: window.location.href,
        userAgent: navigator.userAgent,
        userEmail: email
      });

      if (res.success) {
        haptics.success();
        toast.success('ส่งข้อเสนอแนะเรียบร้อย ขอบคุณครับ!');
        setIsOpen(false);
      } else {
        throw new Error(res.error || 'Failed to submit feedback');
      }
    } catch (err: any) {
      haptics.error();
      toast.error(err.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={toggleModal}
        className="flex h-10 w-10 items-center justify-center rounded-xl text-zinc-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 hover:text-emerald-500 transition-colors tooltip-trigger relative group"
        title="ส่งข้อเสนอแนะ/แจ้งปัญหา"
      >
        <MessageSquareWarning className="h-5 w-5" />
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 pb-20 sm:pb-6 font-body">
          <div 
            className="absolute inset-0 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in duration-300" 
            onClick={toggleModal}
          />
          
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-10 duration-300 border border-zinc-200/50 dark:border-zinc-800/50 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="bg-zinc-900 p-6 sm:p-8 flex items-start justify-between relative overflow-hidden shrink-0">
               <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <MessageSquareWarning className="w-32 h-32 text-white rotate-12" />
               </div>
               <div className="relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                     <AlertCircle className="w-3 h-3" /> แจ้งปัญหา/ข้อเสนอแนะ
                  </div>
                  <h3 className="text-2xl font-black font-heading text-white tracking-tighter">ส่งคำนำแนะถึงทีมพัฒนา</h3>
                  <p className="text-zinc-400 text-sm font-medium mt-1">ช่วยเราพัฒนา ePostal ให้ดียิ่งขึ้น</p>
               </div>
               <button 
                  onClick={toggleModal}
                  className="relative z-10 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
               >
                 <X className="w-5 h-5" />
               </button>
            </div>

            {/* Body */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 overflow-y-auto">
              
              {/* Category */}
              <div className="space-y-3">
                 <label className="text-xs font-black font-heading uppercase text-zinc-500 tracking-widest">ประเภทหัวข้อ</label>
                 <div className="grid grid-cols-3 gap-2">
                    {categories.map(cat => (
                       <button
                         key={cat.id}
                         type="button"
                         onClick={() => { haptics.light(); setFormData(prev => ({ ...prev, category: cat.id })) }}
                         className={`px-2 py-2.5 rounded-xl text-[10px] sm:text-[11px] font-black uppercase transition-all text-center leading-tight flex items-center justify-center min-h-[44px] ${
                           formData.category === cat.id
                             ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                             : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                         }`}
                       >
                         {cat.label}
                       </button>
                    ))}
                 </div>
              </div>

              {/* Rating */}
              <div className="space-y-3">
                 <label className="text-xs font-black font-heading uppercase text-zinc-500 tracking-widest flex justify-between items-center">
                   ระดับความพึงพอใจ <span className="text-[10px] font-medium opacity-50 text-normal normal-case tracking-normal">(เลือก 1-5 ดาว)</span>
                 </label>
                 <div className="flex gap-2 justify-between">
                    {[1, 2, 3, 4, 5].map(star => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => { haptics.medium(); setFormData(prev => ({ ...prev, rating: star })) }}
                        className={`flex-1 flex justify-center items-center py-3 rounded-2xl transition-all ${
                           formData.rating >= star 
                             ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-500 ring-2 ring-amber-500/30' 
                             : 'bg-zinc-50 dark:bg-zinc-800/50 text-zinc-300 dark:text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                         }`}
                      >
                         <Star className={`w-6 h-6 ${formData.rating >= star ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                 </div>
              </div>

              {/* Comment */}
              <div className="space-y-3">
                 <label className="text-xs font-black font-heading uppercase text-zinc-500 tracking-widest">รายละเอียดเพิ่มเติม</label>
                 <textarea
                   value={formData.comment}
                   onChange={e => setFormData(prev => ({ ...prev, comment: e.target.value }))}
                   placeholder="อธิบายปัญหา ลิงก์ที่เกิดปัญหา หรือฟีเจอร์ที่อยากให้เพิ่ม..."
                   className="w-full h-32 p-4 text-sm bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/50 dark:border-zinc-800 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all resize-none"
                   required
                 />
              </div>

              {/* Action */}
              <button
                 type="submit"
                 disabled={loading}
                 className="w-full flex items-center justify-center gap-2 py-4 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-2xl font-black font-heading uppercase tracking-widest hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-500 transition-all shadow-xl hover:shadow-emerald-500/20 group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                 {loading ? (
                    <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                 ) : (
                    <>
                       <Send className="w-4 h-4 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" /> ส่งข้อเสนอแนะ
                    </>
                 )}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
