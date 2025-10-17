# Test PresenceList with Real Users

## Current Status ✅
- PresenceList component is now showing (we fixed the rendering issue)
- The component is working but only shows test users
- We need to test with real users to see if cursor tracking works

## Quick Test with 2 Users

### Step 1: Open Browser 1
1. Go to: http://localhost:5173
2. Sign in with account A (e.g., demo@demo.com)
3. Open any project → any canvas
4. **Move your mouse around the canvas**
5. **Check console** - you should see:
   ```
   🎯 [useCursors] Initializing for: {userId: "...", projectId: "...", canvasId: "..."}
   📡 [Cursor Service] Subscribing to cursors at: projects/.../canvases/.../cursors
   🖱️ [useCursors] Updating cursor position: {userId: "...", x: 100, y: 200, ...}
   ```

### Step 2: Open Browser 2 (Different User!)
1. Open **incognito window** or **different browser**
2. Go to: http://localhost:5173
3. Sign in with **DIFFERENT** account (create new one if needed)
4. Open **SAME** project → **SAME** canvas
5. **Move mouse around**

### Step 3: Check Results

#### Browser 1 should show:
- PresenceList with "2 people"
- Other user's colored cursor moving around
- Console logs showing cursor updates

#### Browser 2 should show:
- PresenceList with "2 people" 
- Other user's colored cursor moving around
- Console logs showing cursor updates

## What to Look For

### ✅ Success Indicators:
```javascript
// Both browsers should see:
📥 [useCursors] Received cursor update: {totalUsers: 2, allUserIds: ["user1", "user2"]}
👥 [useCursors] After filtering current user: {otherUsersCount: 1, otherUserIds: ["user2"]}
✅ [useCursors] Updating cursors state: 1 users
🔍 [PresenceList] Rendering with: {userCount: 1, users: ["OtherUser"]}
✅ [PresenceList] Rendering presence list with 1 users
```

### ❌ Problem Indicators:
```javascript
// If you see this, there's an issue:
📥 [useCursors] Received cursor update: {totalUsers: 1, allUserIds: ["user1"]}
// ↑ Only 1 user means the other user isn't being tracked

// Or this:
⚠️ [PresenceList] No users online, returning null
// ↑ PresenceList disappears because no other users detected
```

## Debug Steps if Not Working

### 1. Check Firebase Data
1. Go to: https://console.firebase.google.com
2. Select project: `collabcanva-d9e10`
3. Go to: **Realtime Database**
4. Navigate to: `projects` → `{your-project-id}` → `canvases` → `canvas-1` → `cursors`
5. **You should see cursor data for both users**

### 2. Check Console Logs
Look for these specific logs:

#### ✅ Good - You Should See:
```javascript
🎯 [useCursors] Initializing for: {userId: "user1", projectId: "project_ABC", canvasId: "canvas-1"}
📡 [Cursor Service] Subscribing to cursors at: projects/project_ABC/canvases/canvas-1/cursors
🖱️ [useCursors] Updating cursor position: {userId: "user1", x: 100, y: 200, projectId: "project_ABC", canvasId: "canvas-1"}
📥 [useCursors] Received cursor update: {totalUsers: 2, allUserIds: ["user1", "user2"]}
```

#### ❌ Bad - Problems:
```javascript
// Wrong path (using global instead of project-specific)
📡 [Cursor Service] Subscribing to cursors at: sessions/global-canvas-v1

// No cursor updates
// (Missing 🖱️ logs means mouse movement isn't being tracked)

// No cursor data received
// (Missing 📥 logs means Firebase subscription isn't working)
```

### 3. Common Issues & Solutions

#### Issue: "No users online" even with 2 users
**Check:**
- Are both users on the **SAME** project and **SAME** canvas?
- Are the projectId and canvasId correct in console logs?
- Is the subscription path correct (not global)?

#### Issue: Only 1 user shows up
**Check:**
- Firebase Realtime Database has cursor data for both users
- Database rules allow read access
- Both users are authenticated

#### Issue: Cursors not moving
**Check:**
- Mouse movement logs (🖱️) are appearing
- Firebase has cursor position data
- Other user is actually moving their mouse

## Expected Behavior

### When Working Correctly:
1. **Both users see PresenceList** with "2 people"
2. **Colored cursors appear** and move in real-time
3. **Click user name** → jumps to their cursor position
4. **Console shows** cursor updates and Firebase data
5. **Firebase database** has cursor data at correct path

### Test Different Scenarios:
1. **Same canvas**: Both should see each other
2. **Different canvas**: Should only see themselves
3. **Different project**: Should only see themselves
4. **One user leaves**: PresenceList should update to "1 person"

## Next Steps

Once you confirm it's working with 2 users:
1. **Remove debug logs** (clean up console)
2. **Test with 3+ users** to ensure scalability
3. **Test edge cases** (user disconnects, network issues)
4. **Add features** (user status, role badges, etc.)

---

**Try the 2-user test now!** Open the same canvas in 2 different browsers and move your mouse around. You should see each other's cursors in real-time! 🎉
