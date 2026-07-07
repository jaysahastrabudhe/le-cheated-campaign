/**
 * Zoho CRM OAuth Token Helper Script
 * 
 * This script exchanges a Zoho OAuth Authorization Code for a persistent Refresh Token.
 * Run this script locally using: node scripts/get-zoho-token.js
 */

const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('=====================================================');
const prompt = (query) => new Promise((resolve) => rl.question(query, resolve));

async function run() {
  console.log('\nSTEP 1: Register your Client in Zoho API Console');
  console.log('1. Go to: https://api-console.zoho.com/');
  console.log('2. Click "Add Client" and select "Self Client".');
  console.log('3. Click "APIs" tab. In Scopes, enter:');
  console.log('   ZohoCRM.modules.ALL');
  console.log('4. Set Duration to "10 minutes" and Scope Description to "Campaign Leads".');
  console.log('5. Click "Generate" and copy the Authorization Code.');
  console.log('=====================================================');

  const clientId = (await prompt('\nEnter your Zoho Client ID: ')).trim();
  const clientSecret = (await prompt('Enter your Zoho Client Secret: ')).trim();
  const authCode = (await prompt('Enter the generated Authorization Code: ')).trim();

  if (!clientId || !clientSecret || !authCode) {
    console.error('\n[Error] All inputs are required to proceed.');
    rl.close();
    return;
  }

  console.log('\nExchanging Authorization Code for tokens...');

  const tokenUrl = 'https://accounts.zoho.com/oauth/v2/token';
  const params = new URLSearchParams({
    code: authCode,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
  });

  try {
    const res = await fetch(tokenUrl, {
      method: 'POST',
      body: params,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const data = await res.json();

    if (data.error) {
      console.error('\n❌ Zoho API Error:', data.error);
      console.log('Ensure your client credentials are correct and the auth code has not expired (must be used within 10 minutes).');
    } else {
      console.log('\n=====================================================');
      console.log('🎉 SUCCESS! Credentials Generated Successfully.');
      console.log('=====================================================');
      console.log('Add the following variables to your Vercel Deployment:\n');
      console.log(`ZOHO_CLIENT_ID="${clientId}"`);
      console.log(`ZOHO_CLIENT_SECRET="${clientSecret}"`);
      console.log(`ZOHO_REFRESH_TOKEN="${data.refresh_token}"`);
      console.log('\nKeep these values secure! The Refresh Token does not expire.');
      console.log('=====================================================');
    }
  } catch (err) {
    console.error('\n❌ Network or parsing failure:', err);
  } finally {
    rl.close();
  }
}

run();
