import React from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import Login from './Login';
import AudioPlayer from '../AudioPlayer';
import { LogOut, User, Volume2 } from 'lucide-react';

const AppContent = () => {
  const { authToken, user, isLoading, login, logout, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <Login onLoginSuccess={login} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header with user info and logout */}
      <div className="max-w-md mx-auto mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-gray-600" />
            <div>
              <span className="text-gray-800 font-medium">
                {user?.name || user?.email || 'User'}
              </span>
              {user?.email && user?.name && (
                <p className="text-xs text-gray-500">{user.email}</p>
              )}
            </div>
          </div>
          <button
            onClick={logout}
            className="flex items-center space-x-1 text-gray-600 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>

      {/* Audio Player Section */}
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-sm p-4 mb-4">          <div className="flex items-center space-x-2 mb-2">
            <Volume2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-800">Audio Player - Book #2</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Streaming Book #2 with full authentication support
          </p>
        </div>        {/* Audio Player - Hard coded for Book #2 */}
        <AudioPlayer
          authToken={authToken}
          autoPlay={false}
          showDownload={true}
          showBookmark={true}
          onProgressUpdate={(position, status, playbackRate) => {
            console.log('Progress update for Book #2:', { position, status, playbackRate });
          }}
        />
      </div>

      {/* Footer */}
      <div className="max-w-md mx-auto mt-6">
        <div className="text-center text-xs text-gray-500">
          <p>NextJS Audio Player v1.0</p>
          <p>Authenticated session active</p>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;
