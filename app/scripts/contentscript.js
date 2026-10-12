'use strict';

(async () => {
  try {
    // URL patterns to check against
    const releasesUrlPattern = new URLPattern({pathname: '/:user/:repo/releases*'});
    const repositoryUrlPattern = new URLPattern({pathname: '/:user/:repo'});
    // URL → count
    const downloadMap = new Map();
    // Downloads of every asset of every release
    let totalDownloads = 0;

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
     * Check if url matches that of a release page or of the repository home page.
     */
    function checkUrlPattern(url) {
      try {
        const parsedUrl = new URL(url);
        if (!releasesUrlPattern.test(parsedUrl) && !repositoryUrlPattern.test(parsedUrl)) {
          return false;
        }
      } catch (e) {
        // Invalid URL format
        return false;
      }

      // Only repository pages expose the repository name, without it a path such as
      // /settings/profile would be taken for a repository and hit the API for nothing.
      return Boolean(document.querySelector('meta[name="octolytics-dimension-repository_nwo"]'));
    }

    /**
     * Read the url of the next page out of a GitHub Link header.
     */
    function getNextPageUrl(linkHeader) {
      if (!linkHeader) return null;

      const next = linkHeader.split(',').find((part) => part.includes('rel="next"'));
      const match = next && next.match(/<([^>]+)>/);
      return match ? match[1] : null;
    }

    /**
     * Build download map: URL → count if on release page.
     * Every page of releases is requested so that the total is not limited to the first 30 releases.
     */
    async function getReleaseUrls() {
      // Build GitHub API URL from current document URL
      let apiUrl = document.URL
        .replace('//github.com', '//api.github.com/repos')
        .split('/releases')[0]
        .concat('/releases?per_page=100');

      totalDownloads = 0;

      while (apiUrl) {
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
            totalDownloads += asset.download_count;
          }
        }

        apiUrl = getNextPageUrl(response.headers.get('Link'));
      }
    }

    /**
     * Locate the container of the "Releases" heading of the repository sidebar.
     */
    function getReleasesHeading() {
      // The sidebar is the expected location, the whole page is only a fallback in case
      // GitHub renames the sidebar section.
      const sidebar = document.querySelector('[class*="SidebarSection-module__sidebarSection"]');

      for (const scope of [sidebar, document]) {
        if (!scope) continue;

        for (const link of scope.querySelectorAll('h2 a[href]')) {
          try {
            if (new URL(link.href).pathname.endsWith('/releases')) return link.parentElement;
          } catch (e) {
            // Invalid URL format
          }
        }
      }

      return null;
    }

    /**
     * Display the downloads of all releases next to the "Releases" heading of the sidebar.
     */
    function processTotalDownloads() {
      if (totalDownloads <= 0) return;

      const count = totalDownloads.toLocaleString();
      const existing = document.querySelector('.githubdownloadstotal');
      if (existing) {
        // Only write when the value changed, otherwise this observer callback would re-trigger itself.
        if (existing.textContent !== count) {
          existing.textContent = count;
        }
        return;
      }

      const heading = getReleasesHeading();
      if (!heading) return;

      const dwnCount = document.createElement('span');
      dwnCount.className = 'githubdownloadstotal';
      dwnCount.title = 'Downloads across all releases';

      const dwnIcon = document.createElement('span');
      dwnIcon.className = 'githubdownloadsicon';
      dwnCount.appendChild(dwnIcon);
      dwnCount.appendChild(document.createTextNode(count));

      heading.appendChild(dwnCount);
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

        // Locate the size container: the second cell of the asset row, which holds the hash,
        // the size and the upload date of the asset.
        const sizeContainer = el.closest('.Box-row')?.children?.[1];
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
        processTotalDownloads();
      });
      // GitHub replaces the body while navigating: watching the document element keeps the
      // observer alive, watching the body would leave it attached to a detached element.
      observer.observe(document.documentElement, {childList: true, subtree: true});
    }

    // Script entry point
    hookPushState();

    // If releases page is dynamically loaded
    window.addEventListener('pushStateChange', async (event) => {
      const {newUrl} = event.detail;
      if (checkUrlPattern(newUrl)) {
        await getReleaseUrls();
        processAnchors();
        processTotalDownloads();
        observeDOM();
      }
    });

    // The content script runs at document_start, before GitHub parses the meta tags that tell a
    // repository page apart: wait for the document to be parsed before checking the url.
    if (document.readyState === 'loading') {
      await new Promise((resolve) => document.addEventListener('DOMContentLoaded', resolve, {once: true}));
    }

    // If releases page is reloaded or directly loaded
    if (checkUrlPattern(window.location.href)) {
      await getReleaseUrls();
      processAnchors();
      processTotalDownloads();
      observeDOM();
    }

  } catch (err) {
    console.error('[GitHub Release Downloads] Error:', err);
  }
})();
