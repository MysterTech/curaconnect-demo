# Duplicate Session Creation - FIXED ✅

## Problem
When clicking "New session" button, two sessions were being created:
1. One from the button click
2. One from the useEffect when the component loaded

## Root Cause
The flow was:
1. User clicks "New session" button
2. Button calls `createNewSession()` → creates session #1
3. Navigates to `/session/{newId}`
4. Component re-renders with new sessionId
5. useEffect sees sessionId and tries to load it
6. But there was also logic to create a new session if sessionId === 'new'
7. This created session #2

## Solution

### Changed Button Behavior
- Created new `handleNewSessionClick()` function
- This function always creates a fresh session when clicked
- Shows success toast
- Navigates to the new session

### Changed useEffect Logic
- Removed auto-creation logic for `/session/new`
- Now only loads existing sessions
- Session creation is ONLY triggered by explicit button clicks

### Code Changes

**Before:**
```typescript
// Button
<button onClick={createNewSession}>New session</button>

// useEffect
useEffect(() => {
  if (sessionId && sessionId !== 'new') {
    loadSession(sessionId);
  } else if (sessionId === 'new') {
    createNewSession(); // ❌ Creates duplicate!
  }
}, [sessionId]);
```

**After:**
```typescript
// New handler
const handleNewSessionClick = async () => {
  const newSession = await sessionManager.createSession({...});
  setSession(newSession);
  navigate(`/session/${newSession.id}`, { replace: true });
  showToast('New session created', 'success');
};

// Button
<button onClick={handleNewSessionClick}>New session</button>

// useEffect
useEffect(() => {
  if (sessionId && sessionId !== 'new') {
    loadSession(sessionId); // ✅ Only loads existing
  }
  // No auto-creation
}, [sessionId]);
```

## Testing

### Test Case 1: Click "New session" from sidebar
1. Click "⊕ New session" button
2. ✅ Should create exactly ONE session
3. ✅ Should navigate to `/session/{newId}`
4. ✅ Should show success toast

### Test Case 2: Click "Create" from header
1. Click "Create" button in header
2. ✅ Should create exactly ONE session
3. ✅ Should navigate to `/session/{newId}`
4. ✅ Should show success toast

### Test Case 3: Navigate to existing session
1. Click on a session from the list
2. ✅ Should load that session
3. ✅ Should NOT create a new session

### Test Case 4: Multiple "New session" clicks
1. Click "New session"
2. Wait for it to load
3. Click "New session" again
4. ✅ Should create a second session (expected behavior)
5. ✅ Should NOT create duplicates

## Verification

To verify the fix:
1. Clear your localStorage: `localStorage.clear()` in console
2. Refresh the page
3. Click "New session"
4. Go back to dashboard
5. Check session list - should see only 1 session

## Related Files Modified
- `src/pages/SessionWorkspaceNew.tsx`

## Status
✅ **FIXED** - No more duplicate session creation
