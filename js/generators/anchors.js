function generateStarSVG(color) {
    return `<svg class="anchor" width="50" height="50" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path 
                  d="M50,5 L61,37 L95,37 L68,59 L79,91 L50,72 L21,91 L32,59 L5,37 L39,37 Z" 
                  fill="${color}" 
                  stroke="#000000" 
                  stroke-width="3"
                  stroke-linejoin="round" 
                  stroke-linecap="round" 
              />
            </svg>`;
}

function generateCircleSVG(color) {
    return `<svg class="anchor" width="50" height="50" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <circle cx="50" cy="50" r="45" fill="${color}" stroke="#000000" />
            </svg>`;
}

function generateTriangleSVG(color) {
    return `<svg class="anchor" width="50" height="50" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <polygon points="50,10 90,90 10,90" fill="${color}" stroke="#000000" />
            </svg>`;
}

function generateHeartSVG(color) {
    return `<svg class="anchor" width="50" height="50" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path d="M50,90 L20,60 C10,50 10,30 20,20 C30,10 50,10 50,30 C50,10 70,10 80,20 C90,30 90,50 80,60 Z" fill="${color}" stroke="#000000" />
            </svg>`;
}

function generateFastForwardSVG() {
    return `<svg class="anchor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#FFF" d="M13,6V18L21.5,12M4,18L12.5,12L4,6V18Z" /></svg>`;
}

function generateRewindSVG() {
    return `<svg class="anchor" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 24 24"><path fill="#FFF" d="M11.5,12L20,18V6M11,18V6L2.5,12L11,18Z" /></svg>`;
}

function generateUpArrow() {
  return `<svg class="anchor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#FFF" d="M15,20H9V12H4.16L12,4.16L19.84,12H15V20Z" /></svg>`
}

function generateDownArrow() {
  return `<svg class="anchor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#FFF" d="M9,4H15V12H19.84L12,19.84L4.16,12H9V4Z" /></svg>`
}

function generateLeftArrow() {
  return `<svg class="anchor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#FFF" d="M20,9V15H12V19.84L4.16,12L12,4.16V9H20Z" /></svg>`
}

function generateRightArrow() {
  return `<svg class="anchor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#FFF" d="M4,15V9H12V4.16L19.84,12L12,19.84V15H4Z" /></svg>`
}

const REUSABLE_SVGS = {
  0: generateStarSVG('#8585e0'),
  1: generateCircleSVG('#17ebeb'),
  2: generateTriangleSVG('#f8f843'),
  3: generateHeartSVG('#e32020'),
  4: generateFastForwardSVG(),
  5: generateRewindSVG(),
  6: generateUpArrow(),
  7: generateDownArrow(),
  8: generateLeftArrow(),
  9: generateRightArrow(),
}

document.getElementById('svg-0').innerHTML = REUSABLE_SVGS[0];
document.getElementById('svg-1').innerHTML = REUSABLE_SVGS[1];
document.getElementById('svg-2').innerHTML = REUSABLE_SVGS[2];
document.getElementById('svg-3').innerHTML = REUSABLE_SVGS[3];
