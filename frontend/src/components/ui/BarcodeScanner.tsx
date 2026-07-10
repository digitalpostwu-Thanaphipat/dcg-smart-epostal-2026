import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, CameraOff, SwitchCamera, X, Zap } from 'lucide-react';
import { Modal } from './Modal';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

let scannerIdCounter = 0;

export function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerId = useMemo(() => `barcode-scanner-${++scannerIdCounter}`, []);

  // [P2-6 Fix] เก็บ callback ล่าสุดใน ref กัน stale closure (เดิม effect จับแค่ facingMode)
  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onScanRef.current = onScan; }, [onScan]);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  const stopScanning = useCallback(async () => {
    try {
      const scanner = scannerRef.current;
      if (scanner) {
        // html5-qrcode ต้องเช็ค isScanning ก่อน stop ไม่งั้น throw
        if (scanner.isScanning) {
          await scanner.stop();
        }
        scanner.clear();
        scannerRef.current = null;
      }
    } catch (e) {
      // ignore — สำคัญคือปิด stream ให้ไฟกล้องดับ
      console.warn('BarcodeScanner stop error:', e);
    } finally {
      setIsScanning(false);
    }
  }, []);

  const startScanning = useCallback(async (mode: 'environment' | 'user') => {
    try {
      // [P2-6 Fix] หยุด scanner เดิมให้เสร็จก่อนเริ่มใหม่ กัน orphan stream (ไฟกล้องติดค้าง)
      await stopScanning();
      setError('');
      const scanner = new Html5Qrcode(containerId);
      scannerRef.current = scanner;
      await scanner.start(
        { facingMode: mode },
        { fps: 15, qrbox: { width: 300, height: 140 }, aspectRatio: 1.6 },
        (decodedText) => { onScanRef.current(decodedText); stopScanning(); },
        () => { /* silence decode errors */ }
      );
      setIsScanning(true);
    } catch (err: any) {
      setError(err?.message || 'ไม่สามารถเปิดกล้องได้ โปรดอนุญาตให้เข้าถึงกล้อง');
    }
  }, [containerId, stopScanning]);

  const switchCamera = useCallback(async () => {
    await stopScanning();
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  }, [stopScanning]);

  useEffect(() => {
    // [P2-6 Fix] start ด้วย mode ปัจจุบัน
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startScanning(facingMode);
    // [P2-6 Fix] cleanup ต้อง await จริง ๆ กันไฟกล้องติดค้างหลัง unmount
    let cancelled = false;
    return () => {
      cancelled = true;
      stopScanning().then(() => {
        if (cancelled) return;
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facingMode]);

  const handleClose = useCallback(() => {
    stopScanning().then(() => onCloseRef.current());
  }, [stopScanning]);

  return (
    <Modal
      isOpen={true}
      onClose={handleClose}
      label="ระบบสแกนบาร์โค้ด"
      className="bg-zinc-950/90 p-6"
      contentClassName="w-full max-w-xl"
    >
      <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-[2.5rem] overflow-hidden shadow-2xl border border-zinc-200/50 dark:border-zinc-800/50 animate-in zoom-in-95 duration-500">

        {/* Header */}
        <div className="flex items-center justify-between p-8 dark:bg-zinc-950">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-[9px] font-black uppercase tracking-[0.2em] border border-primary/10">
              <Camera className="w-3 h-3" /> Lens Scan Engine
            </div>
            <h3 className="text-2xl font-heading font-black text-zinc-900 dark:text-white tracking-tighter uppercase leading-none">ระบบสแกนบาร์โค้ด</h3>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={switchCamera} className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-primary transition-all active:scale-90" aria-label="สลับกล้อง"><SwitchCamera className="w-6 h-6" /></button>
             <button onClick={handleClose} className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-rose-500 transition-all active:scale-90" aria-label="ปิดเครื่องสแกน"><X className="w-6 h-6" /></button>
          </div>
        </div>

        {/* Scanner Area */}
        <div className="relative bg-black h-80 overflow-hidden">
          <div id={containerId} className="w-full h-full" />
          {!isScanning && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-[10px] font-black text-white uppercase tracking-widest">กำลังเตรียมกล้อง...</p>
            </div>
          )}

          <div className="absolute inset-0 pointer-events-none border-[40px] border-black/20">
             <div className="w-full h-full border-2 border-primary/30 rounded-2xl" />
          </div>
        </div>

        {/* Footer */}
        <div className="p-10 bg-zinc-50 dark:bg-zinc-950 text-center border-t border-zinc-100 dark:border-zinc-800">
          {error ? (
            <div className="space-y-6">
              <CameraOff className="w-16 h-16 mx-auto text-rose-400 opacity-50" />
              <p className="text-xs text-rose-500 font-black uppercase tracking-widest">{error}</p>
              <button onClick={() => startScanning(facingMode)} aria-label="เชื่อมต่อกล้องใหม่อีกครั้ง" className="w-full h-16 bg-zinc-900 dark:bg-zinc-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95">ลองเชื่อมต่อใหม่</button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-4 text-zinc-400">
               <Zap className="w-5 h-5 text-primary" />
               <p className="text-[10px] font-black uppercase tracking-widest">จัดวางบาร์โค้ดให้อยู่ภายในกรอบสแกนทางด้านบน</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
