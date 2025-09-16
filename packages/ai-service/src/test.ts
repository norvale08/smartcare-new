import { Ollama } from 'ollama';

async function testConnection() {
  try {
    const ollama = new Ollama({ host: 'http://localhost:11434' });
    
    console.log("Testing Ollama connection...");
    
    // Test basic connection
    const response = await ollama.chat({
      model: 'llama3.2:3b',
      messages: [{ role: 'user', content: 'Hello' }],
    });
    
    console.log("Success! Response:", response.message.content);
    
  } catch (error) {
    console.error("Connection failed:", error);
  }
}

testConnection();