import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createZohoLead } from '@/lib/zoho';
import { sql } from '@/lib/db';

const submitSchema = z.object({
  name: z.string().min(1, "Name is required"),
  phone: z.string().min(10, "Phone number is required"),
  email: z.string().email("Invalid email").optional().nullable().or(z.literal('')),
  city: z.string().min(1, "City is required"),
  stream: z.string().optional().nullable(),
  persona: z.enum(["Student", "Parent"]).default("Student"),
  location: z.string().optional().nullable()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('[Campaign Submit] Received body:', body);

    const validation = submitSchema.safeParse(body);
    if (!validation.success) {
      console.error('[Campaign Submit] Validation failed:', validation.error.format());
      return NextResponse.json({ error: 'Invalid payload structure', details: validation.error.format() }, { status: 400 });
    }

    const { name, phone, email, city, stream, persona, location } = validation.data;

    // Normalise phone number to +91XXXXXXXXXX
    const phoneNum = String(phone).replace(/\D/g, '');
    if (phoneNum.length < 10) {
      return NextResponse.json({ error: 'Phone number must be at least 10 digits' }, { status: 400 });
    }
    const cleanPhone = phoneNum.startsWith('91') ? `+${phoneNum}` : (phoneNum.length === 10 ? `+91${phoneNum}` : `+${phoneNum}`);

    // Split Name into First_Name and Last_Name
    const nameParts = (name || '').trim().split(/\s+/);
    let firstName = '';
    let lastName = 'Lead';
    if (nameParts.length > 1) {
      firstName = nameParts.slice(0, -1).join(' ');
      lastName = nameParts[nameParts.length - 1];
    } else if (nameParts.length === 1 && nameParts[0] !== '') {
      lastName = nameParts[0];
    }

    // Call Zoho to create lead
    const zohoPayload = {
      First_Name: firstName,
      Last_Name: lastName,
      Email: email || null,
      Phone: cleanPhone,
      Mobile: cleanPhone,
      City: city,
      Lead_Source: 'Your-School-Cheated',
      Ad_Campaign_Name: 'Your-School-Cheated',
      Ad_Name: location || 'landing-page',
      You_are_interested_as: persona,
      What_are_you_currently_doing: stream || null,
      Lead_Stage: 'MQL',
      Lead_Status: 'Not Contacted'
    };

    let zohoLeadId: string | null = null;
    try {
      zohoLeadId = await createZohoLead(zohoPayload);
    } catch (zohoErr) {
      console.error('[Campaign Submit] Zoho lead creation exception:', zohoErr);
    }

    // Optional direct write to shared database if DATABASE_URL is configured
    if (sql) {
      try {
        console.log('[Campaign Submit] DATABASE_URL detected. Performing direct DB sync...');
        
        const existing = await sql`
          SELECT id, wa_state, zoho_lead_id FROM leads WHERE phone_normalised = ${cleanPhone} LIMIT 1
        ` as Array<{ id: string; wa_state: string; zoho_lead_id: string | null }>;

        if (existing && existing.length > 0) {
          // Update contact info, preserving wa_state
          await sql`
            UPDATE leads 
               SET zoho_lead_id = COALESCE(${zohoLeadId || existing[0].zoho_lead_id}, zoho_lead_id), 
                   name = ${name}, 
                   email = ${email || null}, 
                   lead_source = ${'Your-School-Cheated'}, 
                   campaign_name = ${'Your-School-Cheated'}, 
                   ad_name = ${location || 'landing-page'}, 
                   persona = ${persona}, 
                   academic_level = ${stream || null}, 
                   urgency = ${'HIGH'}, 
                   lead_stage = ${'MQL'}, 
                   lead_status = ${'Not Contacted'}, 
                   updated_at = NOW() 
             WHERE phone_normalised = ${cleanPhone}
          `;
          console.log('[Campaign Submit] Direct DB update completed.');
        } else {
          // Insert new lead with state wa_pending
          await sql`
            INSERT INTO leads (
                zoho_lead_id, phone_normalised, name, email, 
                lead_source, campaign_name, ad_name, persona, 
                academic_level, urgency, lead_stage, lead_status, 
                wa_state, wa_opt_in, created_at, updated_at
             ) VALUES (
                ${zohoLeadId}, ${cleanPhone}, ${name}, ${email || null}, 
                ${'Your-School-Cheated'}, ${'Your-School-Cheated'}, ${location || 'landing-page'}, ${persona}, 
                ${stream || null}, ${'HIGH'}, ${'MQL'}, ${'Not Contacted'}, 
                ${'wa_pending'}, ${true}, NOW(), NOW()
             )
          `;
          console.log('[Campaign Submit] Direct DB insertion completed.');
        }
      } catch (dbErr) {
        console.error('[Campaign Submit] Optional DB write failed:', dbErr);
      }
    }

    return NextResponse.json({ success: true, zohoLeadId }, { status: 200 });

  } catch (err: any) {
    console.error('[Campaign Submit] Internal Server Error:', err);
    return NextResponse.json({ error: 'Internal Server Error', message: err.message }, { status: 500 });
  }
}
