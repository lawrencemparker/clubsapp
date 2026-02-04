import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Force dynamic rendering - prevents this route from running at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Initialize Stripe with the correct API version matching your installed library
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover', 
});

// Admin Client to bypass RLS for creation
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Helper function to generate a URL-safe subdomain from organization name
function generateSubdomain(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')      // Remove leading/trailing hyphens
    .substring(0, 50);             // Limit length
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      name, 
      contactName, 
      contactEmail, 
      contactPhone,
      monthlyFee,
      storageLimitGB,
      address, 
      city, 
      state, 
      zip 
    } = body;

    console.log('📝 Creating organization:', { 
      name, 
      contactEmail, 
      monthlyFee, 
      storageLimitGB 
    });

    // Generate a unique subdomain
    let subdomain = generateSubdomain(name);
    let subdomainAttempt = 0;
    let isUnique = false;

    while (!isUnique && subdomainAttempt < 10) {
      const { data: existing } = await supabaseAdmin
        .from('organizations')
        .select('id')
        .eq('subdomain', subdomain)
        .single();

      if (!existing) {
        isUnique = true;
      } else {
        subdomainAttempt++;
        subdomain = `${generateSubdomain(name)}-${subdomainAttempt}`;
      }
    }

    console.log('🌐 Generated subdomain:', subdomain);

    // 1. Create a Price in Stripe
    const price = await stripe.prices.create({
      unit_amount: Math.round(monthlyFee * 100),
      currency: 'usd',
      recurring: { interval: 'month' },
      product: process.env.STRIPE_PRODUCT_ID!,
      metadata: { org_name: name }
    });

    console.log('💳 Stripe price created:', price.id);

    // 2. Create Organization in Supabase
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name: name,
        subdomain: subdomain,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zip: zip || null,
        monthly_fee: monthlyFee,
        storage_limit_gb: storageLimitGB || 1,
        storage_used_gb: 0,
        subscription_status: 'pending_payment',
        payment_status: 'pending',
        file_count: 0
      })
      .select()
      .single();

    if (orgError) {
      console.error('❌ Database error:', orgError);
      throw new Error(`Database Error: ${orgError.message}`);
    }

    // BASE URL VALIDATION: Ensure we have a scheme (http/https)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const formattedBaseUrl = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;

    // 3. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: `${formattedBaseUrl}/login?setup_success=true`,
      cancel_url: `${formattedBaseUrl}/super-admin?canceled=true`,
      customer_email: contactEmail,
      metadata: {
        org_id: org.id,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone || ''
      },
    });

    console.log('🔗 Stripe checkout session created:', session.url);

    return NextResponse.json({ 
      success: true, 
      paymentUrl: session.url, 
      orgId: org.id,
      orgName: org.name,
      subdomain: org.subdomain
    });

  } catch (error: any) {
    console.error('❌ Registration Error:', error);
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'An error occurred' 
    }, { status: 500 });
  }
}