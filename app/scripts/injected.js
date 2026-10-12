// Store references to the original history functions
const originalPushState = history.pushState;
const originalReplaceState = history.replaceState;
let currentUrl = window.location.href;

/**
 * Send the new url to `contentscript.js` to check if it is a release page.
 * GitHub navigates without a page load through pushState, replaceState and the browser history,
 * so all of them have to be watched. replaceState is also called again with the url of the page
 * that is already displayed, only a real url change is worth a notification.
 */
function notifyUrlChange() {
  const newUrl = window.location.href;
  if (newUrl === currentUrl) return;

  currentUrl = newUrl;
  window.dispatchEvent(new CustomEvent('pushStateChange', {detail: {newUrl}}));
}

// Override the pushState method to detect dynamic page loads
history.pushState = function (state, title, url) {
  originalPushState.apply(this, [state, title, url]);
  notifyUrlChange();
};

// Same for replaceState, which GitHub uses to finish a navigation
history.replaceState = function (state, title, url) {
  originalReplaceState.apply(this, [state, title, url]);
  notifyUrlChange();
};

// The history buttons of the browser do not go through pushState or replaceState
window.addEventListener('popstate', notifyUrlChange);
