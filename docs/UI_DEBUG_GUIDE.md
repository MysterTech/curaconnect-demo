# UI Update Debugging Guide

## Problem

Gemini is responding with transcription data, but the UI isn't updating to show the new transcript segments.

## Debugging Logs Added

We've added comprehensive logging at three critical points in the data flow:

### 1. Service Layer (GeminiTranscriptionService)

**Location**: `src/services/GeminiTranscriptionService.ts`

- Logs when transcript segments are received from Gemini
- Logs when session is updated with new segments

### 2. Component State (ActiveSessionEnhanced)

**Location**: `src/pages/ActiveSessionEnhanced.tsx`

- Logs when event listener is set up
- Logs when `handleSessionUpdate` callback is triggered
- Logs when React state is updated with new session data
- Logs when session state changes (via useEffect)

### 3. UI Component (TranscriptPanel)

**Location**: `src/components/transcript/TranscriptPanel.tsx`

- Logs when segments prop changes
- Shows segment count and preview of each segment

## How to Test

1. **Start the dev server** (if not already running):

   ```bash
   npm run dev
   ```

2. **Open browser console** (F12 or right-click → Inspect → Console)

3. **Start a recording session** and speak

4. **Watch for these log messages** in order:

   ```
   🎬 Starting chunked transcription (every 15 seconds)
   📦 Getting audio chunk for transcription...
   📤 Transcribing X bytes with Gemini...
   🎤 Starting Gemini transcription for X bytes...
   📝 Converted to base64: X characters
   📨 Gemini API response: {...}
   ✅ Transcription complete: "..."
   📊 Transcription result: { segmentCount: X }
   ✅ Chunk transcribed: X segment(s)
   📝 Transcript updated: X → Y segments
   📢 Notifying X session callbacks
   📤 Calling session callback #1
   🔄 Session update received in UI: { id: "...", transcriptLength: X }
   ✅ UI state updated with new session
   ✅ Session callback #1 completed
   🔄 ActiveSessionEnhanced session state changed: { transcriptLength: X }
   🎯 TranscriptPanel received segments update: { count: X }
   ```

## What to Look For

### ✅ If you see ALL logs:

The data is flowing correctly. The issue might be:

- CSS hiding the elements
- Z-index issues
- Component not rendering due to conditional logic

### ⚠️ If logs stop at "Session update received in UI":

The callback is being triggered but React state isn't updating. Possible causes:

- State update batching issue
- Session object reference not changing (React doesn't detect the change)
- Component unmounted/remounted

### ❌ If logs stop at "Gemini transcript received":

The session isn't being updated. Check:

- SessionManager.updateSession() implementation
- Event emitter setup

### ❌ If no logs appear:

The Gemini service isn't receiving data. Check:

- WebSocket connection
- Gemini API configuration
- Audio streaming

## Quick Fixes to Try

### Fix 1: Force Re-render with New Object Reference

If React isn't detecting the session change, ensure we're creating a new object:

```typescript
// In handleSessionUpdate
setSession({ ...updatedSession }); // Force new reference
```

### Fix 2: Check TranscriptPanel Props

Verify the session.transcript is being passed correctly:

```typescript
// In ActiveSessionEnhanced render
<TranscriptPanel
  segments={session?.transcript || []} // Add fallback
  isLive={recordingState.isRecording && !recordingState.isPaused}
/>
```

### Fix 3: Verify Session Object Structure

Add this log to see the actual session structure:

```typescript
console.log("Full session object:", JSON.stringify(session, null, 2));
```

## Next Steps

Based on the console logs, we can identify exactly where the data flow breaks and apply the appropriate fix.
