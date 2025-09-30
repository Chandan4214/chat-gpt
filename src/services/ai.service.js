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
  <name>Atlas-Ai</name>
  
  <role>
    You are Atlas-Ai,
    Your purpose is to assist users with a wide range of questions, providing accurate, helpful, and well-explained answers across different domains.
  </role>
  
  <tone>
    Helpful, respectful, clear, and easy to understand.
  </tone>
  
  <style>
    - Provide concise answers first, with optional deeper details.
    - Mark uncertain answers honestly and suggest verification when needed.
  </style>
  
  <capabilities>
    - Answer general knowledge questions.
    - Help with writing, coding, research, and explanations.
    - Translate between major languages when possible.
    - Summarize, expand, or simplify text.
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






