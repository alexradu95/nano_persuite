export const layout = (content: string, title: string = "Income Tracker", activePage: string = ""): string => {
  return /*html*/`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Income Tracker</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  
  <style>
    /* Neo-Brutalist Design System - Serious Palette */
    :root {
      --neo-black: #000000;
      --neo-white: #ffffff;
      --neo-gray-light: #f5f5f5;
      --neo-gray-medium: #e0e0e0;
      --neo-gray-dark: #333333;
      --neo-accent: #4a4a4a;
      --neo-primary: #d4d4d4;
      --neo-secondary: #b8b8b8;
      --neo-success: #c8e6c9;
      --neo-danger: #ffcdd2;
      --neo-warning: #fff3cd;
      --neo-info: #d1ecf1;
      --neo-shadow: 4px 4px 0px var(--neo-black);
      --neo-shadow-hover: 6px 6px 0px var(--neo-black);
    }
    
    * {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    
    .neo-container {
      border: 4px solid var(--neo-black);
      box-shadow: var(--neo-shadow);
      transition: all 0.1s ease;
    }
    
    .neo-container:hover {
      box-shadow: var(--neo-shadow-hover);
      transform: translate(-2px, -2px);
    }
    
    .neo-btn {
      border: 3px solid var(--neo-black);
      box-shadow: 3px 3px 0px var(--neo-black);
      transition: all 0.1s ease;
      text-transform: uppercase;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    
    .neo-btn:hover {
      box-shadow: 5px 5px 0px var(--neo-black);
      transform: translate(-2px, -2px);
    }
    
    .neo-btn:active {
      box-shadow: 1px 1px 0px var(--neo-black);
      transform: translate(2px, 2px);
    }
    
    .neo-input {
      border: 3px solid var(--neo-black);
      box-shadow: inset 2px 2px 0px rgba(0,0,0,0.2);
      transition: all 0.1s ease;
    }
    
    .neo-input:focus {
      outline: none;
      box-shadow: inset 2px 2px 0px rgba(0,0,0,0.2), 0 0 0 3px var(--neo-yellow);
    }
    
    .neo-card {
      border: 4px solid var(--neo-black);
      box-shadow: 6px 6px 0px var(--neo-black);
      position: relative;
    }
    
    .neo-title {
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1px;
      text-shadow: 2px 2px 0px var(--neo-black);
    }
    
    .neo-gradient-bg {
      background: var(--neo-gray-light);
    }
    
    .neo-stripes {
      background: repeating-linear-gradient(
        45deg,
        var(--neo-black),
        var(--neo-black) 2px,
        var(--neo-white) 2px,
        var(--neo-white) 8px
      );
    }
    
    .neo-calendar-day {
      border: 2px solid var(--neo-black);
      transition: all 0.1s ease;
      position: relative;
    }
    
    .neo-calendar-day:hover {
      box-shadow: 3px 3px 0px var(--neo-black);
      transform: translate(-1px, -1px);
    }
    
    .neo-modal {
      border: 6px solid var(--neo-black);
      box-shadow: 10px 10px 0px var(--neo-black);
    }
    
    /* Color variants */
    .neo-primary { background-color: var(--neo-primary); }
    .neo-secondary { background-color: var(--neo-secondary); }
    .neo-accent { background-color: var(--neo-accent); }
    .neo-danger { background-color: var(--neo-danger); }
    .neo-success { background-color: var(--neo-success); }
    .neo-info { background-color: var(--neo-info); }
    .neo-warning { background-color: var(--neo-warning); }
    .neo-gray-light { background-color: var(--neo-gray-light); }
    .neo-gray-medium { background-color: var(--neo-gray-medium); }
    .neo-gray-dark { background-color: var(--neo-gray-dark); }
    
    .neo-text-outline {
      -webkit-text-stroke: 2px var(--neo-black);
      text-stroke: 2px var(--neo-black);
    }
    
    /* Sidebar styles */
    .sidebar-nav-item {
      transition: all 0.1s ease;
    }
    
    .sidebar-nav-item:hover {
      transform: translate(-2px, -2px);
      box-shadow: 4px 4px 0px var(--neo-black);
    }
    
    .sidebar-nav-item.active {
      background-color: var(--neo-gray-dark);
      color: white;
      box-shadow: 3px 3px 0px var(--neo-black);
    }
    
    .sidebar-tab {
      border-left: 4px solid transparent;
      transition: all 0.1s ease;
    }
    
    .sidebar-tab:hover {
      border-left-color: var(--neo-black);
      background-color: var(--neo-gray-light);
    }
    
    .sidebar-tab.active {
      border-left-color: var(--neo-black);
      background-color: var(--neo-gray-medium);
      font-weight: 800;
    }
  </style>
</head>
<body class="bg-white min-h-screen neo-gradient-bg">
  <div class="flex h-screen">
    <!-- Sidebar -->
    <aside class="w-80 bg-white neo-container m-4 mr-0">
      <div class="p-6">
        <!-- Logo -->
        <div class="mb-8">
          <h1 class="neo-title text-2xl text-black">💰 INCOME TRACKER</h1>
          <div class="neo-stripes h-1 w-full mt-2"></div>
        </div>
        
        <!-- User Info -->
        <div class="mb-8">
          <div class="neo-container neo-gray-medium px-4 py-2">
            <span class="font-black text-black uppercase tracking-wide text-sm">👤 USER</span>
          </div>
        </div>
        
        <!-- Navigation -->
        <nav class="space-y-2">
          <div class="mb-6">
            <div class="sidebar-nav-item neo-container bg-white p-3 mb-2 ${activePage.startsWith('income') ? 'active' : ''}">
              <span class="font-black text-sm uppercase tracking-wide">📊 Income Tracker</span>
            </div>
            
            <!-- Income Tracker Submenu -->
            <div class="ml-4 space-y-1">
              <a href="/app/income/monthly" class="sidebar-tab block p-2 text-sm font-bold uppercase ${activePage === 'income-monthly' ? 'active' : ''}">
                📅 Monthly Income Entries
              </a>
              <a href="/app/income/dashboard" class="sidebar-tab block p-2 text-sm font-bold uppercase ${activePage === 'income-dashboard' ? 'active' : ''}">
                📈 Dashboard
              </a>
              <a href="/app/income/contracts" class="sidebar-tab block p-2 text-sm font-bold uppercase ${activePage === 'income-contracts' ? 'active' : ''}">
                📋 Contracts Configurator
              </a>
              <a href="/app/income/taxes" class="sidebar-tab block p-2 text-sm font-bold uppercase ${activePage === 'income-taxes' ? 'active' : ''}">
                🧾 Taxes Configurator
              </a>
            </div>
          </div>
        </nav>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 p-4 pl-0 overflow-auto">
      <div class="mb-6">
        <div class="neo-card bg-white p-6">
          <h1 class="neo-title text-3xl text-black mb-2">${title}</h1>
          <div class="neo-stripes h-2 w-full"></div>
        </div>
      </div>
      
      <div class="neo-card bg-white p-6">
        ${content}
      </div>
    </main>
  </div>

</body>
</html>`;
};