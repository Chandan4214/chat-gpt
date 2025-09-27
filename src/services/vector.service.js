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

async function queryMemory({queryVector,limit=5,metadata}){
  const data =await chatgpt_index.query({
       vector:queryVector,
        topK:limit,
        filter : metadata?{metadata}:undefined,




})
  return data.matches
}



module.exports={createMemory,queryMemory}