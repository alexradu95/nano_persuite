export const layout = (content: string, title: string = "Income Tracker"): string => {
  return /*html*/`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Income Tracker</title>
  <script src="https://cdn.tailwindcss.com"></script>
  
  <style>
    /* Basic form styles */
    .form-group {
      margin-bottom: 1rem;
    }
    
    .form-input {
      width: 100%;
      padding: 0.5rem;
      border: 1px solid #d1d5db;
      border-radius: 0.375rem;
      outline: none;
    }
    
    .form-input:focus {
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
    
    .btn {
      padding: 0.5rem 1rem;
      border-radius: 0.375rem;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn-primary {
      background-color: #3b82f6;
      color: white;
      border: none;
    }
    
    .btn-primary:hover {
      background-color: #2563eb;
    }
    
    .btn-danger {
      background-color: #ef4444;
      color: white;
      border: none;
    }
    
    .btn-danger:hover {
      background-color: #dc2626;
    }
  </style>
</head>
<body class="bg-gray-100 min-h-screen">
  <!-- Navigation -->
  <nav class="bg-white shadow-sm border-b">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex items-center space-x-8">
          <a href="/app/income" class="text-xl font-bold text-gray-900">Income Tracker</a>
          <div class="hidden md:flex space-x-4">
            <a href="/app/income" class="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md transition-colors">Income</a>
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

</body>
</html>`;
};