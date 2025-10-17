# Firebase Debug Test

## Current Issue
Both users show "0 people" in PresenceList, which means the Firebase Realtime Database subscription isn't working properly.

## Debug Steps

### 1. Check Console for Firebase Errors
Look for these error messages in the console:

```javascript
// Firebase connection errors
🔥 [Cursor Service] Firebase subscription error: [error details]

// Realtime Database initialization errors
Realtime Database initialization failed: [error details]
Multiplayer cursors and presence features will be disabled

// Demo configuration warnings
⚠️ Using demo Firebase configuration. Please set up your .env file with real Firebase credentials
```

### 2. Check Firebase Configuration
Look for these logs in console:

```javascript
// Should see:
📡 [Cursor Service] Subscribing to cursors at: projects/project_ABC/canvases/canvas-1/cursors
👥 [Cursor Service] Received cursor data: {path: "...", hasData: true, userCount: 1, rawData: {...}}

// If you see:
👥 [Cursor Service] Received cursor data: {path: "...", hasData: false, userCount: 0, rawData: null}
// ↑ This means Firebase is connected but no data is being written/read
```

### 3. Check Firebase Console
1. Go to: https://console.firebase.google.com
2. Select project: `collabcanva-d9e10`
3. Go to: **Realtime Database**
4. Look for data at: `projects` → `{your-project-id}` → `canvases` → `canvas-1` → `cursors`

### 4. Common Issues & Solutions

#### Issue 1: Demo Firebase Configuration
**Symptom:** Console shows "⚠️ Using demo Firebase configuration"
**Solution:** Check if `.env` file exists and has real Firebase credentials

#### Issue 2: Realtime Database Not Initialized
**Symptom:** Console shows "Realtime Database initialization failed"
**Solution:** Firebase project might not have Realtime Database enabled

#### Issue 3: Database Rules Not Deployed
**Symptom:** Firebase subscription errors about permissions
**Solution:** Deploy database rules: `npm run firebase:deploy:database`

#### Issue 4: Wrong Firebase Project
**Symptom:** Data not appearing in Firebase Console
**Solution:** Check if using correct Firebase project ID

## Quick Test

### Test 1: Check Firebase Connection
1. Open browser console
2. Look for Firebase initialization logs
3. Check for any error messages

### Test 2: Check Database Rules
1. Go to Firebase Console → Realtime Database
2. Check if rules are deployed
3. Look for cursor data at correct path

### Test 3: Manual Firebase Test
1. Go to Firebase Console → Realtime Database
2. Manually add data at: `projects/test/canvases/canvas-1/cursors/user1`
3. See if it appears in the app

## Expected Console Output (Working)

```javascript
// Initialization
🎯 [useCursors] Initializing for: {userId: "user1", projectId: "project_ABC", canvasId: "canvas-1"}
📡 [Cursor Service] Subscribing to cursors at: projects/project_ABC/canvases/canvas-1/cursors

// Cursor updates
🖱️ [useCursors] Updating cursor position: {userId: "user1", x: 100, y: 200, projectId: "project_ABC", canvasId: "canvas-1"}

// Data received from Firebase
👥 [Cursor Service] Received cursor data: {path: "projects/project_ABC/canvases/canvas-1/cursors", hasData: true, userCount: 2, rawData: {...}}
📥 [useCursors] Received cursor update: {totalUsers: 2, allUserIds: ["user1", "user2"], rawData: {...}}
```

## If Still Not Working

### Nuclear Option - Reset Firebase
1. **Clear browser data** (localStorage, sessionStorage)
2. **Restart dev server** (`npm run dev`)
3. **Check Firebase project** is correct
4. **Redeploy database rules**
5. **Test with fresh browser sessions**

---

**Check the console logs now and let me know what Firebase errors you see!** This will help us identify if it's a configuration issue, rules issue, or connection problem.
