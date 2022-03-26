# run-a-script
[![SemVer](https://img.shields.io/badge/version-1.0.1-brightgreen.svg)](http://semver.org)
[![License: GPL v3](https://img.shields.io/badge/License-GPL%20v3-blue.svg)](http://www.gnu.org/licenses/gpl-3.0)

A Firefox extension that allows you to define exactly one JS script and inject it into every web page you visit. It uses Firefox' [userScripts](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/userScripts) feature which sandboxes JS code before execution. You should be safe from even the most malicious of actors out there. For at least some convenience, jQuery is injected as well and usable from your script. The code of the extension is deliberately minimal, you are encouraged to review it for security before running the extension. Please report all problems you find and share your snippets in the [issues](/issues).

run-a-script is meant for people with trust issues. There are plenty of extensions out there that you could easily re-implement with a small JS snippet instead of installing. Also useful with [uBlock Origin](https://github.com/gorhill/uBlock) for defeating aggressive sites.

The plugin supports:
* sandboxed injection of 1 script + jQuery into all pages, you need to refresh the opened ones
* enabling / disabling the script

The plugin does NOT support:
* Android – but working on it
* Chrome – the whole idea of this extension is to be secure but that's irrelevant if your browser is a blackbox
* saving to and loading from a file – saving would be useful but currently not possible due to a [Firefox bug](https://bugzilla.mozilla.org/show_bug.cgi?id=1292701) 

## Example

Here's a simple script that does useful redirects:

```
console.log("The execution of the custom code is beginning.");

var url = document.URL;
var {
    host,
    protocol
} = new URL(url);

var redirects = {
    "www.youtube.com": "yewtu.be",
    "www.reddit.com": "old.reddit.com",
    "imgur.com": redirectToImgurMedia,
    "twitter.com": "nitter.net"
}

function redirectToImgurMedia() {
    console.log("Attempting to redirect to media...");
    $(document).ready(function() {
        var meta = $("meta[name='twitter:image']").first();
        if (meta.length > 0) {
            window.location.replace(meta.attr("content"));
        } else {
            console.log("Couldn't find the media link.");
        }
    });
}

var redirect = redirects[host];

if (redirect) {
    if (typeof redirect === "string") {
        window.location.replace(url.replace(
            `${protocol}//${host}`,
            `${protocol}//${redirect}`
        ));
    } else
        redirect();
}

console.log("The execution of the custom code is finishing.");
```

## License

Copyright © 2022-present Mihail Ivanchev.

Distributed under the GNU General Public License, Version 3 (GNU GPLv3).

The doge icon was sourced from https://icon-library.com/icon/doge-icon-21.html and subsequently modified.

jQuery is distributed under [its respective license](https://jquery.org/license/).

