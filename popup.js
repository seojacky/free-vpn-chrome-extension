document.addEventListener('DOMContentLoaded', async function() {
    // UI Elements
    const toggleButton = document.querySelector('.btn-power');
    const settingsButton = document.getElementById('openSettings');
    const promoBlock = document.querySelector('.promo');
    const siteDomainElement = document.querySelector('.site-domain');
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    const customSelect = document.querySelector('.custom-select');
    const selectedOption = customSelect.querySelector('.selected-option');
    const optionsContainer = customSelect.querySelector('.options-container');
    const defaultText = 'Select server';

    // Initial state
    selectedOption.innerHTML = `${defaultText}<span class="select-arrow"></span>`;

    // Загружаем список прокси и информацию о странах
    const proxyList = localStorage.getItem('proxyList') || '';
    const proxyInfoList = JSON.parse(localStorage.getItem('proxyInfoList') || '[]');
    const currentProxyIndex = localStorage.getItem('currentProxyIndex') || '0';

    // Управляем отображением промо-блока
    if (proxyInfoList.length > 0) {
        promoBlock.style.display = 'none';
    } else {
        promoBlock.style.display = 'block';
    }

    // Обработка клика по селектору
    selectedOption.addEventListener('click', () => {
        optionsContainer.classList.toggle('show');
    });

    // Закрытие селектора при клике вне его
    document.addEventListener('click', (e) => {
        if (!customSelect.contains(e.target)) {
            optionsContainer.classList.remove('show');
        }
    });

    // Обработчик кнопки настроек
    settingsButton.addEventListener('click', () => {
        chrome.runtime.openOptionsPage();
        window.close();
    });

    // Обработчик кнопки включения/выключения
    toggleButton.addEventListener('click', () => {
        const isEnabled = toggleButton.classList.contains('active');
        
        if (isEnabled) {
            offProxy();
            setIcon('off');
            updateButtonState(false);
            updateVPNStatus(false);
        } else {
            const proxy = onProxy();
            if (proxy) {
                setIcon('on');
                updateButtonState(true);
                updateVPNStatus(true);
            }
        }
    });

    // Функция форматирования отображения прокси
    function formatProxyDisplay(proxyStr, proxyInfo) {
        if (!proxyStr) return { type: 'ERROR', displayAddress: 'Not configured' };

        try {
            let parts = proxyStr.split(':');
            let host, type;

            if (parts.length === 5) {
                [type, host] = parts;
            } else if (parts.length === 3) {
                [type, host] = parts;
            } else if (parts.length === 4) {
                [host] = parts;
                type = proxyInfo?.type || 'HTTP';
            } else if (parts.length === 2) {
                [host] = parts;
                type = proxyInfo?.type || 'HTTP';
            } else {
                return { type: 'ERROR', displayAddress: 'Invalid format' };
            }

            return {
                type: type.toUpperCase(),
                displayAddress: host
            };
        } catch (error) {
            console.error('Error formatting proxy:', error);
            return { type: 'ERROR', displayAddress: 'Invalid format' };
        }
    }

    // Получаем текущий сайт
    function updateCurrentSite() {
        chrome.tabs.query({active: true, lastFocusedWindow: true}, function(tabs) {
            if (tabs[0] && tabs[0].url) {
                try {
                    const url = new URL(tabs[0].url);
                    if (url.protocol === 'chrome:' || url.protocol === 'chrome-extension:') {
                        siteDomainElement.textContent = 'Chrome page';
                    } else {
                        siteDomainElement.textContent = url.hostname;
                    }
                } catch (e) {
                    console.error('Error parsing URL:', e);
                    siteDomainElement.textContent = 'Invalid URL';
                }
            } else {
                siteDomainElement.textContent = 'No active tab';
            }
        });
    }

    // Обновляем статус VPN
    function updateVPNStatus(isEnabled) {
        if (isEnabled) {
            statusDot.classList.remove('inactive');
            statusText.classList.remove('inactive');
            statusText.classList.add('active');
            statusText.textContent = 'VPN Active';
        } else {
            statusDot.classList.add('inactive');
            statusText.classList.remove('active');
            statusText.classList.add('inactive');
            statusText.textContent = 'VPN Inactive';
        }
    }

    // Обработка изменения прокси
    function handleProxyChange(index) {
        const proxyInfo = proxyInfoList[index];
        if (!proxyInfo) return;

        const parts = proxyInfo.proxy.split(':');
        let host, port, user, pass;

        if (parts.length === 5) {
            [, host, port, user, pass] = parts;
        } else if (parts.length === 3) {
            [, host, port] = parts;
        } else if (parts.length === 4) {
            [host, port, user, pass] = parts;
        } else {
            [host, port] = parts;
        }

        const proxySetting = {
            'type': proxyInfo.type,
            'http_host': host,
            'http_port': port,
            ...(user && pass ? { 'auth': { 'enable': true, 'user': user, 'pass': pass } } : {})
        };
        localStorage.setItem('proxySetting', JSON.stringify(proxySetting));
        localStorage.setItem('currentProxyIndex', index);

        chrome.proxy.settings.get({'incognito': false}, function(config) {
            if (config.value.mode === 'pac_script') {
                onProxy();
            }
        });
    }

    // Обновление состояния кнопки
    function updateButtonState(isEnabled) {
        if (isEnabled) {
            toggleButton.classList.remove('inactive');
            toggleButton.classList.add('active');
        } else {
            toggleButton.classList.remove('active');
            toggleButton.classList.add('inactive');
        }
    }

    // Заполняем список прокси
    proxyInfoList.forEach((proxyInfo, index) => {
        const { type, displayAddress } = formatProxyDisplay(proxyInfo.proxy, proxyInfo);
        if (type === 'ERROR') return;

        const option = document.createElement('div');
        option.className = 'option';
        option.innerHTML = `
            <span class="proxy-type ${type.toLowerCase()}">${type}</span>
            ${displayAddress}
            <span class="flag">${proxyInfo.countryInfo?.flag || ''}</span>
        `;
        option.dataset.index = index;
        
        option.addEventListener('click', () => {
            selectedOption.innerHTML = option.innerHTML + '<span class="select-arrow"></span>';
            optionsContainer.classList.remove('show');
            handleProxyChange(index);
        });
        
        optionsContainer.appendChild(option);
    });

    // Установка текущего прокси в селекторе
    if (proxyInfoList.length > 0) {
        const currentProxy = proxyInfoList[currentProxyIndex];
        if (currentProxy) {
            const { type, displayAddress } = formatProxyDisplay(currentProxy.proxy, currentProxy);
            selectedOption.innerHTML = `
                <span class="proxy-type ${type.toLowerCase()}">${type}</span>
                ${displayAddress}
                <span class="flag">${currentProxy.countryInfo?.flag || ''}</span>
                <span class="select-arrow"></span>
            `;
        }
    }

    // Проверяем текущее состояние прокси
    chrome.proxy.settings.get({'incognito': false}, function(config) {
        try {
            const isEnabled = config.value.mode === 'pac_script' || config.value.mode === 'fixed_servers';
            updateButtonState(isEnabled);
            updateVPNStatus(isEnabled);
            setIcon(isEnabled ? 'on' : 'off');
        } catch (error) {
            console.error('Error checking proxy state:', error);
            updateButtonState(false);
            updateVPNStatus(false);
            setIcon('off');
        }
    });

    // Инициализация текущего сайта
    updateCurrentSite();

    const versionEl = document.getElementById('ext-version');
    const currentVersion = chrome.runtime.getManifest().version;
    versionEl.textContent = 'v.' + currentVersion + ' (checking...)';

    function isNewerVersion(remote, local) {
        const [rMaj, rMin] = remote.split('.').map(Number);
        const [lMaj, lMin] = local.split('.').map(Number);
        return rMaj > lMaj || (rMaj === lMaj && rMin > lMin);
    }

    function showUpdateNotice(version) {
        const notice = document.getElementById('update-notice');
        document.getElementById('update-version').textContent = version;
        notice.style.display = 'block';
    }

    function checkForUpdates() {
        const CACHE_KEY = 'chrome-proxy-manager-update-check';
        const CACHE_TTL = 24 * 60 * 60 * 1000;

        try {
            const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
            if (cached && Date.now() - cached.checkedAt < CACHE_TTL) {
                versionEl.textContent = 'v.' + currentVersion;
                if (cached.latestVersion) showUpdateNotice(cached.latestVersion);
                console.log('[VPN] Update check from cache:', cached.latestVersion || 'up to date');
                return;
            }
        } catch (e) {}

        const controller = new AbortController();
        const timeout = setTimeout(function() { controller.abort(); }, 5000);

        fetch('https://api.github.com/repos/seojacky/free-vpn-chrome-extension/branches?per_page=100', {
            signal: controller.signal
        })
            .then(function(r) {
                clearTimeout(timeout);
                if (!r.ok) return null;
                return r.json();
            })
            .then(function(branches) {
                if (!branches) {
                    versionEl.textContent = 'v.' + currentVersion;
                    console.log('[VPN] Update check failed: API error');
                    return;
                }

                const sorted = branches
                    .map(function(b) { return b.name; })
                    .filter(function(name) { return /^\d+\.\d+$/.test(name); })
                    .sort(function(a, b) {
                        const [aMaj, aMin] = a.split('.').map(Number);
                        const [bMaj, bMin] = b.split('.').map(Number);
                        return bMaj - aMaj || bMin - aMin;
                    });

                if (!sorted.length) {
                    versionEl.textContent = 'v.' + currentVersion;
                    return;
                }

                const latestVersion = sorted[0];
                const hasUpdate = isNewerVersion(latestVersion, currentVersion);

                versionEl.textContent = 'v.' + currentVersion;

                try {
                    localStorage.setItem(CACHE_KEY, JSON.stringify({
                        latestVersion: hasUpdate ? latestVersion : null,
                        checkedAt: Date.now()
                    }));
                } catch (e) {}

                if (hasUpdate) {
                    showUpdateNotice(latestVersion);
                    console.log('[VPN] Update available:', latestVersion);
                } else {
                    console.log('[VPN] Extension is up to date');
                }
            })
            .catch(function() {
                clearTimeout(timeout);
                versionEl.textContent = 'v.' + currentVersion;
                console.log('[VPN] Update check timeout or error');
            });
    }

    checkForUpdates();
});