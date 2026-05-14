// Обработка ошибок прокси
chrome.proxy.onProxyError.addListener((details) => {
    console.error('Proxy error:', details);
    updateIcon(false);
});

// Обновление иконки и бейджа
async function updateIcon(isEnabled, isSiteUsingProxy = false) {
    try {
        const proxyMode = localStorage.getItem('proxyMode') || 'proxyAll';
        
        if (!isEnabled) {
            chrome.browserAction.setIcon({
                path: 'icons/off.png'
            });
            chrome.browserAction.setBadgeText({ text: "" });
            return;
        }

        chrome.browserAction.setIcon({
            path: 'icons/on.png'
        });

        // Показываем бейдж "ON" только в режимах proxyOnly и proxyExcept
        const showBadge = (proxyMode === 'proxyOnly' || proxyMode === 'proxyExcept') && isSiteUsingProxy;

        chrome.browserAction.setBadgeText({ text: showBadge ? "ON" : "" });

        if (showBadge) {
            chrome.browserAction.setBadgeBackgroundColor({ color: "#4ade80" });
            chrome.browserAction.setBadgeTextColor({ color: "#ffffff" });
        }
    } catch (error) {
        console.error('Error updating icon:', error);
    }
}

// Проверка использования прокси для сайта
function checkIfSiteUsesVPN(tabId, url) {
    try {
        if (!url) return;
        
        const proxyMode = localStorage.getItem('proxyMode') || 'proxyAll';
        const domainList = (localStorage.getItem('domainList') || '').split('\n')
            .filter(line => line.trim())
            .map(domain => domain.trim().toLowerCase());

        // Получаем активное состояние прокси
        chrome.proxy.settings.get({'incognito': false}, function(config) {
            const isEnabled = config.value.mode === 'pac_script' || config.value.mode === 'fixed_servers';
            
            if (!isEnabled) {
                updateIcon(false);
                return;
            }

            try {
                const hostname = new URL(url).hostname.toLowerCase();
                const isInList = domainList.some(domain => 
                    hostname === domain || hostname.endsWith('.' + domain)
                );

                let showBadge = false;
                if (proxyMode === 'proxyOnly') {
                    showBadge = isInList;
                } else if (proxyMode === 'proxyExcept') {
                    showBadge = !isInList;
                } else { // proxyAll
                    showBadge = true;
                }

                updateIcon(true, showBadge);
            } catch (error) {
                console.error('Error checking hostname:', error);
                updateIcon(true, false);
            }
        });
    } catch (error) {
        console.error('Error checking VPN status:', error);
        updateIcon(false);
    }
}

// Слушатели событий вкладок
chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.tabs.get(activeInfo.tabId, (tab) => {
        if (tab?.url) checkIfSiteUsesVPN(tab.id, tab.url);
    });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.url || changeInfo.status === "complete") {
        checkIfSiteUsesVPN(tabId, tab.url);
    }
});

// Авторизация прокси
chrome.webRequest.onAuthRequired.addListener(
    callbackFn, {
        urls: ["<all_urls>"]
    },
    ['blocking']
);