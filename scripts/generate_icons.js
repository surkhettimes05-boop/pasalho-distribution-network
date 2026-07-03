const sharp = require('sharp');
const path = require('path');

const source = 'C:\\Users\\QCS\\.gemini\\antigravity\\brain\\12d6c29c-7503-4d72-bbbf-9a26704b5ce3\\pasalho_icon_1783073424975.jpg';
const outDir = path.join(__dirname, '..', 'public', 'icons');

async function generate() {
  await sharp(source).resize(512, 512).png().toFile(path.join(outDir, 'icon-512.png'));
  console.log('✓ icon-512.png created');

  await sharp(source).resize(192, 192).png().toFile(path.join(outDir, 'icon-192.png'));
  console.log('✓ icon-192.png created');

  console.log('Done!');
}

generate().catch(err => { console.error(err); process.exit(1); });
