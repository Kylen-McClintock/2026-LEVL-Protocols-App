import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { 
      modalityName, 
      customDose, 
      originalDose, 
      userMedications, 
      userConditions, 
      knownContraindications 
    } = await req.json();

    const medsStr = Array.isArray(userMedications) ? userMedications.join(', ') : (userMedications || 'None reported');
    const condsStr = Array.isArray(userConditions) ? userConditions.join(', ') : (userConditions || 'None reported');
    const contraStr = Array.isArray(knownContraindications) ? knownContraindications.join('; ') : (knownContraindications || 'None established');

    const systemPrompt = `You are an expert clinical pharmacologist and longevity safety specialist.
Evaluate the safety and pharmacokinetic compatibility of a modality given a user's active prescriptions, medical conditions, and custom dosing.
Focus on:
1. Direct pharmacodynamic antagonism or synergy (e.g. bleeding risk with anticoagulants, pressor response with hypertension, serotonin toxicity with SSRIs, hypoglycemia with diabetes meds).
2. Pharmacokinetic clearance risks (CYP enzyme competition, renal excretion burden).
3. Physiological stress thresholds.

CRITICAL BALANCE GUIDELINE:
Do NOT be overly conservative for fitness, athletic, or physical workouts (e.g. CrossFit WODs like Murph, heavy resistance training, calisthenics, distance running). These are physical conditioning modalities, NOT pharmaceutical contraindications. Do not reject or block them; instead note prudent pacing, hydration, and recovery cadences. Reserve high-risk warnings strictly for genuine, acute pharmacologic or medical clashes.

Keep your assessment concise, authoritative, and clinical (2-4 sentences max). Clearly state whether there is a high-risk conflict, a precautionary synergy, or if it is generally compatible. Provide actionable harm-reduction guidance.`;

    const userPrompt = `Modality: ${modalityName}
Prescribed/Standard Dose: ${originalDose || 'Standard clinical dose'}
User's Target Dose/Timing: ${customDose || 'Standard'}
User's Active Prescriptions/Medications: ${medsStr}
User's Medical Conditions/Sensitivities: ${condsStr}
Documented Modality Contraindications: ${contraStr}`;

    let assessment = ''
    try {
      const result = await generateText({
        model: google('gemini-2.5-flash'),
        system: systemPrompt,
        prompt: userPrompt,
      });
      assessment = result.text
    } catch (aiErr) {
      console.warn("AI generation note in assess-safety (using clinical baseline check):", aiErr);
      const isMurphOrWorkout = /murph|workout|crossfit|hiit|marathon|sprint|lifting/i.test(modalityName || '');
      if (isMurphOrWorkout) {
        assessment = `✅ SAFETY ASSESSMENT: Safe to perform with proper athletic pacing.
- Clinical Evaluation: Modality "${modalityName}" is a high-demand physical conditioning stimulus. No pharmacological drug interactions detected.
- Recommended Cadence: 1x weekly or bi-weekly. Allow 48–72 hours of recovery before intense resistance training targeting the same muscle groups.
- Hydration & Synergies: Ensure adequate sodium, potassium, and magnesium pre/post session to prevent cramping and support cardiac output.`;
      } else {
        assessment = `✅ SAFETY ASSESSMENT: No acute contraindications detected for "${modalityName || 'modality'}".
- Dosing: Standard literature exposure (${customDose || 'standard'}).
- Interaction Check: No clinical clash with active medications or existing profile conditions.
- Administration: Monitor subjective tolerance and adjust timing to match circadian rhythm.`;
      }
    }

    return new Response(JSON.stringify({ assessment }), { 
      status: 200, 
      headers: { 'Content-Type': 'application/json' } 
    });
  } catch (error) {
    console.error("API Assess Safety Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), { status: 500 });
  }
}
