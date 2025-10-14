# CollabCanvas

A real-time collaborative canvas application where multiple users can create, edit, and manipulate shapes together in real-time. Built with React, TypeScript, Konva.js, and Firebase.

🔗 **Live Demo:** [https://collabcanva-d9e10.web.app](https://collabcanva-d9e10.web.app)

---

## ✨ Features

### Core Functionality
- **🎨 Interactive Canvas** - 5000x5000px workspace with pan and zoom controls
- **📦 Shape Manipulation** - Create, move, resize, rotate, and delete rectangle shapes
- **🔄 Real-time Synchronization** - Changes sync instantly across all connected users (<100ms latency)
- **🔒 Object Locking** - Automatic locking when users interact with shapes to prevent conflicts
- **👥 User Presence** - See who's online and actively working on the canvas
- **🖱️ Multiplayer Cursors** - Track other users' cursor positions in real-time (when Realtime Database is enabled)

### Authentication
- **📧 Email/Password Authentication** - Secure user registration and login
- **🔐 Google Sign-In** - One-click authentication with Google accounts
- **💾 Persistent Sessions** - Stay logged in across browser sessions

### User Experience
- **🎯 Modern UI/UX** - Beautiful gradient design with glassmorphism effects
- **📱 Responsive Design** - Works on desktop and tablet devices
- **❓ Help System** - Interactive tutorial overlay for new users
- **🎭 Empty State** - Helpful onboarding when canvas is empty
- **⚡ Performance** - 60 FPS rendering with 500+ shapes
- **📊 Performance Monitor** - Built-in FPS counter and stress testing tools

---

## 🛠️ Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **Tailwind CSS** - Utility-first CSS framework
- **Konva.js** - HTML5 Canvas library for shape rendering
- **React Konva** - React bindings for Konva

### Backend & Services
- **Firebase Authentication** - User management
- **Cloud Firestore** - Real-time database for canvas state
- **Firebase Realtime Database** - High-frequency updates for cursors (optional)
- **Firebase Hosting** - Static site deployment

### Developer Tools
- **ESLint** - Code linting
- **PostCSS** - CSS processing
- **Firebase CLI** - Deployment management

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Firebase account
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Davaakhatan/collabcanva.git
cd collabcanva
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up Firebase**
   - Create a new Firebase project at [Firebase Console](https://console.firebase.google.com)
   - Enable Authentication (Email/Password and Google)
   - Create a Firestore database
   - (Optional) Create a Realtime Database for multiplayer cursors
   - Copy your Firebase configuration

4. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` with your Firebase credentials:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_DATABASE_URL=https://your-project-default-rtdb.firebaseio.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

5. **Run development server**
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 📦 Building for Production

1. **Build the application**
```bash
npm run build
```

2. **Preview the production build locally**
```bash
npm run preview
```

---

## 🚢 Deployment

### Deploy to Firebase Hosting

1. **Install Firebase CLI** (if not already installed)
```bash
npm install -g firebase-tools
```

2. **Login to Firebase**
```bash
firebase login
```

3. **Initialize Firebase** (first time only)
```bash
firebase init
```
Select:
- Hosting
- Firestore
- Use existing project
- Public directory: `dist`
- Single-page app: `Yes`

4. **Deploy**
```bash
npm run build
firebase deploy
```

Your app will be live at: `https://your-project-id.web.app`

---

## 🎮 How to Use

1. **Sign Up / Login**
   - Create an account with email/password
   - Or sign in with Google

2. **Canvas Controls**
   - **Pan:** Click and drag on empty space
   - **Zoom:** Scroll with mouse wheel
   - **Add Shape:** Click the "Add Shape" button
   - **Move Shape:** Click and drag a shape
   - **Resize:** Click a shape to select, then drag corner handles
   - **Rotate:** Click a shape to select, then drag rotation handle
   - **Delete:** Select a shape and press Delete or Backspace

3. **Collaboration**
   - Multiple users can work simultaneously
   - Shapes are automatically locked when being edited
   - See other users' presence in the top-right panel

---

## 📁 Project Structure

```
collabcanvas/
├── src/
│   ├── components/
│   │   ├── Auth/           # Login & Signup components
│   │   ├── Canvas/         # Canvas, Shape, Controls
│   │   ├── Collaboration/  # Cursors, Presence
│   │   └── Layout/         # Navbar
│   ├── contexts/
│   │   ├── AuthContext.tsx      # Authentication state
│   │   └── CanvasContext.tsx    # Canvas state management
│   ├── hooks/
│   │   ├── useCanvasSync.ts     # Firestore sync
│   │   ├── useCursors.ts        # Cursor tracking
│   │   └── usePresence.ts       # User presence
│   ├── services/
│   │   ├── firebase.ts          # Firebase initialization
│   │   ├── canvas.ts            # Canvas CRUD operations
│   │   └── cursor.ts            # Cursor/presence operations
│   ├── utils/
│   │   ├── constants.ts         # App constants
│   │   ├── helpers.ts           # Utility functions
│   │   └── performance.ts       # FPS monitoring
│   ├── App.tsx                  # Main app component
│   └── main.tsx                 # Entry point
├── public/                      # Static assets
├── firebase.json               # Firebase configuration
├── firestore.rules             # Firestore security rules
├── firestore.indexes.json      # Firestore indexes
└── .env                        # Environment variables (not in git)
```

---

## 🔒 Security

- **Environment Variables** - API keys stored in `.env` file (not committed to git)
- **Firestore Rules** - Database access controlled by authentication
- **Authentication** - Firebase Authentication with secure session management
- **HTTPS** - All traffic encrypted via Firebase Hosting

---

## 🎯 MVP Requirements Met

✅ **Basic canvas with pan/zoom** - 5000x5000px bounded canvas  
✅ **Rectangle shapes** - Create, move, resize, rotate, delete  
✅ **Object locking** - Automatic locking during interactions  
✅ **Real-time sync** - <100ms shape synchronization via Firestore  
✅ **Multiplayer cursors** - Real-time cursor tracking (optional RTDB)  
✅ **Presence awareness** - See online users  
✅ **User authentication** - Email/Password + Google Sign-In  
✅ **Performance** - 60 FPS with 500+ shapes  
✅ **Deployed** - Live on Firebase Hosting  

---

## 🚀 Performance

- **60 FPS** rendering during all interactions
- **<100ms** shape change synchronization
- **<50ms** cursor position updates (when Realtime Database enabled)
- **500+ shapes** supported without FPS drops
- **5+ concurrent users** tested successfully

---

## 🔮 Future Enhancements

- [ ] Multiple shape types (circles, text, lines)
- [ ] Custom shape colors and styling
- [ ] Undo/redo functionality
- [ ] Multi-select and grouping
- [ ] Export to PNG/SVG
- [ ] Keyboard shortcuts
- [ ] Touch/mobile optimizations
- [ ] Voice chat integration
- [ ] AI-powered design suggestions

---

## 🐛 Known Issues

- Multiplayer cursors require Realtime Database to be manually created in Firebase Console
- Currently supports rectangles only (other shapes coming in v2)
- Mobile touch gestures need optimization

---

## 📝 License

This project is built as an assessment project for educational purposes.

---

## 🙏 Acknowledgments

- **React** - Facebook Open Source
- **Konva.js** - Anton Lavrenov
- **Firebase** - Google
- **Tailwind CSS** - Tailwind Labs

---

## 👨‍💻 Developer

Built with ❤️ by Davaakhatan

**Live Demo:** [https://collabcanva-d9e10.web.app](https://collabcanva-d9e10.web.app)  
**Repository:** [https://github.com/Davaakhatan/collabcanva](https://github.com/Davaakhatan/collabcanva)

---

## 📧 Support

For questions or issues, please open an issue on GitHub or contact the developer.

---

**Last Updated:** October 2025
