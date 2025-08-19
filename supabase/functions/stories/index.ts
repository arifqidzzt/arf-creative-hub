import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const method = req.method;

    if (method === 'GET') {
      // Get all approved stories
      const { data: stories, error } = await supabaseClient
        .from('stories')
        .select(`
          *,
          profiles:penulis_id (
            nama
          )
        `)
        .eq('status', 'diterima')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return new Response(JSON.stringify({ stories }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    if (method === 'POST') {
      // Get user from auth header
      const authHeader = req.headers.get('Authorization')!;
      const token = authHeader.replace('Bearer ', '');
      const { data } = await supabaseClient.auth.getUser(token);
      const user = data.user;

      if (!user) {
        return new Response(JSON.stringify({ error: 'User not authenticated' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 401,
        });
      }

      const { judul, isi, kategori } = await req.json();

      if (!judul || !isi || !kategori) {
        return new Response(JSON.stringify({ error: 'Missing required fields' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        });
      }

      // Create new story
      const { data: story, error: storyError } = await supabaseClient
        .from('stories')
        .insert({
          judul,
          isi,
          kategori,
          penulis_id: user.id,
          status: 'pending'
        })
        .select()
        .single();

      if (storyError) {
        throw storyError;
      }

      // Create notification for user
      await supabaseClient
        .from('notifications')
        .insert({
          user_id: user.id,
          pesan: `Cerita "${judul}" telah berhasil disubmit dan sedang dalam proses review.`,
          tipe: 'info'
        });

      console.log('Story submitted:', story);

      return new Response(JSON.stringify({ 
        message: 'Story submitted successfully',
        story_id: story.id 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 201,
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 405,
    });

  } catch (error) {
    console.error('Error in stories function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});