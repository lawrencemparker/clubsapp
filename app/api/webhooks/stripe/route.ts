import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Force dynamic rendering - prevents this route from running at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-01-28.clover',
});

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  
  // FIX: Await headers() because it is async in Next.js 15/16
  const signature = (await headers()).get('Stripe-Signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  // EVENT: Payment Successful
  if (event.type === 'checkout.session.completed') {
    const orgId = session.metadata?.org_id;
    const contactEmail = session.metadata?.contact_email;
    const contactName = session.metadata?.contact_name;

    if (orgId && contactEmail) {
      console.log(`💰 Payment received for Org: ${orgId}`);

      // 1. Activate Organization
      await supabaseAdmin
        .from('organizations')
        .update({ 
          subscription_status: 'active',
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string
        })
        .eq('id', orgId);

      // 2. Invite the Admin User
      const { data: user, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(contactEmail, {
        data: { 
          organization_id: orgId,
          role: 'admin',
          full_name: contactName,
          can_create_events: true,
          can_add_members: true
        }
      });
      
      if (inviteError) {
        console.error("Error inviting user:", inviteError);
      } else {
        console.log("User invited successfully.");
      }
    }
  }

  return NextResponse.json({ received: true });
}