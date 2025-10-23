# 🔧 Fix: WebSocket Closing Immediately

## The Problem

You're seeing:
```
WebSocket is already in CLOSING or CLOSED state.
```

This means the Gemini Live API connection is being rejected immediately.

## Most Common Causes

### 1. API Key Issues (90% of cases)

#### Check #1: API Key Format
Your API key should start with `AIzaSy`

**Test:**
```javascript
// In browser console
console.log(import.meta.env.VITE_GEMINI_API_KEY);
```

**Expected:** `AIzaSyDDmORABBHdyjg4JQ_7bPvNokvA0GODj8Q`
**If you see:** `undefined` → API key not loaded

#### Check #2: API Key Permissions
Your API key needs **Gemini API** access enabled.

**Fix:**
1. Go to: https://aistudio.google.com/apikey
2. Click on your API key
3. Verify "Generative Language API" is enabled
4. If not, enable it

#### Check #3: API Key Restrictions
Your API key might have restrictions that block the Live API.

**Fix:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Find your API key
3. Check "API restrictions"
4. Make sure "Generative Language API" is allowed
5. Check "Application restrictions" - should be "None" for testing

### 2. Model Not Available (5% of cases)

The model `gemini-2.0-flash-exp` might not be available in your region or account.

**Fix:**
The updated test now tries multiple models automatically:
1. `gemini-2.0-flash-exp` (experimental)
2. `gemini-1.5-flash` (stable)
3. `gemini-1.5-pro` (high quality)

Check console to see which model it's trying.

### 3. API Quota Exceeded (3% of cases)

You might have exceeded your API quota.

**Check:**
1. Go to: https://console.cloud.google.com/apis/api/generativelanguage.googleapis.com/quotas
2. Look for "Requests per minute" and "Requests per day"
3. Check if you've hit the limit

**Fix:**
- Wait for quota to reset (usually 1 minute)
- Or upgrade your quota
- Or create a new API key

### 4. Network/Firewall Issues (2% of cases)

Your network might be blocking WebSocket connections.

**Check:**
```javascript
// Test WebSocket connectivity
const ws = new WebSocket('wss://echo.websocket.org');
ws.onopen = () => console.log('✅ WebSocket works');
ws.onerror = () => console.log('❌ WebSocket blocked');
```

**Fix:**
- Try different network (mobile hotspot)
- Check firewall settings
- Try different browser

## Step-by-Step Diagnosis

### Step 1: Check Console Output

Look for these messages in the test page console:

#### Good Signs:
```
🔑 API Key found: AIzaSyDDmORABBHdyjg...
🔄 Trying model: gemini-2.0-flash-exp
✅ Session opened with gemini-2.0-flash-exp
✅ Setup complete
```

#### Bad Signs:
```
❌ Failed to connect with gemini-2.0-flash-exp
🔌 Session closed: Code 1006, Reason: Abnormal closure
```

### Step 2: Check Close Code

The test now shows the WebSocket close code:

| Code | Meaning | Solution |
|------|---------|----------|
| 1000 | Normal | No issue |
| 1006 | Abnormal | API key or network issue |
| 1008 | Policy violation | API key restrictions |
| 1011 | Server error | Gemini API issue |

### Step 3: Verify API Key

Run this in console:
```javascript
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
console.log('API Key:', apiKey);
console.log('Starts with AIzaSy:', apiKey?.startsWith('AIzaSy'));
console.log('Length:', apiKey?.length); // Should be 39
```

Expected output:
```
API Key: AIzaSyDDmORABBHdyjg4JQ_7bPvNokvA0GODj8Q
Starts with AIzaSy: true
Length: 39
```

### Step 4: Test API Key Directly

Test if your API key works at all:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models?key=YOUR_API_KEY"
```

**If this fails** → API key is invalid
**If this works** → API key is valid, issue is with Live API access

## Quick Fixes

### Fix 1: Regenerate API Key

1. Go to: https://aistudio.google.com/apikey
2. Click "Create API Key"
3. Copy the new key
4. Update `.env`:
   ```
   VITE_GEMINI_API_KEY=your_new_key_here
   ```
5. Restart dev server: `npm run dev`
6. Test again

### Fix 2: Enable Gemini API

1. Go to: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com
2. Click "Enable"
3. Wait 1-2 minutes
4. Test again

### Fix 3: Remove API Restrictions

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click your API key
3. Under "API restrictions", select "Don't restrict key"
4. Under "Application restrictions", select "None"
5. Click "Save"
6. Wait 1-2 minutes
7. Test again

### Fix 4: Try Different Model

Edit `GeminiLiveTest.tsx` line 42:
```typescript
const modelsToTry = [
  'gemini-1.5-flash',  // Try stable version first
  'gemini-2.0-flash-exp',
  'gemini-1.5-pro'
];
```

## Detailed Error Messages

The updated test now shows:

### In Status Display:
- Which model is being tried
- Detailed close reason
- Specific error messages

### In Console:
- API key validation
- Model connection attempts
- WebSocket close codes
- Detailed error information

## Still Not Working?

### Check These:

1. **Browser**: Use Chrome or Edge (best WebSocket support)
2. **HTTPS**: Make sure you're on `localhost` (not IP address)
3. **Extensions**: Disable ad blockers and privacy extensions
4. **Incognito**: Try in incognito/private mode
5. **Different Network**: Try mobile hotspot

### Get More Info:

Run this diagnostic:
```javascript
// In browser console on test page
console.log('=== DIAGNOSTIC INFO ===');
console.log('API Key:', import.meta.env.VITE_GEMINI_API_KEY?.substring(0, 20) + '...');
console.log('Browser:', navigator.userAgent);
console.log('WebSocket support:', 'WebSocket' in window);
console.log('AudioContext support:', !!(window.AudioContext || window.webkitAudioContext));
```

### Contact Support:

If nothing works, you might need to:
1. Check Gemini API status: https://status.cloud.google.com/
2. Contact Google Cloud Support
3. Try a different Google Cloud project

## Success Indicators

You'll know it's fixed when you see:

```
✅ Session opened with [model name]
✅ Setup complete
🎙️ Microphone access granted
🎙️ Audio capture started
```

And NO:
```
❌ Failed to connect
🔌 Session closed: Code 1006
```

## Prevention

To avoid this in the future:

1. ✅ Keep API key in `.env` file
2. ✅ Don't commit API key to git
3. ✅ Set up billing alerts
4. ✅ Monitor API usage
5. ✅ Use API key restrictions in production

---

**Try the test again now!**

The updated test will show you exactly which model works and provide detailed error information.

http://localhost:3000/gemini-test
