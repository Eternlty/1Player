// 歌词解析工具，将lrc文本解析为时间轴和歌词
export function parseLRC(lrcText) {
  const lines = lrcText.split('\n');
  const result = [];
  const timeReg = /\[(\d{2}):(\d{2})\.(\d{2,3})]/;
  for (let line of lines) {
    const match = timeReg.exec(line);
    if (match) {
      const min = parseInt(match[1]);
      const sec = parseInt(match[2]);
      const ms = parseInt(match[3].padEnd(3, '0'));
      const time = min * 60 * 1000 + sec * 1000 + ms;
      const text = line.replace(timeReg, '').trim();
      result.push({ time, text });
    }
  }
  // 按时间排序
  return result.sort((a, b) => a.time - b.time);
}
