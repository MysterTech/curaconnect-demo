# Medical Note Template System

## Overview
A comprehensive template system for generating specialty-specific medical documentation from transcribed consultations.

## Specialties Supported

### 1. General Practitioner (GP)
**Templates:**
- **Main Consultation Template**: Standard GP consultation with presenting complaint, history, examination, diagnosis, and management plan
- **Chronic Disease Management Review**: For managing conditions like diabetes, hypertension, COPD
- **GP Letter with Summary**: Referral or summary letters

**Key Sections:**
- Presenting Complaint
- History of Presenting Complaint
- Past Medical History
- Current Medications
- Allergies
- Physical Examination
- Diagnosis/Impression
- Management Plan

### 2. Dentist
**Templates:**
- **Dental Examination Note**: Comprehensive oral examination
- **Dental Procedure Note**: Documentation of procedures performed

**Key Sections:**
- Chief Complaint
- Dental History
- Extra-oral Examination (Face, TMJ, lymph nodes)
- Intra-oral Examination (Soft/hard tissues)
- Tooth Chart/Findings
- Diagnosis
- Treatment Plan
- Post-operative Instructions

### 3. Cardiologist
**Templates:**
- **Cardiology Consultation**: Initial cardiac assessment
- **Cardiology Follow-up**: Follow-up for cardiac conditions

**Key Sections:**
- Reason for Referral
- Cardiac History (Chest pain, palpitations, dyspnea)
- Cardiovascular Risk Factors
- Cardiac Medications
- Cardiovascular Examination
- ECG Findings
- Investigations (Echo, stress test)
- Cardiac Diagnosis
- Management Plan

### 4. Gynecologist / Obstetrician
**Templates:**
- **Gynecology Consultation**: General gynecology assessment
- **Antenatal Visit**: Routine pregnancy check

**Key Sections:**
- Chief Complaint
- Menstrual History (LMP, cycle, flow)
- Obstetric History (G_P_A_)
- Contraception
- Sexual History
- Examination (Abdominal, pelvic)
- Investigations (Ultrasound, labs)
- Diagnosis
- Management Plan

**Antenatal Specific:**
- Gestational Age
- Fetal Movements
- Fundal Height
- Fetal Heart Rate
- Presentation

### 5. Ayurveda Practitioner
**Templates:**
- **Ayurvedic Consultation**: Traditional assessment
- **Panchakarma Assessment**: Detoxification therapy planning

**Key Sections:**
- Chief Complaint (Roga)
- Prakriti Assessment (Constitutional type)
- Vikriti (Current dosha imbalance)
- Agni (Digestive fire)
- Ama (Toxins)
- Nadi Pariksha (Pulse diagnosis)
- Jihva Pariksha (Tongue examination)
- Ayurvedic Diagnosis
- Chikitsa (Treatment with herbs)
- Pathya (Diet & lifestyle)

**Panchakarma Specific:**
- Bala (Strength assessment)
- Purvakarma (Preparatory procedures)
- Pradhanakarma (Main detox procedures)
- Paschatkarma (Post-procedure care)

### 6. Pediatrician
**Templates:**
- **Well Child Check**: Routine health assessment
- **Pediatric Illness Visit**: Acute illness consultation

**Key Sections:**
- Age
- Growth Parameters (Weight, height, head circumference)
- Developmental Milestones
- Feeding/Nutrition
- Immunization Status
- Physical Examination
- Parental Concerns
- Anticipatory Guidance
- Management Plan

## How It Works

### 1. Doctor Setup
1. Go to **Settings** page
2. Select your **Medical Specialty**
3. Choose a **Default Template** (optional)
4. Save settings

### 2. During Consultation
1. Start new session
2. Click "Select a template" dropdown
3. Choose appropriate template for the visit type
4. Start recording
5. AI generates notes based on:
   - Transcribed conversation
   - Selected template structure
   - Specialty-specific terminology

### 3. AI Note Generation
The AI uses specialty-specific prompts to:
- Extract relevant information from transcript
- Structure it according to template sections
- Use appropriate medical terminology
- Follow specialty-specific documentation standards

## Template Structure

Each template contains:
```typescript
{
  id: string;              // Unique identifier
  name: string;            // Display name
  specialty: string;       // Medical specialty
  description: string;     // Template description
  sections: [              // Template sections
    {
      id: string;
      title: string;
      placeholder: string;
      required: boolean;
      type: 'text' | 'list' | 'structured';
    }
  ],
  aiPrompt: string;        // AI generation instructions
}
```

## AI Prompts by Specialty

### General Practitioner
```
Generate a comprehensive GP consultation note with presenting complaint, 
history, examination findings, diagnosis, and management plan. Focus on 
common primary care conditions.
```

### Dentist
```
Generate a detailed dental examination note including extra-oral and 
intra-oral findings, tooth-specific observations, diagnosis, and 
treatment plan.
```

### Cardiologist
```
Generate a cardiology consultation note focusing on cardiac symptoms, 
risk factors, examination findings, ECG interpretation, and evidence-based 
management plan.
```

### Gynecologist
```
Generate a gynecology consultation note with detailed menstrual and 
obstetric history, examination findings, and appropriate management plan.
```

### Ayurveda
```
Generate an Ayurvedic consultation note including prakriti assessment, 
dosha imbalance, pulse diagnosis, and holistic treatment plan with herbal 
medicines and lifestyle modifications.
```

### Pediatrician
```
Generate a well child check note documenting growth, development, 
immunizations, and providing age-appropriate anticipatory guidance.
```

## Usage Examples

### Example 1: GP Consultation
**Transcript:**
> "Patient complains of chest pain for 2 days, worse on exertion. 
> History of hypertension. BP 150/95. Heart sounds normal. 
> ECG shows no acute changes."

**Generated Note:**
```
Presenting Complaint: Chest pain for 2 days

History: 48-year-old male presenting with chest pain, worse on exertion.
No radiation. No associated symptoms.

Past Medical History: Hypertension

Examination: BP 150/95 mmHg, Heart sounds normal, No murmurs

Investigations: ECG - No acute changes

Diagnosis: Atypical chest pain, Uncontrolled hypertension

Plan:
- Optimize BP control
- Stress test if symptoms persist
- Follow-up in 1 week
```

### Example 2: Dental Examination
**Transcript:**
> "Patient has pain in upper right molar. Tooth 16 has large carious lesion.
> Tender to percussion. Gums healthy."

**Generated Note:**
```
Chief Complaint: Pain in upper right molar

Intra-oral Examination:
- Tooth 16: Large carious lesion, tender to percussion
- Gingiva: Healthy, no inflammation
- Other teeth: No obvious pathology

Diagnosis: Deep caries tooth 16, possible pulpitis

Treatment Plan:
1. Root canal treatment tooth 16
2. Crown restoration
3. Oral hygiene instructions
```

### Example 3: Ayurvedic Consultation
**Transcript:**
> "Patient has digestive issues, bloating after meals. Pulse is irregular.
> Tongue has white coating. Feels cold frequently."

**Generated Note:**
```
Chief Complaint: Digestive issues with bloating

Prakriti: Vata-Kapha predominant

Vikriti: Vata aggravation with Agni mandya

Agni: Manda (weak digestive fire)

Ama: Present (white tongue coating)

Nadi Pariksha: Irregular, Vata predominant pulse

Diagnosis: Agnimandya with Vata prakopa

Chikitsa:
- Hingvastak churna before meals
- Trikatu churna with honey
- Warm water throughout day

Pathya:
- Avoid cold foods and drinks
- Eat warm, cooked meals
- Regular meal times
- Ginger tea after meals
```

## Benefits

1. **Specialty-Specific**: Templates tailored to each medical specialty
2. **Comprehensive**: Covers all essential documentation sections
3. **Flexible**: Multiple templates per specialty for different visit types
4. **AI-Powered**: Automatic note generation from transcripts
5. **Customizable**: Doctors can select appropriate template per visit
6. **Standards-Compliant**: Follows medical documentation best practices

## Future Enhancements

- Custom template creation
- Template sharing between practitioners
- Multi-language support
- Integration with EHR systems
- Template versioning
- Regulatory compliance checks
- Billing code suggestions
- Clinical decision support

## Technical Implementation

### Files Created:
1. `src/models/templates.ts` - Template definitions
2. `src/services/UserSettingsService.ts` - User preferences
3. `src/pages/Settings.tsx` - Settings UI
4. Template integration in SessionWorkspace

### Storage:
- User settings stored in localStorage
- Templates defined in code (can be moved to database)
- Session-template association in session metadata

### AI Integration:
- Template-specific prompts guide AI generation
- Structured output matching template sections
- Specialty-specific medical terminology
- Context-aware documentation

## Getting Started

1. **Set Your Specialty:**
   ```
   Navigate to Settings → Select Specialty → Save
   ```

2. **Choose Default Template:**
   ```
   Settings → Default Note Template → Select → Save
   ```

3. **Use in Session:**
   ```
   New Session → Select Template → Start Recording → AI Generates Notes
   ```

4. **Review and Edit:**
   ```
   View generated notes in Note tab → Edit as needed → Save
   ```

## Support

For questions or custom template requests, please refer to the documentation or contact support.
