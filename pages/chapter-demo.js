import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import Login from '../components/Login';
import ChapterPlayer from '../components/ChapterPlayer';
import AudioPlayer from '../AudioPlayer';
import { BookOpen, User, LogOut, Play, Pause } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000';

// Sample chapters data - in a real app, this would come from your API
const SAMPLE_CHAPTERS = [
  {
    id: 1,
    number: 1,
    title: "Introduction to the Story",
    description: "Setting the scene and introducing main characters",
    duration: 1200, // 20 minutes
  },
  {
    id: 2,
    number: 2,
    title: "The Journey Begins",
    description: "Our protagonist starts their adventure",
    duration: 1800, // 30 minutes
  },
  {
    id: 3,
    number: 3,
    title: "First Challenges",
    description: "Obstacles arise and conflicts emerge",
    duration: 1500, // 25 minutes
  },
  {
    id: 4,
    number: 4,
    title: "Meeting New Allies",
    description: "Important characters are introduced",
    duration: 2100, // 35 minutes
  },
  {
    id: 5,
    number: 5,
    title: "The Plot Thickens",
    description: "Mysteries deepen and tension rises",
    duration: 1650, // 27 minutes
  },
];

const ChapterDemoContent = () => {
  const { authToken, user, isLoading, logout, isAuthenticated } = useAuth();
  const [selectedBook, setSelectedBook] = useState({ id: 1, title: "Sample Book" });
  const [playerMode, setPlayerMode] = useState('chapter'); // 'chapter' or 'individual'
  const [selectedChapterId, setSelectedChapterId] = useState(null);

  const handleProgressUpdate = (position, status, playbackRate, chapter) => {
    console.log('Chapter Progress Update:', {
      chapterId: chapter?.id,
      chapterTitle: chapter?.title,
      position,
      status,
      playbackRate,
      timestamp: new Date().toISOString()
    });
    
    // Here you could save progress to your app's state management
    // or sync with additional analytics services
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <BookOpen className="w-16 h-16 text-blue-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Chapter Player Demo</h1>
            <p className="text-gray-600">Please log in to access the chapter streaming player</p>
          </div>
          <Login />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Chapter Player Demo</h1>
                <p className="text-sm text-gray-500">Streaming with Chapter Endpoints</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{user?.email || user?.name || 'User'}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mode Selection */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Player Mode</h2>
            <div className="flex space-x-4">
              <button
                onClick={() => setPlayerMode('chapter')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  playerMode === 'chapter'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Chapter Player (with Selection)
              </button>
              <button
                onClick={() => setPlayerMode('individual')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  playerMode === 'individual'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Individual Chapter Player
              </button>
            </div>
          </div>
        </div>

        {/* Chapter Player Mode */}
        {playerMode === 'chapter' && (
          <div className="mb-8">
            <ChapterPlayer
              authToken={authToken}
              bookId={selectedBook.id}
              chapters={SAMPLE_CHAPTERS}
              onProgressUpdate={handleProgressUpdate}
              autoPlay={false}
              className="shadow-lg"
            />
          </div>
        )}

        {/* Individual Chapter Player Mode */}
        {playerMode === 'individual' && (
          <div className="space-y-6">
            {/* Chapter Selection */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Individual Chapter</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {SAMPLE_CHAPTERS.map((chapter) => (
                  <button
                    key={chapter.id}
                    onClick={() => setSelectedChapterId(chapter.id)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedChapterId === chapter.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        selectedChapterId === chapter.id
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {chapter.number}
                      </div>
                      <h3 className="font-medium text-gray-900">{chapter.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{chapter.description}</p>
                    <p className="text-xs text-gray-500">
                      Duration: {Math.floor(chapter.duration / 60)}:{(chapter.duration % 60).toString().padStart(2, '0')}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Individual Audio Player */}
            {selectedChapterId && (
              <div className="bg-white rounded-lg shadow-lg border">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Now Playing: {SAMPLE_CHAPTERS.find(c => c.id === selectedChapterId)?.title}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">
                    {SAMPLE_CHAPTERS.find(c => c.id === selectedChapterId)?.description}
                  </p>
                </div>
                <div className="p-6">
                  <AudioPlayer
                    chapterId={selectedChapterId}
                    authToken={authToken}
                    apiBaseUrl={API_BASE_URL}
                    autoPlay={false}
                    showDownload={true}
                    showBookmark={true}
                    onProgressUpdate={(position, status, playbackRate) => {
                      const chapter = SAMPLE_CHAPTERS.find(c => c.id === selectedChapterId);
                      handleProgressUpdate(position, status, playbackRate, chapter);
                    }}
                    className="bg-gray-50 rounded-lg"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* API Endpoints Information */}
        <div className="mt-12 bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Chapter Streaming Endpoints</h2>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Audio Streaming</h3>
              <code className="text-sm text-blue-600 bg-white px-2 py-1 rounded border">
                GET /audioStreaming/chapters/{`{chapterId}`}/audio
              </code>
              <p className="text-sm text-gray-600 mt-2">
                Streams audio content for the specified chapter with authentication.
              </p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium text-gray-900 mb-2">Progress Tracking</h3>
              <div className="space-y-2">
                <div>
                  <code className="text-sm text-blue-600 bg-white px-2 py-1 rounded border">
                    GET /audioStreaming/chapters/{`{chapterId}`}/progress
                  </code>
                  <p className="text-sm text-gray-600 mt-1">Get current progress for a chapter.</p>
                </div>
                <div>
                  <code className="text-sm text-blue-600 bg-white px-2 py-1 rounded border">
                    POST /audioStreaming/chapters/{`{chapterId}`}/progress
                  </code>
                  <p className="text-sm text-gray-600 mt-1">Update progress for a chapter.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">How to Use</h2>
          <div className="space-y-3 text-sm text-blue-800">
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-medium mt-0.5">1</div>
              <p><strong>Chapter Player Mode:</strong> Use the integrated chapter selection with automatic progress tracking across all chapters.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-medium mt-0.5">2</div>
              <p><strong>Individual Chapter Mode:</strong> Select specific chapters and play them with dedicated AudioPlayer instances.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-medium mt-0.5">3</div>
              <p><strong>Progress Tracking:</strong> All progress is automatically saved using the chapter-specific endpoints.</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-medium mt-0.5">4</div>
              <p><strong>Resume Functionality:</strong> Players will show resume buttons for partially completed chapters.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ChapterDemo = () => {
  return (
    <AuthProvider>
      <ChapterDemoContent />
    </AuthProvider>
  );
};

export default ChapterDemo;
