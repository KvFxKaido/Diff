export const config = { runtime: 'edge' };

export default async function handler(req: Request) {
  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const apiKey = process.env.OLLAMA_CLOUD_API_KEY;
    if (!apiKey) {
      console.error('[api/chat] OLLAMA_CLOUD_API_KEY not set');
      return Response.json(
        { error: 'API key not configured. Add OLLAMA_CLOUD_API_KEY in Vercel settings.' },
        { status: 500 },
      );
    }

    const body = await req.text();
    console.log('[api/chat] Forwarding to ollama.com/api/chat');

    const upstream = await fetch('https://ollama.com/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body,
    });

    if (!upstream.ok) {
      const errBody = await upstream.text().catch(() => '');
      console.error(`[api/chat] Upstream ${upstream.status}: ${errBody.slice(0, 200)}`);
      return Response.json(
        { error: `Ollama API error ${upstream.status}: ${errBody.slice(0, 200)}` },
        { status: upstream.status },
      );
    }

    // Stream the ndjson response back to the client
    return new Response(upstream.body, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[api/chat] Unhandled error: ${message}`);
    return Response.json({ error: message }, { status: 500 });
  }
}
