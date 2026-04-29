import { createCanvas } from "canvas";
import { writeFileSync } from "fs";

function makeIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#F5F1EA";
  ctx.fillRect(0, 0, size, size);
  ctx.fillStyle = "#3D2F20";
  ctx.font = `bold ${Math.round(size * 0.35)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("DW", size / 2, size / 2);
  return canvas.toBuffer("image/png");
}

writeFileSync("public/icon-192.png", makeIcon(192));
writeFileSync("public/icon-512.png", makeIcon(512));
console.log("Icons generated.");
