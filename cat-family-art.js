// Surroundings are sampled from the approved cat-free scenery. The cat drawings
// are separate original image assets and never enter these masks or patterns.
const source = 'assets/cat-family-scenery.png';
const viewBox = '26 16 1748 958';
let serial = 0;

const baskets = {
  minoucha: 'M62 339 Q65 301 113 282 Q178 251 255 254 Q345 254 415 278 Q491 302 518 355 Q526 389 505 431 Q487 469 441 482 Q354 501 240 497 Q151 492 106 467 Q72 446 64 399 Q58 365 62 339Z',
  mala: 'M520 296 Q534 257 584 235 Q638 210 714 204 Q798 196 890 211 Q1001 216 1071 246 Q1143 270 1171 313 Q1187 347 1171 391 Q1159 438 1118 461 Q1066 485 963 489 Q846 495 731 481 Q632 474 576 444 Q539 422 530 382 Q516 342 520 296Z'
};

// The garland follows the visible rope, bows, hearts, paw tags and fish tag.
// Its lower edge steps around the tower's top instead of clipping a rectangular
// piece of the tower into the animated layer.
const garland = 'M26 16H1774V168L1694 165 1685 109 1668 112 1663 85 1650 92 1628 112 1600 95 1553 86 1543 86 1540 78 1530 74 1510 68 1490 70 1480 81 1440 86 1415 78 1370 109 1305 113 1265 98 1240 111 1190 116 1182 159 1109 162 1102 137 1134 111 1109 108 1099 91 1054 119 1000 112 983 90 881 88 854 120 787 119 781 93 760 111 709 84 697 77 654 103 599 102 586 77 577 80 574 111 502 118 489 85 463 77 450 107 400 115 383 87 360 82 344 100 294 101 278 81 256 86 249 101 204 125 174 104 161 76 153 78 147 152 41 143 26 89Z';

const scraps = [
  'M1050 849 Q1085 842 1124 847 L1156 866 1156 925 1138 942 1066 941 1050 922Z',
  'M1172 845 Q1232 838 1291 842 L1336 851 1337 923 1318 939 1194 939 1174 926Z',
  'M1348 854 Q1404 845 1463 849 L1506 858 1507 932 1484 945 1368 945 1348 932Z',
  'M1520 849 Q1588 839 1651 846 L1698 856 1699 925 1679 941 1540 940 1520 926Z'
];

function svg(body, name) {
  return `<svg class="family-art family-art-${name}" viewBox="${viewBox}" preserveAspectRatio="none" aria-hidden="true" focusable="false" style="pointer-events:none" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}

function originalImage() {
  return `<image href="${source}" width="1800" height="1005"/>`;
}

export function familyBase() {
  const id = `family-base-${++serial}`;
  return svg(`<defs>
    <pattern id="${id}-paper" patternUnits="userSpaceOnUse" width="512" height="192">
      <svg width="512" height="192" viewBox="33 528 512 192" preserveAspectRatio="none">${originalImage()}</svg>
    </pattern>
    <pattern id="${id}-floor" patternUnits="userSpaceOnUse" width="686" height="28">
      <svg width="686" height="28" viewBox="1015 940 686 28" preserveAspectRatio="none">${originalImage()}</svg>
    </pattern>
    <mask id="${id}-cutouts" maskUnits="userSpaceOnUse" x="0" y="0" width="1800" height="1005">
      <rect width="1800" height="1005" fill="white"/>
      <g fill="black"><path d="${baskets.minoucha}"/><path d="${baskets.mala}"/><path d="${garland}"/>${scraps.map(path => `<path d="${path}"/>`).join('')}</g>
    </mask>
  </defs>
  <rect x="0" y="0" width="1800" height="737" fill="url(#${id}-paper)"/>
  <rect x="0" y="737" width="1800" height="268" fill="url(#${id}-floor)"/>
  <g mask="url(#${id}-cutouts)">${originalImage()}</g>`, 'base');
}

export function familyBasket(which) {
  const name = which === 'left' || which === 'minoucha' || which === 0 ? 'minoucha' : 'mala';
  const id = `family-basket-${name}-${++serial}`;
  return svg(`<defs><clipPath id="${id}" clipPathUnits="userSpaceOnUse"><path d="${baskets[name]}"/></clipPath></defs><g clip-path="url(#${id})">${originalImage()}</g>`, name);
}

export function familyGarland() {
  const id = `family-garland-${++serial}`;
  return svg(`<defs><clipPath id="${id}" clipPathUnits="userSpaceOnUse"><path d="${garland}"/></clipPath></defs><g clip-path="url(#${id})">${originalImage()}</g>`, 'garland');
}
