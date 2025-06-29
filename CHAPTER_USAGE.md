# Chapter Player Usage Examples

This document provides examples of how to use the ChapterPlayer component with chapter streaming endpoints.

## Installation

```bash
npm install lucide-react
```

## Chapter Streaming Endpoints

### API Structure
```
GET /audioStreaming/chapters/{chapterId}/audio
POST /audioStreaming/chapters/{chapterId}/progress  
GET /audioStreaming/chapters/{chapterId}/progress
```

## Basic Usage Examples

### 1. Simple Chapter Player

```jsx
import ChapterPlayer from './components/ChapterPlayer';

function BookChapterPage() {
  const authToken = "your-jwt-token-here";
  const chapters = [
    {
      id: 1,
      number: 1,
      title: "Introduction",
      description: "Setting the scene",
      duration: 1200 // 20 minutes
    },
    {
      id: 2,
      number: 2,
      title: "The Journey Begins",
      description: "Adventure starts",
      duration: 1800 // 30 minutes
    }
  ];
  
  return (
    <div className="container mx-auto p-4">
      <h1>Book Chapters</h1>
      <ChapterPlayer
        authToken={authToken}
        bookId={123}
        chapters={chapters}
        onProgressUpdate={(position, status, playbackRate, chapter) => {
          console.log(`Chapter ${chapter.id}: ${position}s`);
        }}
      />
    </div>
  );
}
```

### 2. Chapter Player with Auto-Advance

```jsx
import React, { useState } from 'react';
import ChapterPlayer from './components/ChapterPlayer';

function AutoAdvanceChapterPlayer() {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const chapters = [
    { id: 1, title: "Chapter 1", duration: 1200 },
    { id: 2, title: "Chapter 2", duration: 1500 },
    { id: 3, title: "Chapter 3", duration: 1800 }
  ];
  
  const handleProgressUpdate = (position, status, playbackRate, chapter) => {
    // Auto-advance when chapter is completed
    if (status === 'completed') {
      const currentIndex = chapters.findIndex(c => c.id === chapter.id);
      if (currentIndex < chapters.length - 1) {
        setCurrentChapterIndex(currentIndex + 1);
        // Force re-render of ChapterPlayer with new selected chapter
      }
    }
  };
  
  return (
    <div>
      <ChapterPlayer
        authToken="your-token"
        bookId={456}
        chapters={chapters}
        onProgressUpdate={handleProgressUpdate}
        autoPlay={true}
      />
    </div>
  );
}
```

### 3. Individual Chapter AudioPlayer

```jsx
import AudioPlayer from './AudioPlayer';

function IndividualChapterPlayer({ chapterId, authToken }) {
  return (
    <div className="chapter-container">
      <h3>Playing Chapter {chapterId}</h3>
      <AudioPlayer
        chapterId={chapterId}
        authToken={authToken}
        apiBaseUrl="https://your-api.com"
        autoPlay={false}
        showDownload={true}
        showBookmark={true}
        onProgressUpdate={(position, status, playbackRate) => {
          // Custom progress tracking for individual chapter
          console.log(`Chapter ${chapterId} progress:`, { position, status, playbackRate });
        }}
      />
    </div>
  );
}
```

### 4. Chapter Playlist with Manual Selection

```jsx
import { useState } from 'react';
import AudioPlayer from './AudioPlayer';

function ChapterPlaylist() {
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [chapterProgress, setChapterProgress] = useState({});
  
  const chapters = [
    { id: 1, title: "Introduction", duration: 1200 },
    { id: 2, title: "Development", duration: 1500 },
    { id: 3, title: "Climax", duration: 1800 },
    { id: 4, title: "Resolution", duration: 1350 }
  ];
  
  const handleChapterSelect = (chapter) => {
    setSelectedChapter(chapter);
  };
  
  const handleProgressUpdate = (position, status, playbackRate) => {
    if (selectedChapter) {
      setChapterProgress(prev => ({
        ...prev,
        [selectedChapter.id]: { position, status, playbackRate }
      }));
    }
  };
  
  return (
    <div className="chapter-playlist">
      {/* Chapter List */}
      <div className="chapter-list">
        <h2>Chapters</h2>
        {chapters.map(chapter => (
          <div
            key={chapter.id}
            onClick={() => handleChapterSelect(chapter)}
            className={`chapter-item ${
              selectedChapter?.id === chapter.id ? 'active' : ''
            }`}
          >
            <h3>{chapter.title}</h3>
            <span>{Math.floor(chapter.duration / 60)}:{(chapter.duration % 60).toString().padStart(2, '0')}</span>
            {chapterProgress[chapter.id] && (
              <div className="progress">
                Progress: {Math.floor(chapterProgress[chapter.id].position)}s
              </div>
            )}
          </div>
        ))}
      </div>
      
      {/* Audio Player */}
      {selectedChapter && (
        <div className="player-section">
          <h2>Now Playing: {selectedChapter.title}</h2>
          <AudioPlayer
            chapterId={selectedChapter.id}
            authToken="your-auth-token"
            onProgressUpdate={handleProgressUpdate}
            showDownload={true}
            showBookmark={true}
          />
        </div>
      )}
    </div>
  );
}
```

### 5. Chapter Player with Resume Functionality

```jsx
import { useState, useEffect } from 'react';
import ChapterPlayer from './components/ChapterPlayer';

function ResumeCapableChapterPlayer({ bookId, authToken }) {
  const [chapters, setChapters] = useState([]);
  const [lastPlayedChapter, setLastPlayedChapter] = useState(null);
  
  useEffect(() => {
    loadChaptersWithProgress();
  }, []);
  
  const loadChaptersWithProgress = async () => {
    // Load chapters from your API
    const chaptersResponse = await fetch(`/api/books/${bookId}/chapters`);
    const chaptersData = await chaptersResponse.json();
    
    // Load progress for each chapter
    const chaptersWithProgress = await Promise.all(
      chaptersData.map(async (chapter) => {
        try {
          const progressResponse = await fetch(
            `/audioStreaming/chapters/${chapter.id}/progress`,
            {
              headers: { 'Authorization': `Bearer ${authToken}` }
            }
          );
          const progressData = await progressResponse.json();
          return { ...chapter, progress: progressData.progress };
        } catch (error) {
          return { ...chapter, progress: null };
        }
      })
    );
    
    setChapters(chaptersWithProgress);
    
    // Find last played chapter (has progress but not completed)
    const lastPlayed = chaptersWithProgress.find(chapter => 
      chapter.progress?.position > 0 && 
      chapter.progress?.completion_percentage < 100
    );
    
    if (lastPlayed) {
      setLastPlayedChapter(lastPlayed);
    }
  };
  
  return (
    <div>
      {lastPlayedChapter && (
        <div className="resume-banner">
          <p>Continue where you left off:</p>
          <button onClick={() => {/* Resume chapter */}}>
            Resume "{lastPlayedChapter.title}" at {Math.floor(lastPlayedChapter.progress.position)}s
          </button>
        </div>
      )}
      
      <ChapterPlayer
        authToken={authToken}
        bookId={bookId}
        chapters={chapters}
        autoPlay={false}
      />
    </div>
  );
}
```

## Chapter Data Structure

### Expected Chapter Object Format

```typescript
interface Chapter {
  id: string | number;           // Unique chapter identifier
  number?: number;               // Chapter number (optional)
  title?: string;               // Chapter title (optional)
  description?: string;         // Chapter description (optional)
  duration?: number;            // Duration in seconds (optional)
}

interface ChapterProgress {
  position: number;             // Current position in seconds
  completion_percentage: number; // 0-100
  is_finished: boolean | number; // true/1 if completed
  playback_speed: number;       // Current playback speed
}
```

### API Response Examples

**GET /audioStreaming/chapters/123/progress**
```json
{
  "progress": {
    "position": 245,
    "completion_percentage": 35,
    "is_finished": false,
    "playback_speed": 1.0
  }
}
```

**POST /audioStreaming/chapters/123/progress**
```json
{
  "position": 300,
  "duration": 1800,
  "playback_speed": 1.25
}
```

## Integration with Different Backends

### Node.js/Express Backend Example

```javascript
// Chapter streaming endpoint
app.get('/audioStreaming/chapters/:chapterId/audio', authenticateToken, (req, res) => {
  const { chapterId } = req.params;
  const audioPath = path.join(__dirname, 'audio', 'chapters', `${chapterId}.mp3`);
  
  if (!fs.existsSync(audioPath)) {
    return res.status(404).json({ error: 'Chapter not found' });
  }
  
  const stat = fs.statSync(audioPath);
  const fileSize = stat.size;
  const range = req.headers.range;
  
  if (range) {
    // Handle range requests for seeking
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const stream = fs.createReadStream(audioPath, { start, end });
    
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'audio/mpeg',
    });
    
    stream.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'audio/mpeg',
    });
    fs.createReadStream(audioPath).pipe(res);
  }
});

// Progress endpoints
app.get('/audioStreaming/chapters/:chapterId/progress', authenticateToken, async (req, res) => {
  const { chapterId } = req.params;
  const userId = req.user.id;
  
  const progress = await db.getChapterProgress(userId, chapterId);
  res.json({ progress: progress || { position: 0, completion_percentage: 0, is_finished: false } });
});

app.post('/audioStreaming/chapters/:chapterId/progress', authenticateToken, async (req, res) => {
  const { chapterId } = req.params;
  const { position, duration, playback_speed } = req.body;
  const userId = req.user.id;
  
  const completion_percentage = duration > 0 ? Math.round((position / duration) * 100) : 0;
  const is_finished = completion_percentage >= 95; // Consider 95%+ as finished
  
  await db.updateChapterProgress(userId, chapterId, {
    position,
    duration,
    completion_percentage,
    is_finished,
    playback_speed,
    updated_at: new Date()
  });
  
  res.json({ success: true, progress: { position, completion_percentage, is_finished } });
});
```

## Mobile-Specific Considerations

### React Native Integration

```jsx
// For React Native apps using react-native-audio-toolkit
import { Player } from 'react-native-audio-toolkit';

function ReactNativeChapterPlayer({ chapterId, authToken }) {
  const [player, setPlayer] = useState(null);
  
  useEffect(() => {
    const audioUrl = `https://your-api.com/audioStreaming/chapters/${chapterId}/audio`;
    
    const newPlayer = new Player(audioUrl, {
      autoDestroy: false,
      continuesToPlayInBackground: true
    });
    
    // Add auth headers (implementation depends on your setup)
    newPlayer.setHTTPHeaders({
      'Authorization': `Bearer ${authToken}`
    });
    
    setPlayer(newPlayer);
    
    return () => {
      if (newPlayer) {
        newPlayer.destroy();
      }
    };
  }, [chapterId, authToken]);
  
  const handleProgressUpdate = async (position) => {
    try {
      await fetch(`https://your-api.com/audioStreaming/chapters/${chapterId}/progress`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          position: Math.floor(position),
          duration: player?.duration || 0,
          playback_speed: player?.playbackRate || 1
        })
      });
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };
  
  return (
    <View>
      {/* Your React Native UI for chapter player */}
    </View>
  );
}
```

## Error Handling

### Robust Error Handling Example

```jsx
import { useState, useEffect } from 'react';
import ChapterPlayer from './components/ChapterPlayer';

function RobustChapterPlayer({ bookId, authToken }) {
  const [chapters, setChapters] = useState([]);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const loadChapters = async () => {
    try {
      setError(null);
      const response = await fetch(`/api/books/${bookId}/chapters`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      setChapters(data.chapters || []);
      setRetryCount(0);
    } catch (err) {
      setError(err.message);
      
      // Auto-retry up to 3 times with exponential backoff
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          loadChapters();
        }, Math.pow(2, retryCount) * 1000);
      }
    }
  };
  
  useEffect(() => {
    if (authToken && bookId) {
      loadChapters();
    }
  }, [authToken, bookId]);
  
  if (error && retryCount >= 3) {
    return (
      <div className="error-state">
        <h3>Unable to load chapters</h3>
        <p>{error}</p>
        <button onClick={() => { setRetryCount(0); loadChapters(); }}>
          Try Again
        </button>
      </div>
    );
  }
  
  if (chapters.length === 0) {
    return <div>Loading chapters...</div>;
  }
  
  return (
    <ChapterPlayer
      authToken={authToken}
      bookId={bookId}
      chapters={chapters}
      onProgressUpdate={(position, status, playbackRate, chapter) => {
        // Handle progress updates with error recovery
        console.log('Progress update:', { chapter: chapter.id, position, status });
      }}
    />
  );
}
```

## Testing

### Unit Test Example (Jest)

```javascript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChapterPlayer from './ChapterPlayer';

const mockChapters = [
  { id: 1, title: 'Chapter 1', duration: 1200 },
  { id: 2, title: 'Chapter 2', duration: 1500 }
];

describe('ChapterPlayer', () => {
  it('renders chapter selection', () => {
    render(
      <ChapterPlayer
        authToken="test-token"
        bookId={123}
        chapters={mockChapters}
      />
    );
    
    expect(screen.getByText('Chapter 1')).toBeInTheDocument();
    expect(screen.getByText('Chapter 2')).toBeInTheDocument();
  });
  
  it('calls progress update on chapter selection', async () => {
    const mockProgressUpdate = jest.fn();
    
    render(
      <ChapterPlayer
        authToken="test-token"
        bookId={123}
        chapters={mockChapters}
        onProgressUpdate={mockProgressUpdate}
      />
    );
    
    fireEvent.click(screen.getByText('Chapter 1'));
    
    await waitFor(() => {
      expect(mockProgressUpdate).toHaveBeenCalled();
    });
  });
});
```

## Summary

The chapter player provides:

1. **Chapter Selection UI** - Easy browsing and selection of chapters
2. **Progress Tracking** - Automatic progress sync using chapter endpoints
3. **Resume Functionality** - Smart resume from last position
4. **Mobile Compatibility** - Works with React Native and mobile browsers
5. **Error Handling** - Robust error recovery and retry logic
6. **Flexible Integration** - Can be used standalone or integrated with existing apps

The key endpoints used are:
- `GET /audioStreaming/chapters/{chapterId}/audio` - Stream chapter audio
- `GET /audioStreaming/chapters/{chapterId}/progress` - Get progress
- `POST /audioStreaming/chapters/{chapterId}/progress` - Update progress
