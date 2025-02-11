function onProxy() {
    try {
        var proxySetting = JSON.parse(localStorage.proxySetting);
        var proxyMode = localStorage.getItem('proxyMode') || 'proxyAll';
        var domainList = (localStorage.getItem('domainList') || '').split('\n')
            .filter(line => line.trim())
            .map(domain => domain.trim().toLowerCase());

        var proxy = {
            type: 'http',
            host: proxySetting['http_host'],
            port: proxySetting['http_port']
        };

        var proxyString = `PROXY ${proxy.host}:${proxy.port}`;
        var config = {
            mode: "pac_script",
            pacScript: {}
        };

        if (proxyMode === 'proxyAll') {
            config.pacScript.data = `
                function FindProxyForURL(url, host) {
                    
                    return "${proxyString}";
                }
            `;
        } else if (proxyMode === 'proxyOnly') {
            var sitesArray = JSON.stringify(domainList);
            config.pacScript.data = `
                function FindProxyForURL(url, host) {
                    host = host.toLowerCase();
                    var sites = ${sitesArray};
                    for (var i = 0; i < sites.length; i++) {
                        if (dnsDomainIs(host, sites[i])) {
                            return "${proxyString}";
                        }
                    }
                    return "DIRECT";
                }
            `;
        } else if (proxyMode === 'proxyExcept') {
            var sitesArray = JSON.stringify(domainList);
            config.pacScript.data = `
                function FindProxyForURL(url, host) {
                    host = host.toLowerCase();
                    var sites = ${sitesArray};
                    for (var i = 0; i < sites.length; i++) {
                        if (dnsDomainIs(host, sites[i])) {
                            return "DIRECT";
                        }
                    }
                    return "${proxyString}";
                }
            `;
        }

        chrome.proxy.settings.set({
            value: config,
            scope: 'regular'
        }, function () {
            showNotification(true);
        });

        return proxy;
    } catch (error) {
        console.error('Error in onProxy:', error);
    }
}

function offProxy() {
    var config = {
        mode: 'direct'
    };

    chrome.proxy.settings.set({
        value: config,
        scope: 'regular'
    }, function () {
        showNotification(false);
    });
}

function setIcon(str) {
    var icon = {
        path: 'icons/on.png'
    }
    if (str == 'off') {
        icon['path'] = 'icons/off.png';
    }
    chrome.browserAction.setIcon(icon);
}

function showNotification(isEnabled) {
    const proxySetting = JSON.parse(localStorage.proxySetting || '{}');
    const title = isEnabled ? 'VPN Connected' : 'VPN Disconnected';
    const message = isEnabled 
        ? `Connected to: ${proxySetting.http_host}:${proxySetting.http_port}`
        : 'VPN is now disabled';
    
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/' + (isEnabled ? 'on.png' : 'off.png'),
        title: title,
        message: message
    });
}

function callbackFn(details) {
    try {
        var proxySetting = JSON.parse(localStorage.proxySetting || '{}');
        return {
            authCredentials: {
                username: proxySetting.auth?.user || "dnrrfarc",
                password: proxySetting.auth?.pass || "cvbnihiajzzt"
            }
        };
    } catch (error) {
        console.error('Error in callbackFn:', error);
        return {
            authCredentials: {
                username: "dnrrfarc",
                password: "cvbnihiajzzt"
            }
        };
    }
}