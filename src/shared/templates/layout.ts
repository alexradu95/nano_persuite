export const layout = (content: string, title: string = "Personal Dashboard"): string => {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Personal Dashboard</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/htmx.org@1.9.2"></script>
  
  <!-- HTMZ - 166 bytes of magic -->
  <script>
    document.addEventListener('htmx:afterRequest', function(event) {
      if (event.detail.xhr.status >= 400) {
        console.error('Request failed:', event.detail.xhr.responseText);
      }
    });
  </script>
  
  <style>
    .htmx-indicator {
      display: none;
    }
    .htmx-request .htmx-indicator {
      display: inline;
    }
    .htmx-request.htmx-indicator {
      display: inline;
    }
  </style>
</head>
<body class="bg-gray-100 min-h-screen">
  <!-- Navigation -->
  <nav class="bg-white shadow-sm border-b">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center space-x-8">
          <a href="/app/dashboard" class="text-xl font-bold text-gray-900">Personal Dashboard</a>
          <div class="hidden md:flex space-x-4">
            <a href="/app/dashboard" class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md">Dashboard</a>
            <a href="/app/finance" class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md">Finance</a>
            <a href="/app/tasks" class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md">Tasks</a>
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

  <!-- Loading Indicator -->
  <div id="loading" class="htmx-indicator fixed top-4 right-4 bg-blue-500 text-white px-4 py-2 rounded-lg">
    Loading...
  </div>

  <!-- Server-Sent Events for real-time updates -->
  <script>
    const eventSource = new EventSource('/events');
    
    eventSource.onmessage = function(event) {
      const data = JSON.parse(event.data);
      console.log('SSE received:', data);
      
      // Refresh relevant sections based on data.table
      if (data.table === 'transactions' && document.getElementById('transactions-list')) {
        htmx.trigger('#transactions-list', 'refresh');
      }
      
      if (data.table === 'tasks' && document.getElementById('tasks-container')) {
        htmx.trigger('#tasks-container', 'refresh');
      }
    };
    
    eventSource.onerror = function(event) {
      console.error('SSE error:', event);
    };
  </script>
</body>
</html>`;
};