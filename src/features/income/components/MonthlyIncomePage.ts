import { Card } from '../../../components/atoms/Card';
import { Button } from '../../../components/atoms/Button';
import { StatCard } from '../../../components/molecules/StatCard';
import { MonthlyCalendar } from '../../../components/organisms/MonthlyCalendar';
import { MonthNavigation } from './MonthNavigation';
import { IncomeEntryModal } from './IncomeEntryModal';
import type { Contract, MonthlyIncomeSummary } from '../../../schemas/income';

export interface MonthlyIncomePageProps {
  contracts: Contract[];
  monthlyIncome: MonthlyIncomeSummary;
  year: number;
  month: number;
}

export const MonthlyIncomePage = ({
  contracts,
  monthlyIncome,
  year,
  month
}: MonthlyIncomePageProps): string => {
  return `
    <div class="income-tracker space-y-8">
      ${MonthNavigation({ year, month })}
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        ${StatCard({
          title: 'MONTHLY SUMMARY',
          icon: '',
          value: `${monthlyIncome.totalHours}H - €${monthlyIncome.totalAmount.toFixed(2)}`,
          variant: 'light'
        })}
        
        ${StatCard({
          title: 'QUICK STATS',
          icon: '',
          value: `${monthlyIncome.entries.length} entries`,
          variant: 'medium'
        })}
      </div>
      
      ${Card({
        variant: 'white',
        children: `
          <h3 class="neo-title text-2xl text-black mb-6"> DAILY INCOME ENTRIES</h3>
          ${MonthlyCalendar({ monthlyIncome, year, month })}
        `
      })}
      
      ${IncomeEntryModal({ contracts })}
    </div>
    
    <script>
      ${getPageScripts()}
    </script>
  `;
};

const getPageScripts = (): string => {
  return `
    function openIncomeEntryModal(date) {
      document.getElementById('income-entry-date').value = date;
      document.getElementById('income-entry-modal').style.display = 'block';
    }
    
    function closeIncomeEntryModal() {
      document.getElementById('income-entry-modal').style.display = 'none';
    }
  `;
};