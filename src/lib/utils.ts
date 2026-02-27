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

/**
 * 画像をリサイズ＆JPEG圧縮してbase64文字列を返す
 * スマホ写真(数MB)を200-400KB程度に圧縮してGASへ送信可能にする
 */
export function compressImage(
  dataUrl: string,
  maxWidth = 1200,
  quality = 0.7,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas unsupported')); return; }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    img.src = dataUrl;
  });
}
