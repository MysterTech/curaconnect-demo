# Transcription Quality Improvements

## Changes Made

### 1. Enhanced Medical Transcription Prompt
**Problem:** The original prompt was too generic: "Please transcribe the following audio into text."

**Solution:** Implemented a comprehensive medical transcription prompt that:
- Identifies the context as medical consultation audio
- Preserves medical terminology and abbreviations (BP, HR, mg, PRN)
- Uses proper medical spelling
- Handles speaker diarization (Doctor/Patient identification)
- Filters out unnecessary filler words
- Formats numbers clearly (e.g., "120 over 80" for blood pressure)
- Maintains professional medical documentation standards

### 2. Speaker Diarization Support
**Problem:** All transcription was treated as a single speaker with "unknown" label.

**Solution:** 
- Added intelligent parsing of speaker-labeled transcriptions
- Recognizes multiple speaker formats: Doctor, Patient, Physician, Clinician, Provider, Nurse
- Maps speaker labels to valid types: `provider`, `patient`, or `unknown`
- Splits transcription into separate segments per speaker
- Maintains conversation flow and context

### 3. Improved Segment Parsing
**Problem:** Entire transcription was returned as one large segment.

**Solution:**
- Implemented `parseTranscriptionIntoSegments()` method
- Handles both speaker-labeled and unlabeled transcriptions
- Creates separate segments for each speaker turn
- Preserves text continuity across multiple lines from same speaker

### 4. Fixed Transcription Interval
**Problem:** Code comment said "every 15 seconds" but used 5000ms (5 seconds).

**Solution:** Changed interval to 15000ms (15 seconds) to match the intended behavior and reduce API calls.

## Technical Details

### Gemini API Configuration
```typescript
generationConfig: {
  temperature: 0.1,      // Low temperature for consistent medical terminology
  topP: 0.95,           // High probability mass for accuracy
  topK: 40,             // Moderate diversity
  maxOutputTokens: 8192 // Support longer consultations
}
```

### Speaker Mapping
- **Provider labels:** Doctor, Physician, Clinician, Provider, Nurse → `provider`
- **Patient labels:** Patient → `patient`
- **Unknown:** Any other or no label → `unknown`

### Transcription Flow
1. Audio recorded in 15-second chunks
2. Sent to Gemini with medical context prompt
3. Response parsed for speaker labels
4. Split into segments by speaker
5. Added to session transcript
6. UI updated with new segments

## Expected Improvements

### Accuracy
- ✅ Better recognition of medical terminology
- ✅ Proper spelling of drug names and conditions
- ✅ Preserved medical abbreviations
- ✅ Accurate number formatting (vitals, dosages)

### Structure
- ✅ Clear speaker identification
- ✅ Organized conversation flow
- ✅ Separate segments for analysis
- ✅ Better context for AI note generation

### Performance
- ✅ Optimized API call frequency (15s intervals)
- ✅ Minimum audio size threshold (50KB)
- ✅ Efficient segment processing
- ✅ Reduced unnecessary transcriptions

## Testing Recommendations

1. **Test Medical Terminology**
   - Say drug names: "Lisinopril 10mg", "Metformin 500mg"
   - Use abbreviations: "BP is 120 over 80", "HR is 72"
   - Medical conditions: "hypertension", "diabetes mellitus type 2"

2. **Test Speaker Diarization**
   - Have two people speak alternately
   - Check if segments are properly labeled
   - Verify conversation flow is maintained

3. **Test Long Consultations**
   - Record for 2-3 minutes
   - Check if all chunks are transcribed
   - Verify no duplicate segments

4. **Test Edge Cases**
   - Very short audio (< 50KB)
   - Silence periods
   - Background noise
   - Multiple speakers talking simultaneously

## Known Limitations

1. **Real-time vs Batch:** Gemini only supports batch transcription, not streaming
2. **Speaker Identification:** Relies on AI to identify speakers, may not be 100% accurate
3. **Audio Quality:** Poor audio quality will affect transcription accuracy
4. **Language:** Currently optimized for English medical terminology
5. **Latency:** 15-second chunks mean slight delay in transcription appearing

## Future Enhancements

- [ ] Add support for multiple languages
- [ ] Implement confidence scoring per word
- [ ] Add medical specialty-specific terminology
- [ ] Support for custom medical vocabulary
- [ ] Timestamp accuracy improvements
- [ ] Audio quality pre-processing
- [ ] Noise reduction before transcription
