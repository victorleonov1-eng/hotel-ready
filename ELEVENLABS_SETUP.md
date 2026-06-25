# ElevenLabs Premium Text-to-Speech Setup Guide

HOTEL Ready now supports **optional premium voices** via ElevenLabs API for significantly improved text-to-speech quality during role-play scenarios.

## Why Premium Voices?

- **Professional quality**: Natural-sounding voices vs. browser's synthetic speech
- **Emotion-aware delivery**: Voice parameters adjust based on guest emotional state
- **Consistent experience**: Same voice throughout the scenario
- **5 distinct voices**: Choose the best fit for your hotel culture
- **Zero disruption**: Works seamlessly without the API key (falls back to browser TTS)

## Getting Started

### Step 1: Create ElevenLabs Account

1. Visit [elevenlabs.io](https://elevenlabs.io)
2. Sign up for a free account (includes free credits for testing)
3. Go to Settings → API Keys to get your API key

### Step 2: Configure HOTEL Ready

1. Edit your `.env` file:
   ```bash
   ELEVENLABS_API_KEY=your_api_key_here
   ```

2. Restart the dev server:
   ```bash
   npm run dev
   ```

3. Open the app and start a role-play scenario
4. Before clicking "Start conversation", you'll see:
   - **Guest Voice** dropdown with 5 available voices
   - Toggle to enable/disable premium voice
   - Option to use browser voice if preferred

### Step 3: Test Voice Options

Each scenario shows a voice selector. Try each voice to find the best fit for your hotel:

| Voice | Character | Best For |
|-------|-----------|----------|
| **Bella** (Professional) | Warm, professional | General-purpose scenarios |
| **Elli** (Friendly) | Approachable, friendly | Customer service, front desk |
| **Chris** (Assertive) | Confident, authoritative | Complex complaints, high-stakes |
| **Sarah** (Warm) | Empathetic, caring | Difficult guest situations |
| **Charlie** (Calm) | Measured, composed | Technical or anxious guests |

## How It Works

### Voice Selection UI
```
Before scenario starts:
├─ Guest Voice dropdown (5 options)
├─ Toggle: "Enable premium voice"
└─ Shows when ElevenLabs is available
```

### Emotion-Aware Delivery

The guest's emotional state affects voice delivery:

- **Angry/Irritated** → Higher stability, consistent delivery
- **Satisfied/Warming** → Lower stability, more expressive
- **Anxious** → Moderate adjustments, supportive tone
- **Neutral** → Balanced delivery

This happens automatically based on the AI guest's state in each turn.

### Fallback Behavior

If ElevenLabs is unavailable:
1. API key not configured → Uses browser voice
2. API request fails → Gracefully falls back to browser voice
3. Audio playback fails → Retries with browser voice

**No interruption to training—it just continues with browser voice.**

## Pricing

ElevenLabs offers:

- **Free tier**: 10,000 characters/month (test/demo)
- **Starter**: $5/month for 100,000 characters
- **Pro**: $99/month for 1,000,000 characters
- **Scale**: $99/month + $0.30 per 10,000 characters

### Cost Estimation

- Average scenario: 2,000-3,000 characters of guest dialogue
- Training session: 5-10 scenarios = 10,000-30,000 characters
- Team of 20 staff: 1-2 character-months if everyone trains regularly

## Advanced Configuration

### Using Different Voice Models

In `server/elevenlabs.ts`, the voices are pre-configured to use ElevenLabs' recommended voices:

```typescript
export const AVAILABLE_VOICES = {
  professional: {
    id: 'EXAVITQu4vr4xnSDxMaL', // Bella
    name: 'Bella (Professional)',
  },
  // ... other voices
};
```

To use different voices:
1. Browse voices on [elevenlabs.io/labs](https://elevenlabs.io/labs)
2. Copy the voice ID
3. Update the `AVAILABLE_VOICES` object in `server/elevenlabs.ts`
4. Restart the server

### Custom Voice Parameters

Edit the `emotionToVoiceParams()` function to customize how emotions affect voice delivery:

```typescript
export const emotionToVoiceParams = (emotion?: string) => {
  const baseParams = {
    stability: 0.5,        // 0 = expressive, 1 = consistent
    similarity_boost: 0.75, // 0 = diverse, 1 = similar
  };
  // Customize per emotion...
};
```

## Monitoring Usage

Track your ElevenLabs usage:
1. Log in to [elevenlabs.io](https://elevenlabs.io)
2. Go to Dashboard → Usage to see character count
3. Set billing alerts if needed

## Troubleshooting

### No voice selector appears
- **Cause**: `ELEVENLABS_API_KEY` not set or invalid
- **Fix**: Check your `.env` file and restart the server
- **Fallback**: The app will use browser voice (still works fine)

### Voice plays but sounds robotic
- **Cause**: High emotion stability setting
- **Fix**: Reduce `stability` in `emotionToVoiceParams()` to ~0.4-0.5

### Audio playback fails intermittently
- **Cause**: Network latency or browser audio restrictions
- **Fix**: User preference is saved; they can disable premium voice and use browser TTS
- **Note**: This won't break training—it just uses browser voice instead

### Rate limiting (API returns 429)
- **Cause**: Exceeded character quota for the month
- **Fix**: Upgrade your ElevenLabs plan or wait for next billing cycle
- **Fallback**: Browser voice still works

## Performance Notes

- TTS requests add ~500-1000ms latency per guest message
- Browser speechSynthesis is instant but lower quality
- Audio files are fetched over HTTPS—works on any network

## Disabling ElevenLabs

If you want to stop using ElevenLabs:

1. Remove `ELEVENLABS_API_KEY` from `.env`
2. Restart the server
3. App automatically uses browser voice (no changes needed)
4. User preferences in localStorage are cleared on next load

## Future Enhancements

- [ ] Voice customization per scenario
- [ ] Speaker gender selection
- [ ] Voice rate/pitch controls
- [ ] Custom pronunciation rules
- [ ] Support for other TTS providers (Google Cloud, AWS Polly)
- [ ] Audio caching to reduce API calls

## Support

For issues with ElevenLabs:
- Check [ElevenLabs documentation](https://docs.elevenlabs.io)
- Review API key permissions
- Verify account has available credits

For HOTEL Ready issues:
- Check console for error messages
- Verify `.env` configuration
- Test with browser voice as fallback
