const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const source = 'C:\\Users\\QCS\\.gemini\\antigravity\\brain\\12d6c29c-7503-4d72-bbbf-9a26704b5ce3\\media__1783073673867.png';
const publicDir = path.join(__dirname, '..', 'public');
const iconsDir = path.join(publicDir, 'icons');

async function cropLogos() {
  const rawBuf = fs.readFileSync(source);
  const m = await sharp(rawBuf).metadata();
  console.log(`Source: ${m.width}x${m.height}`);

  // 1. Full logo with text: top half with some margin
  await sharp(rawBuf)
    .extract({ left: 0, top: 0, width: m.width, height: 262 })
    .png()
    .toFile(path.join(publicDir, 'logo-full.png'));
  console.log('✓ logo-full.png');

  // 2. Icon-only: the bottom-left icon including the orange arrow tip
  // The orange arrow goes up to about y=290 and the icon base goes to about y=535
  // The icon spans from about x=50 to x=440
  // Need to capture wider to get the full arrow
  const iconBuf = await sharp(rawBuf)
    .extract({ left: 15, top: 270, width: 470, height: 280 })
    .png()
    .toBuffer();

  // Trim whitespace
  const trimmedIcon = await sharp(iconBuf)
    .trim({ threshold: 10 })
    .png()
    .toBuffer();

  await sharp(trimmedIcon).toFile(path.join(publicDir, 'logo-icon.png'));
  console.log('✓ logo-icon.png');

  // Make square with padding and center
  const im = await sharp(trimmedIcon).metadata();
  console.log(`Trimmed icon: ${im.width}x${im.height}`);
  const maxD = Math.max(im.width, im.height);
  const padPercent = 0.20; // 20% padding around the icon
  const totalSize = Math.round(maxD * (1 + padPercent * 2));
  const padTop = Math.round((totalSize - im.height) / 2);
  const padBottom = totalSize - im.height - padTop;
  const padLeft = Math.round((totalSize - im.width) / 2);
  const padRight = totalSize - im.width - padLeft;

  const squareBuf = await sharp(trimmedIcon)
    .extend({ top: padTop, bottom: padBottom, left: padLeft, right: padRight, background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .png()
    .toBuffer();

  await sharp(squareBuf).resize(512, 512).png().toFile(path.join(iconsDir, 'icon-512.png'));
  console.log('✓ icon-512.png');
  await sharp(squareBuf).resize(192, 192).png().toFile(path.join(iconsDir, 'icon-192.png'));
  console.log('✓ icon-192.png');

  // 3. Favicon from bottom-right
  const favBuf = await sharp(rawBuf)
    .extract({ left: 565, top: 320, width: 90, height: 75 })
    .trim({ threshold: 10 })
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .resize(32, 32, { fit: 'contain', background: { r: 255, g: 255, b: 255 } })
    .png()
    .toBuffer();
  await sharp(favBuf).toFile(path.join(publicDir, 'favicon.png'));
  console.log('✓ favicon.png');

  console.log('\n✓ All logos cropped and saved!');
}

cropLogos().catch(err => { console.error('Fatal:', err.message); process.exit(1); });
