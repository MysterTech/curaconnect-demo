# Audio Upload Troubleshooting Guide

## Common Issues and Solutions

### Issue: "Failed to process audio file"

#### Possible Causes:

1. **API Key Not Configured**
   - Check if `VITE_GEMINI_API_KEY` is set in `.env`
   - Verify the key is valid
   - Restart dev server after adding key

2. **Unsupported Audio Format**
   - Gemini supports: WAV, MP3, WebM, OGG, M4A
   - Check file extension matches content type
   - Try converting to WAV or MP3

3. **File Too Large**
   - Gemini has size limits (~25MB recommended)
   - Compress audio file
   - Split into smaller segments

4. **Corrupted Audio File**
   - Try playing file in media player first
   - Re-export from recording software
   - Use different file

5. **Network Issues**
   - Check internet connection
   - Verify Gemini API is accessible
   - Check browser console for network errors

## Debugging Steps

### Step 1: Check Console Logs

Open browser console (F12) and look for:

```
📤 Processing uploaded audio file: [filename] [type] [size]
📦 Created audio blob: [size] bytes, type: [type]
🎤 Starting transcription...
✅ Transcription result: [result]
```

**If you see:**
- `❌ Failed to process audio file:` → Check error message
- `⚠️ No segments in transcription result` → Audio has no speech
- `Gemini API error response:` → API issue

### Step 2: Verify API Key

```bash
# Check .env file
cat .env | grep VITE_GEMINI_API_KEY

# Should show:
VITE_GEMINI_API_KEY=your-key-here
```

### Step 3: Test Audio File

**Try these test files:**
1. Record 5 seconds of speech
2. Save as WAV
3. Upload to MedScribe
4. Check if it transcribes

**If test file works:**
- Original file may be corrupted
- Try different format

**If test file fails:**
- API key issue
- Network issue
- Browser compatibility

### Step 4: Check File Details

```javascript
// In console, after selecting file:
console.log('File:', file.name, file.type, file.size);

// Should show:
File: recording.wav audio/wav 1234567
```

**Valid types:**
- `audio/wav`
- `audio/mpeg` or `audio/mp3`
- `audio/webm`
- `audio/ogg`
- `audio/m4a`

**Invalid types:**
- `video/*` (extract audio first)
- `application/*` (not audio)
- Empty type (file may be corrupted)

## Error Messages Explained

### "Please upload a valid audio file"
**Cause:** File type not recognized  
**Solution:** Use WAV, MP3, WebM, OGG, or M4A

### "No speech detected in audio file"
**Cause:** Audio is silent or too quiet  
**Solution:** 
- Check recording volume
- Ensure microphone was working
- Try different file

### "Gemini API request failed: 400"
**Cause:** Invalid request to API  
**Solution:**
- Check audio format is supported
- Verify file isn't corrupted
- Try smaller file

### "Gemini API request failed: 401"
**Cause:** Invalid API key  
**Solution:**
- Check API key in .env
- Verify key is active
- Generate new key if needed

### "Gemini API request failed: 429"
**Cause:** Rate limit exceeded  
**Solution:**
- Wait a few minutes
- Reduce upload frequency
- Check API quota

### "Failed to process audio file: Network error"
**Cause:** Can't reach Gemini API  
**Solution:**
- Check internet connection
- Verify firewall settings
- Try different network

## File Format Recommendations

### Best Quality (Recommended)
```
Format: WAV
Codec: PCM
Sample Rate: 16000 Hz or 44100 Hz
Channels: Mono (1 channel)
Bit Depth: 16-bit
```

### Good Balance
```
Format: MP3
Bitrate: 128 kbps or higher
Sample Rate: 44100 Hz
Channels: Mono
```

### Web Recording
```
Format: WebM
Codec: Opus
Sample Rate: 48000 Hz
Channels: Mono
```

## Converting Audio Files

### Using FFmpeg (Command Line)

**Convert to WAV:**
```bash
ffmpeg -i input.mp3 -ar 16000 -ac 1 output.wav
```

**Convert to MP3:**
```bash
ffmpeg -i input.wav -b:a 128k output.mp3
```

**Reduce File Size:**
```bash
ffmpeg -i input.wav -ar 16000 -ac 1 -b:a 64k output.mp3
```

### Using Online Tools

1. **CloudConvert** - https://cloudconvert.com/
2. **Online Audio Converter** - https://online-audio-converter.com/
3. **Zamzar** - https://www.zamzar.com/

## Browser Compatibility

### Supported Browsers
- ✅ Chrome 90+
- ✅ Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+

### Known Issues
- Safari may have issues with WebM
- Older browsers may not support all formats
- Mobile browsers may have upload limits

## Performance Tips

### For Large Files

1. **Compress before upload**
   - Use lower bitrate
   - Convert to mono
   - Reduce sample rate

2. **Split long recordings**
   - Max 15-20 minutes per file
   - Upload separately
   - Combine transcripts later

3. **Use appropriate format**
   - WAV for quality (but large)
   - MP3 for size (but compressed)
   - WebM for web (good balance)

### For Slow Networks

1. **Use lower quality**
   - 64 kbps MP3
   - 16000 Hz sample rate
   - Mono channel

2. **Upload during off-peak**
   - Less network congestion
   - Faster processing

## Testing Checklist

- [ ] API key is configured in .env
- [ ] Dev server restarted after adding key
- [ ] Audio file plays in media player
- [ ] File size < 25 MB
- [ ] File format is supported
- [ ] Browser console shows no errors
- [ ] Internet connection is stable
- [ ] Firewall allows Gemini API access

## Still Not Working?

### Collect Debug Info

1. **Browser Console Logs**
   - Copy all error messages
   - Note any warnings

2. **File Details**
   - Name, type, size
   - Where it was recorded
   - What software created it

3. **Environment**
   - Browser and version
   - Operating system
   - Network type (WiFi/Ethernet)

4. **Steps to Reproduce**
   - What you clicked
   - What happened
   - What you expected

### Alternative Solutions

**If upload still fails:**

1. **Use Live Recording**
   - Click "Start Recording" instead
   - Record directly in browser
   - More reliable

2. **Try Different File**
   - Record new audio
   - Use different format
   - Use shorter duration

3. **Check API Status**
   - Visit Gemini API status page
   - Check for outages
   - Try again later

## Contact Support

If none of these solutions work:

1. Check GitHub issues
2. Create new issue with:
   - Error message
   - Console logs
   - File details
   - Steps to reproduce

## Quick Fixes

### Most Common Solutions

1. **Restart dev server** after adding API key
2. **Convert to WAV** if other formats fail
3. **Reduce file size** if upload times out
4. **Check API key** is valid and active
5. **Try different browser** if issues persist

---

**Remember:** Live recording is always more reliable than file upload. Use upload for pre-recorded audio only.
