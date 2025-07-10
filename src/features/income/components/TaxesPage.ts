export const TaxesPage = (): string => {
  return `
    <div class="space-y-6">
      
      <div class="neo-card neo-warning p-6">
        <div class="flex items-center space-x-3">
          <span class="text-2xl"></span>
          <div>
            <h3 class="font-black text-black uppercase">COMING SOON</h3>
            <p class="font-medium text-black">Tax configuration and calculation features will be available in a future update.</p>
          </div>
        </div>
      </div>
      
      <div class="neo-card bg-white p-6">
        <h3 class="neo-title text-xl text-black mb-4">PLANNED FEATURES</h3>
        <div class="space-y-3">
          <div class="neo-container neo-gray-light p-3">
            <span class="font-black text-black uppercase">• Tax Rate Configuration</span>
          </div>
          <div class="neo-container neo-gray-light p-3">
            <span class="font-black text-black uppercase">• Automatic Tax Calculations</span>
          </div>
          <div class="neo-container neo-gray-light p-3">
            <span class="font-black text-black uppercase">• Tax Reports Generation</span>
          </div>
          <div class="neo-container neo-gray-light p-3">
            <span class="font-black text-black uppercase">• Quarterly Tax Estimates</span>
          </div>
        </div>
      </div>
    </div>
  `;
};