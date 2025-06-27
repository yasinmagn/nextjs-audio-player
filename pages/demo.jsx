import { useState, useEffect } from 'react';
import AudioPlayer from '../AudioPlayer';

/**
 * Demo page showing how to use the AudioPlayer component
 * Note: AudioPlayer is hard-coded to stream only Book #2
 */
export default function AudioPlayerDemo() {
  const [authToken, setAuthToken] = useState('');
  const [apiBaseUrl, setApiBaseUrl] = useState('http://localhost:10000');
  const [progressLog, setProgressLog] = useState([]);
  // Demo authentication (replace with your actual auth logic)
  useEffect(() => {
    // Get auth token from localStorage or your auth provider
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('authToken') || 'demo-token';
      setAuthToken(token);
    }
  }, []);
  const handleProgressUpdate = (position, status, playbackRate) => {
    const logEntry = {
      timestamp: new Date().toLocaleTimeString(),
      position: Math.floor(position),
      status,
      playbackRate
    };
    setProgressLog(prev => [logEntry, ...prev.slice(0, 9)]); // Keep last 10 entries
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-center mb-8">
          NextJS Audio Player Demo
        </h1>
        
        {/* Hard-coded Book Notice */}
        <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-8">
          <h3 className="font-semibold mb-2">📖 Hard-coded for Book #2</h3>
          <p>This audio player is configured to stream only <strong>Book #2</strong> from the <code>/books/2/audio</code> endpoint.</p>
        </div>

        {/* Configuration Panel */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Player Configuration</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* API Settings */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Base URL
              </label>
              <input
                type="text"
                value={apiBaseUrl}
                onChange={(e) => setApiBaseUrl(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="http://localhost:10000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auth Token
              </label>
              <input
                type="text"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Your JWT token"
              />
            </div>
          </div>
        </div>

        {/* Audio Player */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Audio Player - Book #2</h2>
          {authToken ? (
            <AudioPlayer 
              authToken={authToken}
              apiBaseUrl={apiBaseUrl}
              onProgressUpdate={handleProgressUpdate}
              autoPlay={false}
              showDownload={true}
              showBookmark={true}
            />          ) : (
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
              Please provide an auth token to play Book #2.
            </div>
          )}
        </div>

        {/* Progress Log */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Progress Log</h2>
          {progressLog.length > 0 ? (
            <div className="space-y-2">
              {progressLog.map((entry, index) => (
                <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-50 rounded">
                  <span className="text-sm text-gray-600">{entry.timestamp}</span>
                  <span className="text-sm">Position: {entry.position}s</span>
                  <span className="text-sm">Status: {entry.status}</span>
                  <span className="text-sm">Speed: {entry.playbackRate}x</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No progress updates yet. Start playing to see progress tracking.</p>
          )}
        </div>        {/* API Endpoints Reference */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">API Endpoints Used (Hard-coded Book #2)</h2>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded">
              <h3 className="font-medium text-blue-900">Book #2 Audio Streaming</h3>
              <code className="text-sm text-blue-700">
                GET {apiBaseUrl}/books/2/audio
              </code>
            </div>
            <div className="p-3 bg-purple-50 rounded">
              <h3 className="font-medium text-purple-900">Book #2 Progress Tracking</h3>
              <code className="text-sm text-purple-700">
                POST {apiBaseUrl}/booksManagement/audio/2/progress
              </code>
            </div>
          </div>
        </div>

        {/* Mobile Testing Guide */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">📱 Mobile Testing</h2>
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-4">
              This player is optimized for mobile devices. Test on:
            </p>
            <ul className="list-disc pl-6 space-y-1 text-gray-600">
              <li><strong>iOS Safari:</strong> Native AVPlayer support for audio/mp4 and audio/mpeg</li>
              <li><strong>Android Chrome:</strong> Native MediaPlayer support for audio/aac and audio/mpeg</li>
              <li><strong>React Native:</strong> Compatible with expo-av and react-native-track-player</li>
            </ul>
            <div className="mt-4 p-4 bg-blue-50 rounded">
              <h4 className="font-medium text-blue-900 mb-2">Test Features:</h4>
              <ul className="list-disc pl-6 space-y-1 text-blue-700 text-sm">
                <li>HTTP Range requests for seeking</li>
                <li>Automatic progress tracking every 30 seconds</li>
                <li>Playback speed controls (0.5x to 2x)</li>
                <li>Volume controls</li>
                <li>Bookmark functionality</li>
                <li>Download for offline listening</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
