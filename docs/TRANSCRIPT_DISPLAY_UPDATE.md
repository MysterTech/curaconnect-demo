# Transcript Display Update

## Changes Made

Updated the transcript display to show **timestamps** instead of **speaker labels** (Doctor/Patient).

## What Changed

### Before
- Each transcript segment showed:
  - Speaker avatar (icon)
  - Speaker label ("Provider" or "Patient")
  - Timestamp (small, on the right)
  - Confidence percentage
  - Text content
- Different colored backgrounds for different speakers

### After
- Each transcript segment now shows:
  - **Timestamp badge** (prominent, on the left)
  - Text content
  - Confidence indicator (only shown if low confidence)
- Clean, uniform appearance with neutral gray background
- Timestamps are displayed in a blue badge format (e.g., "0:00", "0:30", "1:00")

## Visual Changes

### Main Transcript Panel
```
┌─────────────────────────────────────────┐
│ [0:00] This is what was spoken...      │
│                                         │
│ [0:30] Next segment of speech...       │
│                                         │
│ [1:00] Another segment...              │
└─────────────────────────────────────────┘
```

### Compact Transcript Panel
```
0:00  This is what was spoken...
0:30  Next segment of speech...
1:00  Another segment...
```

## Benefits

1. **Clearer Timeline**: Timestamps are now the primary identifier
2. **Neutral Display**: No speaker bias or assumptions
3. **Cleaner UI**: Removed unnecessary icons and color coding
4. **Better for Privacy**: No speaker identification in the transcript
5. **Easier to Reference**: "At 2:30 you mentioned..." is more natural

## Technical Details

**File Modified**: `src/components/transcript/TranscriptPanel.tsx`

**Key Changes**:
- Removed speaker avatar and icon display
- Moved timestamp from right side to left side as a badge
- Changed from colored backgrounds to neutral gray
- Removed speaker label display
- Updated CompactTranscriptPanel to match

**Timestamp Format**: Uses `formatTimestamp()` utility which formats seconds as "MM:SS" (e.g., 90 seconds → "1:30")

## Testing

To verify the changes:
1. Start a recording session
2. Speak for at least 30 seconds
3. Check the transcript panel
4. Verify:
   - ✅ Timestamps appear as blue badges on the left
   - ✅ No "Doctor" or "Patient" labels visible
   - ✅ Text is clearly readable
   - ✅ Timestamps increment properly (0:00, 0:30, 1:00, etc.)

## Future Enhancements

Consider adding:
- Click on timestamp to jump to that point in audio playback
- Highlight current timestamp during playback
- Search by timestamp range
- Export with timestamps
