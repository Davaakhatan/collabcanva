# PresenceList Test - RIGHT NOW

## What I Just Fixed

1. **Made PresenceList always show** (temporarily)
2. **Added a test user** so you can see it working
3. **Added fallback message** when no real users are online
4. **Enhanced debug logging** to track what's happening

## What You Should See NOW

### 1. Refresh the page (F5)
You should now see a **draggable panel** in the bottom-left corner that says:
- "Online" 
- "1 person" (the test user)
- A colored circle with "T" (for Test User)

### 2. Check Console Logs
Look for these logs in the browser console:

```javascript
🚀 [PresenceList Wrapper] Component called with: {projectId: "...", canvasId: "canvas-1"}
🎨 [PresenceList Wrapper] Rendering with: {cursorsCount: 0, ...}
🧪 [PresenceList Wrapper] Using test cursors: 1 users
🔍 [PresenceList] Rendering with: {userCount: 1, users: ["Test User"]}
✅ [PresenceList] Rendering presence list with 1 users
```

### 3. If You DON'T See the Panel

**Check these things:**

1. **Look at the bottom-left corner** - it might be positioned there
2. **Check if it's behind other elements** - try scrolling or resizing window
3. **Look for console errors** - any red errors in console?
4. **Check if the component is being called** - look for the 🚀 log

### 4. Test the Dragging

- **Click and drag** the panel header to move it around
- **Click the arrow** to expand/collapse
- **Click "Test User"** to jump to their cursor position

## If It's Still Not Working

### Check Console for These Logs:

#### ✅ GOOD - You Should See:
```javascript
🚀 [PresenceList Wrapper] Component called with: {projectId: "project_...", canvasId: "canvas-1"}
🧪 [PresenceList Wrapper] Using test cursors: 1 users
✅ [PresenceList] Rendering presence list with 1 users
```

#### ❌ BAD - Problems:
```javascript
// Missing the wrapper call
// (No 🚀 log means the component isn't being rendered)

// Wrong projectId/canvasId
projectId: undefined, canvasId: undefined

// No cursors
cursorsCount: 0
```

### Quick Debug Steps:

1. **Hard refresh**: Ctrl+F5 (or Cmd+Shift+R on Mac)
2. **Check URL**: Should be `/projects/.../canvases/canvas-1`
3. **Open DevTools**: F12, look at Console tab
4. **Look for errors**: Any red error messages?

## Next Steps After It Works

### 1. Test with Real Users:
1. Open **Browser 1**: http://localhost:5173
2. Sign in as **User A**
3. Open any project's canvas
4. Open **Browser 2** (incognito): http://localhost:5173  
5. Sign in as **User B** (different account!)
6. Open **SAME** project and canvas
7. Both should see "2 people" in PresenceList

### 2. Remove Test Code:
Once it's working, I'll remove the test user and restore the normal behavior.

## What the PresenceList Should Look Like

```
┌─────────────────────────┐
│ 🟢 Online               │ ← Green pulsing dot
│ 1 person          ▼    │ ← User count, collapse arrow
├─────────────────────────┤
│ [T] Test User           │ ← Colored circle with initial
│    ● Follow        →    │ ← Color dot, "Follow" text, arrow
└─────────────────────────┘
```

## Position
- **Default**: Bottom-left corner
- **Draggable**: Click and drag the header
- **Fixed**: Stays in position when scrolling

## Colors
- **Background**: Semi-transparent white/dark
- **Border**: Subtle gray border
- **User circles**: Different colors for each user
- **Hover effects**: Blue highlights on hover

---

**Try it now!** Refresh the page and look for the draggable panel in the bottom-left corner. If you see it, the PresenceList is working! 🎉
