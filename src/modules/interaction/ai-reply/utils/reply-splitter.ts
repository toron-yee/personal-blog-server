const MAX_REPLY_CHARS = 10;
const MAX_REPLY_PARTS = 6;
// 用于寻找优先切分点的标点集合（中英文混合）
const SPLIT_PUNCTUATION = new Set([
  '，',
  '。',
  '！',
  '？',
  '～',
  '…',
  '、',
  '；',
  '：',
  ',',
  '.',
  '!',
  '?',
  '~',
  ';',
  ':',
]);
// 这些结尾标点会被保留，避免语气被“削平”
const KEEP_END_PUNCTUATION = new Set(['？', '！', '～', '?', '!', '~']);
// 这些结尾标点会在规范化阶段尝试剔除，减少“半句话 + 悬空标点”
const EXTRA_TRAILING_PUNCTUATION = new Set([
  '，',
  '。',
  '、',
  '；',
  '：',
  '…',
  ',',
  '.',
  ';',
  ':',
  '）',
  ')',
  '】',
  ']',
  '」',
  '』',
  '”',
  '"',
  "'",
]);

export function splitReplyParts(content: string = '') {
  // 统一换行符，并把全角分隔符“｜”归一化成“|”
  const normalized = String(content)
    .replace(/\r\n/g, '\n')
    .replace(/｜/g, '|')
    .trim();

  if (!normalized) {
    return [];
  }

  // 支持显式“|”分段；否则按换行分段
  const seededParts = normalized.includes('|')
    ? normalized.split('|')
    : normalized.split('\n');

  const baseParts = seededParts.map((part) => part.trim()).filter(Boolean);
  const sourceParts = baseParts.length > 0 ? baseParts : [normalized];
  const finalParts: string[] = [];

  for (const part of sourceParts) {
    // 每个逻辑分段再按字符上限切细，确保可控的展示节奏
    const slicedParts = splitByCharLimit(part, MAX_REPLY_CHARS);
    for (const slicedPart of slicedParts) {
      // 全局分段数量有上限，防止超长回答导致消息数量失控
      if (finalParts.length >= MAX_REPLY_PARTS) {
        return finalParts;
      }
      finalParts.push(slicedPart);
    }
  }

  return finalParts;
}

function splitByCharLimit(content: string, limit: number) {
  // 使用 Array.from 按 Unicode code point 切分，避免把 surrogate pair 切坏
  const chars = Array.from(String(content).trim());
  const parts: string[] = [];

  while (chars.length > 0 && parts.length < MAX_REPLY_PARTS) {
    const end = pickSplitIndex(chars, limit);
    const chunk = normalizeReplyChunk(chars.splice(0, end).join(''));
    if (chunk) {
      parts.push(chunk);
    }
  }

  return parts;
}

function pickSplitIndex(chars: string[], limit: number) {
  if (chars.length <= limit) {
    return chars.length;
  }

  let nearestSplit = -1;
  let nearestDistance = Number.MAX_SAFE_INTEGER;

  // 在全串里找“最接近 limit 的标点位”，优先保证语义边界自然
  for (let index = 0; index < chars.length; index += 1) {
    if (!SPLIT_PUNCTUATION.has(chars[index])) {
      continue;
    }

    const splitPos = index + 1;
    if (splitPos < 2) {
      continue;
    }

    const distance = Math.abs(splitPos - limit);
    if (
      distance < nearestDistance ||
      (distance === nearestDistance && splitPos > nearestSplit)
    ) {
      nearestDistance = distance;
      nearestSplit = splitPos;
    }
  }

  return nearestSplit > 0 ? nearestSplit : limit;
}

function normalizeReplyChunk(content: string) {
  let chunk = String(content).trim();

  // 清理切分后尾部冗余标点，但保留语气终止符（如 ? ! ～）
  while (chunk) {
    const chars = Array.from(chunk);
    const lastChar = chars[chars.length - 1];

    if (KEEP_END_PUNCTUATION.has(lastChar)) {
      break;
    }

    if (
      !SPLIT_PUNCTUATION.has(lastChar) &&
      !EXTRA_TRAILING_PUNCTUATION.has(lastChar)
    ) {
      break;
    }

    chars.pop();
    chunk = chars.join('').trim();
  }

  return chunk;
}
