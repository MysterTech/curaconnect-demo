# Audio Upload Debug Steps

## What to Check Now

With the new console logs added, follow these steps:

### Step 1: Open Browser Console
1. Press **F12** (or Cmd+Option+I on Mac)
2. Go to **Console** tab
3. Clear any old messages

### Step 2: Try Upload
1. Click the dropdown arrow (▼) next to "Start Recording"
2. Click "Upload Audio"
3. Select an audio file

### Step 3: Check Console Logs

You should see these logs in order:

```
🖱️ Upload button clicked
📎 File input ref: <input element>
📁 File input changed, files: FileList
📄 File selected: [filename] [type] [size]
✅ File validated, calling onUploadAudio...
🎯 handleUploadAudio called with file: File
📋 Current session: [session-id]
📤 Processing uploaded audio file: [filename] [type] [size]
📦 Created audio blob: [size] bytes, type: [type]
🎤 Starting transcription...
```

### What Each Log Means:

**🖱️ Upload button clicked**
- Dropdown menu item was clicked
- File picker should open

**📁 File input changed**
- You selected a file
- File picker closed

**📄 File selected**
- Shows file details
- If missing: file picker was cancelled

**✅ File validated**
- File type is acceptable
- About to call handler

**🎯 handleUploadAudio called**
- Handler function started
- If missing: prop not connected

**📋 Current session**
- Shows session ID
- If "No session": create session first

**📤 Processing uploaded audio**
- Starting transcription
- If missing: error occurred earlier

## Troubleshooting by Missing Logs

### Missing: 🖱️ Upload button clicked
**Problem:** Click not registering  
**Check:**
- Is dropdown visible?
- Are you clicking the right button?
- Any JavaScript errors?

### Missing: 📁 File input changed
**Problem:** File picker not opening  
**Check:**
- Browser permissions
- File input element exists
- Console errors

### Missing: 📄 File selected
**Problem:** No file chosen  
**Check:**
- Did you cancel file picker?
- Did you select a file?
- File picker opened correctly?

### Missing: ✅ File validated
**Problem:** File type rejected  
**Check:**
- File extension (.wav, .mp3, etc.)
- File MIME type
- Alert message shown?

### Missing: 🎯 handleUploadAudio called
**Problem:** Handler not connected  
**Check:**
- Prop passed to HeaderBar?
- Function defined in parent?
- TypeScript errors?

### Missing: 📋 Current session
**Problem:** No session exists  
**Solution:**
- Create a new session first
- Click "New session" button
- Then try upload

### Missing: 📤 Processing uploaded audio
**Problem:** Error in try block  
**Check:**
- Previous error messages
- Network tab for API calls
- Any exceptions thrown

## Common Scenarios

### Scenario 1: Nothing Happens
**Symptoms:** No logs at all  
**Likely Cause:** Click not registering  
**Solution:**
1. Refresh page
2. Check dropdown is visible
3. Try clicking different area

### Scenario 2: File Picker Opens But Nothing After
**Symptoms:** Only 🖱️ log  
**Likely Cause:** File not selected or cancelled  
**Solution:**
1. Make sure to select a file
2. Don't cancel picker
3. Check file is valid audio

### Scenario 3: File Selected But No Processing
**Symptoms:** Logs up to ✅ but no 🎯  
**Likely Cause:** Handler not called  
**Solution:**
1. Check console for errors
2. Verify prop connection
3. Restart dev server

### Scenario 4: Handler Called But No Session
**Symptoms:** 🎯 log but "No session available"  
**Likely Cause:** Session not created  
**Solution:**
1. Click "New session" first
2. Then try upload
3. Check session state

### Scenario 5: Processing Starts But Fails
**Symptoms:** 📤 log but then error  
**Likely Cause:** API or file issue  
**Solution:**
1. Check API key in .env
2. Verify file format
3. Check network tab

## Quick Test

### Test 1: Dropdown Works
```
1. Click dropdown arrow
2. Should see: 🖱️ Upload button clicked
3. File picker should open
```

### Test 2: File Selection Works
```
1. Select any audio file
2. Should see: 📁 File input changed
3. Should see: 📄 File selected
```

### Test 3: Handler Called
```
1. After file selection
2. Should see: 🎯 handleUploadAudio called
3. Should see: 📋 Current session
```

### Test 4: Processing Works
```
1. After handler called
2. Should see: 📤 Processing uploaded audio
3. Should see: 📦 Created audio blob
4. Should see: 🎤 Starting transcription
```

## What to Report

If still not working, share:

1. **All console logs** (copy/paste)
2. **File details** (name, type, size)
3. **Which step fails** (which log is last)
4. **Any error messages**
5. **Browser and version**

## Expected Full Flow

```
User clicks dropdown
  ↓
🖱️ Upload button clicked
  ↓
File picker opens
  ↓
User selects file
  ↓
📁 File input changed
📄 File selected: test.wav audio/wav 1234567
  ↓
✅ File validated, calling onUploadAudio...
  ↓
🎯 handleUploadAudio called with file: File
📋 Current session: session-abc123
  ↓
📤 Processing uploaded audio file: test.wav audio/wav 1234567
📦 Created audio blob: 1234567 bytes, type: audio/wav
  ↓
🎤 Starting transcription...
  ↓
✅ Transcription result: {...}
📝 Got 5 segments
  ↓
🔍 Analyzing transcript: Patient presents with...
  ↓
✅ Extracted 3 vital signs
✅ Created 2 tasks
```

---

**Try uploading now and share what logs you see!**
