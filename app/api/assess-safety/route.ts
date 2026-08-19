import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { modalityName, customDose, originalDose } = await req.json();

    const systemPrompt = `You are a strict medical safety AI. A user is attempting to customize the dosage or timing of a modality.
Evaluate the safety and efficacy of the user's custom dose against the standard medically-validated dose.
Respond with a short, clinical assessment (2-3 sentences max). If it is unsafe, clearly state that it exceeds recommended safe limits. If it is likely safe but lacks clinical evidence, state that it is safe but efficacy is unknown.`;

    const result = await generateText({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      prompt: `Modality: ${modalityName}\nOriginal Dose/Timing: ${originalDose}\nUser's Custom Dose/Timing: ${customDose}`,
    });

    return new Response(JSON.stringify({ assessment: result.text }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error("API Assess Safety Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), { status: 500 });
  }
}
