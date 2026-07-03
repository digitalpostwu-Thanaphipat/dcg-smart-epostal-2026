import React, { useRef, useState, useMemo, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, Check, Trash2, PenTool, Info, Loader2, User, Truck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SearchableSelect } from './SearchableSelect';
import { useMasterDataStore } from '@/store/useMasterDataStore';

interface SignaturePadProps {
  onConfirm: (signature: string, receiverName: string, deliveryMethod: string) => void;
  onClose: () => void;
  loading?: boolean;
  /** รายการพัสดุที่เลือกนำจ่าย */
  selectedItems: any[];
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onConfirm, onClose, loading, selectedItems }) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [receiverName, setReceiverName] = useState('');
  const [receiverSelectValue, setReceiverSelectValue] = useState<string | number>('');
  const [deliveryMethod, setDeliveryMethod] = useState<'ส่งมอบที่หน่วยงาน'>('ส่งมอบที่หน่วยงาน');

  const { personnel, positions, representatives, departments } = useMasterDataStore();

  // Extract unique departments from selected items
  const itemDepartments = useMemo(() => {
    const depts = new Set<string>();
    selectedItems.forEach(item => {
      const d = item.department || item.departmentName || item.deptName;
      if (d) depts.add(String(d).trim());
    });
    return Array.from(depts);
  }, [selectedItems]);

  // Extract unique recipient names from selected items (Original Receiver on Label)
  const originalRecipients = useMemo(() => {
    const names = new Set<string>();
    selectedItems.forEach(item => {
      const n = item.recipientName || item.receiverName || item['ชื่อผู้รับไปรษณีย์ภัณฑ์'] || item.ชื่อผู้รับ;
      if (n && n !== 'ไม่ระบุชื่อผู้รับไปรษณีย์ภัณฑ์') names.add(String(n).trim());
    });
    return Array.from(names);
  }, [selectedItems]);

  // Resolve department objects to match personnel filtering
  const selectedDepts = useMemo(() => {
    if (itemDepartments.length === 0) return [];
    return departments.filter(d => {
      const dName = String(d.name).trim().toLowerCase();
      const dId = String(d.id).trim().toLowerCase();
      return itemDepartments.some(target => {
        const t = target.toLowerCase();
        return dName === t || dId === t || dName.includes(t) || t.includes(dName);
      });
    });
  }, [itemDepartments, departments]);

  // Pre-fill receiver name if exactly one unique recipient name exists
  useEffect(() => {
    if (originalRecipients.length === 1 && !receiverName) {
      const timer = setTimeout(() => {
        setReceiverName(originalRecipients[0]);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [originalRecipients, receiverName]);

  // Build filtered options: Original Recipients + Positions + Personnel + Representatives
  const signerOptions = useMemo(() => {
    const opts: { id: string | number; label: string; cleanLabel: string; group: string }[] = [];

    // 1. Original Recipients (from Label)
    originalRecipients.forEach(name => {
      opts.push({
        id: `label-${name}`,
        label: `📋 ${name}`,
        cleanLabel: name,
        group: '📋 ผู้รับตามจ่าหน้า'
      });
    });

    // 2. Positions filtered by department(s)
    positions
      .filter((pos: any) => {
        if (selectedDepts.length > 0) {
          return selectedDepts.some(d => String(pos.deptId) === String(d.id));
        }
        if (itemDepartments.length > 0) {
          const pDeptId = String(pos.deptId).toLowerCase();
          return itemDepartments.some(target => {
            const t = target.toLowerCase();
            return pDeptId.includes(t) || t.includes(pDeptId);
          });
        }
        return true;
      })
      .forEach((pos: any) => {
        opts.push({
          id: `pos-${pos.name}`,
          label: `🏛️ ${pos.name}`,
          cleanLabel: pos.name,
          group: '📋 ตำแหน่ง'
        });
      });

    // 3. Personnel filtered by department(s)
    personnel
      .filter((p: any) => {
        const pDept = String(p.deptId || '').trim().toLowerCase();
        if (selectedDepts.length > 0) {
          return selectedDepts.some(d => {
            const sId = String(d.id || '').trim().toLowerCase();
            const sName = String(d.name || '').trim().toLowerCase();
            return pDept === sId || pDept === sName;
          });
        }
        if (itemDepartments.length > 0) {
          return itemDepartments.some(target => {
            const t = target.toLowerCase().trim();
            return pDept === t || t.includes(pDept) || pDept.includes(t);
          });
        }
        return true;
      })
      .forEach((p: any) => {
        opts.push({
          id: `person-${p.email || p.fullName}`,
          label: `👤 ${p.fullName}`,
          cleanLabel: p.fullName,
          group: '👤 บุคลากรในหน่วยงาน'
        });
      });

    // 4. Representatives filtered by department(s)
    representatives
      .filter((r: any) => {
        const rDept = String(r.deptId || '').trim().toLowerCase();
        if (selectedDepts.length > 0) {
          return selectedDepts.some(d => {
            const sId = String(d.id || '').trim().toLowerCase();
            const sName = String(d.name || '').trim().toLowerCase();
            return rDept === sId || rDept === sName;
          });
        }
        if (itemDepartments.length > 0) {
          return itemDepartments.some(target => {
            const t = target.toLowerCase().trim();
            return rDept === t || t.includes(rDept) || rDept.includes(t);
          });
        }
        return true;
      })
      .forEach((r: any) => {
        opts.push({
          id: `rep-${r.id || r.name}`,
          label: `🏢 ${r.name}`,
          cleanLabel: r.name,
          group: '🏢 ตัวแทนรับพัสดุ'
        });
      });

    return opts;
  }, [selectedDepts, personnel, positions, representatives, originalRecipients, itemDepartments]);

  const clear = () => {
    sigCanvas.current?.clear();
    setIsEmpty(true);
  };

  const handleConfirm = () => {
    if (!receiverName.trim()) return;
    if (sigCanvas.current?.isEmpty()) return;
    const canvas = sigCanvas.current?.getCanvas();
    const data = canvas?.toDataURL('image/png');
    if (data) onConfirm(data, receiverName.trim(), deliveryMethod);
  };

  const handleSignerChange = (val: string | number) => {
    setReceiverSelectValue(val);
    const found = signerOptions.find(o => String(o.id) === String(val));
    setReceiverName(found ? found.cleanLabel : String(val));
  };

  const displayDeptName = itemDepartments.length > 1 
    ? `${itemDepartments[0]} และอื่นๆ (${itemDepartments.length} หน่วยงาน)`
    : itemDepartments[0] || 'ไม่ระบุหน่วยงาน';

  return (
    <div className="fixed inset-0 z-[200] flex items-start pt-6 sm:pt-10 justify-center px-3 sm:px-6 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-300 font-body overflow-y-auto">
      <div className="w-full max-w-2xl clay-card-deep p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-500 mb-8 !rounded-[3rem]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-8">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-[0.2em] border border-primary/10">
               <PenTool className="w-3 h-3" /> โพรโทคอลการลงนามดิจิทัล (Digital Signature)
            </div>
            <h3 className="text-xl sm:text-2xl font-heading font-black text-zinc-900 dark:text-white tracking-tighter uppercase leading-none">ลงนามรับพัสดุ</h3>
            <p className="text-xs font-medium text-primary mt-1">📦 {displayDeptName} {selectedItems.length ? `(${selectedItems.length} รายการ)` : ''}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-rose-500 transition-all active:scale-95"
            aria-label="ปิดหน้าต่างลงนาม"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Signer Name — SearchableSelect filtered by department */}
        <div className="px-5 sm:px-8 pb-4">
          <label className="block text-sm font-heading font-black text-zinc-700 dark:text-zinc-300 mb-2">
            <User className="w-4 h-4 inline mr-1.5 text-primary" />
            ชื่อผู้เซ็นรับ <span className="text-rose-500">*</span>
          </label>
          <SearchableSelect
            allowCustom
            onCustomChange={(val) => setReceiverName(val)}
            groupOrder={['📋 ผู้รับตามจ่าหน้า', '👤 บุคลากรในหน่วยงาน', '🏢 ตัวแทนรับพัสดุ', '📋 ตำแหน่ง']}
            options={signerOptions}
            value={receiverSelectValue}
            onChange={handleSignerChange}
            placeholder={itemDepartments.length > 0 ? `ค้นหาชื่อใน ${itemDepartments.join(', ')}...` : 'กรุณาเลือกรายการก่อน...'}
          />
          {!receiverName.trim() && (
            <p className="mt-1.5 text-[10px] font-bold text-rose-400 px-1">กรุณาเลือกหรือกรอกชื่อผู้เซ็นรับก่อนยืนยัน</p>
          )}
        </div>

        {/* Delivery Method Selection */}
        <div className="px-5 sm:px-8 pb-4">
          <label className="block text-sm font-heading font-black text-zinc-700 dark:text-zinc-300 mb-2">
            <Info className="w-4 h-4 inline mr-1.5 text-primary" />
            วิธีการส่งมอบ
          </label>
          <div className="grid grid-cols-1 gap-2">
            {[
              { id: 'ส่งมอบที่หน่วยงาน', label: 'ส่งมอบที่หน่วยงาน', icon: Truck }
            ].map(method => (
              <button
                key={method.id}
                onClick={() => setDeliveryMethod(method.id as any)}
                aria-label={`เลือกวิธีการส่งมอบแบบ ${method.label}`}
                className={cn(
                  "py-3 rounded-2xl text-[11px] font-heading font-black border transition-all flex items-center justify-center gap-1.5",
                  deliveryMethod === method.id 
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 border-transparent shadow-md" 
                    : "border-zinc-100 dark:border-zinc-800 text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                )}
              >
                <method.icon className="w-4 h-4" aria-hidden="true" />
                {method.label}
              </button>
            ))}
          </div>
        </div>

        {/* Canvas Area */}
        <div className="px-5 sm:px-8 pb-5 space-y-3">
           <div className="relative group">
              <div className="absolute inset-0 bg-primary/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="border-4 border-dashed border-zinc-100 dark:border-zinc-800 rounded-3xl bg-zinc-50 dark:bg-zinc-950/50 overflow-hidden">
                 <SignatureCanvas
                   ref={sigCanvas}
                   penColor="#047857"
                   canvasProps={{
                     className: "w-full h-36 sm:h-52 cursor-crosshair",
                   }}
                   onBegin={() => setIsEmpty(false)}
                 />
              </div>
              
              {isEmpty && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40">
                   <PenTool className="w-8 h-8 text-zinc-300 dark:text-zinc-700 mb-2" />
                   <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">กรุณาลงลายมือชื่อภายในกรอบนี้</p>
                </div>
              )}

              <button 
                onClick={clear}
                className="absolute top-3 right-3 p-2 rounded-xl bg-white dark:bg-zinc-900 text-zinc-400 hover:text-rose-500 shadow-lg border border-zinc-100 dark:border-zinc-800 transition-all active:scale-90"
                title="ล้างหน้าจอ"
                aria-label="ล้างหน้าจอลงนาม"
              >
                <Trash2 className="w-4 h-4" />
              </button>
           </div>

           <div className="flex items-center gap-2 text-zinc-400 px-1 leading-relaxed">
              <Info className="w-4 h-4 text-primary shrink-0" />
              <p className="text-[9px] font-bold uppercase tracking-wider">ลายเซ็นอิเล็กทรอนิกส์นี้จะถูกบันทึกเข้าระบบเพื่อใช้เป็นหลักฐานการนำจ่าย</p>
           </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3 p-4 sm:p-8 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-800">
           <button 
             onClick={onClose}
             aria-label="ยกเลิกการเซ็นรับ"
             className="px-6 py-3.5 bg-white dark:bg-zinc-900 text-zinc-400 rounded-2xl font-black text-[10px] uppercase tracking-widest border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 transition-all active:scale-95 text-center"
           >
             ยกเลิก
           </button>
           <button 
             onClick={handleConfirm}
             disabled={isEmpty || loading || !receiverName.trim()}
             aria-label="ยืนยันตัวตนและบันทึกลายเซ็น"
             className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl shadow-primary/20 disabled:opacity-50 disabled:grayscale hover:brightness-110"
           >
             {loading ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <Check className="w-5 h-5" />}
             ยืนยันตัวตนและบันทึก
           </button>
        </div>
      </div>
    </div>
  );
};
