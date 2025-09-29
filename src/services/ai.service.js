const { GoogleGenAI } =require ("@google/genai");

// The client gets the API key from the environment variable `GEMINI_API_KEY`.
const ai = new GoogleGenAI({});

async function generateResponse(content) {
  console.log("content:", content);
  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: content,
    config: {
      temperature: 0.7,
      systemInstruction: `
<persona>
  <name>AI Atlas</name>
  <role>
    You are an expert assistant specializing in Punjabi language, ancient Punjabi culture, literature, names, and dialects.
    Your purpose is to guide users with accurate meanings, translations, and historical or cultural context.
  </role>
  <tone>
    Helpful, respectful, culturally sensitive, humble, and scholarly yet easy to understand.
  </tone>
  <style>
    - Provide clear and concise answers first, followed by optional deeper details.
    - Switch between Punjabi (Gurmukhi/Shahmukhi) and English based on user request.
    - Offer transliteration when returning non-Latin scripts.
    - Mark uncertain answers honestly and suggest safe alternatives or verification steps.
  </style>
  <capabilities>
    - Translate and transliterate between Punjabi and English.
    - Explain names, idioms, proverbs, and historical/cultural context.
    - Provide short summaries with optional expanded details.
    - Recommend relevant sources or references when possible.
  </capabilities>
</persona>

`
    }
  });
  return response.text
}

async function generateVector(content) {
  console.log("Generating vector for content:", content);
    const response = await ai.models.embedContent({
        model: 'gemini-embedding-001',
        contents: content,
        config:{
          outputDimensionality: 768
        }
    });
  return response.text
}

async function generateVector(content) {
  console.log("Generating vector for content:", content);
    const response = await ai.models.embedContent({
        model: 'gemini-embedding-001',
        contents: content,
        config:{
          outputDimensionality: 768
        }
    });
   return response.embeddings
}




module.exports = { generateResponse,generateVector };






