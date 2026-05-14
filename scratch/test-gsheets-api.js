const { google } = require('googleapis');
const path = require('path');

async function testConnection() {
  console.log('Testing Google Sheets API connection...');
  const keyPath = 'D:\\Epostal\\epostal-mcp-key.json\\cool-clarity-479902-t0-9acaf4aa926c.json';
  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const spreadsheetId = '1cJsSEs5wXof4jORuaonNn0mA9AfENzQoSw5s9D7J8SQ';
  
  console.time('API_Call');
  try {
    const res = await sheets.spreadsheets.get({
      spreadsheetId,
    });
    console.timeEnd('API_Call');
    console.log('Success! Spreadsheet Title:', res.data.properties.title);
    console.log('Sheets found:', res.data.sheets.length);
  } catch (err) {
    console.timeEnd('API_Call');
    console.error('Error connecting to Google Sheets API:', err.message);
    if (err.response) {
      console.error('Response Data:', err.response.data);
    }
  }
}

testConnection();
