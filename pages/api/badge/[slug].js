import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req, res) {
  const { slug } = req.query;

  // 1. Look up the artist by slug
  const { data: artist, error } = await supabase
    .from('artists')
    .select('display_name, status')
    .eq('slug', slug)
    .single();

  if (error || !artist) {
    res.status(404).send('Not found');
    return;
  }

  // 2. Pick a colour based on status
  // active        => green
  // under_review  => yellow
  // revoked       => red
  let bg = '#2ecc71'; // green
  if (artist.status === 'under_review') bg = '#f1c40f';
  if (artist.status === 'revoked') bg = '#e74c3c';

  // 3. Build the SVG
  // (Simple, readable, looks "official enough" for now)
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="300" height="70" role="img" aria-label="PureArt Alliance badge">
  <rect width="300" height="70" rx="10" ry="10" fill="${bg}" />
  <text x="16" y="26"
        font-size="14"
        font-family="Arial, sans-serif"
        fill="#000"
        font-weight="bold">
    PUREART ALLIANCE
  </text>
  <text x="16" y="45"
        font-size="12"
        font-family="Arial, sans-serif"
        fill="#000">
    ${artist.display_name}
  </text>
  <text x="16" y="60"
        font-size="11"
        font-family="Arial, sans-serif"
        fill="#000">
    Status: ${artist.status.toUpperCase()}
  </text>
</svg>`.trim();

  // 4. Respond with SVG
  res.setHeader('Content-Type', 'image/svg+xml');
  res.status(200).send(svg);
}
