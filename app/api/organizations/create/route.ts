import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe with the correct API version matching your installed library
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover', 
});

// Admin Client to bypass RLS for creation
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      name, 
      contactName, 
      contactEmail, 
      contactPhone,
      monthlyFee, 
      address, 
      city, 
      state, 
      zip 
    } = body;

    // 1. Create a Price in Stripe dynamically
    // We create a recurring price for the specific amount entered in the form
    const price = await stripe.prices.create({
      unit_amount: Math.round(monthlyFee * 100), // Convert dollars to cents
      currency: 'usd',
      recurring: { interval: 'month' },
      product: process.env.STRIPE_PRODUCT_ID!,
      metadata: { org_name: name }
    });

    // 2. Create Organization in Supabase
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .insert({
        name,
        address,
        city,
        state,
        zip,
        monthly_fee: monthlyFee,
        subscription_status: 'pending_payment'
      })
      .select()
      .single();

    if (orgError) throw new Error(`Database Error: ${orgError.message}`);

    // 3. Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: price.id, quantity: 1 }],
      // Success URL: Where the user goes after paying
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/login?setup_success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/?canceled=true`,
      customer_email: contactEmail, // Pre-fill the email
      metadata: {
        org_id: org.id,
        contact_name: contactName,
        contact_email: contactEmail,
        contact_phone: contactPhone
      },
    });

    return NextResponse.json({ 
      success: true, 
      paymentUrl: session.url, 
      orgId: org.id 
    });

  } catch (error: any) {
    console.error('Registration Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}