// Store a reference to the original pushState function
const originalPushState = history.pushState;

// Override the pushState method to detect dynamic page loads
history.pushState = function (state, title, url) {
  originalPushState.apply(this, [state, title, url]);
  const newUrl = window.location.href;
  // Send the new url to `contentscript.js` to check if it is a release page
  window.dispatchEvent(new CustomEvent('pushStateChange', {detail: {newUrl}}));
};
