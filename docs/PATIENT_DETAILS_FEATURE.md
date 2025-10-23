# Patient Details Feature

## Overview

Added an intuitive patient details input component with search, autocomplete, and automatic visit category detection.

## Features

### 1. Smart Patient Search
- **Search as you type**: Filters patients by name, phone, or email
- **Suggested patients**: Shows recently visited patients at the top
- **All patients list**: Browse complete patient database

### 2. Quick Actions
- **Create new patient**: Add a new patient to the database
- **Just use**: Use the entered name without saving to database (for one-time visits)

### 3. Auto-Populate Visit Category
After recording stops, the system automatically analyzes the transcript and detects the visit category:

**Supported Categories**:
- Routine Checkup
- Follow-up Visit
- Acute Illness
- Chronic Disease Management
- Dental Consultation
- Cardiology Consultation
- Pediatric Visit
- Gynecology Visit
- Mental Health
- Injury/Trauma
- General Consultation (default)

**Detection Method**: Keyword matching against transcript content

### 4. Patient Data Persistence
- Patients are stored in `localStorage` under `medscribe_patients`
- Tracks last visit date for smart suggestions
- Maintains visit history

## UI Flow

### Before Recording
```
┌─────────────────────────────────────┐
│  👤 Add patient details             │
│                                     │
│  [Click to open dropdown]           │
└─────────────────────────────────────┘
```

### Dropdown Open
```
┌─────────────────────────────────────┐
│  [Search: John...]                  │
│                                     │
│  ➕ Create new patient              │
│  ➡️  Just use "John"                │
│                                     │
│  Suggested                          │
│  • John (2 days ago)                │
│  • John1 (1 week ago)               │
│                                     │
│  All Patients                       │
│  • John                             │
│  • John1                            │
└─────────────────────────────────────┘
```

### Patient Selected
```
┌─────────────────────────────────────┐
│  👤  John                           │
│     Routine Checkup                 │ ← Auto-populated after recording
│     555-0101                        │
│                                  🗑️ │
└─────────────────────────────────────┘
```

## Technical Implementation

### Component: `PatientDetailsInput.tsx`

**Location**: `src/components/patient/PatientDetailsInput.tsx`

**Props**:
```typescript
interface PatientDetailsInputProps {
  selectedPatient: Patient | null;
  onPatientSelect: (patient: Patient | null) => void;
  visitCategory?: string;
  isRecording?: boolean;
  disabled?: boolean;
}
```

**Patient Interface**:
```typescript
interface Patient {
  id: string;
  name: string;
  dateOfBirth?: string;
  phone?: string;
  email?: string;
  lastVisit?: Date;
  visitHistory?: string[];
}
```

### Integration in `ActiveSessionEnhanced.tsx`

**State Added**:
```typescript
const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
const [visitCategory, setVisitCategory] = useState<string>('');
```

**Visit Category Detection**:
```typescript
const detectVisitCategory = (transcript: TranscriptSegment[]): string => {
  // Analyzes transcript text for medical keywords
  // Returns most likely visit category
}
```

**Auto-populate on Stop**:
```typescript
const confirmStopRecording = async () => {
  // ... stop recording logic
  
  // Auto-detect visit category from transcript
  if (session.transcript.length > 0) {
    const category = detectVisitCategory(session.transcript);
    setVisitCategory(category);
  }
  
  // ... navigation
};
```

## User Experience

### During Recording
- Patient details input is **disabled** to prevent accidental changes
- Selected patient remains visible with visit category

### After Recording Stops
- Visit category automatically appears below patient name
- Based on keywords found in the transcript
- Can be manually edited if needed

### Search Experience
- **Instant filtering**: Results update as you type
- **Smart suggestions**: Recent patients appear first
- **Keyboard navigation**: Enter to select, Escape to close
- **Click outside**: Closes dropdown automatically

## Storage

### LocalStorage Key
`medscribe_patients`

### Data Structure
```json
[
  {
    "id": "1",
    "name": "John",
    "phone": "555-0101",
    "lastVisit": "2024-01-15T10:30:00.000Z",
    "visitHistory": ["Routine Checkup", "Follow-up Visit"]
  }
]
```

## Future Enhancements

1. **Patient Demographics**: Add age, gender, medical record number
2. **Visit History**: Show previous visit summaries
3. **Allergies & Medications**: Quick reference during consultation
4. **Insurance Information**: Track insurance details
5. **Appointment Scheduling**: Integrate with calendar
6. **Export Patient Data**: Generate patient reports
7. **Advanced Search**: Filter by date range, visit type, etc.
8. **Patient Photos**: Add profile pictures for better identification
9. **Backend Integration**: Sync with hospital EMR systems
10. **AI-Enhanced Detection**: Use Gemini to better categorize visits

## Testing

To test the feature:

1. **Start a new session**
2. **Click "Add patient details"**
3. **Try searching**: Type "John" to see filtering
4. **Create new patient**: Click "Create new patient" and add a name
5. **Select a patient**: Click on a patient from the list
6. **Start recording**: Patient input becomes disabled
7. **Speak about a medical condition**: e.g., "Patient has a fever and cough"
8. **Stop recording**: Visit category should auto-populate as "Acute Illness"

## Keywords for Visit Categories

| Category | Keywords |
|----------|----------|
| Routine Checkup | checkup, routine, annual, physical, wellness |
| Follow-up Visit | follow up, checking in, progress |
| Acute Illness | sick, fever, cough, cold, flu, pain |
| Chronic Disease | diabetes, hypertension, blood pressure, chronic |
| Dental | tooth, teeth, dental, cavity, gum |
| Cardiology | heart, chest pain, palpitation, cardiac |
| Pediatric | child, baby, infant, vaccination |
| Gynecology | pregnancy, prenatal, menstrual, gynecology |
| Mental Health | anxiety, depression, stress, counseling |
| Injury/Trauma | injury, accident, fall, trauma, wound |
