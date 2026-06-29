/**
 * ePostal API Mock Data
 * For Unit Testing and Offline Development
 */

export const MOCK_DEPARTMENTS = [
  { id: 'D001', name: 'สำนักผู้บริหาร', DeptID: 'D001', DeptName: 'สำนักผู้บริหาร', Building: 'อาคาร 1', Floor: '1' },
  { id: 'D002', name: 'ฝ่ายไอที', DeptID: 'D002', DeptName: 'ฝ่ายไอที', Building: 'อาคาร 3', Floor: '4' },
];

export const MOCK_POSITIONS = [
  { id: 'P01', PositionName: 'ผู้อำนวยการ', DeptID: 'D001' },
  { id: 'P02', PositionName: 'หัวหน้าฝ่าย', DeptID: 'D002' },
];

export const MOCK_REPRESENTATIVES = [
  { id: 'R01', RepName: 'นายใจดี', DeptID: 'D001' },
];

export const MOCK_PERSONNEL = [
  { Email: 'admin@epostal.ai', FullName: 'Admin ePostal', DeptID: 'D001', Department: 'สำนักผู้บริหาร' },
  { Email: 'staff@epostal.ai', FullName: 'Staff User', DeptID: 'D002', Department: 'ฝ่ายไอที' },
];

export const MOCK_PACKAGES = [
  { id: 'PKG001', packageId: 'PKG001', trackingNo: 'TH123456', type: 'EMS', department: 'สำนักงานคณบดี', status: 'รอนำจ่าย' },
  { id: 'PKG002', packageId: 'PKG002', trackingNo: 'TH789012', type: 'ลงทะเบียน', department: 'สำนักงานคณบดี', status: 'ส่งมอบแล้ว' },
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
