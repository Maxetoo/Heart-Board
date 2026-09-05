const { StatusCodes } = require('http-status-codes');
const { GoogleGenAI, Type } = require('@google/genai');
const CustomError = require('../error');

/**
 * Server-side AI helpers.
 *
 * These used to run in the browser with the Gemini key injected into the JS
 * bundle at build time, which published the key to every visitor and made
 * moderation bypassable from devtools. The key now lives only in this process.
 */

const MODEL = 'gemini-3-flash-preview';

let client = null;
function getClient() {
  if (!process.env.GEMINI_API_KEY) {
    throw new CustomError.BadRequestError('AI features are not configured on this server.');
  }
  if (!client) {
    client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return client;
}

const MAX_TEXT = 5000;

function requireText(body) {
  const text = (body?.text || '').toString();
  if (!text.trim()) throw new CustomError.BadRequestError('text is required.');
  if (text.length > MAX_TEXT) {
    throw new CustomError.BadRequestError(`text must be under ${MAX_TEXT} characters.`);
  }
  return text;
}

/**
 * POST /api/v1/ai/moderate  { text } -> { isSafe, reason, sentiment }
 *
 * Also exported as moderateText() so write paths (board/message creation) can
 * enforce the positive-only rule server-side rather than trusting the client.
 */
async function moderateText(text) {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: `Analyze the following content for toxicity, hate speech, or negativity.
The platform is "Heartboard", a positive-only appreciation system.
Content: "${text}"`,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          isSafe:    { type: Type.BOOLEAN },
          reason:    { type: Type.STRING },
          sentiment: { type: Type.STRING },
        },
        required: ['isSafe', 'sentiment'],
      },
    },
  });

  try {
    return JSON.parse(response.text || '{}');
  } catch {
    return { isSafe: true, sentiment: 'neutral' };
  }
}

const moderate = async (req, res) => {
  const text = requireText(req.body);
  try {
    const result = await moderateText(text);
    res.status(StatusCodes.OK).json(result);
  } catch (error) {
    console.error('Moderation error:', error.message);
    // Fail open so a Gemini outage does not block every post.
    res.status(StatusCodes.OK).json({ isSafe: true, sentiment: 'neutral' });
  }
};

/** POST /api/v1/ai/refine  { text } -> { text } */
const refine = async (req, res) => {
  const text = requireText(req.body);
  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: `You are an expert editor for a heartfelt appreciation and recognition platform called Heartboard.
Refine the following text to improve grammar, clarity, readability, and wording while preserving the user's original heartfelt intent and tone. Return ONLY the refined text without markdown quotes or explanation.

Text to refine: "${text}"`,
    });

    const refined = (response.text || '').trim().replace(/^["']|["']$/g, '');
    res.status(StatusCodes.OK).json({ text: refined || text });
  } catch (error) {
    console.error('Refine text error:', error.message);
    res.status(StatusCodes.OK).json({ text });
  }
};

/** POST /api/v1/ai/transcribe  { audio: base64 } -> { text } */
const transcribe = async (req, res) => {
  const audio = (req.body?.audio || '').toString();
  if (!audio) throw new CustomError.BadRequestError('audio is required.');

  // Base64 inflates by ~4/3; cap the decoded payload around 8MB.
  if (audio.length > 11 * 1024 * 1024) {
    throw new CustomError.BadRequestError('Audio clip is too long to transcribe.');
  }

  try {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: 'audio/pcm;rate=16000', data: audio } },
          { text: 'Transcribe this audio appreciation message into text.' },
        ],
      },
    });
    res.status(StatusCodes.OK).json({ text: response.text || '' });
  } catch (error) {
    console.error('Transcription error:', error.message);
    res.status(StatusCodes.OK).json({ text: '' });
  }
};

module.exports = { moderate, refine, transcribe, moderateText };
