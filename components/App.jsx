import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import Login from './Login';
import AudioPlayer from '../AudioPlayer';
import ChapterPlayer from './ChapterPlayer';
import { LogOut, User, Volume2, BookOpen, List } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000';

const AppContent = () => {
  const { authToken, user, isLoading, login, logout, isAuthenticated } = useAuth();
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [booksError, setBooksError] = useState(null);
  const [viewMode, setViewMode] = useState('book'); // 'book' or 'chapter'
  
  // Book chapters state
  const [chapters, setChapters] = useState([]);
  const [loadingChapters, setLoadingChapters] = useState(false);
  const [chaptersError, setChaptersError] = useState(null);
  
  // Book introduction progress state
  const [introProgress, setIntroProgress] = useState(null);
  const [loadingIntro, setLoadingIntro] = useState(false);
  const [introError, setIntroError] = useState(null);
  // Chapter progress state
  const [chapterProgress, setChapterProgress] = useState(null);
  const [loadingChapterProgress, setLoadingChapterProgress] = useState(false);
  const [chapterProgressError, setChapterProgressError] = useState(null);

  useEffect(() => {
    if (isAuthenticated && authToken) {
      fetchBooks();
    }
    // eslint-disable-next-line
  }, [isAuthenticated, authToken]);

  // Load chapters when a book is selected
  useEffect(() => {
    if (selectedBook && authToken && viewMode === 'chapter') {
      fetchChapters(selectedBook);
    }
  }, [selectedBook, authToken, viewMode]);

  const fetchBooks = async () => {
    setLoadingBooks(true);
    setBooksError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/booksManagement/books`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const booksData = await response.json();
      // Normalize books: add id property for UI compatibility
      const booksArr = Array.isArray(booksData.books) ? booksData.books.map(book => ({ ...book, id: book.book_id })) : [];
      setBooks(booksArr);
    } catch (error) {
      setBooksError(error.message);
      setBooks([]); // Defensive: set to empty array on error
    } finally {
      setLoadingBooks(false);
    }
  };

  // Get streamUrl for selected chapter
  let streamUrl = null;
  if (selectedBook && selectedChapter) {
    const chapter = (selectedBook.chapters || []).find(c => c.chapter_id === selectedChapter.chapter_id);
    if (chapter && chapter.api_endpoints && chapter.api_endpoints.stream_chapter) {
      streamUrl = `${API_BASE_URL}${chapter.api_endpoints.stream_chapter}`;
    }
  }

  // Fetch book introduction progress
  const fetchIntroProgress = async (book) => {
    if (!book) return;
    setLoadingIntro(true);
    setIntroError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/audioStreaming/bookintro/${book.id}/progress`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const progressData = await response.json();
      setIntroProgress(progressData);
    } catch (error) {
      setIntroError(error.message);
      setIntroProgress(null);
    } finally {
      setLoadingIntro(false);
    }
  };

  // Update book introduction progress
  const updateIntroProgress = async (book, position) => {
    if (!book) return;
    try {
      await fetch(`${API_BASE_URL}/audioStreaming/bookintro/${book.id}/progress`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ position }),
      });
    } catch (error) {
      // Optionally handle error
    }
  };

  // Fetch chapter progress
  const fetchChapterProgress = async (chapter) => {
    if (!chapter || !chapter.api_endpoints?.get_progress) return;
    setLoadingChapterProgress(true);
    setChapterProgressError(null);
    try {
      const response = await fetch(`${API_BASE_URL}${chapter.api_endpoints.get_progress}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      const progressData = await response.json();
      setChapterProgress(progressData);
    } catch (error) {
      setChapterProgressError(error.message);
      setChapterProgress(null);
    } finally {
      setLoadingChapterProgress(false);
    }
  };

  // Update chapter progress
  const updateChapterProgress = async (chapter, position) => {
    if (!chapter || !chapter.api_endpoints?.update_progress) return;
    try {
      await fetch(`${API_BASE_URL}${chapter.api_endpoints.update_progress}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ position }),
      });
    } catch (error) {
      // Optionally handle error
    }
  };

  // Fetch chapters for the selected book
  const fetchChapters = async (book) => {
    setLoadingChapters(true);
    setChaptersError(null);
    try {
      // In a real app, you might have an endpoint like /booksManagement/books/{bookId}/chapters
      // For now, we'll create sample chapters based on the book
      const sampleChapters = [
        { id: 1, number: 1, title: `${book.title} - Chapter 1`, description: "Introduction", duration: 1200 },
        { id: 2, number: 2, title: `${book.title} - Chapter 2`, description: "Development", duration: 1500 },
        { id: 3, number: 3, title: `${book.title} - Chapter 3`, description: "Climax", duration: 1800 },
        { id: 4, number: 4, title: `${book.title} - Chapter 4`, description: "Resolution", duration: 1350 },
      ];
      setChapters(sampleChapters);
    } catch (error) {
      setChaptersError(error.message);
      setChapters([]);
    } finally {
      setLoadingChapters(false);
    }
  };

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

      {/* Book Selection Dropdown */}
      <div className="max-w-4xl mx-auto mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center space-x-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <span>Select a Book</span>
          </h2>
          
          {loadingBooks && (
            <div className="flex items-center space-x-2 text-gray-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span>Loading books...</span>
            </div>
          )}
          
          {booksError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              Error: {booksError}
            </div>
          )}
          
          {!loadingBooks && !booksError && books.length === 0 && (
            <div className="text-gray-500 text-center py-4">No books found.</div>
          )}
          
          {books.length > 0 && (
            <select
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={selectedBook ? selectedBook.id : ''}
              onChange={e => {
                const book = books.find(b => b.id === Number(e.target.value));
                setSelectedBook(book || null);
                setSelectedChapter(null);
                setIntroProgress(null);
                if (book) {
                  fetchIntroProgress(book);
                  if (viewMode === 'chapter') {
                    fetchChapters(book);
                  }
                }
              }}
            >
              <option value="">-- Select a Book --</option>
              {books.map(book => (
                <option key={book.id} value={book.id}>
                  {book.title || `Book #${book.id}`}
                </option>
              ))}
            </select>
          )}

          {/* View Mode Toggle */}
          {selectedBook && (
            <div className="mb-4">
              <div className="flex items-center space-x-4 mb-4">
                <span className="text-sm font-medium text-gray-700">Playback Mode:</span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setViewMode('book')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'book'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Volume2 className="w-4 h-4 inline mr-1" />
                    Book Introduction
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('chapter');
                      if (selectedBook) fetchChapters(selectedBook);
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'chapter'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <List className="w-4 h-4 inline mr-1" />
                    Chapter Player
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Book Introduction Player */}
      {selectedBook && viewMode === 'book' && (
        <div className="max-w-4xl mx-auto mb-6">
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
              <h3 className="text-lg font-semibold">Book Introduction</h3>
              <p className="text-blue-100 text-sm">{selectedBook.title || `Book #${selectedBook.id}`}</p>
            </div>
            
            <div className="p-6">
              {loadingIntro && (
                <div className="flex items-center space-x-2 text-gray-600 mb-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  <span>Loading progress...</span>
                </div>
              )}
              
              {introError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                  Error: {introError}
                </div>
              )}
              
              {introProgress && (
                <div className="text-sm text-gray-600 mb-4">
                  Progress: {Math.floor(introProgress.position || 0)} seconds
                </div>
              )}
              
              <AudioPlayer
                bookId={selectedBook.id}
                authToken={authToken}
                autoPlay={false}
                showDownload={true}
                showBookmark={true}
                onProgressUpdate={(position, status, playbackRate) => {
                  updateIntroProgress(selectedBook, position);
                }}
                className="bg-gray-50 rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Chapter Player */}
      {selectedBook && viewMode === 'chapter' && (
        <div className="max-w-4xl mx-auto mb-6">
          {loadingChapters && (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center">
              <div className="flex items-center justify-center space-x-2 text-gray-600">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span>Loading chapters...</span>
              </div>
            </div>
          )}
          
          {chaptersError && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                Error loading chapters: {chaptersError}
              </div>
            </div>
          )}
          
          {!loadingChapters && !chaptersError && chapters.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-6 text-center text-gray-500">
              No chapters available for this book.
            </div>
          )}
          
          {chapters.length > 0 && (
            <ChapterPlayer
              authToken={authToken}
              bookId={selectedBook.id}
              chapters={chapters}
              onProgressUpdate={(position, status, playbackRate, chapter) => {
                console.log('Chapter progress update:', {
                  bookId: selectedBook.id,
                  chapterId: chapter?.id,
                  position,
                  status,
                  playbackRate
                });
              }}
              autoPlay={false}
              className="shadow-lg"
            />
          )}
        </div>
      )}
      {/* Footer */}
      <div className="max-w-4xl mx-auto mt-8">
        <div className="text-center text-sm text-gray-500">
          <p>NextJS Audio Player v2.0 - Chapter Support</p>
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
