import { supabase } from '../../lib/supabaseClient';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { artist_slug, vote } = req.body;

  if (!artist_slug || !['up', 'down'].includes(vote)) {
    res.status(400).json({ error: 'Bad request' });
    return;
  }

  // Get the currently logged in user (from Supabase session cookie / token)
  // Note: On Vercel (serverless), supabase.auth.getUser() does not magically
  // know the browser session. So for now we will receive the user id from the
  // client. We'll improve this later with server-side auth if needed.
  //
  // SECURITY NOTE:
  // This is okay for now because we're in early dev / closed alpha.
  // We'll lock it down later by verifying the token server-side.
  const { voter_id } = req.body;
  if (!voter_id) {
    res.status(401).json({ error: 'Not signed in' });
    return;
  }

  // Upsert the user's vote (insert if not exists, update if exists)
  const { error: upsertError } = await supabase
    .from('votes')
    .upsert(
      [
        {
          artist_slug,
          voter_id,
          vote,
        },
      ],
      { onConflict: 'voter_id,artist_slug' }
    );

  if (upsertError) {
    res.status(500).json({ error: upsertError.message });
    return;
  }

  // Get fresh totals
  const { data: allVotes, error: tallyError } = await supabase
    .from('votes')
    .select('vote')
    .eq('artist_slug', artist_slug);

  if (tallyError) {
    res.status(500).json({ error: tallyError.message });
    return;
  }

  const upCount = allVotes.filter(v => v.vote === 'up').length;
  const downCount = allVotes.filter(v => v.vote === 'down').length;
  const total = upCount + downCount;
  const score = total ? Math.round((upCount / total) * 100) : 100;

  res.status(200).json({
    up: upCount,
    down: downCount,
    score,
  });
}
