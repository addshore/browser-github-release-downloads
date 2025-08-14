'use strict';

(async () => {
  try {
    // Build GitHub API URL from current document URL
    const apiUrl = document.URL
      .replace('//github.com', '//api.github.com/repos')
      .split('/tag/')[0];

    const response = await fetch(apiUrl);
    if (!response.ok) {
      throw new Error(`GitHub API request failed: ${response.status}`);
    }

    const releases = await response.json();
    const downloadMap = new Map();

    // Build download map: URL → count
    for (const release of releases) {
      for (const asset of release.assets || []) {
        const url = decodeURI(asset.browser_download_url);
        downloadMap.set(url, asset.download_count);
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

    processAnchors();

  } catch (err) {
    console.error('[GitHub Download Counter] Error:', err);
  }
})();
