import React from 'react';
import { AlertCircle, RefreshCw, CheckCircle2, User, Clock } from 'lucide-react';

interface ConflictDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onResolve: (decision: 'keep_mine' | 'keep_server') => void;
  conflictData: {
    packageId: string;
    serverData: {
      status: string;
      updatedBy: string;
      updatedAt?: string;
    };
    clientData: {
      status: string;
      updatedBy: string;
    };
  };
}

export const ConflictDialog: React.FC<ConflictDialogProps> = ({
  isOpen,
  onClose,
  onResolve,
  conflictData
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 flex flex-col animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-amber-50 p-6 flex items-start gap-4 border-b border-amber-100">
          <div className="bg-amber-100 p-3 rounded-2xl">
            <AlertCircle className="w-8 h-8 text-amber-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">พบข้อมูลที่แก้ไขพร้อมกัน</h2>
            <p className="text-amber-700 mt-1 font-medium">รหัสพัสดุ: {conflictData.packageId}</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-8">
          <p className="text-gray-600 text-lg leading-relaxed">
            มีเจ้าหน้าที่ท่านอื่นแก้ไขข้อมูลพัสดุนี้ในขณะที่คุณออฟไลน์ 
            กรุณาเลือกข้อมูลที่คุณต้องการบันทึกลงระบบ
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Server Data (The Truth) */}
            <div className="flex flex-col h-full bg-slate-50 rounded-2xl p-6 border-2 border-slate-100 hover:border-slate-200 transition-all">
              <div className="flex items-center gap-2 mb-4 text-slate-600 font-semibold uppercase tracking-wider text-xs">
                <RefreshCw className="w-4 h-4" />
                ข้อมูลบนเซิร์ฟเวอร์
              </div>
              <div className="space-y-4 flex-grow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">สถานะ</p>
                    <p className="font-bold text-slate-900">{conflictData.serverData.status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <User className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">แก้ไขโดย</p>
                    <p className="font-bold text-slate-900">{conflictData.serverData.updatedBy}</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => onResolve('keep_server')}
                aria-label="ใช้ข้อมูลจากเซิร์ฟเวอร์"
                className="mt-6 w-full py-4 px-4 bg-white border-2 border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-100 active:scale-95 transition-all shadow-sm"
              >
                ใช้ข้อมูลเซิร์ฟเวอร์
              </button>
            </div>

            {/* Client Data (Your Data) */}
            <div className="flex flex-col h-full bg-emerald-50 rounded-2xl p-6 border-2 border-emerald-100 hover:border-emerald-200 transition-all">
              <div className="flex items-center gap-2 mb-4 text-emerald-600 font-semibold uppercase tracking-wider text-xs">
                <Clock className="w-4 h-4" />
                ข้อมูลที่คุณแก้ไข
              </div>
              <div className="space-y-4 flex-grow">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs text-emerald-600">สถานะ</p>
                    <p className="font-bold text-emerald-900">{conflictData.clientData.status}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <User className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-xs text-emerald-600">แก้ไขโดย</p>
                    <p className="font-bold text-emerald-900">คุณ (ขณะออฟไลน์)</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => onResolve('keep_mine')}
                aria-label="ยืนยันข้อมูลออฟไลน์ของฉัน"
                className="mt-6 w-full py-4 px-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 active:scale-95 transition-all shadow-lg shadow-emerald-200"
              >
                ยืนยันข้อมูลของฉัน
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
          <button 
            onClick={onClose}
            aria-label="ยกเลิกและตรวจสอบใหม่"
            className="px-6 py-3 text-gray-500 font-semibold hover:text-gray-700 transition-colors"
          >
            ยกเลิกและตรวจสอบใหม่
          </button>
        </div>
      </div>
    </div>
  );
};
