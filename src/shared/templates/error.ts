export const renderErrorMessage = (message: string): string => {
  return `
    <div class="bg-red-50 p-6 rounded-lg">
      <h2 class="text-red-800 font-semibold">Error</h2>
      <p class="text-red-600">${message}</p>
    </div>
  `;
};