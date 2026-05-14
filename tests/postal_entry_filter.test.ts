import { describe, it, expect } from 'vitest';
import { filterBySelectedDept } from '../frontend/src/lib/filterUtils';
import { MOCK_DEPARTMENTS, MOCK_POSITIONS, MOCK_PERSONNEL, MOCK_REPRESENTATIVES } from './mocks/api-mocks';

describe('filterBySelectedDept', () => {
  it('should return true if no selectedDept is provided', () => {
    const item = { deptId: 'D001', department: 'สำนักผู้บริหาร' };
    expect(filterBySelectedDept(item, null)).toBe(true);
    expect(filterBySelectedDept(item, undefined)).toBe(true);
  });

  it('should match by exact department ID (case-insensitive)', () => {
    const selectedDept = { id: 'D001', name: 'สำนักผู้บริหาร' };
    const item1 = { DeptID: 'd001' };
    const item2 = { departmentId: 'D001  ' };
    const item3 = { deptId: 'D002' };

    expect(filterBySelectedDept(item1, selectedDept)).toBe(true);
    expect(filterBySelectedDept(item2, selectedDept)).toBe(true);
    expect(filterBySelectedDept(item3, selectedDept)).toBe(false);
  });

  it('should match by exact department name (case-insensitive)', () => {
    const selectedDept = { id: 'D001', name: 'สำนักผู้บริหาร' };
    const item1 = { department: ' สำนักผู้บริหาร ' };
    const item2 = { DeptName: 'สำนักผู้บริหาร' };
    const item3 = { deptName: 'ฝ่ายไอที' };

    expect(filterBySelectedDept(item1, selectedDept)).toBe(true);
    expect(filterBySelectedDept(item2, selectedDept)).toBe(true);
    expect(filterBySelectedDept(item3, selectedDept)).toBe(false);
  });

  it('should filter mock data correctly based on department', () => {
    // D001 should have positions and personnel
    const deptD001 = MOCK_DEPARTMENTS.find(d => d.id === 'D001');
    const filteredPositionsD001 = MOCK_POSITIONS.filter(p => filterBySelectedDept(p, deptD001));
    const filteredPersonnelD001 = MOCK_PERSONNEL.filter(p => filterBySelectedDept(p, deptD001));
    const filteredRepsD001 = MOCK_REPRESENTATIVES.filter(r => filterBySelectedDept(r, deptD001));

    expect(filteredPositionsD001.length).toBeGreaterThan(0);
    expect(filteredPersonnelD001.length).toBeGreaterThan(0);
    expect(filteredRepsD001.length).toBeGreaterThan(0);

    // Another department that shouldn't have data in the current mock setup
    const deptD005 = MOCK_DEPARTMENTS.find(d => d.id === 'D005');
    if (deptD005) {
      const filteredPositionsD005 = MOCK_POSITIONS.filter(p => filterBySelectedDept(p, deptD005));
      // In current mock data, only D001 is populated
      expect(filteredPositionsD005.length).toBe(0);
    }
  });

  it('should handle undefined or null fields gracefully', () => {
    const selectedDept = { id: 'D001', name: 'สำนักผู้บริหาร' };
    const itemEmpty = {};
    const itemNull = { deptId: null, department: null };

    expect(filterBySelectedDept(itemEmpty, selectedDept)).toBe(false);
    expect(filterBySelectedDept(itemNull, selectedDept)).toBe(false);
  });
});
