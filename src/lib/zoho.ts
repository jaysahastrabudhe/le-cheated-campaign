const ZOHO_BASE_URL = 'https://www.zohoapis.com/crm/v2';
const ZOHO_AUTH_URL = 'https://accounts.zoho.com/oauth/v2/token';

// In-memory token cache to prevent hitting OAuth limit on every submit
let cachedToken: string | null = null;
let tokenExpiresAt = 0;

/**
 * Gets a valid Zoho Access Token using the refresh token from env variables.
 * Caches the token in-memory in the serverless function environment.
 */
export async function getZohoAccessToken(): Promise<string | null> {
  const clientId = process.env.ZOHO_CLIENT_ID;
  const clientSecret = process.env.ZOHO_CLIENT_SECRET;
  const refreshToken = process.env.ZOHO_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.warn('[Zoho] API credentials missing — writeback disabled.');
    return null;
  }

  // Check cache
  if (cachedToken && Date.now() < tokenExpiresAt) {
    return cachedToken;
  }

  console.log('[Zoho] Refreshing Access Token...');
  try {
    const params = new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    });

    const res = await fetch(ZOHO_AUTH_URL, {
      method: 'POST',
      body: params,
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Zoho Auth Error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    if (!data.access_token) {
      throw new Error(`Zoho Auth Error: No access_token in response: ${JSON.stringify(data)}`);
    }

    cachedToken = data.access_token;
    // Cache it for 55 minutes
    tokenExpiresAt = Date.now() + 55 * 60 * 1000;

    return cachedToken;
  } catch (err) {
    console.error('[Zoho] Failed to refresh access token:', err);
    return null;
  }
}

/**
 * Creates a new lead in Zoho CRM.
 * Returns the generated Zoho Lead ID on success, or null on failure/credentials missing.
 */
export async function createZohoLead(fields: Record<string, any>): Promise<string | null> {
  const token = await getZohoAccessToken();
  if (!token) {
    console.warn('[Zoho Create] No access token — lead will not be written to Zoho.');
    return null;
  }

  console.log(`[Zoho Create] Creating lead in Zoho CRM...`);

  try {
    const res = await fetch(`${ZOHO_BASE_URL}/Leads`, {
      method: 'POST',
      headers: {
        'Authorization': `Zoho-oauthtoken ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: [fields],
      }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      console.error(`[Zoho Create] API error ${res.status}:`, JSON.stringify(errData));
      return null;
    }

    const result = await res.json();
    if (result.data && result.data[0]?.status === 'success') {
      const leadId = result.data[0].details.id;
      console.log(`[Zoho Create] Successfully created lead in Zoho: ${leadId}`);
      return leadId;
    }

    console.warn(`[Zoho Create] Non-success response:`, JSON.stringify(result));
    return null;
  } catch (err) {
    console.error(`[Zoho Create] Failed to create lead in Zoho:`, err);
    return null;
  }
}
