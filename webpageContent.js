const { pinecone, indexName } = require("./pinecone");
const { generateEmbedding } = require("./generateEmbedding");

async function storeWebpageContent(url, content) {
  try {
    const chunks = splitTextIntoChunks(content); 

    const embeddings = await Promise.all(chunks.map(chunk => generateEmbedding(chunk)));

    const index = pinecone.index(indexName);
    const vectors = embeddings.map((embedding, i) => ({
      id: `${url}-${i}`, 
      values: embedding,
      metadata: { url, text: chunks[i] },
    }));

    await index.upsert(vectors);
    console.log("Stored embeddings in Pinecone.");
  } catch (error) {
    console.error("Error storing content in Pinecone:", error);
  }
}

function splitTextIntoChunks(text, chunkSize = 512) {
  return text.match(new RegExp(`.{1,${chunkSize}}`, "g")) || [text];
}

module.exports = { storeWebpageContent };
