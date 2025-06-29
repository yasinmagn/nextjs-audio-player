# NextJS Audio Player with Authentication

A feature-rich, mobile-optimized audio player component for NextJS applications with built-in authentication system. Designed for streaming audio from Node.js backends with full iOS AVPlayer, Android MediaPlayer, and React Native compatibility.

> **📖 Note**: This version uses the new `/audioStreaming/bookintro/{bookId}/audio` endpoint structure with configurable book IDs.

## ✨ Features

- **🔐 Complete Authentication System**: Built-in login with JWT token management
- **📱 Mobile Optimized**: Works seamlessly on iOS and Android devices
- **🎵 Streaming Support**: Direct streaming from authenticated API endpoints
- **⚡ Progress Tracking**: Real-time progress updates with backend synchronization
- **🎛️ Full Controls**: Play, pause, seek, volume, playback speed controls
- **📍 Bookmarking**: Save and resume from specific positions
- **⬇️ Download Support**: Authenticated file downloads
- **🔄 Auto-Resume**: Remembers playback position across sessions
- **🎨 Modern UI**: Clean, responsive design with Tailwind CSS
- **🛠️ Developer Friendly**: Environment variable support for development

## 🚀 Quick Start

### 1. Environment Setup

Copy the environment template and configure your settings:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000

# Default Login Credentials (for development/testing)
NEXT_PUBLIC_DEFAULT_EMAIL=user@example.com
NEXT_PUBLIC_DEFAULT_PASSWORD=password123
```

### 2. Installation

```bash
npm install
# or
yarn install
```

### 3. Usage

The complete app with authentication and book selection:

```jsx
import App from '../components/App';

export default function Home() {
  return <App />;
}
```

Or use the standalone AudioPlayer component with dynamic book selection:

```jsx
import { useState, useEffect } from 'react';
import AudioPlayer from './AudioPlayer';

function BookPlayerPage() {
  const [books, setBooks] = useState([]);
  const [selectedBookId, setSelectedBookId] = useState(null);
  const [authToken, setAuthToken] = useState('your-jwt-token');

  // Fetch available books
  useEffect(() => {
    const fetchBooks = async () => {
      const response = await fetch('/booksManagement/books', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const booksData = await response.json();
      setBooks(booksData);
      if (booksData.length > 0) {
        setSelectedBookId(booksData[0].id); // Auto-select first book
      }
    };
    
    if (authToken) {
      fetchBooks();
    }
  }, [authToken]);

  return (
    <div>
      {/* Book Selection */}
      <div className="mb-4">
        <h3>Select a Book:</h3>
        <div className="grid grid-cols-2 gap-4">
          {books.map(book => (
            <div 
              key={book.id}
              onClick={() => setSelectedBookId(book.id)}
              className={`p-4 border rounded cursor-pointer ${
                selectedBookId === book.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
            >
              <h4>{book.title || `Book #${book.id}`}</h4>
              {book.author && <p className="text-sm text-gray-600">by {book.author}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* Audio Player */}
      {selectedBookId && (
        <AudioPlayer
          authToken={authToken}
          bookId={selectedBookId}
          autoPlay={false}
          showDownload={true}
          showBookmark={true}
          onProgressUpdate={(position, status, playbackRate) => {
            console.log('Progress:', { position, status, playbackRate });
          }}
        />
      )}
    </div>
  );
}
```

## 🔐 Authentication Flow

### 1. Login Process
1. User enters credentials (or uses environment defaults in development)
2. App calls `POST /user/login` endpoint
3. Server returns JWT token: `{ "token": "jwt_token_here" }`
4. Token is stored in localStorage and used for all API calls
5. AudioPlayer becomes accessible

### 2. Environment Variables for Development

For development/testing, set default credentials in `.env.local`:

```env
NEXT_PUBLIC_DEFAULT_EMAIL=test@example.com
NEXT_PUBLIC_DEFAULT_PASSWORD=testpassword
```

In development mode, the login form will:
- Pre-fill with these credentials
- Show a "Load Default Credentials" button
- Display development mode indicators

### 3. Token Management
- Automatic token validation on app startup
- Secure token storage in localStorage
- Automatic logout on token expiration
- Token included in all API requests

## 📡 Required API Endpoints

Your backend should implement these endpoints:

### Authentication
```bash
POST /user/login
# Body: { "email": "user@example.com", "password": "password" }
# Response: { "token": "jwt_token_here", "user": {...} }

GET /user/me
# Headers: Authorization: Bearer {token}
# Response: { "id": 1, "email": "user@example.com", "name": "User" }
```

### Books Management
```bash
# Get list of available books
GET /booksManagement/books
# Headers: Authorization: Bearer {token}
# Response: [{ "id": 1, "title": "Book Title", "author": "Author Name", "description": "..." }, ...]
```

### Audio Streaming
```bash
# Stream audio for a specific book
GET /audioStreaming/bookintro/{bookId}/audio
# Headers: Authorization: Bearer {token}

# Update book progress
POST /audioStreaming/bookintro/{bookId}/progress
# Headers: Authorization: Bearer {token}
# Body: { "position": 120, "duration": 3600, "playback_speed": 1.0 }

# Get book progress  
GET /audioStreaming/bookintro/{bookId}/progress
# Headers: Authorization: Bearer {token}
# Response: { "position": 120, "completion_percentage": 25, "is_finished": false }
```

### Legacy Audio Endpoints (Optional)
```bash
GET /booksManagement/chapters/{chapterId}/audio
GET /booksManagement/audio/{audioId}/stream
# Headers: Authorization: Bearer {token}
```

## 🎯 Component Props

### App Component (Full Authentication)
```jsx
<App />  // No props needed - handles everything
```

### AudioPlayer Component (Standalone)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `authToken` | string | required | JWT authentication token |
| `bookId` | string | null | Book ID for streaming |
| `chapterId` | string | null | Chapter ID for streaming |
| `audioId` | string | null | Specific audio ID for streaming |
| `apiBaseUrl` | string | env var | API base URL |
| `autoPlay` | boolean | false | Auto-start playback |
| `showDownload` | boolean | true | Show download button |
| `showBookmark` | boolean | true | Show bookmark button |
| `onProgressUpdate` | function | null | Progress callback |
| `className` | string | '' | Additional CSS classes |

## 🔒 Security Features

- **JWT Token Management**: Secure token storage and validation
- **Authenticated Requests**: All API calls include authentication headers
- **Token Validation**: Automatic token validation on app startup
- **Secure Downloads**: Authenticated file downloads
- **Environment Safety**: Development credentials only in development mode
- **CORS Support**: Handles cross-origin requests properly

## 📱 Mobile Compatibility

- **iOS**: Compatible with AVPlayer
- **Android**: Compatible with MediaPlayer
- **React Native**: Ready for React Native integration
- **Touch Optimized**: Mobile-friendly controls and gestures
- **Responsive Design**: Adapts to different screen sizes

## 🛠️ Development

### Running the Development Server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

### Building for Production

```bash
npm run build
npm start
# or
yarn build
yarn start
```

### Development Features

- Debug logging in development mode
- Default credential loading
- Environment mode indicators
- Hot reloading support
- Development helpers in login form

## 🎨 Styling

Built with Tailwind CSS for easy customization:

```jsx
<AudioPlayer 
  className="my-custom-styles shadow-xl bg-gray-50"
  // ... other props
/>
```

## 🐛 Troubleshooting

### Common Issues

1. **Login Failures**
   - Verify backend returns `{ token: "..." }` format
   - Check CORS settings on your backend
   - Ensure `/user/login` endpoint accepts POST requests
   - Verify credentials in `.env.local` for development

2. **Audio Not Playing**
   - Check browser console for authentication errors
   - Verify token is being sent in request headers
   - Test audio URLs directly with authentication
   - Check CORS settings for audio endpoints

3. **Environment Variables Not Loading**
   - Ensure `.env.local` exists in project root
   - Variables must start with `NEXT_PUBLIC_` for client-side access
   - Restart development server after changing variables
   - Check file is not named `.env.local.txt` or similar

4. **Token Validation Issues**
   - Check `/user/me` endpoint exists and works
   - Verify JWT token format and expiration
   - Check for token in localStorage via browser dev tools
   - Ensure backend accepts `Authorization: Bearer {token}` format

### Debug Information

Enable debug logging by setting `NODE_ENV=development`. Check browser console for:
- Authentication status
- API request/response details
- Audio loading progress
- Error messages and stack traces

## 📦 Dependencies

- React 18+
- Next.js 14+
- Lucide React (icons)
- Tailwind CSS (optional, for styling)

## 📄 File Structure

```
nextjs-audio-player/
├── AudioPlayer.jsx           # Main audio player component
├── components/
│   ├── App.jsx              # Main app with authentication
│   └── Login.jsx            # Login form component
├── contexts/
│   └── AuthContext.jsx     # Authentication context
├── utils/
│   └── config.js           # Configuration utilities
├── pages/
│   ├── index.js            # Main page
│   └── demo.jsx            # Demo page
├── .env.example            # Environment template
├── .env.local              # Your environment variables
└── package.json            # Dependencies
```

## 🔄 Migration Guide

### From v1.0 (No Auth) to v2.0 (With Auth)

1. **Update imports**:
   ```jsx
   // Old
   import AudioPlayer from './AudioPlayer';
   
   // New - Full app with auth
   import App from './components/App';
   
   // Or continue using AudioPlayer directly
   import AudioPlayer from './AudioPlayer';
   // But now requires authToken prop
   ```

2. **Add environment variables**:
   ```env
   NEXT_PUBLIC_API_URL=your_api_url
   NEXT_PUBLIC_DEFAULT_EMAIL=dev_email
   NEXT_PUBLIC_DEFAULT_PASSWORD=dev_password
   ```

3. **Update backend** to support authentication endpoints

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

**Ready to stream? 🎵 Set up your environment variables and start your backend API!**

## 🎯 Features

- ✅ **Mobile Native Support**: iOS (AVPlayer), Android (MediaPlayer), React Native
- ✅ **HTTP Range Requests**: Seeking support for large audio files
- ✅ **Progress Tracking**: Automatic sync with backend every 30 seconds
- ✅ **Multiple Format Support**: MP3, M4A, AAC, WAV
- ✅ **Playback Controls**: Speed (0.5x-2x), Volume, Seek, Skip
- ✅ **Offline Support**: Download for offline listening
- ✅ **Bookmark System**: Save and resume from specific positions
- ✅ **Responsive Design**: Touch-optimized for mobile
- ✅ **Authentication**: JWT token support
- ✅ **Error Handling**: Graceful fallbacks and retries

## 🚀 Quick Start

### 1. Installation

```bash
npm install lucide-react
# or
yarn add lucide-react
```

### 2. Basic Usage

```jsx
import AudioPlayer from './components/AudioPlayer';

function MyPage() {
  return (
    <AudioPlayer
      bookId={123}
      authToken="your-jwt-token"
      apiBaseUrl="https://your-api.com"
      onProgressUpdate={(position, status, speed) => {
        console.log(`Progress: ${position}s, Status: ${status}`);
      }}
    />
  );
}
```

### 3. Environment Variables

```bash
# .env.local
NEXT_PUBLIC_API_URL=https://your-backend-api.com
```

## 📱 Mobile Optimization

### iOS Native Support
- **Audio Formats**: `audio/mp4` (M4A), `audio/mpeg` (MP3)
- **Player**: Native AVPlayer integration
- **Features**: Background playback, lock screen controls

### Android Native Support  
- **Audio Formats**: `audio/aac` (AAC), `audio/mpeg` (MP3)
- **Player**: Native MediaPlayer integration
- **Features**: Background playback, notification controls

### React Native Compatibility
- **Libraries**: Works with `expo-av`, `react-native-track-player`
- **Formats**: Universal `audio/mpeg` support
- **Integration**: WebView or native module bridge

## 🔧 API Integration

The player integrates with these backend endpoints:

### Books Management
```
# Get list of available books
GET /booksManagement/books
Response: [
  {
    "id": 1,
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald", 
    "description": "A classic American novel..."
  }
]
```

### Streaming Endpoints
```
# Stream audio for selected book
GET /audioStreaming/bookintro/{bookId}/audio

# Legacy endpoints (still supported)
GET /booksManagement/chapters/{chapterId}/audio
GET /booksManagement/audio/{audioId}/stream
```

### Progress Tracking
```
# Update listening progress
POST /audioStreaming/bookintro/{bookId}/progress
Body: {
  "position": 120,
  "duration": 3600,
  "playback_speed": 1.5
}

# Get current progress
GET /audioStreaming/bookintro/{bookId}/progress
Response: {
  "position": 120,
  "completion_percentage": 25,
  "is_finished": false
}
```

## 🎛️ Component Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `bookId` | number | null | ID of book to stream |
| `chapterId` | number | null | ID of chapter to stream |
| `audioId` | number | null | Direct audio ID |
| `authToken` | string | required | JWT authentication token |
| `apiBaseUrl` | string | env var | Backend API base URL |
| `autoPlay` | boolean | false | Start playing automatically |
| `showDownload` | boolean | true | Show download button |
| `showBookmark` | boolean | true | Show bookmark button |
| `onProgressUpdate` | function | null | Progress callback |
| `className` | string | '' | Custom CSS classes |

## 💻 Usage Examples

### Book Player
```jsx
<AudioPlayer
  bookId={123}
  authToken={token}
  autoPlay={true}
  onProgressUpdate={(pos, status, speed) => {
    // Sync with your state management
    dispatch(updateProgress({ bookId: 123, position: pos }));
  }}
/>
```

### Chapter Playlist
```jsx
function ChapterPlaylist({ chapters, currentChapter }) {
  return (
    <div>
      <AudioPlayer
        chapterId={currentChapter}
        authToken={useAuth()}
        onProgressUpdate={(pos, status) => {
          if (status === 'completed') {
            // Auto-advance to next chapter
            setCurrentChapter(getNextChapter());
          }
        }}
      />
    </div>
  );
}
```

### Custom Progress Tracking
```jsx
function CustomPlayer() {
  const [bookmarks, setBookmarks] = useState([]);
  
  const handleProgress = async (position, status, speed) => {
    // Save to custom backend
    await saveProgress({
      position,
      status,
      speed,
      timestamp: Date.now()
    });
    
    // Update local state
    if (status === 'bookmarked') {
      setBookmarks(prev => [...prev, { position, time: Date.now() }]);
    }
  };
  
  return (
    <AudioPlayer
      bookId={bookId}
      onProgressUpdate={handleProgress}
    />
  );
}
```

## 🛠️ Development

### Running the Demo

```bash
cd nextjs-audio-player
npm install
npm run dev
```

Visit `http://localhost:3000/demo` to see the interactive demo.

### Project Structure

```
nextjs-audio-player/
├── AudioPlayer.jsx          # Main component
├── pages/demo.jsx           # Demo page
├── USAGE.md                 # Detailed usage examples
├── package.json             # Dependencies
└── README.md                # This file
```

### Testing on Mobile

1. **iOS Testing**:
   ```bash
   # Use iOS Simulator or real device
   npm run dev
   # Open in Safari, test audio/mp4 and audio/mpeg
   ```

2. **Android Testing**:
   ```bash
   # Use Android Emulator or real device
   npm run dev
   # Open in Chrome, test audio/aac and audio/mpeg
   ```

3. **React Native Integration**:
   ```jsx
   // Use WebView or create native bridge
   import { WebView } from 'react-native-webview';
   
   <WebView source={{ uri: 'https://your-app.com/audio-player' }} />
   ```

## 🔐 Authentication

The player supports JWT authentication:

```jsx
// Get token from your auth provider
const token = await authProvider.getToken();

<AudioPlayer
  bookId={123}
  authToken={token}
  onError={(error) => {
    if (error.includes('401')) {
      // Handle token expiration
      refreshToken();
    }
  }}
/>
```

## 📊 Supported Audio Formats

| Format | MIME Type | iOS | Android | React Native | File Extension |
|--------|-----------|-----|---------|--------------|----------------|
| MP3 | `audio/mpeg` | ✅ | ✅ | ✅ | `.mp3` |
| M4A | `audio/mp4` | ✅ | ⚠️ | ✅ | `.mp4` |
| AAC | `audio/aac` | ✅ | ✅ | ✅ | `.aac` |
| WAV | `audio/wav` | ✅ | ✅ | ✅ | `.wav` |

## ⚡ Performance Tips

1. **Preload Strategy**: Component uses `preload="metadata"` for faster loading
2. **Progress Interval**: Updates every 30 seconds to balance UX and performance  
3. **Range Requests**: Enables seeking without downloading entire file
4. **Error Recovery**: Automatic retries with exponential backoff
5. **Memory Management**: Cleanup intervals and event listeners on unmount

## 🌐 Browser Support

- ✅ Chrome 60+ (Desktop/Mobile)
- ✅ Firefox 55+ (Desktop/Mobile)
- ✅ Safari 12+ (Desktop/Mobile)
- ✅ Edge 79+
- ✅ iOS Safari 12+
- ✅ Samsung Internet 8+

## 🚀 Deployment

### Vercel Deployment
```bash
npm run build
vercel --prod
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 📄 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

- 📧 Email: support@yourapp.com
- 🐛 Issues: [GitHub Issues](https://github.com/yourrepo/issues)
- 📖 Docs: [Full Documentation](https://docs.yourapp.com)

---

Built with ❤️ for seamless audio streaming experiences across all devices.

# NextJS Audio Player Demo

## Overview
This project demonstrates a robust audio player with resume and completion logic, suitable for web and adaptable for React Native mobile apps.

## Key Features
- **Resume Playback**: If the user has previously listened to part of a book (progress.position > 0 and completion_percentage < 100), a Resume button appears. Clicking it resumes playback from the last saved position.
- **Start Over**: If the user has finished the book (is_finished is true/1 or completion_percentage is 100), a Start Over Again button appears, letting the user restart from the beginning.
- **Mutual Exclusivity**: Only one of Resume or Start Over Again is shown at a time, never both.
- **Secure Streaming**: All API requests use the Bearer token from login for authentication.
- **Progress Tracking**: The player regularly updates the backend with the user's current position and playback speed.

## How It Works (Step-by-Step)
1. **On Load**: The player calls the progress endpoint:
   `/audioStreaming/bookintro/{BOOK_ID}/progress`
   - If `progress.position > 0` and `completion_percentage < 100`, Resume is shown.
   - If `is_finished` is true/1 or `completion_percentage` is 100, Start Over Again is shown.
2. **Resume**: Clicking Resume fetches the audio with `?resume=true` and starts playback from the last saved position.
3. **Start Over**: Clicking Start Over Again sets playback to the beginning and starts playing.
4. **Progress Updates**: The player sends progress updates to the backend as the user listens.
5. **Authentication**: All endpoints require the Bearer token from login.

## Example Usage (Web)
- Open the demo in your browser.
- Log in to get your Bearer token.
- Play a book. Pause and return later to see the Resume button.
- Finish a book to see the Start Over Again button.

## Adapting for React Native Mobile
- Use the same API logic for progress and streaming endpoints.
- Use `fetch` with Bearer token for all requests.
- Use the [react-native-audio-toolkit](https://github.com/react-native-audio-toolkit/react-native-audio-toolkit) or [expo-av](https://docs.expo.dev/versions/latest/sdk/av/) for audio playback.
- Set the audio source to the streaming endpoint, and set `currentTime` to the resume position after metadata loads.
- Show Resume or Start Over Again buttons based on the same logic as above.

## Example Resume Logic (React Native)
```js
// Pseudocode for React Native
const progress = await fetch(`/audioStreaming/bookintro/${bookId}/progress`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json());
if (progress.progress.position > 0 && progress.progress.completion_percentage < 100) {
  // Show Resume
}
if (progress.progress.is_finished === 1 || progress.progress.completion_percentage === 100) {
  // Show Start Over Again
}
```

## API Endpoints
- `GET /booksManagement/books` - Gets list of available books with metadata.
- `GET /audioStreaming/bookintro/{bookId}/audio?resume=true` - Streams audio, resuming if possible.
- `GET /audioStreaming/bookintro/{bookId}/progress` - Gets user progress for the book.
- `POST /audioStreaming/bookintro/{bookId}/progress` - Updates user progress.

## Notes for Junior Developers
- Always check for a valid Bearer token before making API calls.
- Use the progress endpoint to determine which button to show.
- Only one of Resume or Start Over Again should be visible at a time.
- When resuming, set the audio's currentTime to the saved position after metadata loads.
- For mobile, use the appropriate audio library and follow the same logic for progress and resume.

---

## Environment Configuration: Setting Username and Password

To run this project locally, you may want to pre-configure default login credentials for development and testing. This is done using the `.env.local` file in the project root.

### Example `.env.local` file:
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:10000

# Default Login Credentials (for development/testing)
NEXT_PUBLIC_DEFAULT_EMAIL=your@email.com
NEXT_PUBLIC_DEFAULT_PASSWORD=yourpassword

# Alternative: Use non-public variables for better security in production
DEFAULT_LOGIN_EMAIL=your@email.com
DEFAULT_LOGIN_PASSWORD=yourpassword
```

- `NEXT_PUBLIC_DEFAULT_EMAIL` and `NEXT_PUBLIC_DEFAULT_PASSWORD` are used for development and can be accessed on the client side.
- `DEFAULT_LOGIN_EMAIL` and `DEFAULT_LOGIN_PASSWORD` are for server-side use only and should not be exposed to the client in production.

**Important:** Never commit real credentials to version control. Use environment variables for sensitive data.
