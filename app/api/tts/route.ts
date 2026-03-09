export async function POST(req: Request) {
  try {
    const { text } = (await req.json()) as { text?: string }
    const input = typeof text === 'string' ? text.trim() : ''
    if (!input) {
      return Response.json({ error: 'Missing text' }, { status: 400 })
    }

    const apiKey = process.env.ELEVENLABS_API_KEY
    const voiceId = process.env.ELEVENLABS_VOICE_ID
    if (!apiKey || !voiceId) {
      return Response.json({ error: 'Missing ElevenLabs configuration' }, { status: 500 })
    }

    const modelId = process.env.ELEVENLABS_MODEL_ID || 'eleven_turbo_v2_5'
    const outputFormat = process.env.ELEVENLABS_OUTPUT_FORMAT || 'mp3_22050_32'
    const optimizeLatency = process.env.ELEVENLABS_OPTIMIZE_LATENCY || '3'
    const ttsUrl = new URL(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`)
    ttsUrl.searchParams.set('output_format', outputFormat)
    ttsUrl.searchParams.set('optimize_streaming_latency', optimizeLatency)

    const elevenRes = await fetch(ttsUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text: input,
        model_id: modelId,
        voice_settings: {
          stability: 0.4,
          similarity_boost: 0.8,
        },
      }),
    })

    if (!elevenRes.ok) {
      const raw = await elevenRes.text()
      let detail = raw
      try {
        const parsed = JSON.parse(raw) as { detail?: { message?: string } | string }
        if (typeof parsed?.detail === 'string') detail = parsed.detail
        if (typeof parsed?.detail === 'object' && parsed.detail?.message) detail = parsed.detail.message
      } catch {
        // Keep raw text if upstream payload is not JSON.
      }
      return Response.json(
        {
          error: 'ElevenLabs request failed',
          upstreamStatus: elevenRes.status,
          detail: detail || 'Unknown ElevenLabs error',
        },
        { status: 502 }
      )
    }

    const audioBuffer = await elevenRes.arrayBuffer()
    return new Response(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : 'TTS failed' },
      { status: 500 }
    )
  }
}

