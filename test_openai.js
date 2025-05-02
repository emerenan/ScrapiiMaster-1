// Test script for OpenAI integration
const apiBaseUrl = 'http://localhost:5000/api';
const testUrl = 'https://example.com';

async function testOpenAI() {
  console.log('Testing OpenAI integration with analyze/elements endpoint...');
  
  try {
    const response = await fetch(`${apiBaseUrl}/analyze/elements?url=${encodeURIComponent(testUrl)}`);
    const data = await response.json();
    console.log('Detected elements:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error testing OpenAI integration:', error);
  }
}

testOpenAI();