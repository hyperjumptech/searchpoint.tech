export function generateLocalAvatar(name: string, size = 128): string {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  const radius = size / 2;

  ctx.beginPath();
  ctx.arc(radius, radius, radius, 0, Math.PI * 2, true);
  ctx.closePath();

  ctx.fillStyle = "#CB3635";
  ctx.fill();

  ctx.fillStyle = "#fff";
  ctx.font = `${radius}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const initial = name[0]?.toUpperCase() ?? "?";
  ctx.fillText(initial, radius, radius);

  return canvas.toDataURL();
}
