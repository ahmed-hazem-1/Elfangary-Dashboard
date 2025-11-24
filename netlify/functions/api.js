// This file helps route API calls to the correct Netlify functions

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  return {
    statusCode: 404,
    headers,
    body: JSON.stringify({ error: 'API endpoint not found' })
  };
};
