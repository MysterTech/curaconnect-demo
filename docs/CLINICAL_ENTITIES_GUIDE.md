# Clinical Entities Extraction Feature

## Overview
Automatically extracts and categorizes medical entities from consultation transcripts with confidence scores, organized in SOAP format.

## Features

### 1. Entity Types
The system identifies 8 types of clinical entities:

- **Symptoms** 🔴: Patient complaints (chest pain, headache, fever)
- **Diagnoses** 🟣: Medical diagnoses (hypertension, diabetes, pneumonia)
- **Medications** 🔵: Drugs and dosages (Amlodipine 5mg, Aspirin 81mg)
- **Procedures** 🟢: Medical procedures (ECG, X-ray, blood test)
- **Anatomy** 🟡: Body parts (heart, lungs, abdomen)
- **Vital Signs** 🟠: Measurements (BP 150/95, HR 80, Temp 101F)
- **Lab Values** 🩷: Test results (HbA1c 7.2%, WBC 12000)
- **Allergies** 🟠: Known allergies (Penicillin, Sulfa drugs)

### 2. SOAP Organization
Entities are automatically categorized into:

- **Subjective** 🗣️: What the patient says
  - Symptoms, complaints, history
  - Patient's description of problem

- **Objective** 🔬: What the doctor observes
  - Vital signs, examination findings
  - Lab results, test results

- **Assessment** 🎯: Clinical judgment
  - Diagnoses, differential diagnoses
  - Clinical impressions

- **Plan** 📋: Treatment approach
  - Medications, procedures
  - Follow-up, referrals

### 3. Confidence Scores
Each entity has a confidence score (0-100%):

- **90-100%** (High) 🟢: Explicitly mentioned, clear context
- **70-89%** (Medium) 🟡: Implied or inferred from context
- **0-69%** (Low) 🔴: Uncertain or ambiguous

## How It Works

### Automatic Extraction
1. User records consultation
2. Transcript is generated
3. After 5 seconds of no new transcript:
   - Clinical entities are extracted
   - SOAP categorization is performed
   - Confidence scores are calculated

### Manual Refresh
- Click "Refresh" button in Clinical Entities tab
- Re-analyzes current transcript
- Updates entities and confidence scores

## UI Components

### Clinical Entities Tab
Located between "Note" and other tabs:
```
[Transcript] [Context] [Note] [Clinical Entities (12)]
```

### SOAP Sections
Four collapsible sections:
```
🗣️ Subjective (5 entities)
  [chest pain] 95% symptom
  [2 days] 90% duration
  
🔬 Objective (3 entities)
  [BP 150/95] 98% vital-sign
  [heart sounds normal] 85% examination
  
🎯 Assessment (2 entities)
  [hypertension] 92% diagnosis
  
📋 Plan (2 entities)
  [Amlodipine 10mg] 95% medication
  [follow-up 1 week] 88% plan
```

### Entity Cards
Each entity displays:
- **Value**: The medical term
- **Confidence**: Percentage score
- **Type**: Entity category
- **Color**: Type-specific color coding

## Example Usage

### Example 1: Complete Consultation
**Transcript:**
```
"Patient John Doe, 45 years old, presents with chest pain for 2 days.
Pain is worse on exertion. History of hypertension.
Currently on Amlodipine 5mg daily. No known allergies.
On examination, BP 150/95, heart sounds normal.
ECG shows no acute changes.
Diagnosis: Atypical chest pain, uncontrolled hypertension.
Plan: Increase Amlodipine to 10mg, stress test if symptoms persist."
```

**Extracted Entities:**

**Subjective:**
- chest pain (95% - symptom)
- 2 days (90% - duration)
- worse on exertion (88% - symptom)
- hypertension (92% - diagnosis/history)

**Objective:**
- BP 150/95 (98% - vital-sign)
- heart sounds normal (85% - examination)
- ECG no acute changes (90% - procedure/finding)

**Assessment:**
- Atypical chest pain (92% - diagnosis)
- Uncontrolled hypertension (95% - diagnosis)

**Plan:**
- Amlodipine 10mg (95% - medication)
- stress test (88% - procedure)
- follow-up (85% - plan)

### Example 2: Minimal Information
**Transcript:**
```
"Patient has headache"
```

**Extracted Entities:**

**Subjective:**
- headache (95% - symptom)

**Objective:** (empty)
**Assessment:** (empty)
**Plan:** (empty)

## Benefits

### 1. Quick Review
- Scan key medical information at a glance
- Identify what was documented
- Spot missing information

### 2. Quality Assurance
- Verify all important entities captured
- Check confidence scores for accuracy
- Identify ambiguous information

### 3. Coding & Billing
- Identify diagnoses for ICD codes
- List procedures for CPT codes
- Document medications for billing

### 4. Clinical Decision Support
- Review all symptoms mentioned
- Check all vital signs recorded
- Verify all medications documented

### 5. Teaching & Training
- Show students how to organize information
- Demonstrate SOAP documentation
- Highlight key clinical entities

## Confidence Score Interpretation

### High Confidence (90-100%)ecord.
ltation r the consuins naccuracieor ify any gaps d identied andocument what was kly reviewoctors quicThis helps d
ce support
 assuranlityuay
- ✅ Qilit capabreview- ✅ Quick ding
 color coisualg
- ✅ Vdence scorinfi
- ✅ Contationsennized preP-orga- ✅ SOAtraction
ntity exedical etic m✅ Automaides:
- feature provs ntitiel Eica

The ClinSummary

## tpor supguagelan ] Multi-rules
- [dation ity vali [ ] Entto EHR
-ties Export enti] 
- [ lterrch and fiity sea] Ent
- [ esof entitimeline view 
- [ ] TiCPT codesICD/ng to tity linki Enpes
- [ ]ntity ty[ ] Custom e
- ingntity editnual eMas

- [ ] enthancemture En## Funeeded

 be rrection maynual coMa
4. rizationerify categod vhouloctor s
3. Dxt on contess basedt guees bes2. AI maks cases
for ambiguous expected This iions:**
1. olut
**Song sectin wron Entity i:**Problem
**CategoryWrong SOAP ript

### sctranct review and corReon
4. atiplete informrovide com3. Pminology
medical terard . Use standy
2callspecifiearly and clore k m
1. Speations:**oluw <70%
**Sho sties:** All entiblemes
**Proce Scor Confiden# Lowors

##sole for errheck con
4. Cetrysh" to r"Refre. Click gured
3PI key confini A Verify Gemit
2.t has contenranscrip
1. Check tlutions:**
**So listy entitiesptm:** Emobleed
**Pres Extract# No Entiti

##inghoot Troubles apply

##siderations con
- HIPAAocally only l stored
- Results serversernalored on extdata st No API
-via Gemini ed  Processrivacy:
-Data P
### ered
trigge manually 
- Can bdingoreclly after romatica autgth
- Runsanscript lentron  Depends 
--5 seconds 2 Typicallye:
-essing Tim# Proc
## + SOAP)
esntitin (extractiorallel eutput
- Pa o-structured
- JSONacycurace (0.1) for turera tempodel
- Lowsh AI mFlaini 2.5  Gem:
- Usesethodn Mractio Extails

###cal Det# Techniontext

#mplex cand conderst
❌ Uaccuracyrantee 100% ent
❌ Guactor's judgmce doses
❌ Repla diagnoalake clinic❌ Mnformation
unstated infer ot Do:
❌ IIt Cann# What ypes

##ty ttiple enify multiy
✅ Identminolog ter medicales
✅ Handle scorcede confident
✅ ProvirmaP foto SOAategorize in Cies
✅titenmentioned ly  explicit:
✅ Extract It Can Do

### Whatimitations# Late

#propri is aponcategorizatiP rm SOA5. Confianually
ntities mdd missing e Aes
4.entitiidence conf low- removeorClarify ntities
3. onfidence eium-crify medct
2. Vere corretities aenonfidence  high-ceck all:
1. Cheview

### For Rech in speAP structureollow SOly**: Fnize Logical**Orgagies"
5. er", "No all chest painves**: "Notintion Nega"
4. **Me 5mg dailydipinemlo Acribed: "Presly**te Clear
3. **Sta"high BP"ion" not ertens"Hyp: ard Terms**Stande "
2. **UsP elevatedot "BP 150/95" n"Bific**: *Be Spec
1. *tion:ate Extrac# For Accur
##Practices
est 

## Bonficaticlaritain, needs eriguous, unc
❌ Amby (60%)
```allerg" → e allergic%)
"Maybon (50" → medicatincatioSome medi (65%)
"iselall" → mag weelin"Not fe
```
nce (<70%)Confide

### Low c specifissinferred, leed or Impli)
```
⚠️ 78%est pain ( cht" →iscomfor d
"Chestensive (72%)ntihypert→ a" ondicatiP meon BStarted n (75%)
"tensioperd" → hy elevateessure
"Blood pr%)
``` (70-89Confidenceum 
### Meditext
d, clear conateicitly st
✅ Expl)
``` (96%dipine 5mg → Amloine 5mg"mlodip Ascribed)
"Pre (95%pertensionsion" → hyith hyperten wgnosed%)
"Dia980/95 (" → BP 1550/95 is 1
```
"BP