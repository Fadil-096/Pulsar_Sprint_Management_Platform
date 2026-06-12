export const calculateEfficiency = (estimatedHours, spentHours) => {
  if (!spentHours || spentHours === 0) {
    if (!estimatedHours || estimatedHours === 0) return null; // No data
    return { score: 100, label: '100%', trend: 'neutral', color: 'text-gray-500' }; // 0 spent but has estimate (not started)
  }

  const score = Math.round((estimatedHours / spentHours) * 100);
  
  if (score > 100) {
    return { score, label: `${score}%`, trend: 'up', color: 'text-green-600' };
  } else if (score >= 80) {
    return { score, label: `${score}%`, trend: 'down', color: 'text-amber-600' };
  } else {
    return { score, label: `${score}%`, trend: 'down', color: 'text-red-600' };
  }
};
