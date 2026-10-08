const { randomUUID } = require('node:crypto');

function json(res, status, body) {
  res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  return res.end(JSON.stringify(body));
}

function clean(value, max) {
  return String(value || '').trim().slice(0, max);
}

async function supabase(path, options = {}) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error('supabase_not_configured');
  const baseUrl = url.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(options.method === 'POST' || options.method === 'PATCH' ? { Prefer: 'return=representation' } : {}),
      ...(options.headers || {})
    }
  });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { raw: text }; }
  if (!response.ok) {
    const error = new Error(`supabase_http_${response.status}`);
    error.details = data?.message || data?.hint || data?.code || 'Supabase request failed';
    throw error;
  }
  return data;
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const gameId = clean(req.query?.game_id, 100);
    if (!gameId) return json(res, 400, { error: 'game_id is required' });
    try {
      const visitorId = clean(req.query?.visitor_id, 80);
      const [comments, votes] = await Promise.all([
        supabase(`game_comments?game_id=eq.${encodeURIComponent(gameId)}&select=id,game_id,display_name,body,created_at&order=created_at.desc&limit=100`),
        supabase(`game_votes?game_id=eq.${encodeURIComponent(gameId)}&select=vote,visitor_id`)
      ]);
      return json(res, 200, {
        comments: Array.isArray(comments) ? comments : [],
        likes: Array.isArray(votes) ? votes.filter(v => v.vote === 1).length : 0,
        dislikes: Array.isArray(votes) ? votes.filter(v => v.vote === -1).length : 0,
        viewerVote: visitorId && Array.isArray(votes) ? (votes.find(v => v.visitor_id === visitorId)?.vote || 0) : 0
      });
    } catch (error) {
      console.error('comments_get_failed', error.message, error.details || '');
      return json(res, 503, { error: 'Comments are temporarily unavailable', code: error.message, detail: error.details || null });
    }
  }

  if (req.method === 'POST') {
    const body = req.body || {};
    const gameId = clean(body.game_id, 100);
    const action = clean(body.action, 20);
    if (!gameId || !['comment', 'vote'].includes(action)) return json(res, 400, { error: 'Invalid request' });

    try {
      if (action === 'comment') {
        const displayName = clean(body.display_name, 40);
        const comment = clean(body.body, 800);
        if (displayName.length < 2 || comment.length < 2) return json(res, 400, { error: 'Name and comment are required' });
        if (/https?:\/\//i.test(comment) || /<[^>]+>/.test(comment)) return json(res, 400, { error: 'Links and markup are not allowed' });
        const created = await supabase('game_comments', {
          method: 'POST', body: JSON.stringify({ game_id: gameId, display_name: displayName, body: comment })
        });
        return json(res, 201, { comment: Array.isArray(created) ? created[0] : created });
      }

      const visitorId = clean(body.visitor_id, 80);
      const vote = Number(body.vote);
      if (visitorId.length < 16 || ![-1, 0, 1].includes(vote)) return json(res, 400, { error: 'Invalid vote' });
      if (vote === 0) {
        await supabase(`game_votes?game_id=eq.${encodeURIComponent(gameId)}&visitor_id=eq.${encodeURIComponent(visitorId)}`, { method: 'DELETE' });
        return json(res, 200, { vote: 0 });
      }
      const updated = await supabase('game_votes?on_conflict=game_id,visitor_id', {
        method: 'POST',
        body: JSON.stringify({ game_id: gameId, visitor_id: visitorId, vote }),
        headers: { Prefer: 'resolution=merge-duplicates,return=representation' }
      });
      return json(res, 200, { vote: Array.isArray(updated) ? updated[0] : updated });
    } catch (error) {
      console.error('comments_post_failed', error.message, error.details || '');
      return json(res, 503, { error: 'This action is temporarily unavailable', code: error.message, detail: error.details || null });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return json(res, 405, { error: 'Method not allowed' });
};
