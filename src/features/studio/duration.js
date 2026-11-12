// Clip lengths as people write them: "24:05", "1:02:30" or plain seconds

// Seconds from "1445", "24:05" or "1:02:30"; null when it isn't a length
export function parseDuration(text) {
  const value = String(text ?? "").trim();
  if (!value) return null;
  if (/^\d+$/.test(value)) return Number(value);
  const match = value.match(/^(?:(\d+):)?([0-5]?\d):([0-5]\d)$/);
  if (!match) return null;
  const [, hours = "0", minutes, seconds] = match;
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
}

// 1445 → "24:05", 3750 → "1:02:30"
export function formatDuration(totalSeconds) {
  if (totalSeconds === null || totalSeconds === undefined || Number.isNaN(Number(totalSeconds))) return "";
  const total = Math.round(Number(totalSeconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = String(total % 60).padStart(2, "0");
  return hours ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}` : `${minutes}:${seconds}`;
}

// The length of a video file or link, read from its metadata in the browser; null if it can't be read
export function readVideoLength(source, timeoutMs = 15000) {
  return new Promise((resolve) => {
    const video = document.createElement("video");
    const url = source instanceof Blob ? URL.createObjectURL(source) : source;
    let settled = false;
    const finish = (value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      video.removeAttribute("src");
      video.load?.();
      if (source instanceof Blob) URL.revokeObjectURL(url);
      resolve(value);
    };
    const timer = setTimeout(() => finish(null), timeoutMs);
    video.preload = "metadata";
    video.muted = true;
    video.onloadedmetadata = () => finish(Number.isFinite(video.duration) && video.duration > 0 ? Math.round(video.duration) : null);
    video.onerror = () => finish(null);
    video.src = url;
  });
}
