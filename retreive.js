async function retrieveRelevantChunks(query) {
    try {
      const queryEmbedding = await generateEmbedding(query);
      const index = pinecone.index(indexName);
      const searchResults = await index.query({
        vector: queryEmbedding,
        topK: 5, 
        includeMetadata: true,
      });
  
      return searchResults.matches.map(match => match.metadata.text).join("\n");
    } catch (error) {
      console.error("Error retrieving relevant content from Pinecone:", error);
      return "";
    }
  }
  
  module.exports = { retrieveRelevantChunks };
  