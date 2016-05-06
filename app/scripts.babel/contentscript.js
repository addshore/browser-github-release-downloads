'use strict';

var xmlHttp = new XMLHttpRequest();
xmlHttp.onreadystatechange = function () {
  switch (xmlHttp.readyState) {
    case 0 : // UNINITIALIZED
    case 1 : // LOADING
    case 2 : // LOADED
    case 3 : // INTERACTIVE
      break;
    case 4 : // COMPLETED
      var releases = JSON.parse( xmlHttp.responseText );
      var downloadMap = [];
      for (var i in releases) {
        for (var j in releases[i].assets) {
          downloadMap[releases[i].assets[j].browser_download_url] = releases[i].assets[j].download_count;
        }
      }
      var els = document.getElementsByTagName('a');
      for (var i = 0, l = els.length; i < l; i++) {
        var el = els[i];
        if ( el.href in downloadMap ) {
          var dwnCount = document.createElement( 'small' );
          dwnCount.appendChild( document.createTextNode( ' - ' + downloadMap[el.href] + ' downloads' ) )
          el.appendChild( dwnCount );
        }
      }
      break;
    default: console.log( 'Error: GitHub Release Download Count Request Errored.' );
  }
};
xmlHttp.open( 'GET',
  document.URL.replace( '//github.com', '//api.github.com/repos' ).split( '/tag/' )[0],
  true
);
xmlHttp.send( null );