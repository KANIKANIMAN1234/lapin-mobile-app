export function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

export function formatYen(n: number): string {
  return '¥' + n.toLocaleString();
}

export function padTime(n: number): string {
  return String(n).padStart(2, '0');
}

export function formatText(raw: string): string {
  if (!raw.trim()) return raw;
  let text = raw.replace(/。(?![\n])/g, '。\n').replace(/、{2,}/g, '、').replace(/\n{3,}/g, '\n\n');
  const lines = text.split('\n').filter((l) => l.trim());
  return lines
    .map((line) => {
      line = line.trim();
      if (!line.endsWith('。') && !line.endsWith('）') && !line.endsWith(')') && !line.endsWith('】')) {
        line += '。';
      }
      return line;
    })
    .join('\n');
}
