// Import the Pinecone library
const  { Pinecone } = require('@pinecone-database/pinecone')
// Initialize a Pinecone client with your API key
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

// Create a dense index with integrated embedding
const chatgpt_index = pc.index('chatgpt')


async function createMemory({vectors,metadata,messageId}){
  await chatgpt_index.upsert([
    {
      id:messageId,
      values:vectors,
      metadata
    }
  ])
}

async function queryMemory({ queryVector, limit = 5, metadata }) {
  if (!Array.isArray(queryVector) || queryVector.length === 0) return [];

  // Build Pinecone filter
  let filter;
  if (metadata) {
    filter = {};
    for (const key in metadata) {
      filter[key] = { $eq: metadata[key] }; // ✅ use $eq operator
    }
  }

  const data = await chatgpt_index.query({
    vector: queryVector,
    topK: limit,
    filter,                // proper Pinecone filter format
    includeMetadata: true,
  });

  return data.matches || [];
}



module.exports={createMemory,queryMemory}