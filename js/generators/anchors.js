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

const ANCHOR_SVGS = {
  0: generateStarSVG('#8585e0'),
  1: generateCircleSVG('#17ebeb'),
  2: generateTriangleSVG('#f8f843'),
  3: generateHeartSVG('#e32020'),
}

document.getElementById('svg-0').innerHTML = ANCHOR_SVGS[0];
document.getElementById('svg-1').innerHTML = ANCHOR_SVGS[1];
document.getElementById('svg-2').innerHTML = ANCHOR_SVGS[2];
document.getElementById('svg-3').innerHTML = ANCHOR_SVGS[3];
