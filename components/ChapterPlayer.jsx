import React, { useState, useEffect } from 'react';
import AudioPlayer from '../AudioPlayer';
import { ChevronDown, ChevronUp, BookOpen, Play, Pause } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000';

/**
 * Chapter Player Component
 * Provides chapter selection and uses chapter-specific streaming endpoints
 */
const ChapterPlayer = ({ 
  authToken, 
  bookId, 
  chapters = [], 
  onProgressUpdate = null,
  className = '',
  autoPlay = false 
}) => {
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [isChapterListOpen, setIsChapterListOpen] = useState(false);
  const [chapterProgress, setChapterProgress] = useState({});
  const [loadingProgress, setLoadingProgress] = useState(false);

  // Auto-select chapter with hardcoded ID 4
  useEffect(() => {
    if (chapters.length > 0 && !selectedChapter) {
      // Use first chapter but with hardcoded chapter_id of 4
      const firstChapter = chapters[0];
      if (firstChapter) {
        const hardcodedChapter = {
          ...firstChapter,
          chapter_id: 4 // Hardcode to chapter 4
        };
        setSelectedChapter(hardcodedChapter);
        console.log('Selected hardcoded chapter 4:', hardcodedChapter);
      }
    }
  }, [chapters, selectedChapter]);

  // Load progress for all chapters when component mounts
  useEffect(() => {
    if (authToken && chapters.length > 0) {
      loadAllChapterProgress();
    }
  }, [authToken, chapters]);

  const loadAllChapterProgress = async () => {
    setLoadingProgress(true);
    const progressMap = {};
    
    try {
      // Only load progress for hardcoded chapter 4
      const chapterId = 4;
      try {
        const response = await fetch(
          `${API_BASE_URL}/audioStreaming/chapters/${chapterId}/progress`,
          {
            headers: {
              'Authorization': `Bearer ${authToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (response.ok) {
          const progressData = await response.json();
          progressMap[chapterId] = progressData.progress || {};
        }
      } catch (error) {
        console.warn(`Failed to load progress for chapter ${chapterId}:`, error);
        progressMap[chapterId] = {};
      }

      setChapterProgress(progressMap);
    } catch (error) {
      console.error('Failed to load chapter progress:', error);
    } finally {
      setLoadingProgress(false);
    }
  };

  const handleChapterSelect = (chapter) => {
    if (!chapter || !chapter.chapter_id) {
      console.error('Invalid chapter selected:', chapter);
      return;
    }
    setSelectedChapter(chapter);
    setIsChapterListOpen(false);
  };

  const handleProgressUpdate = async (position, status, playbackRate) => {
    // Update local progress state
    if (selectedChapter) {
      setChapterProgress(prev => ({
        ...prev,
        [selectedChapter.chapter_id]: {
          ...prev[selectedChapter.chapter_id],
          position,
          status,
          playback_speed: playbackRate
        }
      }));
    }

    // Call parent progress handler if provided
    if (onProgressUpdate) {
      onProgressUpdate(position, status, playbackRate, selectedChapter);
    }
  };

  const getChapterStreamUrl = (chapterId) => {
    // Always use hardcoded chapter ID 4
    const hardcodedId = 4;
    console.log('Getting stream URL for hardcoded chapter:', hardcodedId);
    return `${API_BASE_URL}/audioStreaming/chapters/${hardcodedId}/audio`;
  };

  const getChapterProgressUrl = (chapterId) => {
    // Always use hardcoded chapter ID 4
    const hardcodedId = 4;
    console.log('Getting progress URL for hardcoded chapter:', hardcodedId);
    return `${API_BASE_URL}/audioStreaming/chapters/${hardcodedId}/progress`;
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (chapterId) => {
    const progress = chapterProgress[chapterId];
    return progress?.completion_percentage || 0;
  };

  const isChapterCompleted = (chapterId) => {
    const progress = chapterProgress[chapterId];
    return progress?.is_finished === true || progress?.is_finished === 1 || progress?.completion_percentage === 100;
  };

  const hasChapterProgress = (chapterId) => {
    const progress = chapterProgress[chapterId];
    return progress?.position > 0 && progress?.completion_percentage < 100;
  };

  return (
    <div className={`chapter-player bg-white rounded-lg shadow-lg overflow-hidden ${className}`}>
      {/* Chapter Selection Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <BookOpen className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-semibold">Chapter Player</h2>
              {selectedChapter && (
                <p className="text-blue-100 text-sm">
                  Playing: {selectedChapter.title || `Chapter ${selectedChapter.number || selectedChapter.chapter_id}`}
                </p>
              )}
            </div>
          </div>
          
          <button
            onClick={() => setIsChapterListOpen(!isChapterListOpen)}
            className="flex items-center space-x-2 bg-blue-500 hover:bg-blue-400 px-3 py-2 rounded-md transition-colors"
          >
            <span className="text-sm font-medium">Select Chapter</span>
            {isChapterListOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Chapter Selection Dropdown */}
      {isChapterListOpen && (
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="max-h-64 overflow-y-auto">
            {chapters.slice(0, 1).map((chapter, index) => {
              // Use hardcoded chapter ID 4 for display
              const hardcodedChapterId = 4;
              const progressPercentage = getProgressPercentage(hardcodedChapterId);
              const isCompleted = isChapterCompleted(hardcodedChapterId);
              const hasProgress = hasChapterProgress(hardcodedChapterId);
              
              return (
                <div
                  key={`chapter-${index}`}
                  onClick={() => handleChapterSelect({...chapter, chapter_id: hardcodedChapterId})}
                  className={`flex items-center justify-between p-4 hover:bg-white cursor-pointer transition-colors border-b border-gray-100 last:border-b-0 ${
                    selectedChapter?.chapter_id === hardcodedChapterId ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        isCompleted 
                          ? 'bg-green-100 text-green-700'
                          : hasProgress 
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}>
                        {isCompleted ? '✓' : hardcodedChapterId}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">
                          {chapter.title || `Chapter ${hardcodedChapterId}`}
                        </h3>
                        {chapter.description && (
                          <p className="text-sm text-gray-600 mt-1">{chapter.description}</p>
                        )}
                        
                        {/* Progress Bar */}
                        {progressPercentage > 0 && (
                          <div className="mt-2">
                            <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                              <span>{Math.round(progressPercentage)}% complete</span>
                              {chapter.duration && (
                                <span>{formatDuration(chapter.duration)}</span>
                              )}
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  isCompleted ? 'bg-green-500' : 'bg-blue-500'
                                }`}
                                style={{ width: `${progressPercentage}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    {hasProgress && !isCompleted && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        <Play className="w-3 h-3 mr-1" />
                        Resume
                      </span>
                    )}
                    {isCompleted && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ Complete
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Audio Player */}
      {selectedChapter && selectedChapter.chapter_id && authToken && (
        <div className="p-4">
          <AudioPlayer
            chapter={selectedChapter}
            authToken={authToken}
            apiBaseUrl={API_BASE_URL}
            streamUrl={getChapterStreamUrl(selectedChapter.chapter_id)}
            progressUrl={getChapterProgressUrl(selectedChapter.chapter_id)}
            autoPlay={autoPlay}
            showDownload={true}
            showBookmark={true}
            onProgressUpdate={handleProgressUpdate}
            className="bg-gray-50 rounded-lg"
          />
        </div>
      )}

      {/* Chapter Info */}
      {selectedChapter && (
        <div className="px-4 pb-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-medium text-gray-900 mb-2">
              {selectedChapter.title || `Chapter ${selectedChapter.number || selectedChapter.chapter_id}`}
            </h4>
            {selectedChapter.description && (
              <p className="text-sm text-gray-600 mb-2">{selectedChapter.description}</p>
            )}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                Duration: {selectedChapter.duration ? formatDuration(selectedChapter.duration) : 'Unknown'}
              </span>
              {chapterProgress[selectedChapter.chapter_id] && (
                <span>
                  Progress: {Math.round(getProgressPercentage(selectedChapter.chapter_id))}%
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loadingProgress && (
        <div className="p-4 text-center">
          <div className="inline-flex items-center space-x-2 text-gray-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Loading chapter progress...</span>
          </div>
        </div>
      )}

      {/* No Chapters State */}
      {chapters.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium mb-2">No Chapters Available</h3>
          <p className="text-sm">Please select a book that contains chapters to use the chapter player.</p>
        </div>
      )}
    </div>
  );
};

export default ChapterPlayer;
