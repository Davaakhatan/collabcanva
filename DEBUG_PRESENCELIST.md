# PresenceList Debugging Guide

## Latest Changes Applied

### What Was Fixed:
1. **Canvas.tsx** now accepts `projectId` and `canvasId` as props
2. **ProjectCanvasPage.tsx** passes these props to Canvas
3. Canvas uses props first, falls back to context
4. Added comprehensive debug logging throughout the flow

## How to Debug

### Step 1: Open Browser Console (F12)

Watch for these logs when you open a canvas:

#### ✅ GOOD - What You Should See:

```javascript
// 1. URL params are extracted
📍 [ProjectCanvasContent] URL params: {
  projectId: "project_JubCV9YkWSRDIWi0ag9nsDTQGnD2_1760741011605",
  canvasId: "canvas-1",
  fullParams: {projectId: "...", canvasId: "canvas-1"}
}

// 2. Canvas receives the IDs
🖼️ [Canvas] Initializing with: {
  propProjectId: "project_JubCV9YkWSRDIWi0ag9nsDTQGnD2_1760741011605",
  propCanvasId: "canvas-1",
  contextProjectId: null,  // might be null initially, that's OK
  contextCanvasId: null,
  finalProjectId: "project_JubCV9YkWSRDIWi0ag9nsDTQGnD2_1760741011605",  // ← MUST NOT BE NULL
  finalCanvasId: "canvas-1",  // ← MUST NOT BE NULL
  cursorsCount: 0
}

// 3. useCursors initializes
🎯 [useCursors] Initializing for: {
  userId: "Ed7gebwCciaICcLMgLrlEmNSeq33",
  projectId: "project_JubCV9YkWSRDIWi0ag9nsDTQGnD2_1760741011605",
  canvasId: "canvas-1"
}

// 4. Subscribing to correct path
📡 [Cursor Service] Subscribing to cursors at: projects/project_JubCV9YkWSRDIWi0ag9nsDTQGnD2_1760741011605/canvases/canvas-1/cursors

// 5. When another user joins, you'll see:
📥 [useCursors] Received cursor update: {
  totalUsers: 2,
  currentUserId: "Ed7gebwCciaICcLMgLrlEmNSeq33",
  allUserIds: ["Ed7gebwCciaICcLMgLrlEmNSeq33", "AnotherUserId123"],
  projectId: "project_JubCV9YkWSRDIWi0ag9nsDTQGnD2_1760741011605",
  canvasId: "canvas-1"
}

// 6. After filtering
👥 [useCursors] After filtering current user: {
  otherUsersCount: 1,
  otherUserIds: ["AnotherUserId123"]
}

// 7. State update
✅ [useCursors] Updating cursors state: 1 users

// 8. PresenceList renders
🎨 [PresenceList Wrapper] Rendering with: {
  projectId: "project_JubCV9YkWSRDIWi0ag9nsDTQGnD2_1760741011605",
  canvasId: "canvas-1",
  cursorsCount: 1,
  cursors: ["AnotherUserId123"]
}

// 9. PresenceList component shows users
🔍 [PresenceList] Rendering with: {
  userCount: 1,
  users: ["OtherUser"]
}

✅ [PresenceList] Rendering presence list with 1 users
```

#### ❌ BAD - Problems to Look For:

```javascript
// Problem 1: Undefined IDs
📍 [ProjectCanvasContent] URL params: {
  projectId: undefined,  // ← PROBLEM!
  canvasId: undefined    // ← PROBLEM!
}

// Problem 2: Using fallback path
📡 [Cursor Service] Subscribing to cursors at: sessions/global-canvas-v1
// ↑ WRONG! Should be: projects/.../canvases/.../cursors

// Problem 3: No cursors received
👥 [Cursor Service] Received cursor data: no users
// ↑ Means nobody else is on this canvas

// Problem 4: PresenceList not rendering
⚠️ [PresenceList] No users online, returning null
```

## Step 2: Test with 2 Users

### Browser 1 (User A):
1. Open http://localhost:5173
2. Sign in as user A
3. Open Projects > Test Project > Main Canvas
4. Open Console (F12)
5. Move mouse around the canvas

**What to check:**
- See your own cursor writing to Firebase
- Path should be: `projects/.../canvases/.../cursors/YOUR_USER_ID`

### Browser 2 (User B):
1. Open http://localhost:5173 (incognito or different browser)
2. Sign in as user B (DIFFERENT account!)
3. Open Projects > SAME "Test Project" > SAME "Main Canvas"
4. Open Console (F12)
5. Move mouse around

**What to check:**
- Browser A should now show: `📥 [useCursors] Received cursor update: { totalUsers: 2 }`
- Browser B should show: `📥 [useCursors] Received cursor update: { totalUsers: 2 }`
- Both should see PresenceList with "2 people"

## Step 3: Verify Firebase Data

### Go to Firebase Console:
1. Open: https://console.firebase.google.com
2. Select your project: `collabcanva-d9e10`
3. Go to: Realtime Database
4. Navigate to: `projects` > `{your-project-id}` > `canvases` > `canvas-1` > `cursors`

### What You Should See:
```json
{
  "projects": {
    "project_JubCV9YkWSRDIWi0ag9nsDTQGnD2_1760741011605": {
      "canvases": {
        "canvas-1": {
          "cursors": {
            "Ed7gebwCciaICcLMgLrlEmNSeq33": {
              "displayName": "demo",
              "cursorColor": "#FF5733",
              "cursorX": 450,
              "cursorY": 320,
              "lastSeen": 1729200000000
            },
            "AnotherUserId123": {
              "displayName": "OtherUser",
              "cursorColor": "#3498DB",
              "cursorX": 720,
              "cursorY": 180,
              "lastSeen": 1729200001000
            }
          }
        }
      }
    }
  }
}
```

### If You See Nothing:
- Check database rules are deployed
- Check if user is authenticated
- Check console for Firebase permission errors
- Verify projectId and canvasId are not null/undefined

## Step 4: Common Issues & Solutions

### Issue 1: "No users online"
**Symptom:** PresenceList shows "No users online" even with multiple users

**Check:**
```javascript
// In console, look for:
cursorsCount: 0  // ← Should be > 0 if other users are present
```

**Solutions:**
- Make sure users are on the SAME project and SAME canvas
- Check if projectId/canvasId are defined (not null/undefined)
- Verify Firebase Realtime Database rules allow read access
- Check if `useCursors` is being called with correct params

### Issue 2: Using Global Path
**Symptom:** All users appear together regardless of canvas

**Check:**
```javascript
// Should see:
📡 [Cursor Service] Subscribing to cursors at: projects/.../canvases/.../cursors

// NOT:
📡 [Cursor Service] Subscribing to cursors at: sessions/global-canvas-v1
```

**Solution:**
- Ensure projectId and canvasId are passed to `useCursors(projectId, canvasId)`
- Check Canvas component receives props from ProjectCanvasPage
- Verify props are not null/undefined

### Issue 3: ProjectId/CanvasId are Null
**Symptom:** finalProjectId or finalCanvasId are null in logs

**Check:**
```javascript
🖼️ [Canvas] Initializing with: {
  propProjectId: "project_...",     // Should have value
  propCanvasId: "canvas-1",         // Should have value
  finalProjectId: null,              // ← PROBLEM if null
  finalCanvasId: null               // ← PROBLEM if null
}
```

**Solutions:**
- Check URL has correct format: `/projects/{projectId}/canvases/{canvasId}`
- Verify `useParams()` is extracting values correctly
- Ensure ProjectCanvasPage passes props to Canvas component

### Issue 4: Permission Errors
**Symptom:** Firebase errors in console about permissions

**Check:**
```javascript
FirebaseError: PERMISSION_DENIED: Permission denied
```

**Solutions:**
- Verify database rules are deployed: `npm run firebase:deploy:database`
- Check if user is authenticated
- Verify path in database rules matches cursor path

## Step 5: Manual Testing Checklist

Use this checklist to verify everything works:

### Pre-Test:
- [ ] Dev server is running (`npm run dev`)
- [ ] Firebase config is correct (`.env` file)
- [ ] Database rules are deployed
- [ ] Firestore rules are deployed

### Test Scenario A - Same Canvas:
- [ ] Open Browser 1, sign in as User A
- [ ] Open Project X > Canvas Y
- [ ] See console logs with correct projectId/canvasId
- [ ] Open Browser 2, sign in as User B
- [ ] Open SAME Project X > SAME Canvas Y
- [ ] Both browsers show "2 people" in PresenceList
- [ ] See colored cursors moving
- [ ] Click user name → jumps to their cursor

### Test Scenario B - Different Canvas:
- [ ] Browser 1: Project X > Canvas A
- [ ] Browser 2: Project X > Canvas B
- [ ] Both show "1 person" (themselves only)
- [ ] No cursors from other user visible

### Test Scenario C - Different Project:
- [ ] Browser 1: Project X > Canvas A
- [ ] Browser 2: Project Y > Canvas A
- [ ] Both show "1 person" (themselves only)
- [ ] No cursors from other user visible

## Step 6: If Still Not Working

### Nuclear Option - Full Reset:

1. **Clear All Browser Data:**
   ```
   Chrome: Settings > Privacy > Clear browsing data
   Firefox: Settings > Privacy > Clear Data
   Safari: Safari > Clear History
   ```

2. **Restart Dev Server:**
   ```bash
   # Stop server (Ctrl+C)
   npm run dev
   ```

3. **Clear Firebase Data:**
   - Go to Firebase Console > Realtime Database
   - Delete everything under `projects`
   - Recreate a test project

4. **Re-deploy Rules:**
   ```bash
   npx firebase-tools deploy --only database --project collabcanva-d9e10
   ```

5. **Check Firebase Auth:**
   - Go to Firebase Console > Authentication
   - Verify users exist
   - Check if users are enabled

6. **Verify Network:**
   - Open Network tab in DevTools
   - Look for WebSocket connections to Firebase
   - Should see: `ws://firebaseio.com/...`
   - Check if data is being sent/received

## Success Criteria

✅ **It's Working When You See:**
1. Console logs show correct projectId and canvasId (not null/undefined)
2. Subscription path includes the specific project and canvas
3. PresenceList shows "2 people" when 2 users are on same canvas
4. Colored cursors appear and move in real-time
5. Clicking user names jumps to their cursor position
6. Firebase Realtime Database has cursor data at correct path

🎉 **You'll know it's fully working when you can:**
- See other users' names in the PresenceList
- See their colored cursors moving around
- Click their name and jump to their location
- Add shapes and see them appear for all users
- Collaborate in real-time on the same canvas

