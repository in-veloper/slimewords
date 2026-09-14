const sharp = require('sharp');
const path = require('path');

const ASSETS = path.join(__dirname, '..', 'assets');

// semlime 의 art.js 에 있는 슬라임 몸통/장식 그대로 — 아이콘도 앱 안에서
// 보이는 마스코트와 똑같이 생기도록 같은 SVG path 를 그대로 쓴다.
const BODY =
  'M50 20 C57 41 86 53 86 70 C86 80 75 87 62 87 C58 87 57 84.5 53 84.5 ' +
  'C49 84.5 48 87 44 87 C31 87 14 80 14 70 C14 53 43 41 50 20 Z';
const GLOSS = 'M27 64 C30 54 40 45 48 42 C39 49 31 58 28 68 Z';
const CROWN_D = 'M13 70 L19 25 L35 45 L50 16 L65 45 L81 25 L87 70 Z';

const MAIN = '#FF9FB0';
const CHEEK = '#FF5C82';
const INK = '#4A2B45';

function slime() {
  return `
    <path d="${CROWN_D.replace(/(\d+)/g, (n) => (Number(n)))}" fill="none" />
    <path d="${BODY}" fill="${MAIN}" />
    <path d="${GLOSS}" fill="#fff" opacity="0.55" />
    <ellipse cx="50" cy="84" rx="30" ry="4" fill="${CHEEK}" opacity="0.35" />
    <ellipse cx="27" cy="73" rx="6.6" ry="4.3" fill="${CHEEK}" opacity="0.75" />
    <ellipse cx="73" cy="73" rx="6.6" ry="4.3" fill="${CHEEK}" opacity="0.75" />
    <ellipse cx="39" cy="63" rx="5" ry="6.3" fill="${INK}" />
    <ellipse cx="61" cy="63" rx="5" ry="6.3" fill="${INK}" />
    <circle cx="41" cy="60.6" r="1.8" fill="#fff" />
    <circle cx="63" cy="60.6" r="1.8" fill="#fff" />
    <path d="M37 72 Q50 88 63 72 Z" fill="${INK}" />
    <path d="M44 79 Q50 84 56 79" fill="#FF8FA8" />
  `;
}

function svg({ size, viewBox = '0 0 100 100', content, background }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="${viewBox}">${
    background || ''
  }${content}</svg>`;
}

async function main() {
  const iconSvg = svg({
    size: 1024,
    background: `
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#FFE2E9" />
          <stop offset="1" stop-color="#FFC8D6" />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill="url(#bg)" />
    `,
    content: slime(),
  });
  await sharp(Buffer.from(iconSvg)).png().toFile(path.join(ASSETS, 'icon.png'));

  const fgSvg = svg({ size: 432, viewBox: '-18 -18 136 136', content: slime() });
  await sharp(Buffer.from(fgSvg)).resize(432, 432).png().toFile(path.join(ASSETS, 'android-icon-foreground.png'));

  const bgSvg = svg({
    size: 432,
    background: `
      <defs>
        <linearGradient id="bg2" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#FFE2E9" />
          <stop offset="1" stop-color="#FFC8D6" />
        </linearGradient>
      </defs>
      <rect width="432" height="432" fill="url(#bg2)" />
    `,
    content: '',
  });
  await sharp(Buffer.from(bgSvg)).png().toFile(path.join(ASSETS, 'android-icon-background.png'));

  const monoSvg = svg({
    size: 432,
    viewBox: '-18 -18 136 136',
    content: `<path d="${BODY}" fill="#FFFFFF" />`,
  });
  await sharp(Buffer.from(monoSvg)).resize(432, 432).png().toFile(path.join(ASSETS, 'android-icon-monochrome.png'));

  const splashSvg = svg({ size: 600, viewBox: '-10 -10 120 120', content: slime() });
  await sharp(Buffer.from(splashSvg)).resize(600, 600).png().toFile(path.join(ASSETS, 'splash-icon.png'));

  const faviconSvg = svg({
    size: 48,
    background: `<rect width="100" height="100" rx="18" fill="#FFC8D6" />`,
    content: slime(),
  });
  await sharp(Buffer.from(faviconSvg)).resize(48, 48).png().toFile(path.join(ASSETS, 'favicon.png'));

  console.log('아이콘 생성 완료');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
