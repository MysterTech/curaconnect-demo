# Template System Testing Guide

## ✅ Complete Integration

The template system is now fully integrated with:
- ✅ Template selection in workspace
- ✅ AI note generation from transcripts
- ✅ Specialty-specific templates
- ✅ Settings page for configuration
- ✅ Auto-generation after recording

## 🧪 How to Test

### Step 1: Configure Your Specialty
```
1. Go to http://localhost:5173/settings
2. Select your specialty (e.g., "General Practitioner")
3. Optionally set a default template
4. Click "Save Settings"
```

### Step 2: Start a New Session
```
1. Go to http://localhost:5173/
2. Click "Start New Session"
3. You'll be redirected to the workspace
```

### Step 3: Select a Template
```
1. In the Note tab, click "Select a template" dropdown
2. You'll see templates for your specialty:
   - For GP: Main Consultation, Chronic Disease Management, GP Letter
   - For Dentist: Dental Examination, Dental Procedure
   - etc.
3. Select the appropriate template for your consultation
```

### Step 4: Record Consultation
```
1. Click green "Start transcribing" button
2. Select "Transcribing" mode
3. Speak your consultation (simulate a patient visit)
4. Wait for transcription to appear (every 15 seconds)
5. Click "Stop recording" when done
```

### Step 5: View Generated Note
```
1. Go to "Note" tab
2. After 5 seconds, AI will automatically generate a structured note
3. The note will follow the template structure
4. You can click "Regenerate" to create a new version
```

## 📋 Test Scenarios

### Scenario 1: GP Consultation
**Template:** Main Consultation Template

**What to say:**
```
"Patient John Doe, 45 years old, presents with chest pain for 2 days.
Pain is worse on exertion, no radiation. No shortness of breath.
Past medical history includes hypertension.
Currently on Amlodipine 5mg daily.
No known allergies.
On examination, blood pressure is 150/95, heart sounds normal, no murmurs.
ECG shows no acute changes.
Diagnosis: Atypical chest pain, uncontrolled hypertension.
Plan: Increase Amlodipine to 10mg, stress test if symptoms persist, follow-up in one week."
```

**Expected Note Sections:**
- Presenting Complaint
- History of Presenting Complaint
- Past Medical History
- Current Medications
- Allergies
- Physical Examination
- Diagnosis/Impression
- Management Plan

### Scenario 2: Dental Examination
**Template:** Dental Examination Note

**What to say:**
```
"Patient complains of pain in upper right molar for 3 days.
No previous dental work on that tooth.
Extra-oral examination shows no facial swelling, TMJ normal.
Intra-oral examination reveals tooth 16 has a large carious lesion.
Tooth is tender to percussion.
Gingiva appears healthy with no inflammation.
Diagnosis: Deep caries tooth 16, possible pulpitis.
Treatment plan: Root canal treatment followed by crown restoration.
Post-operative instructions: Avoid chewing on that side, take prescribed antibiotics."
```

**Expected Note Sections:**
- Chief Complaint
- Dental History
- Extra-oral Examination
- Intra-oral Examination
- Tooth Chart/Findings
- Diagnosis
- Treatment Plan

### Scenario 3: Cardiology Consultation
**Template:** Cardiology Consultation

**What to say:**
```
"Patient referred for palpitations and occasional chest discomfort.
Episodes occur 2-3 times per week, lasting 5-10 minutes.
Risk factors include family history of heart disease, father had MI at age 55.
Currently not on any cardiac medications.
Cardiovascular examination: BP 130/80, regular heart rate 72, no murmurs.
ECG shows normal sinus rhythm, no ST changes.
Plan: 24-hour Holter monitor, echocardiogram, start low-dose beta blocker."
```

**Expected Note Sections:**
- Reason for Referral
- Cardiac History
- Cardiovascular Risk Factors
- Cardiac Medications
- Cardiovascular Examination
- ECG Findings
- Diagnosis
- Management Plan

## 🔍 What to Check

### Template Selection
- [ ] Dropdown shows templates for your specialty
- [ ] Selected template name appears in button
- [ ] Can change template mid-session
- [ ] Default template loads automatically (if set)

### Note Generation
- [ ] Note generates automatically after recording stops
- [ ] Note follows template structure
- [ ] Sections are properly labeled
- [ ] Content is relevant to transcript
- [ ] Medical terminology is appropriate
- [ ] "Regenerate" button works

### Settings Integration
- [ ] Settings page loads correctly
- [ ] Can select specialty
- [ ] Templates update when specialty changes
- [ ] Can set default template
- [ ] Settings persist after refresh

## 🐛 Troubleshooting

### No Templates Showing
**Problem:** Template dropdown is empty
**Solution:** 
1. Go to Settings
2. Select a specialty
3. Save settings
4. Refresh the page

### Note Not Generating
**Problem:** Note stays on "Generating..." forever
**Solution:**
1. Check console for errors
2. Verify Gemini API key is configured
3. Check that transcript has content
4. Click "Generate Note Now" button manually

### Wrong Template Sections
**Problem:** Generated note doesn't match template
**Solution:**
1. Verify correct template is selected
2. Try regenerating the note
3. Check that transcript is relevant to template type

## 📊 Expected Behavior

### Automatic Flow:
```
1. User selects specialty in Settings
2. User starts new session
3. Default template loads (if set)
4. User records consultation
5. Transcript appears every 15 seconds
6. User stops recording
7. After 5 seconds, note auto-generates
8. Note appears in Note tab
9. User can regenerate if needed
```

### Manual Flow:
```
1. User starts session
2. User selects template from dropdown
3. User records consultation
4. User clicks "Generate Note Now"
5. Note appears immediately
```

## ✨ Features Working

✅ 6 medical specialties
✅ 15+ templates
✅ Template selection dropdown
✅ Auto-generation after recording
✅ Manual generation button
✅ Regenerate functionality
✅ Template-specific AI prompts
✅ Structured note output
✅ Settings persistence
✅ Default template support

## 🎯 Success Criteria

A successful test should show:
1. ✅ Templates load based on specialty
2. ✅ Selected template appears in UI
3. ✅ Recording and transcription work
4. ✅ Note generates automatically
5. ✅ Note follows template structure
6. ✅ Content is medically relevant
7. ✅ Can regenerate notes
8. ✅ Settings persist

## 📝 Notes

- Note generation uses Gemini 2.5 Flash
- Generation happens 5 seconds after transcript stops updating
- You can manually trigger generation anytime
- Templates are specialty-specific
- AI uses template-specific prompts for better results
- Generated notes can be edited (future feature)

## 🚀 Next Steps

After testing:
1. Try different specialties
2. Test all template types
3. Record real consultations
4. Verify medical accuracy
5. Customize templates as needed
6. Share feedback for improvements

Happy testing! 🏥✨
