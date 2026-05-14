export const filterBySelectedDept = (item: any, selectedDept: any) => {
  if (!selectedDept) return true;
  const sId = String(selectedDept.id || '').trim().toLowerCase();
  const sName = String(selectedDept.name || '').trim().toLowerCase();
  
  const iDeptId = String(item.deptId || item.DeptID || item.departmentId || '').trim().toLowerCase();
  const iDeptName = String(item.department || item.Department || item.deptName || item.DeptName || '').trim().toLowerCase();
  
  const isMatched = (
    (iDeptId && (iDeptId === sId || iDeptId === sName)) || 
    (iDeptName && (iDeptName === sId || iDeptName === sName))
  );

  return isMatched as boolean;
};
