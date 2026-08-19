import { generateText } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY
});

async function main() {
  try {
    const { text } = await generateText({
      model: google("gemini-1.5-flash-latest"),
      prompt: "Hello, say test"
    });
    console.log("RESULT FLASH LATEST:", text);
  } catch(e) {
    console.error("ERROR FLASH LATEST:", e.message);
  }
}
main();
