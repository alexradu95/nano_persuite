export interface MonthNavigationProps {
  year: number;
  month: number;
}

export const MonthNavigation = ({ year, month }: MonthNavigationProps): string => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  return `
    <div class="flex justify-between items-center mb-6">
      <div class="flex items-center space-x-4">
        <a href="/app/income/monthly?year=${prevYear}&month=${prevMonth}" class="neo-btn neo-gray-medium px-4 py-2 text-black font-black">← PREV</a>
        <h2 class="neo-title text-xl text-white bg-black px-4 py-2">${monthNames[month - 1]} ${year}</h2>
        <a href="/app/income/monthly?year=${nextYear}&month=${nextMonth}" class="neo-btn neo-gray-medium px-4 py-2 text-black font-black">NEXT →</a>
      </div>
    </div>
  `;
};