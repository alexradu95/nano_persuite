const renderIncomeTabNavigation = (activePage: string): string => {
  const tabs = [
    { id: 'income-monthly', label: '📅 Monthly', href: '/app/income/monthly' },
    { id: 'income-dashboard', label: '📈 Dashboard', href: '/app/income/dashboard' },
    { id: 'income-contracts', label: '📋 Contracts', href: '/app/income/contracts' },
    { id: 'income-taxes', label: '🧾 Taxes', href: '/app/income/taxes' }
  ];

  return `
    <div class="income-tabs">
      ${tabs.map(tab => `
        <a href="${tab.href}" class="income-tab px-6 py-3 text-sm font-black uppercase bg-white ${activePage === tab.id ? 'active' : ''}">
          ${tab.label}
        </a>
      `).join('')}
    </div>
  `;
};

export const layout = (content: string, title: string = "Income Tracker", activePage: string = ""): string => {
  return /*html*/`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Income Tracker</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
  <meta name="view-transition" content="same-origin">
  
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
      text-shadow: 1px 1px 0px var(--neo-black);
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
    
    /* View Transition API Styles */
    @view-transition {
      navigation: auto;
    }
    
    /* Fallback for browsers without view transition support */
    @media (prefers-reduced-motion: reduce) {
      ::view-transition-group(*),
      ::view-transition-old(*),
      ::view-transition-new(*) {
        animation-duration: 0.01ms !important;
        animation-delay: 0s !important;
        animation-iteration-count: 1 !important;
      }
    }
    
    /* Transition names for key elements */
    main {
      view-transition-name: main-content;
    }
    
    aside {
      view-transition-name: sidebar-content;
    }
    
    /* Custom transition animations - elegant fade only */
    ::view-transition-old(main-content) {
      animation: fade-out 0.15s ease-out;
    }
    
    ::view-transition-new(main-content) {
      animation: fade-in 0.2s ease-out;
    }
    
    ::view-transition-old(sidebar-content) {
      animation: fade-out 0.1s ease-out;
    }
    
    ::view-transition-new(sidebar-content) {
      animation: fade-in 0.15s ease-out;
    }
    
    /* Root transition for overall page change */
    ::view-transition-old(root) {
      animation: fade-out 0.12s ease-out;
    }
    
    ::view-transition-new(root) {
      animation: fade-in 0.18s ease-out;
    }
    
    @keyframes fade-out {
      from {
        opacity: 1;
      }
      to {
        opacity: 0;
      }
    }
    
    @keyframes fade-in {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    
    /* Horizontal tabs styling */
    .income-tabs {
      border-bottom: 4px solid var(--neo-black);
      display: flex;
      position: sticky;
      top: 0;
      background: white;
      z-index: 100;
      flex-shrink: 0;
    }
    
    .income-tab {
      border: 3px solid var(--neo-black);
      border-bottom: none;
      box-shadow: 2px 0px 0px var(--neo-black);
      transition: all 0.1s ease;
      margin-right: -3px;
    }
    
    .income-tab:hover {
      background-color: var(--neo-gray-light);
    }
    
    .income-tab.active {
      background-color: var(--neo-gray-medium);
      font-weight: 900;
      border-bottom: 4px solid var(--neo-gray-medium);
      margin-bottom: -4px;
      z-index: 10;
      position: relative;
    }
    
    .income-tab:first-child {
      border-top-left-radius: 0;
    }
    
    .income-tab:last-child {
      border-top-right-radius: 0;
      margin-right: 0;
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
          </div>
        </nav>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 p-4 pl-0 flex flex-col h-screen">
      <div class="mb-6 flex-shrink-0">
        <div class="neo-card bg-white p-6">
          <h1 class="neo-title text-3xl text-black mb-2">${title}</h1>
          <div class="neo-stripes h-2 w-full"></div>
        </div>
      </div>
      
      <div class="neo-card bg-white flex flex-col flex-1 min-h-0">
        ${activePage.startsWith('income') ? renderIncomeTabNavigation(activePage) : ''}
        <div class="p-6 flex-1 overflow-auto">
          ${content}
        </div>
      </div>
    </main>
  </div>

  <script>
    // Enhanced navigation with View Transition API for MPAs
    function initViewTransitions() {
      // Check if View Transition API is supported
      if (!document.startViewTransition) {
        console.log('View Transition API not supported, falling back to normal navigation');
        return;
      }
      
      console.log('View Transition API supported - initializing...');
      
      // Intercept navigation links
      document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (!link) return;
        
        // Only intercept internal app links
        if (!link.href.includes('/app/')) return;
        
        // Skip if it's a different origin
        if (link.origin !== window.location.origin) return;
        
        // Skip if it's the same page
        if (link.href === window.location.href) return;
        
        // Skip if it has target="_blank" or similar
        if (link.target && link.target !== '_self') return;
        
        // Skip if it's a modifier key click
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        
        e.preventDefault();
        
        console.log('Starting view transition to:', link.href);
        
        // Start view transition with proper MPA navigation
        document.startViewTransition(async () => {
          try {
            // Fetch the new page
            const response = await fetch(link.href);
            if (!response.ok) {
              throw new Error(\`HTTP error! status: \${response.status}\`);
            }
            
            const html = await response.text();
            
            // Parse the new HTML
            const parser = new DOMParser();
            const newDoc = parser.parseFromString(html, 'text/html');
            
            // Update the document title
            document.title = newDoc.title;
            
            // Update the main content area
            const currentMain = document.querySelector('main');
            const newMain = newDoc.querySelector('main');
            if (currentMain && newMain) {
              currentMain.innerHTML = newMain.innerHTML;
            }
            
            // Update the sidebar active state
            const currentSidebar = document.querySelector('aside');
            const newSidebar = newDoc.querySelector('aside');
            if (currentSidebar && newSidebar) {
              currentSidebar.innerHTML = newSidebar.innerHTML;
            }
            
            // Update the URL
            window.history.pushState({}, '', link.href);
            
            // Re-initialize any JavaScript that might be needed
            initPageScripts();
            
            console.log('View transition completed successfully');
          } catch (error) {
            console.error('View transition failed:', error);
            // Fallback to normal navigation
            window.location.href = link.href;
          }
        });
      });
    }
    
    // Initialize page-specific scripts
    function initPageScripts() {
      // Re-run any inline scripts that might be in the new content
      const scripts = document.querySelectorAll('main script, aside script');
      scripts.forEach(script => {
        if (script.innerHTML) {
          try {
            eval(script.innerHTML);
          } catch (e) {
            console.warn('Failed to execute inline script:', e);
          }
        }
      });
    }
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initViewTransitions);
    } else {
      initViewTransitions();
    }
    
    // Add progressive enhancement for browsers that support it
    if (document.startViewTransition) {
      document.documentElement.classList.add('view-transitions-supported');
    }
  </script>

</body>
</html>`;
};