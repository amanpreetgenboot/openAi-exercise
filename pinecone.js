const { Pinecone } = require("pinecone-client");

const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY,
});

const indexName = "webpage-content"; 

async function initPinecone() {
  try {
    const existingIndexes = await pinecone.listIndexes();
    if (!existingIndexes.includes(indexName)) {
      await pinecone.createIndex(indexName, {
        dimension: 768, 
        metric: "cosine",
      });
    }
  } catch (error) {
    console.error("Error initializing Pinecone:", error);
  }
}

module.exports = { pinecone, indexName, initPinecone };
