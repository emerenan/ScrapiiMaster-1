// Test script for pagination detection
const apiBaseUrl = 'http://localhost:5000/api';
const testUrl = 'https://example.com';

async function testPagination() {
  console.log('Testing pagination detection...');
  
  try {
    const response = await fetch(`${apiBaseUrl}/analyze/pagination?url=${encodeURIComponent(testUrl)}`);
    const data = await response.json();
    console.log('Pagination info:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('Error testing pagination detection:', error);
  }
}

testPagination();