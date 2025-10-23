# Medical Specialties Update

## Overview

Expanded the medical specialties from 6 to 60+ specialties, organized into three main categories: Physician, Surgeon, and Allied Health.

## Changes Made

### 1. Updated `MedicalSpecialty` Type

**File**: `src/models/templates.ts`

Added 54 new specialty types organized by category:

#### Physician Specialties (35)
- Addiction Medicine
- Anaesthetics
- Cardiology
- Dermatology
- Emergency Medicine
- Endocrinology
- Gastroenterology
- General Medicine
- General Practice
- Genetics
- Geriatric Medicine
- Haematology
- ICU
- Immunology & Allergy
- Infectious Disease
- Medical Admin
- Nephrology
- Neurology
- Nuclear Medicine
- Occupational Medicine
- Oncology
- Paediatrics
- Pain Medicine
- Palliative Care
- Pathology
- Pharmacology
- Physician - Other
- Psychiatry
- Public Health
- Radiation Oncology
- Radiology
- Rehab Medicine
- Respiratory
- Rheumatology
- Sexual Health Medicine

#### Surgeon Specialties (13)
- Cardiothoracic
- Ear Nose and Throat
- General Surgery
- Maxillofacial Surgery
- Neurosurgery
- Obstetrics and Gynaecology
- Ophthalmology
- Orthopaedic
- Paediatric Surgery
- Plastics
- Urology
- Vascular

#### Allied Health (5)
- Audiology
- Chinese Medicine
- Sports & Exercise Medicine

### 2. Updated Settings UI

**File**: `src/pages/Settings.tsx`

Reorganized the specialty dropdown with `<optgroup>` elements for better organization:

```tsx
<select>
  <option value="">Select specialty</option>
  
  <optgroup label="Physician">
    <!-- 35 physician specialties -->
  </optgroup>
  
  <optgroup label="Surgeon">
    <!-- 13 surgeon specialties -->
  </optgroup>
  
  <optgroup label="Allied Health">
    <!-- 5 allied health specialties -->
  </optgroup>
</select>
```

### 3. Maintained Backward Compatibility

Original 6 specialties are still available:
- General Practitioner (under Physician)
- Dentist (under Allied Health)
- Cardiologist → Cardiology (under Physician)
- Gynecologist → Obstetrics and Gynaecology (under Surgeon)
- Ayurveda Practitioner (under Allied Health)
- Pediatrician → Paediatrics (under Physician)

## UI Improvements

### Before
```
Specialty: [Dropdown with 6 options]
```

### After
```
Specialty: [Dropdown with organized categories]
  Physician
    ├─ Addiction Medicine
    ├─ Anaesthetics
    ├─ Cardiology
    └─ ... (35 total)
  Surgeon
    ├─ Cardiothoracic
    ├─ Ear Nose and Throat
    └─ ... (13 total)
  Allied Health
    ├─ Audiology
    ├─ Chinese Medicine
    └─ ... (5 total)
```

## Benefits

1. **Comprehensive Coverage**: Covers virtually all medical specialties
2. **Better Organization**: Grouped by category for easier navigation
3. **Searchable**: Users can type to search within the dropdown
4. **Scalable**: Easy to add more specialties in the future
5. **Professional**: Matches standard medical specialty classifications

## Template System

### Current Behavior
- Each specialty can have its own templates
- Currently, only 6 specialties have templates defined
- New specialties will fall back to general templates

### Future Enhancement
To add templates for new specialties:

1. Create template arrays (e.g., `DERMATOLOGY_TEMPLATES`)
2. Add to `ALL_TEMPLATES` array
3. Templates will automatically appear in Settings

Example:
```typescript
export const DERMATOLOGY_TEMPLATES: NoteTemplate[] = [
  {
    id: 'derm-consultation',
    name: 'Dermatology Consultation',
    specialty: 'dermatology',
    description: 'Skin condition assessment',
    sections: [...],
    aiPrompt: '...'
  }
];
```

## Testing

To test the new specialties:

1. **Navigate to Settings**
2. **Click on Specialty dropdown**
3. **Verify categories appear**:
   - Physician (35 options)
   - Surgeon (13 options)
   - Allied Health (5 options)
4. **Select a specialty** (e.g., "Dermatology")
5. **Save settings**
6. **Verify it persists** after page refresh

## Data Structure

### Specialty Type
```typescript
type MedicalSpecialty = 
  | 'general-practitioner'
  | 'addiction-medicine'
  | 'cardiothoracic'
  | 'audiology'
  // ... 60+ total
```

### Specialty Labels
```typescript
const SPECIALTY_LABELS: Record<MedicalSpecialty, string> = {
  'addiction-medicine': 'Addiction Medicine',
  'anaesthetics': 'Anaesthetics',
  // ... all specialties
}
```

## Future Enhancements

1. **Specialty-Specific Templates**: Create templates for each specialty
2. **Subspecialties**: Add subspecialties (e.g., Interventional Cardiology)
3. **Custom Specialties**: Allow users to add custom specialties
4. **Specialty Icons**: Add icons for visual identification
5. **Specialty Descriptions**: Add hover tooltips with specialty descriptions
6. **Regional Variations**: Support different specialty names by region
7. **Certification Tracking**: Track board certifications per specialty
8. **Specialty-Specific Settings**: Different defaults per specialty

## Migration Notes

### For Existing Users
- Existing specialty selections will continue to work
- Users can update to more specific specialties if desired
- No data migration required

### For New Users
- More options to choose from
- Better matches their actual specialty
- Organized categories make selection easier

## Naming Conventions

Specialty IDs use kebab-case:
- `addiction-medicine`
- `ear-nose-throat`
- `sports-exercise-medicine`

Specialty Labels use Title Case:
- "Addiction Medicine"
- "Ear Nose and Throat"
- "Sports & Exercise Medicine"
