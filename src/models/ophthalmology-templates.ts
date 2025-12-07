import { NoteTemplate } from './templates';

// Ophthalmology Templates
export const OPHTHALMOLOGY_TEMPLATES: NoteTemplate[] = [
    {
        id: 'ophthal-routine-exam',
        name: 'Routine Eye Examination',
        specialty: 'ophthalmology',
        description: 'Comprehensive eye examination',
        sections: [
            { id: 'chief-complaint', title: 'Chief Complaint', placeholder: 'Main visual concern or reason for visit', required: true, type: 'text' },
            { id: 'visual-acuity', title: 'Visual Acuity', placeholder: 'Distance and near vision (OD, OS, OU)', required: true, type: 'text' },
            { id: 'refraction', title: 'Refraction', placeholder: 'Objective and subjective refraction', required: false, type: 'text' },
            { id: 'iop', title: 'Intraocular Pressure', placeholder: 'IOP measurements (OD, OS)', required: true, type: 'text' },
            { id: 'pupils', title: 'Pupil Examination', placeholder: 'Size, shape, reactivity, APD', required: true, type: 'text' },
            { id: 'eom', title: 'Extraocular Movements', placeholder: 'EOM and alignment', required: true, type: 'text' },
            { id: 'confrontation', title: 'Visual Fields', placeholder: 'Confrontation fields or perimetry', required: false, type: 'text' },
            { id: 'slit-lamp', title: 'Slit Lamp Examination', placeholder: 'Anterior segment findings (lids, conjunctiva, cornea, AC, iris, lens)', required: true, type: 'text' },
            { id: 'fundus', title: 'Fundus Examination', placeholder: 'Optic disc, macula, vessels, periphery', required: true, type: 'text' },
            { id: 'diagnosis', title: 'Diagnosis/Impression', placeholder: 'Ophthalmic diagnosis', required: true, type: 'text' },
            { id: 'plan', title: 'Management Plan', placeholder: 'Treatment, prescriptions, follow-up', required: true, type: 'text' },
        ],
        aiPrompt: 'Generate a comprehensive ophthalmology examination note including visual acuity, IOP, detailed slit lamp and fundus examination findings, diagnosis, and management plan. Use standard ophthalmology terminology and abbreviations (OD, OS, OU, PERRLA, etc.).'
    },
    {
        id: 'ophthal-cataract-consult',
        name: 'Cataract Consultation',
        specialty: 'ophthalmology',
        description: 'Pre-operative cataract assessment',
        sections: [
            { id: 'symptoms', title: 'Visual Symptoms', placeholder: 'Blurred vision, glare, difficulty with activities', required: true, type: 'text' },
            { id: 'visual-acuity', title: 'Visual Acuity', placeholder: 'Best corrected visual acuity (BCVA)', required: true, type: 'text' },
            { id: 'cataract-grading', title: 'Cataract Grading', placeholder: 'Type and density (nuclear, cortical, PSC)', required: true, type: 'text' },
            { id: 'biometry', title: 'Biometry', placeholder: 'Axial length, K readings, IOL power calculation', required: false, type: 'text' },
            { id: 'ocular-health', title: 'Ocular Health', placeholder: 'Cornea, retina, optic nerve assessment', required: true, type: 'text' },
            { id: 'medical-history', title: 'Relevant Medical History', placeholder: 'Diabetes, medications, allergies', required: true, type: 'text' },
            { id: 'surgical-plan', title: 'Surgical Plan', placeholder: 'Phacoemulsification, IOL type, target refraction', required: true, type: 'text' },
            { id: 'risks-discussed', title: 'Risks Discussed', placeholder: 'Surgical risks and complications discussed', required: true, type: 'text' },
            { id: 'consent', title: 'Consent', placeholder: 'Informed consent obtained', required: true, type: 'text' },
        ],
        aiPrompt: 'Generate a cataract consultation note including visual symptoms, cataract grading, biometry results, surgical plan with IOL selection, risks discussed, and consent documentation.'
    },
    {
        id: 'ophthal-glaucoma-followup',
        name: 'Glaucoma Follow-up',
        specialty: 'ophthalmology',
        description: 'Glaucoma monitoring visit',
        sections: [
            { id: 'interval-history', title: 'Interval History', placeholder: 'Changes since last visit, medication compliance', required: true, type: 'text' },
            { id: 'visual-acuity', title: 'Visual Acuity', placeholder: 'Current VA (OD, OS)', required: true, type: 'text' },
            { id: 'iop', title: 'Intraocular Pressure', placeholder: 'Current IOP and comparison to previous', required: true, type: 'text' },
            { id: 'gonioscopy', title: 'Gonioscopy', placeholder: 'Angle assessment if performed', required: false, type: 'text' },
            { id: 'optic-disc', title: 'Optic Disc Assessment', placeholder: 'Cup-to-disc ratio, rim appearance, hemorrhages', required: true, type: 'text' },
            { id: 'visual-field', title: 'Visual Field', placeholder: 'Perimetry results and progression', required: false, type: 'text' },
            { id: 'oct', title: 'OCT', placeholder: 'RNFL thickness, GCC analysis', required: false, type: 'text' },
            { id: 'medications', title: 'Current Medications', placeholder: 'Glaucoma medications and compliance', required: true, type: 'text' },
            { id: 'assessment', title: 'Assessment', placeholder: 'Disease control, progression status', required: true, type: 'text' },
            { id: 'plan', title: 'Management Plan', placeholder: 'Continue/adjust medications, surgery consideration, follow-up', required: true, type: 'text' },
        ],
        aiPrompt: 'Generate a glaucoma follow-up note documenting IOP control, optic disc changes, visual field progression, medication compliance, and management adjustments. Include comparison to previous visits.'
    },
    {
        id: 'ophthal-diabetic-retinopathy',
        name: 'Diabetic Retinopathy Screening',
        specialty: 'ophthalmology',
        description: 'Diabetic eye examination',
        sections: [
            { id: 'diabetes-history', title: 'Diabetes History', placeholder: 'Type, duration, HbA1c, control', required: true, type: 'text' },
            { id: 'visual-acuity', title: 'Visual Acuity', placeholder: 'Best corrected VA (OD, OS)', required: true, type: 'text' },
            { id: 'anterior-segment', title: 'Anterior Segment', placeholder: 'Lens status, rubeosis', required: true, type: 'text' },
            { id: 'retinopathy-grading', title: 'Diabetic Retinopathy Grading', placeholder: 'None, mild/moderate/severe NPDR, PDR', required: true, type: 'text' },
            { id: 'macular-edema', title: 'Diabetic Macular Edema', placeholder: 'Presence and severity of DME', required: true, type: 'text' },
            { id: 'oct-macula', title: 'OCT Macula', placeholder: 'Central macular thickness, fluid', required: false, type: 'text' },
            { id: 'fundus-photo', title: 'Fundus Photography', placeholder: 'Wide-field imaging findings', required: false, type: 'text' },
            { id: 'other-findings', title: 'Other Findings', placeholder: 'Vitreous hemorrhage, TRD, NVD, NVE', required: false, type: 'text' },
            { id: 'plan', title: 'Management Plan', placeholder: 'Observation, laser, anti-VEGF, referral, follow-up interval', required: true, type: 'text' },
        ],
        aiPrompt: 'Generate a diabetic retinopathy screening note with DR grading, macular edema assessment, OCT findings, and appropriate management plan including treatment recommendations and follow-up timing.'
    },
    {
        id: 'ophthal-postop',
        name: 'Post-operative Visit',
        specialty: 'ophthalmology',
        description: 'Post-surgical follow-up',
        sections: [
            { id: 'procedure', title: 'Procedure Performed', placeholder: 'Type of surgery and date', required: true, type: 'text' },
            { id: 'symptoms', title: 'Current Symptoms', placeholder: 'Pain, vision, discharge, photophobia', required: true, type: 'text' },
            { id: 'visual-acuity', title: 'Visual Acuity', placeholder: 'Uncorrected and best corrected VA', required: true, type: 'text' },
            { id: 'iop', title: 'Intraocular Pressure', placeholder: 'Post-operative IOP', required: true, type: 'text' },
            { id: 'anterior-segment', title: 'Anterior Segment', placeholder: 'Wound, AC reaction, IOL position', required: true, type: 'text' },
            { id: 'fundus', title: 'Fundus Examination', placeholder: 'Posterior segment assessment', required: true, type: 'text' },
            { id: 'complications', title: 'Complications', placeholder: 'Any post-operative complications', required: false, type: 'text' },
            { id: 'medications', title: 'Post-operative Medications', placeholder: 'Current eye drops and compliance', required: true, type: 'text' },
            { id: 'assessment', title: 'Assessment', placeholder: 'Post-operative recovery status', required: true, type: 'text' },
            { id: 'plan', title: 'Plan', placeholder: 'Continue/taper medications, next visit, restrictions', required: true, type: 'text' },
        ],
        aiPrompt: 'Generate a post-operative ophthalmology note documenting surgical recovery, visual outcomes, wound healing, complications if any, and ongoing management plan.'
    },
    {
        id: 'ophthal-red-eye',
        name: 'Red Eye / Acute Problem',
        specialty: 'ophthalmology',
        description: 'Acute eye problem consultation',
        sections: [
            { id: 'chief-complaint', title: 'Chief Complaint', placeholder: 'Redness, pain, discharge, vision change', required: true, type: 'text' },
            { id: 'history', title: 'History of Present Illness', placeholder: 'Onset, duration, associated symptoms, trauma', required: true, type: 'text' },
            { id: 'visual-acuity', title: 'Visual Acuity', placeholder: 'VA in affected eye(s)', required: true, type: 'text' },
            { id: 'external-exam', title: 'External Examination', placeholder: 'Lids, lashes, discharge', required: true, type: 'text' },
            { id: 'conjunctiva', title: 'Conjunctiva', placeholder: 'Injection pattern, chemosis, follicles', required: true, type: 'text' },
            { id: 'cornea', title: 'Cornea', placeholder: 'Clarity, epithelial defect, infiltrate, fluorescein staining', required: true, type: 'text' },
            { id: 'anterior-chamber', title: 'Anterior Chamber', placeholder: 'Depth, cells, flare, hypopyon', required: true, type: 'text' },
            { id: 'iop', title: 'Intraocular Pressure', placeholder: 'IOP if indicated', required: false, type: 'text' },
            { id: 'diagnosis', title: 'Diagnosis', placeholder: 'Conjunctivitis, keratitis, uveitis, etc.', required: true, type: 'text' },
            { id: 'treatment', title: 'Treatment', placeholder: 'Topical medications, oral medications, procedures', required: true, type: 'text' },
            { id: 'follow-up', title: 'Follow-up', placeholder: 'When to return, warning signs', required: true, type: 'text' },
        ],
        aiPrompt: 'Generate an acute eye problem note with detailed examination of the red eye, differential diagnosis consideration, appropriate treatment plan, and clear follow-up instructions.'
    }
];
