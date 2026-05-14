/**
 * ePostal API Mock Data
 * For Unit Testing and Offline Development
 */

export const MOCK_DEPARTMENTS = [
  { DeptID: 'D01', DeptName: 'สำนักงานคณบดี', Building: 'อาคาร 1', Floor: '1' },
  { DeptID: 'D02', DeptName: 'ภาควิชาวิศวกรรมคอมพิวเตอร์', Building: 'อาคาร 3', Floor: '4' },
];

export const MOCK_PERSONNEL = [
  { Email: 'admin@epostal.ai', FullName: 'Admin ePostal', DeptID: 'D01', Department: 'สำนักงานคณบดี' },
  { Email: 'staff@epostal.ai', FullName: 'Staff User', DeptID: 'D02', Department: 'ภาควิชาวิศวกรรมคอมพิวเตอร์' },
];

export const MOCK_PACKAGES = [
  { id: 'PKG001', packageId: 'PKG001', trackingNo: 'TH123456', type: 'EMS', department: 'สำนักงานคณบดี', status: 'รอจ่าย' },
  { id: 'PKG002', packageId: 'PKG002', trackingNo: 'TH789012', type: 'ลงทะเบียน', department: 'สำนักงานคณบดี', status: 'จ่ายแล้ว' },
];

export const MOCK_RESPONSES = {
  getInitialData: {
    success: true,
    data: {
      user: { email: 'admin@epostal.ai', fullName: 'Admin ePostal', role: 'Admin', department: 'สำนักงานคณบดี' },
      depts: MOCK_DEPARTMENTS,
      personnel: MOCK_PERSONNEL,
      announcements: []
    }
  },
  savePackageEntry: { success: true, packageId: 'PKG-NEW' },
  confirmDelivery: { success: true }
};
