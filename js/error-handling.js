const errorPopup = document.getElementById('error-popup');
const errorMessage = document.getElementById('error-message');
const errorStack = document.getElementById('error-stack');
const closePopupButton = document.getElementById('error-close-popup');

function showErrorPopup(message, stack) {
  errorMessage.textContent = message;
  errorStack.value = stack;
  errorPopup.style.display = 'flex';
}

function hideErrorPopup() {
  errorPopup.style.display = 'none';
}

window.onerror = function (message, source, lineno, colno, error) {
  const errorDetails = `Error: ${message}\nSource: ${source}\nLine: ${lineno}\nColumn: ${colno}`;
  const stackTrace = error ? error.stack : 'No stack trace available.';
  showErrorPopup(errorDetails, stackTrace);
};

closePopupButton.addEventListener('click', hideErrorPopup);
