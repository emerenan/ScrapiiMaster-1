// Test script for checking API endpoints
const testUrl = 'https://example.com';
const apiBaseUrl = 'http://localhost:5000/api';

async function testApi() {
  console.log('Testing API endpoints...');
  
  // Test premium status
  try {
    const premiumResponse = await fetch(`${apiBaseUrl}/user/premium`);
    const premiumData = await premiumResponse.json();
    console.log('Premium status:', premiumData);
  } catch (error) {
    console.error('Error testing premium status:', error);
  }
  
  // Test database connections
  try {
    const connectionsResponse = await fetch(`${apiBaseUrl}/database/connections`);
    const connectionsData = await connectionsResponse.json();
    console.log('Database connections:', connectionsData);
  } catch (error) {
    console.error('Error testing database connections:', error);
  }
  
  // Test page info
  try {
    const pageResponse = await fetch(`${apiBaseUrl}/analyze/page?url=${encodeURIComponent(testUrl)}`);
    const pageData = await pageResponse.json();
    console.log('Page info:', pageData);
  } catch (error) {
    console.error('Error testing page info:', error);
  }
  
  console.log('API tests completed');
}

testApi();