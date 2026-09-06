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

/**
 * Trims to a hard character budget without cutting a word in half, preferring
 * to end on the last complete sentence.
 */
function fitToBudget(text, maxChars) {
  if (text.length <= maxChars) return text;
  const window = text.slice(0, maxChars);
  const lastSentence = Math.max(
    window.lastIndexOf('. '), window.lastIndexOf('! '), window.lastIndexOf('? '),
  );
  if (lastSentence > maxChars * 0.5) return window.slice(0, lastSentence + 1).trim();
  const lastSpace = window.lastIndexOf(' ');
  return (lastSpace > 0 ? window.slice(0, lastSpace) : window).trim();
}

/**
 * POST /api/v1/ai/refine  { text, maxChars? } -> { text }
 *
 * Rewrites the user's own words rather than generating a generic message: the
 * names, the specific thing being thanked for, and the sender's voice all have
 * to survive, otherwise the "Refine" button reads as replacing what they wrote.
 *
 * Unlike moderation, this does NOT fail open. Echoing the input back on an API
 * error looked to the user like the button did nothing at all.
 */
const refine = async (req, res) => {
  const text = requireText(req.body);
  const maxChars = Math.min(Math.max(Number(req.body?.maxChars) || 250, 40), MAX_TEXT);

  const ai = getClient();
  let response;
  try {
    response = await ai.models.generateContent({
      model: MODEL,
      contents: `You are an expert editor for Heartboard, a positive-only appreciation and recognition platform.

Rewrite the message below so it reads warmly and clearly. Rules:
- Work from what the writer actually said. Keep every name, role, event, and specific detail they mentioned; never invent facts, achievements, or relationships that are not in their text.
- Fix grammar, spelling, punctuation and awkward phrasing. Tighten rambling sentences.
- Keep their voice and level of formality. If they wrote casually, stay casual; if the note is short, keep it short.
- Keep it heartfelt and specific, not corporate or generic.
- Hard limit: ${maxChars} characters. Aim for about the same length as the original.
- Output ONLY the rewritten message. No quotes, no markdown, no preamble, no alternatives.

Message:
${text}`,
      config: { temperature: 0.7 },
    });
  } catch (error) {
    console.error('Refine text error:', error.message);
    throw new CustomError.BadRequestError("Couldn't refine that right now. Please try again.");
  }

  const refined = (response.text || '')
    .trim()
    .replace(/^["'“”]+|["'“”]+$/g, '')
    .trim();

  if (!refined) throw new CustomError.BadRequestError('The refiner returned nothing. Please try again.');

  res.status(StatusCodes.OK).json({ text: fitToBudget(refined, maxChars) });
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
