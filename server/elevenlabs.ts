const API_KEY = process.env.ELEVENLABS_API_KEY;
const API_URL = 'https://api.elevenlabs.io/v1';

// ElevenLabs voice IDs with characteristics
export const AVAILABLE_VOICES = {
  professional: {
    id: 'EXAVITQu4vr4xnSDxMaL', // Bella - warm, professional
    name: 'Bella (Professional)',
    description: 'Warm and professional tone',
  },
  friendly: {
    id: 'MF3mGyEYCl7XYWbV9V6O', // Elli - friendly, approachable
    name: 'Elli (Friendly)',
    description: 'Friendly and approachable',
  },
  assertive: {
    id: 'TxGEqnHWrfWFTfGW9XjX', // Chris - confident, assertive
    name: 'Chris (Assertive)',
    description: 'Confident and authoritative',
  },
  warm: {
    id: 'IKne3meq5OH5OfVMjIbN', // Sarah - warm, empathetic
    name: 'Sarah (Warm)',
    description: 'Warm and empathetic',
  },
  calm: {
    id: 'bIHbv24MWmeRgasZak2b', // Charlie - calm, measured
    name: 'Charlie (Calm)',
    description: 'Calm and measured',
  },
};

export type VoiceStyle = keyof typeof AVAILABLE_VOICES;

// Map emotions to voice characteristics
export const emotionToVoiceParams = (emotion?: string) => {
  const baseParams = {
    stability: 0.5,
    similarity_boost: 0.75,
  };

  switch (emotion) {
    case 'angry':
    case 'irritated':
      return { ...baseParams, stability: 0.7, similarity_boost: 0.8 };
    case 'warming':
    case 'satisfied':
      return { ...baseParams, stability: 0.4, similarity_boost: 0.85 };
    case 'anxious':
      return { ...baseParams, stability: 0.55, similarity_boost: 0.7 };
    default:
      return baseParams;
  }
};

export async function textToSpeechElevenLabs(
  text: string,
  voiceId: string = AVAILABLE_VOICES.professional.id,
  emotion?: string
): Promise<ArrayBuffer | null> {
  if (!API_KEY) {
    console.warn('ElevenLabs API key not configured, falling back to browser TTS');
    return null;
  }

  try {
    const voiceSettings = emotionToVoiceParams(emotion);

    const response = await fetch(`${API_URL}/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_monolingual_v1',
        voice_settings: voiceSettings,
      }),
    });

    if (!response.ok) {
      console.error(`ElevenLabs API error: ${response.status} ${response.statusText}`);
      return null;
    }

    return await response.arrayBuffer();
  } catch (error) {
    console.error('ElevenLabs TTS error:', error);
    return null;
  }
}

export async function getAvailableVoices() {
  if (!API_KEY) {
    return Object.entries(AVAILABLE_VOICES).map(([key, value]) => ({
      id: value.id,
      name: value.name,
      value: key as VoiceStyle,
    }));
  }

  try {
    const response = await fetch(`${API_URL}/voices`, {
      headers: {
        'xi-api-key': API_KEY,
      },
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.voices?.map((v: any) => ({
      id: v.voice_id,
      name: v.name,
      value: v.voice_id,
    })) || null;
  } catch (error) {
    console.error('Error fetching ElevenLabs voices:', error);
    return null;
  }
}
