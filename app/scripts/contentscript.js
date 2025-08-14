'use strict';

var xmlHttp = new XMLHttpRequest();
xmlHttp.onreadystatechange = function () {
  switch (xmlHttp.readyState) {
    case 0: // UNINITIALIZED
    case 1: // LOADING
    case 2: // LOADED
    case 3:
      // INTERACTIVE
      break;
    case 4:
      // COMPLETED
      var releases = JSON.parse(xmlHttp.responseText);
      var downloadMap = new Map()
      for (var i in releases) {
        for (var j in releases[i].assets) {
          // browser_download_url is a full URL to the resource
          var downLink = decodeURI(releases[i].assets[j].browser_download_url)
            // .slice(18)
          downloadMap.set(downLink, releases[i].assets[j].download_count)
        }
      }
      var els = document.getElementsByTagName('a');
      //var locale = getLocale();
      for (var i = 0, l = els.length; i < l; i++) {
        var el = els[i];
        var link = el.href.startsWith('/') ? "https://github.com" + el.href : el.href
        if (downloadMap.has(link)) {
          var dwnCount = document.createElement('small');
          dwnCount.className = 'githubdownloadscounter text-gray float-right'; // Right style
          var d = downloadMap.get(link);
          //if (locale.length) {
          //  d = d.toLocaleString("en-US");
          //}
          dwnCount.appendChild(document.createTextNode(d));
          var dwnIcon = document.createElement('span');
          dwnCount.appendChild(dwnIcon);
          var sizeContainer = el.parentNode.parentNode.children[1];
          if (!sizeContainer) {
            console.log("No size parent element selectable to attached download count to");
            continue;
          }
          var size = sizeContainer.children[0];
          if (!size) {
            console.log("No size element selectable to attached download count to");
            continue;
          }
          sizeContainer.insertBefore(dwnCount, size);
          dwnCount.style.minWidth = dwnCount.offsetWidth + 3 + 'px';
          dwnCount.style.flexGrow = '2';
          dwnCount.style.marginLeft = '5px';
        }
      }
      break;
    default:
      console.log('Error: GitHub Release Download Count Request Errored.');
  }
};
xmlHttp.open('GET', document.URL.replace('//github.com', '//api.github.com/repos').split('/tag/')[0], true);
xmlHttp.send(null);
