import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Download, Bookmark } from 'lucide-react';
import { logger, networkLog, audioLog, perfLog, LOG_CATEGORIES } from './utils/config';
import { sessionLogger } from './utils/logger';

/**
 * NextJS Audio Player Component
 * Hard coded to stream only Book #2 from /books/2/audio endpoint
 * Compatible with iOS AVPlayer, Android MediaPlayer, and React Native
 */
const AudioPlayer = ({
  apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:10000',
  authToken,
  onProgressUpdate = null,
  autoPlay = false,
  showDownload = true,
  showBookmark = true,
  className = ''
}) => {  // Hard coded to book ID 2
  const BOOK_ID = 2;  // Component initialization logging
  useEffect(() => {
    logger.info(LOG_CATEGORIES.INIT, '=== AUDIO PLAYER COMPONENT INITIALIZED ===');
    
    const initConfig = {
      bookId: BOOK_ID,
      apiBaseUrl,
      hasAuthToken: !!authToken,
      autoPlay,
      showDownload,
      showBookmark,
      className
    };
    
    // Check if we're in browser environment before accessing navigator
    const browserCapabilities = typeof window !== 'undefined' ? {
      userAgent: navigator.userAgent,
      mp3Support: !!document.createElement('audio').canPlayType('audio/mpeg'),
      mp4Support: !!document.createElement('audio').canPlayType('audio/mp4'),
      aacSupport: !!document.createElement('audio').canPlayType('audio/aac'),
      hasMediaSession: 'mediaSession' in navigator,
      hasServiceWorker: 'serviceWorker' in navigator,
      connectionType: navigator.connection?.effectiveType || 'unknown',
      memoryLimit: navigator.deviceMemory || 'unknown'
    } : {
      userAgent: 'Server-side rendering',
      mp3Support: false,
      mp4Support: false,
      aacSupport: false,
      hasMediaSession: false,
      hasServiceWorker: false,
      connectionType: 'unknown',
      memoryLimit: 'unknown'
    };
    
    sessionLogger.info(LOG_CATEGORIES.INIT, 'Audio Player initialized', {
      config: initConfig,
      capabilities: browserCapabilities
    });
    
    // Install global debugging methods in development
    if (process.env.NODE_ENV === 'development') {
      sessionLogger.installGlobal();
    }
    
    return () => {
      logger.info(LOG_CATEGORIES.INIT, '=== AUDIO PLAYER COMPONENT UNMOUNTING ===');
      sessionLogger.info(LOG_CATEGORIES.INIT, 'Component unmounting');
      
      // Print session summary on unmount in development
      if (process.env.NODE_ENV === 'development') {
        setTimeout(() => sessionLogger.printSummary(), 100);
      }
    };
  }, []);
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [error, setError] = useState(null);
  const [audioMetadata, setAudioMetadata] = useState(null);
  const [resumeAvailable, setResumeAvailable] = useState(false);
  const [resumePosition, setResumePosition] = useState(null);
  const [showStartOver, setShowStartOver] = useState(false);
  // Add state for completion percentage
  const [completionPercentage, setCompletionPercentage] = useState(0);

  // Refs
  const audioRef = useRef(null);
  const progressIntervalRef = useRef(null);
  // API endpoints - hard coded to book 2
  const getStreamingUrl = useCallback(() => {
    // Always use resume=true for playback
    return `${apiBaseUrl}/audioStreaming/books/${BOOK_ID}/audio?resume=true`;
  }, [apiBaseUrl]);

  const getProgressUrl = useCallback(() => {
    return `${apiBaseUrl}/audioStreaming/books/${BOOK_ID}/progress`;
  }, [apiBaseUrl]);  // Initialize audio source
  useEffect(() => {
    const streamingUrl = getStreamingUrl();
    if (streamingUrl && audioRef.current) {
      const initTimer = perfLog.start('Audio streaming initialization');
      setIsLoading(true);
      setError(null);
      logger.info(LOG_CATEGORIES.INIT, '=== AUDIO STREAMING INITIALIZATION ===');
      logger.info(LOG_CATEGORIES.NETWORK, 'Setting up audio stream', {
        url: streamingUrl,
        hasAuth: !!authToken,
        audioElementReady: !!audioRef.current
      });
      // Set up audio element with authentication headers
      if (authToken) {
        // If token, fetch the audio as a blob and set srcObject
        fetch(streamingUrl, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })
          .then(response => {
            if (!response.ok) throw new Error('Failed to fetch audio');
            return response.blob();
          })
          .then(blob => {
            const url = URL.createObjectURL(blob);
            audioRef.current.src = url;
            setIsLoading(false);
            initTimer.end();
          })
          .catch(err => {
            setError('Failed to load audio. Please check your connection.');
            setIsLoading(false);
            initTimer.end();
          });
      } else {
        // No token, set src directly
        audioRef.current.src = streamingUrl;
        setIsLoading(false);
        initTimer.end();
      }
    }
  }, [getStreamingUrl, authToken]);
  // Progress tracking
  const updateProgress = useCallback(async (position, status = 'playing') => {
    const progressUrl = getProgressUrl();
    if (!progressUrl || !authToken) {
      logger.warn(LOG_CATEGORIES.PROGRESS, 'Progress update skipped', {
        hasUrl: !!progressUrl,
        hasToken: !!authToken,
        url: progressUrl
      });
      return;
    }

    const requestBody = {
      position: Math.floor(position),
      status,
      playback_speed: playbackRate
    };

    logger.debug(LOG_CATEGORIES.PROGRESS, 'Updating progress', requestBody);

    try {
      const startTime = performance.now();
      networkLog.request('POST', progressUrl, { 'Content-Type': 'application/json', 'Authorization': 'Bearer ***' });
        const response = await fetch(progressUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
          'User-Agent': `NextJS-AudioPlayer/1.0 ${typeof window !== 'undefined' ? navigator.userAgent : 'SSR'}`
        },
        body: JSON.stringify(requestBody)
      });

      const responseTime = Math.round(performance.now() - startTime);
      networkLog.response('POST', progressUrl, response.status, responseTime);

      if (response.ok) {
        const result = await response.json();
        logger.info(LOG_CATEGORIES.PROGRESS, 'Progress updated successfully', result);
        if (onProgressUpdate) {
          onProgressUpdate(position, status, playbackRate);
        }
      } else {
        const errorText = await response.text();
        logger.error(LOG_CATEGORIES.PROGRESS, 'Progress update failed', {
          status: response.status,
          statusText: response.statusText,
          errorResponse: errorText
        });
      }
    } catch (err) {
      logger.error(LOG_CATEGORIES.PROGRESS, 'Progress update error', {
        error: {
          name: err.name,
          message: err.message,
          stack: err.stack
        },
        requestBody
      });
    }
  }, [getProgressUrl, authToken, playbackRate, onProgressUpdate]);
  // Audio event handlers
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      const loadTimer = perfLog.start('Audio metadata loading');
      const duration = audioRef.current.duration;
      const metadata = {
        duration: duration,
        readyState: audioRef.current.readyState,
        networkState: audioRef.current.networkState,
        src: audioRef.current.src
      };
      
      audioLog.event('loadedmetadata', metadata);
      sessionLogger.trackAudioLoad(performance.now() - (window.audioLoadStartTime || 0), metadata);
      
      logger.info(LOG_CATEGORIES.PLAYBACK, 'Audio metadata loaded', {
        ...metadata,
        formattedDuration: formatTime(duration)
      });
      
      setDuration(duration);
      setIsLoading(false);
      loadTimer.end();
      
      if (autoPlay) {
        logger.info(LOG_CATEGORIES.PLAYBACK, 'Auto-play enabled, starting playback');
        handlePlay();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const currentTime = audioRef.current.currentTime;
      setCurrentTime(currentTime);
      
      // Log position every 30 seconds to avoid spam but provide regular updates
      if (Math.floor(currentTime) % 30 === 0 && Math.floor(currentTime) > 0) {
        const percentage = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;
        audioLog.position(Math.round(currentTime), Math.round(duration), percentage);
      }
    }
  };
  const handleLoadStart = () => {
    window.audioLoadStartTime = performance.now(); // Track load start time
    audioLog.event('loadstart', { src: audioRef.current?.src });
    logger.info(LOG_CATEGORIES.PLAYBACK, 'Audio load started');
    setIsLoading(true);
  };

  const handleCanPlay = () => {
    const bufferedInfo = audioRef.current?.buffered.length > 0 ? {
      bufferedRanges: audioRef.current.buffered.length,
      firstRange: {
        start: audioRef.current.buffered.start(0),
        end: audioRef.current.buffered.end(0)
      }
    } : { bufferedRanges: 0 };
    
    audioLog.event('canplay', bufferedInfo);
    logger.info(LOG_CATEGORIES.PLAYBACK, 'Audio ready to play', bufferedInfo);
    setIsLoading(false);
  };
  const handleError = (e) => {
    const errorDetails = {
      errorCode: audioRef.current?.error?.code,
      errorMessage: audioRef.current?.error?.message,
      networkState: audioRef.current?.networkState,
      readyState: audioRef.current?.readyState,
      src: audioRef.current?.src,
      event: e.type
    };
    
    const errorMessages = {
      1: 'MEDIA_ERR_ABORTED - The fetching process was aborted',
      2: 'MEDIA_ERR_NETWORK - A network error occurred',
      3: 'MEDIA_ERR_DECODE - An error occurred while decoding',
      4: 'MEDIA_ERR_SRC_NOT_SUPPORTED - The audio format is not supported'
    };
    
    const detailedError = errorMessages[errorDetails.errorCode] || 'Unknown audio error';
    errorDetails.detailedError = detailedError;
    
    audioLog.error(detailedError, errorDetails);
    logger.error(LOG_CATEGORIES.PLAYBACK, 'Audio playback error', errorDetails);
    
    // Track error in session logger
    const error = new Error(detailedError);
    error.audioErrorCode = errorDetails.errorCode;
    sessionLogger.trackError(error, {
      category: 'audio_playback',
      audioState: errorDetails
    });
    
    setError('Failed to load audio. Please check your connection.');
    setIsLoading(false);
  };

  const handleEnded = () => {
    audioLog.event('ended', { 
      finalPosition: formatTime(duration),
      duration: duration 
    });
    logger.info(LOG_CATEGORIES.PLAYBACK, 'Audio playback completed');
    setIsPlaying(false);
    updateProgress(duration, 'completed');
  };  // Player controls
  const handlePlay = async () => {
    if (audioRef.current) {
      const playTimer = perfLog.start('Audio playback start');
      
      const currentState = {
        readyState: audioRef.current.readyState,
        networkState: audioRef.current.networkState,
        currentTime: audioRef.current.currentTime,
        duration: audioRef.current.duration,
        paused: audioRef.current.paused
      };
      
      logger.info(LOG_CATEGORIES.PLAYBACK, 'Attempting playback', currentState);
      
      try {
        await audioRef.current.play();
        
        audioLog.state('playing', {
          position: formatTime(audioRef.current.currentTime),
          duration: formatTime(audioRef.current.duration)
        });
        logger.info(LOG_CATEGORIES.PLAYBACK, 'Playback started successfully');
        
        setIsPlaying(true);
        setError(null);
        
        // Start progress tracking
        progressIntervalRef.current = setInterval(() => {
          if (audioRef.current && !audioRef.current.paused) {
            updateProgress(audioRef.current.currentTime, 'playing');
          }
        }, 30000); // Update every 30 seconds as per mobile best practices
        
        playTimer.end();
        
      } catch (err) {
        const errorDetails = {
          name: err.name,
          message: err.message,
          audioState: currentState
        };
        
        audioLog.error(`Playback failed: ${err.message}`, errorDetails);
        logger.error(LOG_CATEGORIES.PLAYBACK, 'Playback error', errorDetails);
        
        const userFriendlyError = err.name === 'NotAllowedError' 
          ? 'Playback blocked by browser. Please click play again.'
          : err.name === 'NotSupportedError'
          ? 'Audio format not supported by this browser.'
          : 'Failed to play audio. Please try again.';
          
        setError(userFriendlyError);
        playTimer.end();
      }
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      const pausePosition = audioRef.current.currentTime;
      
      logger.info(LOG_CATEGORIES.PLAYBACK, 'Pausing playback', {
        position: formatTime(pausePosition),
        duration: formatTime(duration)
      });
      
      audioRef.current.pause();
      audioLog.state('paused', { position: formatTime(pausePosition) });
      setIsPlaying(false);
      
      // Clear progress interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        logger.debug(LOG_CATEGORIES.PROGRESS, 'Progress tracking stopped');
      }
      
      // Update progress on pause
      updateProgress(pausePosition, 'paused');
    }
  };  const handleSeek = (newTime) => {
    if (audioRef.current) {
      const seekStartTime = performance.now();
      const oldTime = currentTime;
      
      const seekInfo = {
        from: formatTime(currentTime),
        to: formatTime(newTime),
        duration: formatTime(duration),
        percentageFrom: Math.round((currentTime / duration) * 100),
        percentageTo: Math.round((newTime / duration) * 100)
      };
      
      logger.info(LOG_CATEGORIES.PLAYBACK, 'Seek operation', seekInfo);
      
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      updateProgress(newTime, isPlaying ? 'playing' : 'paused');
      
      // Track seek performance
      const seekDuration = performance.now() - seekStartTime;
      sessionLogger.trackSeek(oldTime, newTime, seekDuration);
      
      audioLog.event('seek', seekInfo);
    }
  };

  const handleSkipForward = () => {
    const newTime = Math.min(currentTime + 30, duration);
    logger.info(LOG_CATEGORIES.UI, 'Skip forward', {
      amount: '+30s',
      from: formatTime(currentTime),
      to: formatTime(newTime)
    });
    handleSeek(newTime);
  };

  const handleSkipBackward = () => {
    const newTime = Math.max(currentTime - 30, 0);
    logger.info(LOG_CATEGORIES.UI, 'Skip backward', {
      amount: '-30s',
      from: formatTime(currentTime),
      to: formatTime(newTime)
    });
    handleSeek(newTime);
  };  const handleVolumeChange = (newVolume) => {
    if (audioRef.current) {
      logger.debug(LOG_CATEGORIES.UI, 'Volume changed', {
        from: volume,
        to: newVolume,
        percentage: Math.round(newVolume * 100) + '%'
      });
      audioRef.current.volume = newVolume;
      setVolume(newVolume);
    }
  };

  const handlePlaybackRateChange = (newRate) => {
    if (audioRef.current) {
      logger.info(LOG_CATEGORIES.UI, 'Playback rate changed', {
        from: playbackRate + 'x',
        to: newRate + 'x'
      });
      audioRef.current.playbackRate = newRate;
      setPlaybackRate(newRate);
    }
  };  const handleDownload = () => {
    const streamingUrl = getStreamingUrl();
    if (streamingUrl) {
      const downloadTimer = perfLog.start('Audio download');
      
      logger.info(LOG_CATEGORIES.NETWORK, 'Download initiated', {
        url: streamingUrl,
        hasAuth: !!authToken,
        filename: `book_${BOOK_ID}_audio.mp3`
      });
      
      // Create download link with authentication
      const link = document.createElement('a');
      link.href = streamingUrl;
      link.download = `book_${BOOK_ID}_audio.mp3`;
      
      // For authenticated downloads, we need to handle this differently
      if (authToken) {
        logger.debug(LOG_CATEGORIES.AUTH, 'Starting authenticated download');
        const startTime = performance.now();
        networkLog.request('GET', streamingUrl, { 'Authorization': 'Bearer ***' });
        
        fetch(streamingUrl, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        })        .then(response => {
          const responseTime = Math.round(performance.now() - startTime);
          const contentLength = response.headers.get('Content-Length');
          const contentType = response.headers.get('Content-Type');
          
          networkLog.response('GET', streamingUrl, response.status, responseTime, contentLength);
          sessionLogger.trackNetworkRequest('GET', streamingUrl, response.status, responseTime, contentLength);
          
          logger.info(LOG_CATEGORIES.NETWORK, 'Download response received', {
            status: response.status,
            statusText: response.statusText,
            contentType,
            contentLength: contentLength ? Math.round(contentLength / 1024) + 'KB' : 'unknown',
            responseTime: responseTime + 'ms'
          });
          
          if (!response.ok) {
            throw new Error(`Download failed: ${response.status} ${response.statusText}`);
          }
          
          return response.blob();
        })
        .then(blob => {
          logger.info(LOG_CATEGORIES.NETWORK, 'Download completed', {
            blobSize: Math.round(blob.size / 1024) + 'KB',
            blobType: blob.type
          });
          
          const url = window.URL.createObjectURL(blob);
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          downloadTimer.end();
        })        .catch(err => {
          const responseTime = Math.round(performance.now() - startTime);
          networkLog.error('GET', streamingUrl, err, responseTime);
          sessionLogger.trackError(err, {
            operation: 'download',
            url: streamingUrl,
            responseTime
          });
          
          logger.error(LOG_CATEGORIES.NETWORK, 'Download failed', {
            error: {
              name: err.name,
              message: err.message
            },
            responseTime: responseTime + 'ms'
          });
          
          setError('Download failed. Please try again.');
          downloadTimer.end();
        });
      } else {
        logger.info(LOG_CATEGORIES.NETWORK, 'Starting unauthenticated download');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        downloadTimer.end();
      }
    } else {
      logger.error(LOG_CATEGORIES.NETWORK, 'Download failed - no streaming URL available');
    }
  };  const handleBookmark = () => {
    const bookmarkData = {
      position: currentTime,
      formattedPosition: formatTime(currentTime),
      status: isPlaying ? 'playing' : 'paused',
      timestamp: new Date().toISOString()
    };
    
    logger.info(LOG_CATEGORIES.UI, 'Bookmark created', bookmarkData);
    
    // Create bookmark at current position
    updateProgress(currentTime, 'bookmarked');
    alert(`Bookmarked at ${formatTime(currentTime)}`);
  };

  // On mount, check progress for resume
  useEffect(() => {
    const checkResume = async () => {
      const progressUrl = getProgressUrl();
      if (!progressUrl || !authToken) return;
      try {
        const response = await fetch(progressUrl, {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          if (data && data.progress) {
            setCompletionPercentage(parseFloat(data.progress.completion_percentage) || 0);
            if (
              typeof data.progress.position === 'number' &&
              data.progress.position > 0 &&
              parseFloat(data.progress.completion_percentage) < 100
            ) {
              setResumeAvailable(true);
              setResumePosition(data.progress.position);
            } else {
              setResumeAvailable(false);
            }
            // Check is_finished (can be 1 or true)
            if (data.progress.is_finished === 1 || data.progress.is_finished === true) {
              setShowStartOver(true);
            } else {
              setShowStartOver(false);
            }
          }
        }
      } catch (e) {
        setResumeAvailable(false);
        setShowStartOver(false);
        setCompletionPercentage(0);
      }
    };
    checkResume();
  }, [getProgressUrl, authToken]);

  const handleResume = async () => {
    const streamingUrl = `${apiBaseUrl}/audioStreaming/books/${BOOK_ID}/audio?resume=true`;
    setIsLoading(true);
    setError(null);
    if (authToken) {
      try {
        const response = await fetch(streamingUrl, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!response.ok) throw new Error('Failed to fetch audio');
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        audioRef.current.src = url;
        setIsLoading(false);
        setIsPlaying(true);
        // Set currentTime to resumePosition after metadata loads
        audioRef.current.onloadedmetadata = () => {
          if (resumePosition) {
            audioRef.current.currentTime = resumePosition;
          }
          audioRef.current.play().catch(() => {});
        };
      } catch (err) {
        setError('Failed to resume audio.');
        setIsLoading(false);
      }
    } else {
      audioRef.current.src = streamingUrl;
      setIsLoading(false);
      setIsPlaying(true);
      audioRef.current.onloadedmetadata = () => {
        if (resumePosition) {
          audioRef.current.currentTime = resumePosition;
        }
        audioRef.current.play().catch(() => {});
      };
    }
  };

  // Utility functions
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = () => {
    return duration > 0 ? (currentTime / duration) * 100 : 0;
  };  // Cleanup
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        logger.debug(LOG_CATEGORIES.INIT, 'Cleaning up progress interval');
        clearInterval(progressIntervalRef.current);
      }
      logger.info(LOG_CATEGORIES.INIT, '=== AUDIO PLAYER CLEANUP COMPLETED ===');
    };
  }, []);

  return (
    <div className={`audio-player bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto ${className}`}>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        onError={handleError}
        onEnded={handleEnded}
        preload="metadata"
        crossOrigin="anonymous"
      />

      {/* Error Display */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Audio Metadata */}
      {audioMetadata && (
        <div className="text-center mb-4">
          <h3 className="text-lg font-semibold">{audioMetadata.title}</h3>
          <p className="text-gray-600">{audioMetadata.author}</p>
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
        <div 
          className="w-full bg-gray-200 rounded-full h-2 cursor-pointer"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const newTime = (clickX / rect.width) * duration;
            handleSeek(newTime);
          }}
        >
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-200"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      {/* Main Controls */}
      <div className="flex items-center justify-center space-x-4 mb-4">
        <button
          onClick={handleSkipBackward}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          disabled={isLoading}
        >
          <SkipBack className="w-5 h-5" />
        </button>

        <button
          onClick={isPlaying ? handlePause : handlePlay}
          className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors disabled:opacity-50"
          disabled={isLoading || error}
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6" />
          )}
        </button>

        <button
          onClick={handleSkipForward}
          className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
          disabled={isLoading}
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* Secondary Controls */}
      <div className="flex items-center justify-between">
        {/* Volume Control */}
        <div className="flex items-center space-x-2">
          <Volume2 className="w-4 h-4 text-gray-600" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-16"
          />
        </div>

        {/* Playback Speed */}
        <select
          value={playbackRate}
          onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
          className="text-sm border rounded px-2 py-1"
        >
          <option value={0.5}>0.5x</option>
          <option value={0.75}>0.75x</option>
          <option value={1}>1x</option>
          <option value={1.25}>1.25x</option>
          <option value={1.5}>1.5x</option>
          <option value={2}>2x</option>
        </select>

        {/* Action Buttons */}
        <div className="flex space-x-2">
          {showBookmark && (
            <button
              onClick={handleBookmark}
              className="p-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
              disabled={isLoading || !isPlaying}
            >
              <Bookmark className="w-4 h-4" />
            </button>
          )}
          
          {showDownload && (
            <button
              onClick={handleDownload}
              className="p-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors"
              disabled={isLoading}
            >
              <Download className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Resume Button - Shown if resume position is available */}
      {!isPlaying && resumeAvailable && completionPercentage < 100 && !showStartOver && (
        <button
          onClick={handleResume}
          className="p-2 rounded bg-blue-100 hover:bg-blue-200 transition-colors mr-2"
          disabled={isLoading}
        >
          Resume from {resumePosition ? `${Math.floor(resumePosition/60)}:${String(Math.floor(resumePosition%60)).padStart(2,'0')}` : 'last position'}
        </button>
      )}

      {resumeAvailable && resumePosition !== null && duration > 0 && resumePosition >= duration && (
        <button
          onClick={() => {
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(() => {});
              setIsPlaying(true);
            }
          }}
          className="p-2 rounded bg-green-100 hover:bg-green-200 transition-colors mr-2"
          disabled={isLoading}
        >
          Restart Book
        </button>
      )}

      {!isPlaying && showStartOver && (
        <button
          onClick={() => {
            if (audioRef.current) {
              audioRef.current.currentTime = 0;
              audioRef.current.play().catch(() => {});
              setIsPlaying(true);
            }
          }}
          className="p-2 rounded bg-green-100 hover:bg-green-200 transition-colors mr-2"
          disabled={isLoading}
        >
          Start Over Again
        </button>
      )}

      {/* Mobile-specific touch controls */}
      <style jsx>{`
        .audio-player {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          -khtml-user-select: none;
          -moz-user-select: none;
          -ms-user-select: none;
          user-select: none;
        }
        
        @media (max-width: 768px) {
          .audio-player {
            padding: 1rem;
          }
        }
      `}</style>
    </div>
  );
};

export default AudioPlayer;
