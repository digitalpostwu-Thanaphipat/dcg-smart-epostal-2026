/**
 * Design Utilities for ePostal
 * Part of epostal-design-system skill
 */

export const getBuildingColor = (buildingName: string) => {
  const name = buildingName || '';
  if (name.includes('อาคาร 1') || name.includes('ตึก 1')) return 'emerald';
  if (name.includes('อาคาร 2') || name.includes('ตึก 2')) return 'indigo';
  if (name.includes('อาคาร 3') || name.includes('ตึก 3')) return 'amber';
  if (name.includes('อาคาร 4') || name.includes('ตึก 4')) return 'rose';
  if (name.includes('อาคาร 5') || name.includes('ตึก 5')) return 'blue';
  if (name.includes('สำนักงาน') || name.includes('HQ')) return 'purple';
  
  // Default color based on hash
  const colors = ['emerald', 'indigo', 'amber', 'rose', 'blue', 'purple', 'zinc'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const getBuildingColorClass = (buildingName: string, type: 'bg' | 'text' | 'border' | 'lightBg' = 'bg') => {
  const color = getBuildingColor(buildingName);
  
  const maps = {
    bg: {
      emerald: 'bg-emerald-500',
      indigo: 'bg-indigo-500',
      amber: 'bg-amber-500',
      rose: 'bg-rose-500',
      blue: 'bg-blue-500',
      purple: 'bg-purple-500',
      zinc: 'bg-zinc-500'
    },
    text: {
      emerald: 'text-emerald-500',
      indigo: 'text-indigo-500',
      amber: 'text-amber-500',
      rose: 'text-rose-500',
      blue: 'text-blue-500',
      purple: 'text-purple-500',
      zinc: 'text-zinc-500'
    },
    border: {
      emerald: 'border-emerald-500',
      indigo: 'border-indigo-500',
      amber: 'border-amber-500',
      rose: 'border-rose-500',
      blue: 'border-blue-500',
      purple: 'border-purple-500',
      zinc: 'border-zinc-500'
    },
    lightBg: {
      emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
      blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
      purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
      zinc: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400'
    }
  };
  
  return maps[type][color as keyof typeof maps['bg']];
};
