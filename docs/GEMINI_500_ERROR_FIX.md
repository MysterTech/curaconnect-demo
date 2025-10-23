# Gemini API 500 Error - Audio Format Issue

## The Problem

You're seeing:
```
Error: Gemini API request failed: 500
{"error": {"code": 500, "message": "Internal error encountered.", "status": "INTERNAL"}}
```

This means **Gemini couldn't process your audio file**. This is usually due to:

1. **Unsupported audio format/codec**
2. **Corrupted audio file**
3. **Incompatible MIME type**

## Quick Solution

### Option 1: Convert to WAV (Recommended)

**Using Online Converter:**
1. Go to https://cloudconvert.com/
2. Upload your audio file
3. Convert to **WAV** format
4. Download and upload to MedScribe

**Using FFmpeg (if installed):**
```bash
ffmpeg -i input.mp3 -ar 16000 -ac 1 output.wav
```

### Option 2: Convert to MP3

**Using Online Converter:**
1. Go to https://online-audio-converter.com/
2. Upload your audio file
3. Convert to **MP3** (128 kbps)
4. Download and upload to MedScribe

**Using FFmpeg:**
```bash
ffmpeg -i input.m4a -b:a 128k output.mp3
```

## Supported Formats

### ✅ Definitely Supported by Gemini:
- **WAV** (PCM, 16-bit, 16kHz or 44.1kHz)
- **MP3** (MPEG Audio Layer 3)
- **FLAC** (Free Lossless Audio Codec)

### ⚠️ May Have Issues:
- **M4A** (depends on codec)
- **OGG** (depends on codec)
- **WebM** (depends on codec)
- **AAC** (depends on container)

### ❌ Not Supported:
- **WMA** (Windows Media Audio)
- **ALAC** (Apple Lossless)
- **Proprietary formats**

## Why This Happens

### Codec Mismatch
Your file might be:
- M4A with AAC codec (not fully supported)
- OGG with Vorbis codec (may have issues)
- WebM with Opus codec (may have issues)

### File Corruption
- File didn't download completely
- Recording was interrupted
- File was edited incorrectly

### MIME Type Issues
- File extension doesn't match content
- Browser reports wrong MIME type
- Container format not recognized

## How to Check Your File

### On Windows:
```powershell
# Check file properties
Get-Item "yourfile.mp3" | Select-Object Name, Length, Extension

# Play file to verify it works
Start-Process "yourfile.mp3"
```

### On Mac/Linux:
```bash
# Check file type
file yourfile.mp3

# Check audio details
ffprobe yourfile.mp3
```

### In Browser Console:
```javascript
// After selecting file
console.log('File:', file.name, file.type, file.size);
```

## Recommended Workflow

### For Best Results:

1. **Record in WAV format** if possible
   - Highest compatibility
   - No compression artifacts
   - Direct support

2. **Or use MP3 at 128kbps+**
   - Good compression
   - Wide support
   - Smaller file size

3. **Avoid M4A/AAC formats**
   - May cause 500 errors
   - Convert to WAV/MP3 first

## Conversion Settings

### Optimal WAV Settings:
```
Format: WAV
Codec: PCM
Sample Rate: 16000 Hz (or 44100 Hz)
Channels: Mono (1 channel)
Bit Depth: 16-bit
```

### Optimal MP3 Settings:
```
Format: MP3
Bitrate: 128 kbps (or higher)
Sample Rate: 44100 Hz
Channels: Mono
Quality: High
```

## Alternative: Use Live Recording

If conversion is too much hassle:

1. **Play the audio file** on your computer
2. **Use "Start Recording"** in MedScribe
3. **Let it record** while audio plays
4. **Stop recording** when done

This bypasses format issues entirely!

## Testing Different Formats

Try this test:

1. **Test with WAV:**
   - Convert file to WAV
   - Upload to MedScribe
   - Should work ✅

2. **Test with MP3:**
   - Convert file to MP3
   - Upload to MedScribe
   - Should work ✅

3. **If both fail:**
   - File may be corrupted
   - Try different source file
   - Use live recording instead

## Common File Issues

### Issue: M4A from iPhone
**Problem:** iPhone records in M4A/AAC  
**Solution:** Convert to MP3 or WAV before upload

### Issue: WebM from Browser
**Problem:** Browser recording uses WebM/Opus  
**Solution:** Convert to WAV or use live recording

### Issue: Voice Memo App
**Problem:** Various formats depending on device  
**Solution:** Export as MP3 or WAV

### Issue: Zoom/Teams Recording
**Problem:** May use proprietary codecs  
**Solution:** Convert to standard format

## Quick Conversion Tools

### Online (No Installation):
1. **CloudConvert** - https://cloudconvert.com/
   - Supports all formats
   - Free for small files
   - Fast conversion

2. **Online Audio Converter** - https://online-audio-converter.com/
   - Simple interface
   - Multiple formats
   - Quality settings

3. **Zamzar** - https://www.zamzar.com/
   - Email delivery
   - Batch conversion
   - Format detection

### Desktop Apps:
1. **Audacity** (Free)
   - Open file
   - File → Export → Export as WAV/MP3
   - Full control

2. **VLC Media Player** (Free)
   - Media → Convert/Save
   - Choose format
   - Convert

3. **FFmpeg** (Command Line)
   - Most powerful
   - Batch processing
   - Scriptable

## Prevention

### For Future Recordings:

1. **Set recording format to WAV** in your app
2. **Use 16kHz or 44.1kHz** sample rate
3. **Record in mono** (not stereo)
4. **Test upload** with short sample first
5. **Keep original** in case conversion needed

## Still Getting 500 Error?

If WAV/MP3 still fails:

1. **Check file plays correctly**
   - Open in media player
   - Verify audio is clear
   - No corruption

2. **Try shorter clip**
   - Cut to 30 seconds
   - Test upload
   - If works, file too long

3. **Check file size**
   - Should be < 25 MB
   - Compress if larger
   - Split if very long

4. **Use live recording**
   - Most reliable method
   - No format issues
   - Direct browser support

## Summary

**The 500 error means Gemini can't process your audio format.**

**Quick fix:**
1. Convert to WAV or MP3
2. Upload converted file
3. Should work!

**Or just use live recording instead!** 🎤
