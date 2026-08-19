import { google } from '@ai-sdk/google'
import { generateText } from 'ai'

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { protocolName, activeModalities, availableModalities, userQuestion } = await req.json()

    const systemPrompt = `You are the LEVL Protocol Synergy & Longevity Science AI Coach.
You specialize in clinical longevity protocols (Bryan Johnson Blueprint, Peter Attia Centenarian Decathlon, David Sinclair Epigenetic Stack, Valter Longo FMD, Matthew Walker Sleep Architecture, etc.).

Your task is to provide concise, evidence-based advice for customizing a user's longevity protocol stack.

Context:
- Protocol Name: ${protocolName}
- Current Active Modalities in Stack: ${activeModalities.join(', ')}
- Available/Original Blueprint Modalities: ${availableModalities.join(', ')}

Guidelines:
- Keep answers concise, high-yield, and actionable (2-3 paragraphs max).
- Explain biological mechanisms (e.g., SIRT1 activation, NAD+ pools, AMPK phosphorylation, GLUT4 translocation, thermoregulation).
- Recommend optimal timing windows or synergies if asked.
- Reference verified clinical papers or landmark trials where relevant.

CRITICAL INSTRUCTION:
At the very end of your response, if you recommend adding or removing any specific modalities, ALWAYS append a JSON block formatted EXACTLY like this:
\`\`\`json
{
  "suggestedAdditions": ["Modality Name To Add"],
  "suggestedRemovals": ["Modality Name To Remove"]
}
\`\`\``

    const result = await generateText({
      model: google('gemini-2.5-flash'),
      system: systemPrompt,
      prompt: `User Question: "${userQuestion}"`
    })

    // Parse advice text and optional JSON actions payload
    let advice = result.text
    let suggestedAdditions: string[] = []
    let suggestedRemovals: string[] = []

    const jsonMatch = result.text.match(/```json\s*([\s\S]*?)\s*```/)
    if (jsonMatch && jsonMatch[1]) {
      try {
        const parsed = JSON.parse(jsonMatch[1])
        if (Array.isArray(parsed.suggestedAdditions)) suggestedAdditions = parsed.suggestedAdditions
        if (Array.isArray(parsed.suggestedRemovals)) suggestedRemovals = parsed.suggestedRemovals
        advice = result.text.replace(/```json\s*[\s\S]*?\s*```/, '').trim()
      } catch (e) {
        console.error('Failed to parse suggested actions JSON:', e)
      }
    }

    return new Response(JSON.stringify({ 
      advice, 
      suggestedAdditions, 
      suggestedRemovals 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('API Protocol Coach Error:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500 }
    )
  }
}
