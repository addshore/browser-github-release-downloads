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
      var downloadMap = [];
      for (var i in releases) {
        for (var j in releases[i].assets) {
          downloadMap[decodeURI(releases[i].assets[j].browser_download_url)] = releases[i].assets[j].download_count;
        }
      }
      var els = document.getElementsByTagName('a');
      //var locale = getLocale();

      for (var i = 0, l = els.length; i < l; i++) {
        var el = els[i];
        if (el.href in downloadMap) {
          var dwnCount = document.createElement('small');
          dwnCount.className = 'githubdownloadscounter text-gray float-right'; // Right style
          var d = downloadMap[el.href];
          //if (locale.length) {
          //  d = d.toLocaleString("en-US");
          //}
          dwnCount.appendChild(document.createTextNode(d));
          var dwnIcon = document.createElement('span');
          dwnCount.appendChild(dwnIcon);
          var sizes = el.parentNode.getElementsByTagName('small');
          if (sizes) {
            var size = sizes[0];
            if (size) {
              el.parentNode.insertBefore(dwnCount, size);
              dwnCount.style.minWidth = dwnCount.offsetWidth + 3 + 'px';
              dwnCount.style.flexGrow = '2';
            }
          }
        }
      }
      break;
    default:
      console.log('Error: GitHub Release Download Count Request Errored.');
  }
};
xmlHttp.open('GET', document.URL.replace('//github.com', '//api.github.com/repos').split('/tag/')[0], true);
xmlHttp.send(null);