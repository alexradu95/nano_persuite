export const layout = (content: string, title: string = "Personal Dashboard"): string => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Personal Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/htmx.org@1.9.2"></script>
  <script src="https://unpkg.com/htmx.org@1.9.2/dist/ext/json-enc.js"></script>
  
  <!-- HTMX Configuration -->
  <script>
    // Global HTMX configuration
    htmx.config.globalViewTransitions = true;
    htmx.config.requestClass = 'htmx-request';
    htmx.config.indicatorClass = 'htmx-indicator';
    
    // Global event handlers
    document.addEventListener('htmx:afterRequest', function(event) {
      if (event.detail.xhr.status >= 400) {
        console.error('Request failed:', event.detail.xhr.responseText);
        // Show error notification
        showNotification('Request failed. Please try again.', 'error');
      } else if (event.detail.xhr.status >= 200 && event.detail.xhr.status < 300) {
        // Show success notification for form submissions
        if (event.detail.requestConfig.verb === 'post') {
          showNotification('Action completed successfully!', 'success');
        }
      }
    });
    
    document.addEventListener('htmx:beforeRequest', function(event) {
      console.log('HTMX Request:', event.detail.pathInfo.requestPath);
    });
    
    document.addEventListener('htmx:responseError', function(event) {
      console.error('HTMX Response Error:', event.detail);
      showNotification('Connection error. Please check your internet connection.', 'error');
    });
    
    // Simple notification system
    function showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.className = `fixed top-4 right-4 px-4 py-2 rounded-lg text-white z-50 ${
        type === 'error' ? 'bg-red-500' : 
        type === 'success' ? 'bg-green-500' : 
        'bg-blue-500'
      }`;
      notification.textContent = message;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 3000);
    }
  </script>
  
  <style>
    /* HTMX Loading States */
    .htmx-indicator {
      display: none;
    }
    .htmx-request .htmx-indicator {
      display: inline;
    }
    .htmx-request.htmx-indicator {
      display: inline;
    }
    
    /* Loading spinner */
    .htmx-request {
      position: relative;
    }
    
    .htmx-request::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 20px;
      height: 20px;
      margin: -10px 0 0 -10px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      z-index: 1000;
    }
    
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    
    /* Smooth transitions */
    .htmx-settling {
      transition: all 0.3s ease;
    }
    
    .htmx-swapping {
      opacity: 0.5;
      transition: opacity 0.3s ease;
    }
  </style>
</head>
<body class="bg-gray-100 min-h-screen">
  <!-- Navigation -->
  <nav class="bg-white shadow-sm border-b">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center space-x-8">
          <a href="/app/dashboard" 
             hx-get="/app/dashboard" 
             hx-target="main" 
             hx-push-url="true"
             class="text-xl font-bold text-gray-900">Personal Dashboard</a>
          <div class="hidden md:flex space-x-4">
            <a href="/app/dashboard" 
               hx-get="/app/dashboard" 
               hx-target="main" 
               hx-push-url="true"
               class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md transition-colors">Dashboard</a>
            <a href="/app/finance" 
               hx-get="/app/finance" 
               hx-target="main" 
               hx-push-url="true"
               class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md transition-colors">Finance</a>
            <a href="/app/tasks" 
               hx-get="/app/tasks" 
               hx-target="main" 
               hx-push-url="true"
               class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md transition-colors">Tasks</a>
          </div>
        </div>
        
        <div class="flex items-center">
          <span class="text-sm text-gray-600">Welcome, User</span>
        </div>
      </div>
    </div>
  </nav>

  <!-- Main Content -->
  <main class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">${title}</h1>
    </div>
    
    ${content}
  </main>

  <!-- Global Loading Indicator -->
  <div id="global-loading" class="htmx-indicator fixed top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg z-50">
    <div class="flex items-center space-x-2">
      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
      <span>Loading...</span>
    </div>
  </div>

  <!-- Server-Sent Events for real-time updates -->
  <script>
    // Initialize SSE connection
    let eventSource = null;
    let reconnectTimeout = null;
    
    function connectSSE() {
      if (eventSource) {
        eventSource.close();
      }
      
      eventSource = new EventSource('/events');
      
      eventSource.onopen = function() {
        console.log('SSE connected');
        clearTimeout(reconnectTimeout);
      };
      
      eventSource.onmessage = function(event) {
        try {
          const data = JSON.parse(event.data);
          console.log('SSE received:', data);
          
          // Handle different event types
          if (data.type === 'connected') {
            console.log('SSE connection established');
            return;
          }
          
          if (data.type === 'heartbeat') {
            return; // Ignore heartbeat messages
          }
          
          // Handle data updates
          if (data.table === 'transactions') {
            const transactionsList = document.getElementById('transactions-list');
            if (transactionsList) {
              // Refresh the transactions list
              htmx.ajax('GET', '/api/finance/transactions', {
                target: '#transactions-list',
                swap: 'innerHTML'
              });
            }
          }
          
          if (data.table === 'tasks') {
            const tasksContainer = document.getElementById('tasks-container');
            if (tasksContainer) {
              // Refresh the tasks container
              htmx.ajax('GET', '/api/tasks/refresh', {
                target: '#tasks-container',
                swap: 'innerHTML'
              });
            }
          }
          
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };
      
      eventSource.onerror = function(event) {
        console.error('SSE error:', event);
        
        // Reconnect after 5 seconds
        clearTimeout(reconnectTimeout);
        reconnectTimeout = setTimeout(connectSSE, 5000);
      };
    }
    
    // Connect when page loads
    document.addEventListener('DOMContentLoaded', connectSSE);
    
    // Reconnect when page becomes visible (for mobile/tab switching)
    document.addEventListener('visibilitychange', function() {
      if (!document.hidden && (!eventSource || eventSource.readyState === EventSource.CLOSED)) {
        connectSSE();
      }
    });
  </script>
</body>
</html>`;
};