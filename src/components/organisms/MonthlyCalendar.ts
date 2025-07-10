import { Button } from '../atoms/Button';
import type { MonthlyIncomeSummary } from '../../schemas/income';

export interface MonthlyCalendarProps {
  monthlyIncome: MonthlyIncomeSummary;
  year: number;
  month: number;
}

export const MonthlyCalendar = ({
  monthlyIncome,
  year,
  month
}: MonthlyCalendarProps): string => {
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  
  const renderCalendarDays = (): string => {
    let html = '';
    
    // Empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      html += '<div class="neo-calendar-day bg-gray-100 h-24"></div>';
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const entriesForDay = monthlyIncome.entries.filter(entry => entry.date === dateString);
      const hasEntries = entriesForDay.length > 0;
      const totalHours = entriesForDay.reduce((sum, entry) => sum + entry.hoursWorked, 0);
      const totalAmount = entriesForDay.reduce((sum, entry) => sum + entry.totalAmount, 0);
      
      html += /*html*/ `
        <div class="neo-calendar-day ${hasEntries ? 'neo-success' : 'bg-white'} h-24 p-2 cursor-pointer" 
             onclick="openIncomeEntryModal('${dateString}')">
          <div class="font-black text-black text-lg mb-1">${day}</div>
          <div class="space-y-1">
            <form method="POST" action="/api/income/quick-entry" style="display: inline;">
              <input type="hidden" name="date" value="${dateString}">
              <input type="hidden" name="hours" value="8">
              ${Button({
                text: '+8H',
                type: 'submit',
                variant: 'secondary',
                size: 'sm',
                onClick: 'event.stopPropagation()',
                className: 'w-full'
              })}
            </form>
            ${hasEntries ? `
              <div class="text-xs font-black text-black">
                ${totalHours}H - €${totalAmount.toFixed(0)}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }
    
    return html;
  };

  return `
    <div class="neo-container bg-black p-1">
      <div class="bg-white">
        <div class="grid grid-cols-7 gap-1 p-2">
          ${['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => `
            <div class="neo-container neo-gray-dark text-white p-2 text-center">
              <span class="font-black">${day}</span>
            </div>
          `).join('')}
        </div>
        <div class="grid grid-cols-7 gap-1 p-2">
          ${renderCalendarDays()}
        </div>
      </div>
    </div>
  `;
};
