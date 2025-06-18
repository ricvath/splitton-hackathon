// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.50.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create a Supabase client with the Auth context of the function
    const supabaseClient = createClient(
      // Supabase API URL - env var exported by default.
      Deno.env.get("SUPABASE_URL") ?? "",
      // Supabase API ANON KEY - env var exported by default.
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      // Create client with Auth context of the user that called the function.
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      serviceRoleKey
    );

    // Calculate the date 30 days ago
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString();

    // Get all events
    const { data: events, error: eventsError } = await adminClient
      .from("events")
      .select("id, created_at");

    if (eventsError) {
      throw eventsError;
    }

    const eventsToCheck = events || [];
    const deletedEvents = [];
    const errors = [];

    // For each event, check if there are any expenses in the last 30 days
    for (const event of eventsToCheck) {
      try {
        // Get the most recent expense for this event
        const { data: latestExpense, error: expenseError } = await adminClient
          .from("expenses")
          .select("created_at")
          .eq("event_id", event.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        if (expenseError && expenseError.code !== "PGRST116") {
          // PGRST116 means no rows returned, which is fine
          throw expenseError;
        }

        // If no expenses or the latest expense is older than 30 days, delete the event
        const latestActivity = latestExpense?.created_at || event.created_at;
        if (new Date(latestActivity) < thirtyDaysAgo) {
          console.log(`Deleting inactive event: ${event.id}, last activity: ${latestActivity}`);

          // Delete all related data (expenses and participants will be deleted due to cascade)
          const { error: deleteError } = await adminClient
            .from("events")
            .delete()
            .eq("id", event.id);

          if (deleteError) {
            throw deleteError;
          }

          deletedEvents.push(event.id);
        }
      } catch (error) {
        console.error(`Error processing event ${event.id}:`, error);
        errors.push({ eventId: event.id, error: error.message });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleanup completed. Deleted ${deletedEvents.length} inactive events.`,
        deletedEvents,
        errors: errors.length > 0 ? errors : null,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in cleanup function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
}); 