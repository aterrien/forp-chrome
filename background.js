// Copyright (c) 2011 The Chromium Authors. All rights reserved.
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

var forpController;
function setForpStack(stack) {
    this.document.body.innerHTML = "";
    (function(f) {
        f.find("body")
            .forp({
            stack : stack,
            mode : "embedded"
            });
    })(forp);
}

//Handle request from devtools
chrome.extension.onConnect.addListener(function (port) {

    //Posting back to Devtools
    // chrome.extension.onMessage >> extension
    // port.onMessage >> instance
    port.onMessage.addListener(function (message, sender) {

        if(message.action == 'inspect') {
            chrome.tabs.executeScript(
                null, // current tab
                //{code:"chrome.extension.sendMessage({action: 'load', stack: document.getElementById('forpStack') ? document.getElementById('forpStack').innerHTML : null}, function(response) { console.log(response); });"},
                {code:"var forpStack = document.getElementById('forpStack'); forpStack ? forpStack.innerHTML : null;"},
                function(result) {
                    port.postMessage({
                        action: 'load',
                        stack: result
                    });
                }
            );
        } else if(message.action == 'glueHeaderChunks') {
            /*var chunks = [];
            for(var i in message.request.response.headers) {
                var header = message.request.response.headers[i];
                if (/^X-Forp-Stack_/.test(header.name)) {
                    var index = parseInt(header.name.replace("X-Forp-Stack_",""));
                    chunks[index] = header.value;
                }
            }*/
            port.postMessage({
                action: 'load',
                stack: message.chunks.join('')
            });
        } else {
            // action = load
            port.postMessage(message);
        }
    });
});