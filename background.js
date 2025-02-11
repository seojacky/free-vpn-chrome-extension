// Инициализация настроек при установке
chrome.runtime.onInstalled.addListener(function (details) {
    if (details.reason == "install") {
        var proxySetting = {
            'http_host': '198.23.239.134',
            'http_port': '6540',
            'auth': {
                'enable': '',
                'user': 'dnrrfarc',
                'pass': 'cvbnihiajzzt'
            }
        }
        localStorage.setItem('proxySetting', JSON.stringify(proxySetting));
        localStorage.whiteList = '<local>,192.168.0.0/16,172.16.0.0/12,169.254.0.0/16,10.0.0.0/8';
    }
});

// Проверяем, существуют ли настройки
if (!localStorage.getItem('proxySetting')) {
    var proxySetting = {
        'http_host': '198.23.239.134',
        'http_port': '6540',
        'auth': {
            'enable': '',
            'user': 'dnrrfarc',
            'pass': 'cvbnihiajzzt'
        }
    }
    localStorage.setItem('proxySetting', JSON.stringify(proxySetting));
}

if (!localStorage.getItem('whiteList')) {
    localStorage.whiteList = '<local>,192.168.0.0/16,172.16.0.0/12,169.254.0.0/16,10.0.0.0/8';
}

chrome.webRequest.onAuthRequired.addListener(
    callbackFn, {
        urls: ["<all_urls>"]
    },
    ['blocking']);