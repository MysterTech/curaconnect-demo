/**
 * Medical Note Templates by Specialty
 * Based on standard medical documentation practices
 */

export type MedicalSpecialty = 
  | 'general-practitioner'
  | 'dentist'
  | 'cardiologist'
  | 'gynecologist'
  | 'ayurveda'
  | 'pediatrician'
  // Physician Specialties
  | 'addiction-medicine'
  | 'anaesthetics'
  | 'cardiology'
  | 'dermatology'
  | 'emergency-medicine'
  | 'endocrinology'
  | 'gastroenterology'
  | 'general-medicine'
  | 'general-practice'
  | 'genetics'
  | 'geriatric-medicine'
  | 'haematology'
  | 'icu'
  | 'immunology-allergy'
  | 'infectious-disease'
  | 'medical-admin'
  | 'nephrology'
  | 'neurology'
  | 'nuclear-medicine'
  | 'occupational-medicine'
  | 'oncology'
  | 'paediatrics'
  | 'pain-medicine'
  | 'palliative-care'
  | 'pathology'
  | 'pharmacology'
  | 'physician-other'
  | 'psychiatry'
  | 'public-health'
  | 'radiation-oncology'
  | 'radiology'
  | 'rehab-medicine'
  | 'respiratory'
  | 'rheumatology'
  | 'sexual-health-medicine'
  // Surgeon Specialties
  | 'cardiothoracic'
  | 'ear-nose-throat'
  | 'general-surgery'
  | 'maxillofacial-surgery'
  | 'neurosurgery'
  | 'obstetrics-gynaecology'
  | 'ophthalmology'
  | 'orthopaedic'
  | 'paediatric-surgery'
  | 'plastics'
  | 'urology'
  | 'vascular'
  // Allied Health
  | 'audiology'
  | 'chinese-medicine'
  | 'sports-exercise-medicine';

export interface NoteTemplate {
  id: string;
  name: string;
  specialty: MedicalSpecialty;
  description: string;
  sections: TemplateSection[];
  aiPrompt: string; // Prompt to guide AI in generating this type of note
  isPremium?: boolean; // Whether this is a premium template
  isCustom?: boolean; // Whether this is a user-created custom template
}

export interface TemplateSection {
  id: string;
  title: string;
  placeholder: string;
  required: boolean;
  type: 'text' | 'list' | 'structured';
}

// General Practitioner Templates
export const GP_TEMPLATES: NoteTemplate[] = [
  {
    id: 'gp-consultation',
    name: 'Main Consultation Template',
    specialty: 'general-practitioner',
    description: 'Standard GP consultation note',
    sections: [
      { id: 'presenting-complaint', title: 'Presenting Complaint', placeholder: 'Chief complaint and duration', required: true, type: 'text' },
      { id: 'history', title: 'History of Presenting Complaint', placeholder: 'Detailed history', required: true, type: 'text' },
      { id: 'past-medical', title: 'Past Medical History', placeholder: 'Previous conditions, surgeries', required: false, type: 'list' },
      { id: 'medications', title: 'Current Medications', placeholder: 'List of medications', required: false, type: 'list' },
      { id: 'allergies', title: 'Allergies', placeholder: 'Known allergies', required: false, type: 'list' },
      { id: 'examination', title: 'Physical Examination', placeholder: 'Examination findings', required: true, type: 'text' },
      { id: 'diagnosis', title: 'Diagnosis/Impression', placeholder: 'Clinical diagnosis', required: true, type: 'text' },
      { id: 'plan', title: 'Management Plan', placeholder: 'Treatment plan and follow-up', required: true, type: 'text' },
    ],
    aiPrompt: 'Generate a comprehensive GP consultation note with presenting complaint, history, examination findings, diagnosis, and management plan. Focus on common primary care conditions.'
  },
  {
    id: 'gp-chronic-disease',
    name: 'GP Chronic Disease Management Review',
    specialty: 'general-practitioner',
    description: 'For managing chronic conditions like diabetes, hypertension',
    sections: [
      { id: 'condition', title: 'Chronic Condition', placeholder: 'Primary chronic condition', required: true, type: 'text' },
      { id: 'current-status', title: 'Current Status', placeholder: 'Disease control and symptoms', required: true, type: 'text' },
      { id: 'investigations', title: 'Recent Investigations', placeholder: 'Lab results, monitoring', required: true, type: 'list' },
      { id: 'medications-review', title: 'Medication Review', placeholder: 'Current medications and compliance', required: true, type: 'text' },
      { id: 'complications', title: 'Complications Screening', placeholder: 'Any complications noted', required: false, type: 'text' },
      { id: 'lifestyle', title: 'Lifestyle Advice', placeholder: 'Diet, exercise, smoking cessation', required: true, type: 'text' },
      { id: 'plan', title: 'Management Plan', placeholder: 'Ongoing management and follow-up', required: true, type: 'text' },
    ],
    aiPrompt: 'Generate a chronic disease management review note focusing on disease control, medication compliance, complications screening, and lifestyle modifications.'
  },
  {
    id: 'gp-letter',
    name: 'GP Letter with Summary',
    specialty: 'general-practitioner',
    description: 'Referral or summary letter',
    sections: [
      { id: 'reason', title: 'Reason for Letter', placeholder: 'Purpose of communication', required: true, type: 'text' },
      { id: 'summary', title: 'Clinical Summary', placeholder: 'Brief clinical summary', required: true, type: 'text' },
      { id: 'request', title: 'Request/Action Required', placeholder: 'What is being requested', required: true, type: 'text' },
    ],
    aiPrompt: 'Generate a professional GP letter with clinical summary and clear request for action.'
  },
  {
    id: 'referral-letter-short',
    name: 'Referral Letter (Short)',
    specialty: 'general-practitioner',
    description: 'Concise referral letter with active and stable diagnoses',
    sections: [
      { id: 'active-diagnoses', title: 'Active Diagnoses', placeholder: 'Current active conditions requiring attention', required: true, type: 'list' },
      { id: 'stable-diagnoses', title: 'Stable Diagnoses', placeholder: 'Stable chronic conditions', required: false, type: 'list' },
      { id: 'plan', title: 'Plan', placeholder: 'Management plan and follow-up', required: true, type: 'text' },
      { id: 'summary', title: 'Summary', placeholder: 'Brief consultation summary', required: true, type: 'text' },
    ],
    aiPrompt: `Generate a concise referral letter following this structure:

**Active Diagnoses**
List each active diagnosis with:
- Diagnosis name
- Brief status update with specific dates/values
Example: "Exacerbation of Chronic Obstructive Pulmonary Disease (COPD): Acute exacerbation noted, treated with increased inhaler use as of [date]."

**Stable Diagnoses**
List stable conditions with current status:
Example: "Hypertension: BP consistently around 130/80 mmHg on current regimen."

**Plan**
- Specific management steps with medications and dosages
- Follow-up timeline
Example: "COPD management: Increase corticosteroid inhaler frequency to QID. Schedule follow-up in 4 weeks."

**Summary**
Brief paragraph about the consultation, presenting concerns, and adjustments made.

CRITICAL RULES:
- Do NOT include greetings or salutations
- Do NOT include closing statements or sign-offs
- Use specific dates, values, and measurements from the transcript
- Include medication names and dosages
- Be concise and focused
- Use professional medical terminology
- Only include information explicitly mentioned in the transcript`
  },
  {
    id: 'referral-letter-long',
    name: 'Referral Letter (Long)',
    specialty: 'general-practitioner',
    description: 'Comprehensive referral letter with detailed clinical information',
    sections: [
      { id: 'active-diagnoses', title: 'Active Diagnoses', placeholder: 'Current active conditions requiring attention', required: true, type: 'list' },
      { id: 'stable-diagnoses', title: 'Stable Diagnoses', placeholder: 'Stable chronic conditions', required: false, type: 'list' },
      { id: 'plan', title: 'Plan', placeholder: 'Detailed management plan', required: true, type: 'text' },
      { id: 'medications', title: 'Updated Medication List', placeholder: 'Complete current medication list', required: true, type: 'list' },
      { id: 'detailed-summary', title: 'Detailed Summary', placeholder: 'Comprehensive consultation summary', required: true, type: 'text' },
    ],
    aiPrompt: `Generate a comprehensive referral letter following this structure:

**Active Diagnoses**
List each active diagnosis with detailed status:
- Diagnosis name
- Current management and recent changes
Example: "Ischaemic Heart Disease (IHD): Angina pectoris management intensified due to increased symptom frequency."

**Stable Diagnoses**
List stable conditions with current management:
Example: "Hypercholesterolemia: Stable on Atorvastatin 40mg, no changes."

**Plan**
Detailed management plan with:
- Specific medication adjustments with dosages
- Timing and frequency
- Follow-up schedule
Example: "Increase Amlodipine from 5mg to 10mg daily. Initiate low-dose Aspirin therapy for angina control, 75mg daily. Schedule follow-up in 6 weeks."

**Updated Medication List**
Complete list of current medications with dosages and frequency:
- Medication name, dose, frequency
Example: "Amlodipine 10mg daily, Atorvastatin 40mg nocte, Aspirin 75mg daily"

**Detailed Summary**
Comprehensive paragraph(s) covering:
- Reason for consultation
- Examination findings (vital signs, physical exam)
- Investigation results
- Discussion points with patient
- Lifestyle modifications discussed
- Patient education provided

CRITICAL RULES:
- Do NOT include greetings or salutations
- Do NOT include closing statements or sign-offs
- Include all vital signs and measurements from the transcript
- List all medications with exact dosages
- Provide detailed examination findings
- Include patient education and lifestyle advice discussed
- Use professional medical terminology
- Be thorough and comprehensive
- Only include information explicitly mentioned in the transcript`
  },
  {
    id: 'patient-visit-summary',
    name: 'Patient Visit Summary',
    specialty: 'general-practitioner',
    description: 'Patient-friendly consultation summary letter',
    sections: [
      { id: 'issues', title: 'Issues Discussed', placeholder: 'Current issues, reasons for visit', required: false, type: 'list' },
      { id: 'diagnoses', title: 'Diagnoses', placeholder: 'Diagnoses made during consultation', required: false, type: 'list' },
      { id: 'management', title: 'Next Steps for Management', placeholder: 'Treatment plan, medications, lifestyle changes, follow-up', required: false, type: 'text' },
      { id: 'tasks', title: 'Tasks for You', placeholder: 'Specific tasks for patient', required: false, type: 'list' },
    ],
    aiPrompt: `This note is for the patient, therefore all language used should be at a level appropriate for a health consumer. Do not use medical abbreviations or jargon.

**Issues Discussed:**
List each issue or concern discussed during the visit (leave blank if none mentioned).

**Diagnoses:**
List any diagnoses made during the consultation (leave blank if none mentioned).

**Next Steps for Management:**
Describe the treatment plan, medications prescribed, lifestyle changes recommended, and follow-up appointments in plain language.

**Tasks for You:**
List specific tasks or actions the patient needs to take (leave blank if none mentioned).

CRITICAL RULES:
- Do NOT include greetings or salutations
- Do NOT include closing statements or contact information
- Use only the information from the transcript
- If any information related to a placeholder has not been explicitly mentioned in the transcript, contextual notes or clinical notes, leave that section blank
- Use as many bullet points as needed to capture all the relevant information from the transcript
- Use plain language that patients can understand
- Avoid medical jargon and abbreviations
- Write in full sentences for management and tasks sections`
  },
  {
    id: 'soap-note',
    name: 'SOAP Note',
    specialty: 'general-practitioner',
    description: 'Structured SOAP format (Subjective, Objective, Assessment, Plan)',
    sections: [
      { id: 'subjective', title: 'Subjective', placeholder: 'Patient concerns, complaints, experiences', required: true, type: 'text' },
      { id: 'objective', title: 'Objective', placeholder: 'Factual observations, findings, measurements', required: true, type: 'text' },
      { id: 'assessment', title: 'Assessment', placeholder: 'Analysis and interpretation', required: true, type: 'text' },
      { id: 'plan', title: 'Plan', placeholder: 'Next steps, decisions, action items', required: true, type: 'text' },
    ],
    aiPrompt: `Please summarise the provided transcript using the SOAP (Subjective, Objective, Assessment, Plan) format and return the result strictly in valid markdown. Each section should be formatted as follows:
- Use # for section headings: # Subjective, # Objective, # Assessment, # Plan
- Ensure key details are preserved while keeping the summary clear and concise
- Do not include extra commentary - only return the formatted markdown output

SOAP Section Guidelines:
- Subjective: Summarise subjective details, including the speaker's concerns, complaints, or experiences as described in the transcript.
- Objective: List factual observations, findings, or measurable details mentioned in the conversation.
- Assessment: Provide an analysis or interpretation of the situation based on the discussion.
- Plan: Summarise any next steps, decisions, or action items agreed upon.`
  },
  {
    id: 'generic-summary',
    name: 'Generic Summary',
    specialty: 'general-practitioner',
    description: 'Clear, professional consultation summary for clinician review',
    sections: [
      { id: 'date', title: 'Date of Consultation', placeholder: 'Consultation date', required: false, type: 'text' },
      { id: 'reason', title: 'Reason for Consultation', placeholder: 'Chief complaint', required: true, type: 'text' },
      { id: 'history', title: 'Relevant History', placeholder: 'Relevant background', required: false, type: 'text' },
      { id: 'examination', title: 'Examination Findings', placeholder: 'Physical examination', required: false, type: 'text' },
      { id: 'investigations', title: 'Investigations', placeholder: 'Tests discussed, ordered, or reviewed', required: false, type: 'text' },
      { id: 'diagnosis', title: 'Diagnosis/Impression', placeholder: 'Clinical diagnosis', required: true, type: 'text' },
      { id: 'management', title: 'Management Plan', placeholder: 'Treatments, medications, referrals, follow-up', required: true, type: 'text' },
      { id: 'advice', title: 'Advice/Education', placeholder: 'Patient education provided', required: false, type: 'text' },
    ],
    aiPrompt: `Write a clear, professional consultation summary that is easy for clinicians to review. Use clear section headings where appropriate, and present information in a logical, easy-to-consume format. Include references to what was said or discussed during the consultation when relevant to support clinical reasoning or decisions.

- Date of consultation
- Reason for consultation
- Relevant history
- Examination findings (if applicable)
- Investigations discussed, ordered or reviewed
- Diagnosis or impression
- Management plan (including treatments, medications, referrals, follow-up)
- Any advice or education provided to the patient

Do not make assumptions — leave out or mark as "not provided" any information that is unavailable. The note should be concise, structured, and clinically useful for other healthcare professionals reviewing the case.`
  },
  {
    id: 'patient-history',
    name: 'Patient History',
    specialty: 'general-practitioner',
    description: 'Comprehensive patient history and consultation documentation',
    sections: [
      { id: 'history', title: 'History', placeholder: 'Presenting complaint and history', required: true, type: 'text' },
      { id: 'past-medical', title: 'Past Medical History', placeholder: 'Medical, surgical, family, social history', required: false, type: 'text' },
      { id: 'examination', title: 'Physical Examination', placeholder: 'Vital signs and examination findings', required: false, type: 'text' },
      { id: 'investigations', title: 'Investigations', placeholder: 'Completed investigations and results', required: false, type: 'text' },
      { id: 'impression-plan', title: 'Impression & Plan', placeholder: 'Assessment and management for each condition', required: true, type: 'text' },
      { id: 'patient-summary', title: 'Patient Summary', placeholder: 'Brief summary for each key issue', required: false, type: 'text' },
      { id: 'key-takeaways', title: 'Key Takeaways', placeholder: 'Main actions and recommendations', required: false, type: 'list' },
      { id: 'next-steps', title: 'Next Steps', placeholder: 'Follow-up tasks and instructions', required: false, type: 'list' },
    ],
    aiPrompt: `Write a clear, professional consultation summary that includes the following, based only on the transcript, clinical notes, or explicit clinician input. Do not make assumptions — if information is not provided, leave it blank. Present the note in a structured, easy-to-consume format with clear headings.

History
- Include patient age only if mentioned in the transcript, patient profile, or clinical record.
- Document the reason for visit, current concerns, and relevant history of presenting illness (only if clearly referenced).
- Provide timing, duration, location, intensity, character, or context of the complaint (only if mentioned explicitly).
- Note factors that worsen or relieve symptoms, including any self-administered treatments and their outcomes (only if mentioned explicitly).
- Describe how symptoms have progressed or changed over time (only if mentioned explicitly).
- Summarise prior episodes of similar conditions, including management and outcome (only if mentioned explicitly).
- Indicate how symptoms are affecting daily living, work, or routine activities (only if mentioned explicitly).
- Record additional accompanying symptoms (systemic or localised) (only if mentioned explicitly).

Past Medical History
- Relevant medical or surgical history connected to the current concern (only if stated clearly).
- Relevant family history (only if stated clearly).
- Relevant social history (e.g., smoking, alcohol, substance use, occupational exposure) (only if stated clearly).
- Allergies and reactions (only if stated clearly).
- Current medications, including prescriptions, OTC drugs, supplements (only if stated clearly).
- Immunisation status (only if stated clearly).
- Any other background information or contributing factors (only if stated clearly).

Physical Examination
- Vital signs (e.g., temperature, BP, heart rate) (only if noted explicitly).
- Physical or mental state examination findings (summarised by system) (only if clearly stated).

Investigations
- Completed investigations and results (only if explicitly included).
- Planned investigations should appear under the Management Plan.

Impression & Plan
For each condition or request discussed (Condition #1, #2, #3, etc.):
- Condition name or topic
- Clinical impression / working diagnosis (only if stated)
- Differential diagnosis (only if stated)
- Planned investigations (only if stated)
- Planned treatments or interventions (only if stated)
- Referrals discussed or arranged (only if stated)

Patient Summary
For each key issue discussed:
- Brief summary of the condition or symptom
- Key advice, instructions, or actions related to this issue

Key Takeaways
- List the main actions agreed on during the consultation (e.g., medications, follow-up).
- Include any lifestyle or behavioural changes recommended (single-line list).

Next Steps
- List specific follow-up tasks (e.g., scheduling appointment, monitoring symptoms, starting medication) (only if mentioned).
- Include instructions on what to do if symptoms escalate or new issues arise (only if discussed).

Note: All content must be directly supported by the transcript, contextual notes, or clinician input. Leave sections blank if not supported — do not mention their absence.`
  }
];

// Dental Templates
export const DENTAL_TEMPLATES: NoteTemplate[] = [
  {
    id: 'dental-examination',
    name: 'Dental Examination Note',
    specialty: 'dentist',
    description: 'Comprehensive dental examination',
    sections: [
      { id: 'chief-complaint', title: 'Chief Complaint', placeholder: 'Patient\'s main concern', required: true, type: 'text' },
      { id: 'dental-history', title: 'Dental History', placeholder: 'Previous dental work, issues', required: false, type: 'text' },
      { id: 'extra-oral', title: 'Extra-oral Examination', placeholder: 'Face, TMJ, lymph nodes', required: true, type: 'text' },
      { id: 'intra-oral', title: 'Intra-oral Examination', placeholder: 'Soft tissues, hard tissues', required: true, type: 'text' },
      { id: 'tooth-chart', title: 'Tooth Chart/Findings', placeholder: 'Tooth-by-tooth findings', required: true, type: 'structured' },
      { id: 'diagnosis', title: 'Diagnosis', placeholder: 'Dental diagnosis', required: true, type: 'text' },
      { id: 'treatment-plan', title: 'Treatment Plan', placeholder: 'Proposed treatment', required: true, type: 'list' },
    ],
    aiPrompt: 'Generate a detailed dental examination note including extra-oral and intra-oral findings, tooth-specific observations, diagnosis, and treatment plan.'
  },
  {
    id: 'dental-procedure',
    name: 'Dental Procedure Note',
    specialty: 'dentist',
    description: 'Documentation of dental procedure',
    sections: [
      { id: 'procedure', title: 'Procedure Performed', placeholder: 'Name of procedure', required: true, type: 'text' },
      { id: 'indication', title: 'Indication', placeholder: 'Reason for procedure', required: true, type: 'text' },
      { id: 'anesthesia', title: 'Anesthesia', placeholder: 'Type and amount of anesthesia', required: true, type: 'text' },
      { id: 'procedure-details', title: 'Procedure Details', placeholder: 'Step-by-step description', required: true, type: 'text' },
      { id: 'materials', title: 'Materials Used', placeholder: 'Materials and equipment', required: false, type: 'list' },
      { id: 'complications', title: 'Complications', placeholder: 'Any complications', required: false, type: 'text' },
      { id: 'post-op', title: 'Post-operative Instructions', placeholder: 'Care instructions', required: true, type: 'text' },
    ],
    aiPrompt: 'Generate a dental procedure note with clear documentation of the procedure performed, materials used, and post-operative care instructions.'
  }
];

// Cardiology Templates
export const CARDIOLOGY_TEMPLATES: NoteTemplate[] = [
  {
    id: 'cardio-consultation',
    name: 'Cardiology Consultation',
    specialty: 'cardiologist',
    description: 'Initial cardiology assessment',
    sections: [
      { id: 'referral-reason', title: 'Reason for Referral', placeholder: 'Why patient was referred', required: true, type: 'text' },
      { id: 'cardiac-history', title: 'Cardiac History', placeholder: 'Chest pain, palpitations, dyspnea', required: true, type: 'text' },
      { id: 'risk-factors', title: 'Cardiovascular Risk Factors', placeholder: 'HTN, DM, smoking, family history', required: true, type: 'list' },
      { id: 'medications', title: 'Cardiac Medications', placeholder: 'Current cardiac medications', required: true, type: 'list' },
      { id: 'examination', title: 'Cardiovascular Examination', placeholder: 'BP, heart sounds, peripheral pulses', required: true, type: 'text' },
      { id: 'ecg', title: 'ECG Findings', placeholder: 'ECG interpretation', required: false, type: 'text' },
      { id: 'investigations', title: 'Investigations', placeholder: 'Echo, stress test, labs', required: false, type: 'text' },
      { id: 'diagnosis', title: 'Cardiac Diagnosis', placeholder: 'Primary cardiac diagnosis', required: true, type: 'text' },
      { id: 'plan', title: 'Management Plan', placeholder: 'Treatment and follow-up', required: true, type: 'text' },
    ],
    aiPrompt: 'Generate a cardiology consultation note focusing on cardiac symptoms, risk factors, examination findings, ECG interpretation, and evidence-based management plan.'
  },
  {
    id: 'cardio-follow-up',
    name: 'Cardiology Follow-up',
    specialty: 'cardiologist',
    description: 'Follow-up for cardiac conditions',
    sections: [
      { id: 'interval-history', title: 'Interval History', placeholder: 'Changes since last visit', required: true, type: 'text' },
      { id: 'symptoms', title: 'Current Symptoms', placeholder: 'Chest pain, SOB, edema', required: true, type: 'text' },
      { id: 'medication-compliance', title: 'Medication Compliance', placeholder: 'Adherence to medications', required: true, type: 'text' },
      { id: 'vitals', title: 'Vital Signs', placeholder: 'BP, HR, weight', required: true, type: 'text' },
      { id: 'investigations', title: 'Recent Investigations', placeholder: 'Labs, imaging results', required: false, type: 'text' },
      { id: 'assessment', title: 'Assessment', placeholder: 'Current status', required: true, type: 'text' },
      { id: 'plan', title: 'Plan', placeholder: 'Medication adjustments, follow-up', required: true, type: 'text' },
    ],
    aiPrompt: 'Generate a cardiology follow-up note assessing symptom control, medication compliance, and disease progression with appropriate management adjustments.'
  }
];

// Gynecology Templates
export const GYNECOLOGY_TEMPLATES: NoteTemplate[] = [
  {
    id: 'gyn-consultation',
    name: 'Gynecology Consultation',
    specialty: 'gynecologist',
    description: 'General gynecology consultation',
    sections: [
      { id: 'chief-complaint', title: 'Chief Complaint', placeholder: 'Main gynecological concern', required: true, type: 'text' },
      { id: 'menstrual-history', title: 'Menstrual History', placeholder: 'LMP, cycle regularity, flow', required: true, type: 'text' },
      { id: 'obstetric-history', title: 'Obstetric History', placeholder: 'G_P_A_, previous pregnancies', required: true, type: 'text' },
      { id: 'contraception', title: 'Contraception', placeholder: 'Current contraceptive method', required: false, type: 'text' },
      { id: 'sexual-history', title: 'Sexual History', placeholder: 'Relevant sexual history', required: false, type: 'text' },
      { id: 'examination', title: 'Examination', placeholder: 'Abdominal, pelvic examination', required: true, type: 'text' },
      { id: 'investigations', title: 'Investigations', placeholder: 'Ultrasound, labs, pap smear', required: false, type: 'text' },
      { id: 'diagnosis', title: 'Diagnosis', placeholder: 'Gynecological diagnosis', required: true, type: 'text' },
      { id: 'plan', title: 'Management Plan', placeholder: 'Treatment and follow-up', required: true, type: 'text' },
    ],
    aiPrompt: 'Generate a gynecology consultation note with detailed menstrual and obstetric history, examination findings, and appropriate management plan.'
  },
  {
    id: 'antenatal-visit',
    name: 'Antenatal Visit',
    specialty: 'gynecologist',
    description: 'Routine antenatal check',
    sections: [
      { id: 'gestational-age', title: 'Gestational Age', placeholder: 'Weeks + days', required: true, type: 'text' },
      { id: 'symptoms', title: 'Current Symptoms', placeholder: 'Any concerns or symptoms', required: true, type: 'text' },
      { id: 'fetal-movements', title: 'Fetal Movements', placeholder: 'Frequency and pattern', required: true, type: 'text' },
      { id: 'vitals', title: 'Vital Signs', placeholder: 'BP, weight, urine dipstick', required: true, type: 'text' },
      { id: 'examination', title: 'Obstetric Examination', placeholder: 'Fundal height, fetal heart, presentation', required: true, type: 'text' },
      { id: 'investigations', title: 'Investigations', placeholder: 'Ultrasound, blood tests', required: false, type: 'text' },
      { id: 'plan', title: 'Plan', placeholder: 'Next visit, advice', required: true, type: 'text' },
    ],
    aiPrompt: 'Generate an antenatal visit note documenting gestational age, maternal and fetal wellbeing, examination findings, and appropriate antenatal care plan.'
  }
];

// Ayurveda Templates
export const AYURVEDA_TEMPLATES: NoteTemplate[] = [
  {
    id: 'ayurveda-consultation',
    name: 'Ayurvedic Consultation',
    specialty: 'ayurveda',
    description: 'Traditional Ayurvedic assessment',
    sections: [
      { id: 'chief-complaint', title: 'Chief Complaint (Roga)', placeholder: 'Main health concern', required: true, type: 'text' },
      { id: 'prakriti', title: 'Prakriti Assessment', placeholder: 'Constitutional type (Vata/Pitta/Kapha)', required: true, type: 'text' },
      { id: 'vikriti', title: 'Vikriti (Current Imbalance)', placeholder: 'Current dosha imbalance', required: true, type: 'text' },
      { id: 'agni', title: 'Agni (Digestive Fire)', placeholder: 'Digestive capacity assessment', required: true, type: 'text' },
      { id: 'ama', title: 'Ama (Toxins)', placeholder: 'Presence of toxins', required: false, type: 'text' },
      { id: 'nadi-pariksha', title: 'Nadi Pariksha (Pulse Diagnosis)', placeholder: 'Pulse examination findings', required: true, type: 'text' },
      { id: 'jihva-pariksha', title: 'Jihva Pariksha (Tongue Examination)', placeholder: 'Tongue examination', required: false, type: 'text' },
      { id: 'diagnosis', title: 'Ayurvedic Diagnosis', placeholder: 'Diagnosis in Ayurvedic terms', required: true, type: 'text' },
      { id: 'chikitsa', title: 'Chikitsa (Treatment Plan)', placeholder: 'Herbal medicines, therapies', required: true, type: 'text' },
      { id: 'pathya', title: 'Pathya (Diet & Lifestyle)', placeholder: 'Dietary and lifestyle recommendations', required: true, type: 'text' },
    ],
    aiPrompt: 'Generate an Ayurvedic consultation note including prakriti assessment, dosha imbalance, pulse diagnosis, and holistic treatment plan with herbal medicines and lifestyle modifications.'
  },
  {
    id: 'panchakarma-assessment',
    name: 'Panchakarma Assessment',
    specialty: 'ayurveda',
    description: 'Assessment for detoxification therapy',
    sections: [
      { id: 'indication', title: 'Indication for Panchakarma', placeholder: 'Reason for detoxification', required: true, type: 'text' },
      { id: 'prakriti-vikriti', title: 'Prakriti & Vikriti', placeholder: 'Constitution and current state', required: true, type: 'text' },
      { id: 'bala', title: 'Bala (Strength)', placeholder: 'Physical and mental strength', required: true, type: 'text' },
      { id: 'contraindications', title: 'Contraindications', placeholder: 'Any contraindications', required: false, type: 'text' },
      { id: 'purvakarma', title: 'Purvakarma Plan', placeholder: 'Preparatory procedures', required: true, type: 'text' },
      { id: 'pradhanakarma', title: 'Pradhanakarma Plan', placeholder: 'Main detoxification procedures', required: true, type: 'text' },
      { id: 'paschatkarma', title: 'Paschatkarma Plan', placeholder: 'Post-procedure care', required: true, type: 'text' },
      { id: 'duration', title: 'Duration', placeholder: 'Treatment duration', required: true, type: 'text' },
    ],
    aiPrompt: 'Generate a Panchakarma assessment note with detailed evaluation of patient suitability, planned detoxification procedures, and comprehensive pre and post-care instructions.'
  }
];

// Pediatrics Templates
export const PEDIATRICS_TEMPLATES: NoteTemplate[] = [
  {
    id: 'well-child-check',
    name: 'Well Child Check',
    specialty: 'pediatrician',
    description: 'Routine pediatric health check',
    sections: [
      { id: 'age', title: 'Age', placeholder: 'Child\'s age', required: true, type: 'text' },
      { id: 'growth', title: 'Growth Parameters', placeholder: 'Weight, height, head circumference', required: true, type: 'text' },
      { id: 'development', title: 'Developmental Milestones', placeholder: 'Age-appropriate milestones', required: true, type: 'text' },
      { id: 'feeding', title: 'Feeding/Nutrition', placeholder: 'Diet and feeding pattern', required: true, type: 'text' },
      { id: 'immunization', title: 'Immunization Status', placeholder: 'Vaccines given/due', required: true, type: 'text' },
      { id: 'examination', title: 'Physical Examination', placeholder: 'Systematic examination', required: true, type: 'text' },
      { id: 'concerns', title: 'Parental Concerns', placeholder: 'Any concerns raised', required: false, type: 'text' },
      { id: 'advice', title: 'Anticipatory Guidance', placeholder: 'Age-appropriate advice', required: true, type: 'text' },
      { id: 'plan', title: 'Plan', placeholder: 'Next visit, referrals', required: true, type: 'text' },
    ],
    aiPrompt: 'Generate a well child check note documenting growth, development, immunizations, and providing age-appropriate anticipatory guidance.'
  },
  {
    id: 'pediatric-illness',
    name: 'Pediatric Illness Visit',
    specialty: 'pediatrician',
    description: 'Acute illness consultation',
    sections: [
      { id: 'chief-complaint', title: 'Chief Complaint', placeholder: 'Main presenting symptom', required: true, type: 'text' },
      { id: 'history', title: 'History of Present Illness', placeholder: 'Detailed history', required: true, type: 'text' },
      { id: 'vitals', title: 'Vital Signs', placeholder: 'Temp, HR, RR, BP, SpO2', required: true, type: 'text' },
      { id: 'examination', title: 'Physical Examination', placeholder: 'Focused examination', required: true, type: 'text' },
      { id: 'diagnosis', title: 'Diagnosis', placeholder: 'Clinical diagnosis', required: true, type: 'text' },
      { id: 'treatment', title: 'Treatment', placeholder: 'Medications and management', required: true, type: 'text' },
      { id: 'parent-education', title: 'Parent Education', placeholder: 'Home care instructions', required: true, type: 'text' },
      { id: 'follow-up', title: 'Follow-up', placeholder: 'When to return', required: true, type: 'text' },
    ],
    aiPrompt: 'Generate a pediatric illness visit note with age-appropriate assessment, diagnosis, treatment plan, and clear parent education instructions.'
  }
];

// All templates combined
export const ALL_TEMPLATES: NoteTemplate[] = [
  ...GP_TEMPLATES,
  ...DENTAL_TEMPLATES,
  ...CARDIOLOGY_TEMPLATES,
  ...GYNECOLOGY_TEMPLATES,
  ...AYURVEDA_TEMPLATES,
  ...PEDIATRICS_TEMPLATES,
];

// Helper functions
export const getTemplatesBySpecialty = (specialty: MedicalSpecialty): NoteTemplate[] => {
  return ALL_TEMPLATES.filter(t => t.specialty === specialty);
};

export const getTemplateById = (id: string): NoteTemplate | undefined => {
  return ALL_TEMPLATES.find(t => t.id === id);
};

export const SPECIALTY_LABELS: Record<MedicalSpecialty, string> = {
  'general-practitioner': 'General Practitioner',
  'dentist': 'Dentist',
  'cardiologist': 'Cardiologist',
  'gynecologist': 'Gynecologist / Obstetrician',
  'ayurveda': 'Ayurveda Practitioner',
  'pediatrician': 'Pediatrician',
  // Physician Specialties
  'addiction-medicine': 'Addiction Medicine',
  'anaesthetics': 'Anaesthetics',
  'cardiology': 'Cardiology',
  'dermatology': 'Dermatology',
  'emergency-medicine': 'Emergency Medicine',
  'endocrinology': 'Endocrinology',
  'gastroenterology': 'Gastroenterology',
  'general-medicine': 'General Medicine',
  'general-practice': 'General Practice',
  'genetics': 'Genetics',
  'geriatric-medicine': 'Geriatric Medicine',
  'haematology': 'Haematology',
  'icu': 'ICU',
  'immunology-allergy': 'Immunology & Allergy',
  'infectious-disease': 'Infectious Disease',
  'medical-admin': 'Medical Admin',
  'nephrology': 'Nephrology',
  'neurology': 'Neurology',
  'nuclear-medicine': 'Nuclear Medicine',
  'occupational-medicine': 'Occupational Medicine',
  'oncology': 'Oncology',
  'paediatrics': 'Paediatrics',
  'pain-medicine': 'Pain Medicine',
  'palliative-care': 'Palliative Care',
  'pathology': 'Pathology',
  'pharmacology': 'Pharmacology',
  'physician-other': 'Physician - Other',
  'psychiatry': 'Psychiatry',
  'public-health': 'Public Health',
  'radiation-oncology': 'Radiation Oncology',
  'radiology': 'Radiology',
  'rehab-medicine': 'Rehab Medicine',
  'respiratory': 'Respiratory',
  'rheumatology': 'Rheumatology',
  'sexual-health-medicine': 'Sexual Health Medicine',
  // Surgeon Specialties
  'cardiothoracic': 'Cardiothoracic',
  'ear-nose-throat': 'Ear Nose and Throat',
  'general-surgery': 'General Surgery',
  'maxillofacial-surgery': 'Maxillofacial Surgery',
  'neurosurgery': 'Neurosurgery',
  'obstetrics-gynaecology': 'Obstetrics and Gynaecology',
  'ophthalmology': 'Ophthalmology',
  'orthopaedic': 'Orthopaedic',
  'paediatric-surgery': 'Paediatric Surgery',
  'plastics': 'Plastics',
  'urology': 'Urology',
  'vascular': 'Vascular',
  // Allied Health
  'audiology': 'Audiology',
  'chinese-medicine': 'Chinese Medicine',
  'sports-exercise-medicine': 'Sports & Exercise Medicine',
};
