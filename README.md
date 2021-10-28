# GitHub release downloads

![GitHubCounter Icon](https://raw.githubusercontent.com/addshore/browser-github-release-downloads/master/app/images/icon128.png)

A browser extension that displays release download counters.

## How to install?

Download it from:

 - Chrome: https://chrome.google.com/webstore/detail/github-release-downloads/ncgomhdgmkicjeclohgokhciihpfdlhi
 - Mozilla: Pending approval
 - Edge: Pending approval
 - Safari: Use [GitHubCounter](https://github.com/aonez/GitHubCounter) from [@aonez](https://github.com/aonez), which is based on this extension.

### How it works?

It just shows the downloads count near each release in GitHub. No toolbar elements, no bars, nothing else.

An example:

![](https://raw.githubusercontent.com/aonez/GitHubCounter/master/Media/readme-example.png)

### Icon

- Icon taken from the [Safari version](https://github.com/aonez/GitHubCounter). Based on [Nick Roach](https://www.elegantthemes.com/). Original icon can be found [here](https://www.iconfinder.com/icons/1055068/arrow_cloud_down_download_icon#size=512).

## Development

This extension uses [webextension-toolbox](https://github.com/HaNdTriX/webextension-toolbox)

    $ npm install

### While developing

    npm run dev chrome
    npm run dev firefox
    npm run dev opera
    npm run dev edge

### For builds

    npm run build chrome
    npm run build firefox
    npm run build opera
    npm run build edge

### For releasing

- Bump the version number in:
  - package.json
  - manifest.json
- Update the CHANGELOG.md
- Tag the change on Github (vx.x.x), DO NOT make a Github Release, this is done by Github Actions
- Wait for the Github actions to build the files
- See the STORE_NOTES.md file for helpful details on uploading...

### Environment

The build tool also defines a variable named `process.env.NODE_ENV` in your scripts. 
