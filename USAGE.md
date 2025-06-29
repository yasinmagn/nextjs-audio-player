# NextJS Audio Player Usage Examples

This document provides examples of how to use the AudioPlayer component with your Node.js streaming API.

## Installation

```bash
npm install lucide-react
```

## Basic Usage

### 1. Streaming a Book's Audio

```jsx
import AudioPlayer from './components/AudioPlayer';

function BookPlayerPage() {
  const authToken = "your-jwt-token-here";
  
  return (
    <div className="container mx-auto p-4">
      <h1>Book Audio Player</h1>
      <AudioPlayer
        bookId={123}
        authToken={authToken}
        apiBaseUrl="https://your-api.com"
        autoPlay={false}
        // Uses /audioStreaming/bookintro/{bookId}/audio endpoint
        onProgressUpdate={(position, status, playbackRate) => {
          console.log(`Progress: ${position}s, Status: ${status}, Speed: ${playbackRate}x`);
        }}
      />
    </div>
  );
}
```

### 2. Streaming a Chapter's Audio

```jsx
import AudioPlayer from './components/AudioPlayer';

function ChapterPlayerPage() {
  const authToken = localStorage.getItem('authToken');
  
  return (
    <div className="chapter-player">
      <AudioPlayer
        chapterId={456}
        authToken={authToken}
        apiBaseUrl={process.env.NEXT_PUBLIC_API_URL}
        showDownload={true}
        showBookmark={true}
        className="my-custom-player"
      />
    </div>
  );
}
```

### 3. Multiple Players in a Playlist

```jsx
import { useState } from 'react';
import AudioPlayer from './components/AudioPlayer';

function PlaylistPage() {
  const [currentChapter, setCurrentChapter] = useState(1);
  const chapters = [1, 2, 3, 4, 5]; // Chapter IDs
  const authToken = useAuth(); // Your auth hook
  
  const handleProgressUpdate = (position, status, playbackRate) => {
    // Sync progress across your app
    if (status === 'completed') {
      // Auto-advance to next chapter
      const nextChapter = chapters.indexOf(currentChapter) + 1;
      if (nextChapter < chapters.length) {
        setCurrentChapter(chapters[nextChapter]);
      }
    }
  };
  
  return (
    <div>
      <h2>Chapter {currentChapter}</h2>
      <AudioPlayer
        chapterId={currentChapter}
        authToken={authToken}
        onProgressUpdate={handleProgressUpdate}
        autoPlay={true}
      />
      
      {/* Chapter Navigation */}
      <div className="flex space-x-2 mt-4">
        {chapters.map(chapterId => (
          <button
            key={chapterId}
            onClick={() => setCurrentChapter(chapterId)}
            className={`px-4 py-2 rounded ${
              currentChapter === chapterId ? 'bg-blue-600 text-white' : 'bg-gray-200'
            }`}
          >
            Chapter {chapterId}
          </button>
        ))}
      </div>
    </div>
  );
}
```

## Mobile-Optimized Usage

### React Native Integration

```jsx
// For React Native apps
import { WebView } from 'react-native-webview';

function AudioPlayerScreen() {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
      <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    </head>
    <body>
      <div id="audio-player"></div>
      <script>
        // Your AudioPlayer component rendered here
        // Communicates back to React Native via postMessage
      </script>
    </body>
    </html>
  `;
  
  return (
    <WebView
      source={{ html: htmlContent }}
      onMessage={(event) => {
        const data = JSON.parse(event.nativeEvent.data);
        // Handle progress updates from the web player
      }}
    />
  );
}
```

### PWA Integration

```jsx
// pages/_app.js
import { useEffect } from 'react';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // Register service worker for offline support
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
    
    // Enable media session API for lock screen controls
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: 'Your Audio Book',
        artist: 'Author Name',
        artwork: [
          { src: '/book-cover.jpg', sizes: '512x512', type: 'image/jpeg' }
        ]
      });
    }
  }, []);
  
  return <Component {...pageProps} />;
}
```

## Advanced Features

### Custom Progress Tracking

```jsx
import { useState, useEffect } from 'react';
import AudioPlayer from './components/AudioPlayer';

function AdvancedPlayer({ bookId }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [progress, setProgress] = useState(0);
  
  const handleProgressUpdate = async (position, status, playbackRate) => {
    setProgress(position);
    
    // Save to your custom backend
    await fetch('/api/save-progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bookId,
        position,
        status,
        playbackRate,
        timestamp: new Date().toISOString()
      })
    });
  };
  
  const addBookmark = (position) => {
    const bookmark = {
      id: Date.now(),
      position,
      note: prompt('Bookmark note:'),
      timestamp: new Date()
    };
    setBookmarks([...bookmarks, bookmark]);
  };
  
  return (
    <div>
      <AudioPlayer
        bookId={bookId}
        onProgressUpdate={handleProgressUpdate}
      />
      
      {/* Custom Bookmarks UI */}
      <div className="mt-4">
        <h3>Bookmarks</h3>
        {bookmarks.map(bookmark => (
          <div key={bookmark.id} className="flex justify-between p-2 border-b">
            <span>{bookmark.note}</span>
            <span>{Math.floor(bookmark.position / 60)}:{Math.floor(bookmark.position % 60)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Error Handling & Offline Support

```jsx
import { useState, useEffect } from 'react';
import AudioPlayer from './components/AudioPlayer';

function OfflineCapablePlayer({ bookId }) {
  const [isOnline, setIsOnline] = useState(true);
  const [cachedAudio, setCachedAudio] = useState(null);
  
  useEffect(() => {
    // Monitor network status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const downloadForOffline = async () => {
    try {
      const response = await fetch(`/api/books/${bookId}/audio`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const blob = await response.blob();
      
      // Store in IndexedDB for offline access
      const cache = await caches.open('audio-cache');
      await cache.put(`/offline-audio/${bookId}`, new Response(blob));
      
      setCachedAudio(URL.createObjectURL(blob));
    } catch (error) {
      console.error('Failed to cache audio:', error);
    }
  };
  
  return (
    <div>
      {!isOnline && (
        <div className="bg-yellow-100 p-4 rounded mb-4">
          You're offline. {cachedAudio ? 'Playing cached audio.' : 'Download audio for offline listening.'}
        </div>
      )}
      
      <AudioPlayer
        bookId={bookId}
        // Use cached audio when offline
        apiBaseUrl={!isOnline && cachedAudio ? cachedAudio : undefined}
      />
      
      {isOnline && (
        <button onClick={downloadForOffline} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
          Download for Offline
        </button>
      )}
    </div>
  );
}
```

## API Integration

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://your-backend-api.com
NEXT_PUBLIC_ENABLE_DOWNLOADS=true
NEXT_PUBLIC_ENABLE_BOOKMARKS=true
```

### Authentication Hook

```jsx
// hooks/useAuth.js
import { useState, useEffect } from 'react';

export function useAuth() {
  const [token, setToken] = useState(null);
  
  useEffect(() => {
    // Get token from localStorage, cookies, or your auth provider
    const savedToken = localStorage.getItem('authToken');
    setToken(savedToken);
  }, []);
  
  return token;
}
```

### API Service

```jsx
// services/audioApi.js
class AudioAPI {
  constructor(baseUrl, authToken) {
    this.baseUrl = baseUrl;
    this.authToken = authToken;
  }
  
  async getBookAudio(bookId) {
    const response = await fetch(`${this.baseUrl}/booksManagement/books/${bookId}/audio`, {
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'User-Agent': 'NextJS-AudioPlayer/1.0'
      }
    });
    return response;
  }
  
  async updateProgress(audioId, position, status, playbackSpeed) {
    const response = await fetch(`${this.baseUrl}/booksManagement/audio/${audioId}/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`
      },
      body: JSON.stringify({
        position: Math.floor(position),
        status,
        playback_speed: playbackSpeed
      })
    });
    return response.json();
  }
}

export default AudioAPI;
```

## Supported Audio Formats

The player automatically works with all formats supported by your backend:

- **MP3** (`audio/mpeg`) - Universal support
- **M4A** (`audio/mp4`) - iOS native support
- **AAC** (`audio/aac`) - Android native support  
- **WAV** (`audio/wav`) - Universal support

## Browser Compatibility

- ✅ Chrome 60+
- ✅ Firefox 55+
- ✅ Safari 12+
- ✅ Edge 79+
- ✅ iOS Safari 12+
- ✅ Chrome Mobile 60+

## Performance Tips

1. **Preload Strategy**: Use `preload="metadata"` for faster initial load
2. **Progress Tracking**: Update every 30 seconds to balance UX and performance
3. **Caching**: Implement service worker for offline support
4. **Error Handling**: Graceful fallbacks for network issues
5. **Mobile Optimization**: Touch-friendly controls and responsive design
