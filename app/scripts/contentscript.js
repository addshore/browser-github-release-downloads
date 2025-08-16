'use strict';

(async () => {
  try {
    // URL patterns to check against
    const releasesUrlPattern = new URLPattern({pathname: '/:user/:repo/releases*'});
    // URL → count
    const downloadMap = new Map();

    /**
     * Override the pushState method on page load to detect dynamic page loads.
     */
    function hookPushState() {
      document.addEventListener('DOMContentLoaded', () => {
        const script = document.createElement('script');
        script.setAttribute('type', 'text/javascript');
        // Determine browser: Firefox || Chrome
        const browserAPI = window.browser || window.chrome;
        const script_url = browserAPI.runtime.getURL('/scripts/injected.js')
        script.setAttribute('src', script_url);
        document.head.appendChild(script);
      });
    }

    /**
     * Check if url matches that of a release page.
     */
    function checkUrlPattern(url) {
      try {
        const parsedUrl = new URL(url);
        return releasesUrlPattern.test(parsedUrl);
      } catch (e) {
        // Invalid URL format
        return false;
      }
    }

    /**
     * Build download map: URL → count if on release page.
     */
    async function getReleaseUrls() {
      // Build GitHub API URL from current document URL
      const apiUrl = document.URL
        .replace('//github.com', '//api.github.com/repos')
        .split('/releases')[0]
        .concat('/releases');

      const response = await fetch(apiUrl);
      if (!response.ok) {
        // noinspection ExceptionCaughtLocallyJS
        throw new Error(`GitHub API request failed: ${response.status}`);
      }

      const releases = await response.json();

      for (const release of releases) {
        for (const asset of release.assets || []) {
          const url = decodeURI(asset.browser_download_url);
          downloadMap.set(url, asset.download_count);
        }
      }
    }

    /**
     * Processes all anchor tags, injecting download counts where applicable.
     */
    function processAnchors() {
      const anchors = document.getElementsByTagName('a');
      for (const el of anchors) {
        if (el.dataset.downloadProcessed) continue; // skip if already handled

        const href = el.getAttribute('href');
        if (!href) continue;

        const linkUrl = href.startsWith('/')
          ? `https://github.com${href}`
          : href;

        if (!downloadMap.has(linkUrl)) continue;

        const dwnCount = document.createElement('small');
        dwnCount.className = 'githubdownloadscounter text-gray float-right';
        dwnCount.textContent = downloadMap.get(linkUrl);
        dwnCount.style.marginLeft = '5px';

        // Add an icon span
        const dwnIcon = document.createElement('span');
        dwnCount.appendChild(dwnIcon);

        // Locate size container (two parents up, then second child)
        const sizeContainer = el.parentElement?.parentElement?.children?.[1];
        if (sizeContainer?.children?.[0]) {
          sizeContainer.insertBefore(dwnCount, sizeContainer.children[0]);
          dwnCount.style.minWidth = `${dwnCount.offsetWidth + 3}px`;
          el.dataset.downloadProcessed = 'true';
        }
      }
    }

    /**
     * Observes DOM changes to handle dynamically loaded assets.
     */
    function observeDOM() {
      const observer = new MutationObserver(() => {
        processAnchors();
      });
      observer.observe(document.body, {childList: true, subtree: true});
    }

    // Script entry point
    hookPushState();

    // If releases page is dynamically loaded
    window.addEventListener('pushStateChange', async (event) => {
      const {newUrl} = event.detail;
      if (checkUrlPattern(newUrl)) {
        await getReleaseUrls();
        processAnchors();
        observeDOM();
      }
    });

    // If releases page is reloaded or directly loaded
    if (checkUrlPattern(window.location.href)) {
      await getReleaseUrls();
      processAnchors();
      observeDOM();
    }

  } catch (err) {
    console.error('[GitHub Download Counter] Error:', err);
  }
})();
