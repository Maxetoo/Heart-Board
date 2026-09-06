/**
 * Builds the denormalised `preview` stored on a Board.
 *
 * Feed cards render the board's artwork, but the artwork lives on the board's
 * messages and the list endpoints only project board fields. Rather than making
 * every feed card fetch its messages, the board's face message is snapshotted
 * here whenever it is written.
 *
 * The snapshot must stay SMALL. Legacy canvasData embeds images as base64 data
 * URLs — one document in production is 3.1MB — and a page of 12 cards carrying
 * that would be unusable. Every inline data: URL is stripped; the full artwork
 * is still available from GET /message/:slug/board when the board is opened.
 */

const MAX_PREVIEW_BYTES = 32 * 1024;

const isDataUrl = (v) => typeof v === 'string' && v.startsWith('data:');

/**
 * Recursively removes inline data: URLs from a canvasData document, handling
 * both shapes we have ever written:
 *   legacy  { canvasTexts, canvasBg, canvasFrame, canvasVectors, canvasImages }
 *   current { v, elements: [...] }
 */
function stripInlineImages(node) {
  if (Array.isArray(node)) {
    return node
      .map(stripInlineImages)
      .filter((item) => item !== undefined);
  }

  if (node && typeof node === 'object') {
    const out = {};
    for (const [key, value] of Object.entries(node)) {
      // Drop the element entirely when its image is inline; an image element
      // with no source renders as nothing, which is what we want in a preview.
      if ((key === 'src' || key === 'imageUrl') && isDataUrl(value)) {
        return undefined;
      }
      const cleaned = stripInlineImages(value);
      if (cleaned !== undefined) out[key] = cleaned;
    }
    return out;
  }

  return isDataUrl(node) ? undefined : node;
}

/** First non-inline image URL on a message, if any. */
function firstImageUrl(message) {
  const fromContent = (message?.content?.imageUrls || []).find(
    (u) => u && !isDataUrl(u),
  );
  if (fromContent) return fromContent;

  const data = message?.canvasData;
  if (!data) return null;

  const candidates = Array.isArray(data?.elements)
    ? data.elements
    : Array.isArray(data?.canvasImages)
      ? data.canvasImages
      : [];

  for (const el of candidates) {
    const url = el?.imageUrl || el?.src;
    if (url && !isDataUrl(url)) return url;
  }
  return null;
}

/**
 * @param {object} message a Message document (or lean object)
 * @returns {object|null} the value to store on Board.preview
 */
function buildBoardPreview(message) {
  if (!message) return null;

  let canvasData = stripInlineImages(message.canvasData ?? null) ?? null;

  // Belt and braces: even with images stripped, refuse to store something
  // large enough to bloat a feed response.
  if (canvasData) {
    try {
      if (Buffer.byteLength(JSON.stringify(canvasData), 'utf8') > MAX_PREVIEW_BYTES) {
        canvasData = null;
      }
    } catch {
      canvasData = null;
    }
  }

  return {
    text:       message.content?.text ?? null,
    imageUrl:   firstImageUrl(message),
    audioUrl:   message.content?.audioUrl ?? null,
    type:       message.type ?? null,
    canvasData,
    updatedAt:  new Date(),
  };
}

module.exports = { buildBoardPreview, stripInlineImages, firstImageUrl };
