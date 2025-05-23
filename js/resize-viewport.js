
const setViewportHeight = () => {
  let px = window.innerHeight;
  document.documentElement.style.setProperty('--viewport-height', `${px}px`);
}

window.addEventListener('resize', setViewportHeight);
window.addEventListener('load', setViewportHeight);
