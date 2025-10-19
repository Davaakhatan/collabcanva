# Environment Setup

## Firebase Configuration

This project uses Firebase for authentication, database, and storage. To set up your environment:

### 1. Create a `.env` file

Copy the example file and fill in your Firebase credentials:

```bash
cp env.example .env
```

### 2. Get your Firebase credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to Project Settings (gear icon) > General tab
4. Scroll down to "Your apps" section
5. If you don't have a web app, click "Add app" and select the web icon
6. Copy the configuration values to your `.env` file

### 3. Required Environment Variables

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
VITE_FIREBASE_MEASUREMENT_ID=G-YOUR_MEASUREMENT_ID
```

### 4. Security Notes

- **NEVER commit your `.env` file to version control**
- The `.env` file is already in `.gitignore`
- Your API key is safe to use in client-side code (Firebase handles security)
- For production, consider using Firebase App Check for additional security

### 5. Running the Fix Script

If you need to run the `fix-user-projects.js` script:

```bash
# Make sure your .env file is set up first
node fix-user-projects.js
```

The script will automatically load your environment variables and validate that all required values are present.
