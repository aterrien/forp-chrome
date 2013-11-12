/**
 * Forp devtools
 */
var ForpChrome = function () {
    this._handleRequest = false;
    this.window = null;
    this.setWindow = function(window) {
        this.window = window;
        this.window.init(this);
        return this;
    };
    this.importStr = function(str) {
        var stack = JSON.parse(str);
        this.window.setForpStack(stack);
    };
    this.handleHeaders = function(har) {
        // handle JSON
        for (var i = 0; i < har.response.headers.length; ++i) {
            var header = har.response.headers[i];
            if (/^X-Forp-/.test(header.name)) {
                this.importStr(header.value);
            }
        }
    };
    this.handleRequest = function(state) {
        if(state != null) {
            this._handleRequest = state;
            return this.refresh();
        } else {
            return this._handleRequest;
        }
    }
    this.warn = function(message) {
        var messageDiv = this.window.document.getElementById("message");
        messageDiv.innerHTML = message;
    };
    this.refresh = function() {
        this.window.refresh(this);
        return this;
    };
};


chrome.devtools.panels.create(
    "Forp",
    "./icon.png",
    "./panel.html",
    function(extensionPanel) {
        var runOnce = false;

        extensionPanel.onShown.addListener(
            function(panelWindow) {

                if (runOnce) return;
                runOnce = true;

                var profiler = (new ForpChrome())
                                    .setWindow(panelWindow);


                var port = chrome.extension.connect({name: "forp"});

                //Handles response when received from background page
                port.onMessage.addListener(function (message) {
                    profiler.importStr(message.stack);
                });

                chrome.devtools.network.getHAR(function(result) {

                    var entries = result.entries;
                    if (!entries.length) {
                        profiler.warn("Reload the page to track forp.");
                    }

                    chrome.devtools.network.onNavigated.addListener(function(url) {
                        profiler.handleRequest(true);
                    });

                    chrome.devtools.network.onRequestFinished.addListener(
                        function(request){

                            if(!profiler.handleRequest()) return;
                            profiler.handleRequest(false);

                            var action = 'inspect',
                                chunks = [];

                            // detects X-Forp header
                            for(var i in request.response.headers) {
                                var header = request.response.headers[i];
                                if (/^X-Forp-Stack_/.test(header.name)) {
                                    var index = parseInt(header.name.replace("X-Forp-Stack_",""));
                                    chunks[index] = header.value.substr(1); // starts with "_"
                                    action = 'glueHeaderChunks';
                                }
                            }

                            port.postMessage({
                                action: action,
                                chunks : chunks
                            });
                        }
                    );
                });
            }
        );
    }
);

chrome.devtools.network.addRequestHeaders({
    "X-Forp-Version": "1.1.0"
});