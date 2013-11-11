/**
 * Devtools window connector
 */
function init(controller) {
    (function($) {
        $("a.handleXhr").bind(
            'click',
            function(e) {
                if(controller.handleRequest()) {
                    controller.handleRequest(false);
                    $(this).removeClass('enabled');
                } else {
                    controller.handleRequest(true);
                    $(this).addClass('enabled');
                }
            }
        );
    })(jMicro);
}

function refresh(controller) {
    (function($) {
        if(!controller.handleRequest()) {
            $("a.handleXhr").removeClass('enabled');
        } else {
            $("a.handleXhr").addClass('enabled');
        }
    })(jMicro);
}

function setForpStack(stack) {
    (function($) {
        $("div.profile")
            .empty()
            .forp({
                stack : stack,
                mode : "embedded"
            });
    })(jMicro);
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