import React from 'react';

const TestPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-4">SplitTON Test Page</h1>
        
        <div className="space-y-4">
          <div className="p-4 bg-green-100 rounded-lg">
            <h2 className="font-bold text-green-800">✅ App is Loading</h2>
            <p className="text-green-700">React and basic components are working</p>
          </div>

          <div className="p-4 bg-blue-100 rounded-lg">
            <h2 className="font-bold text-blue-800">🔧 Environment Info</h2>
            <ul className="text-blue-700 text-sm space-y-1">
              <li>Window available: {typeof window !== 'undefined' ? '✅' : '❌'}</li>
              <li>Telegram available: {typeof window !== 'undefined' && !!window.Telegram ? '✅' : '❌'}</li>
              <li>WebApp available: {typeof window !== 'undefined' && !!window.Telegram?.WebApp ? '✅' : '❌'}</li>
              <li>User Agent: {typeof window !== 'undefined' ? window.navigator.userAgent.slice(0, 50) + '...' : 'N/A'}</li>
            </ul>
          </div>

          <div className="p-4 bg-yellow-100 rounded-lg">
            <h2 className="font-bold text-yellow-800">📱 Telegram WebApp Data</h2>
            {typeof window !== 'undefined' && window.Telegram?.WebApp ? (
              <ul className="text-yellow-700 text-sm space-y-1">
                <li>Platform: {window.Telegram.WebApp.platform || 'Unknown'}</li>
                <li>Version: {window.Telegram.WebApp.version || 'Unknown'}</li>
                <li>Color Scheme: {window.Telegram.WebApp.colorScheme || 'Unknown'}</li>
                <li>User ID: {window.Telegram.WebApp.initDataUnsafe?.user?.id || 'No user'}</li>
                <li>Username: {window.Telegram.WebApp.initDataUnsafe?.user?.username || 'No username'}</li>
              </ul>
            ) : (
              <p className="text-yellow-700">Telegram WebApp not available</p>
            )}
          </div>

          <button 
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600"
            onClick={() => {
              if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
                window.Telegram.WebApp.showAlert('Test alert from SplitTON!');
              } else {
                alert('Telegram WebApp not available');
              }
            }}
          >
            Test Telegram Alert
          </button>

          <button 
            className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600"
            onClick={() => {
              window.location.href = '/';
            }}
          >
            Go to Main App
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestPage; 