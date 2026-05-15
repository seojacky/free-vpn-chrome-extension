document.addEventListener('DOMContentLoaded', function() {
    const versionEl = document.getElementById('ext-version');
    const currentVersion = chrome.runtime.getManifest().version;
    versionEl.textContent = 'v.' + currentVersion;

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
            if (cached && cached.latestVersion && Date.now() - cached.checkedAt < CACHE_TTL) {
                versionEl.textContent = 'v.' + currentVersion;
                if (isNewerVersion(cached.latestVersion, currentVersion)) showUpdateNotice(cached.latestVersion);
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
                        latestVersion: latestVersion,
                        checkedAt: Date.now()
                    }));
                } catch (e) {}

                if (hasUpdate) {
                    showUpdateNotice(latestVersion);
                }
            })
            .catch(function() {
                clearTimeout(timeout);
                versionEl.textContent = 'v.' + currentVersion;
            });
    }

    checkForUpdates();

    // UI Elements
    const proxyMode = localStorage.getItem('proxyMode') || 'proxyAll';
    const domainList = localStorage.getItem('domainList') || '';
    const proxyList = localStorage.getItem('proxyList') || '';

    // Initialize spoiler functionality
    document.querySelectorAll('.spoiler-header').forEach(header => {
        const content = header.nextElementSibling;
        const icon = header.querySelector('.spoiler-icon');
        
        header.addEventListener('click', () => {
            const isCollapsed = content.style.display === 'none' || content.style.display === '';
            content.style.display = isCollapsed ? 'block' : 'none';
            icon.innerHTML = isCollapsed ? '&#9652;' : '&#9662;';
        });
    });

    // Устанавливаем значения
    document.querySelector(`#${proxyMode}`).checked = true;
    document.querySelector('#domainList').value = domainList;
    document.querySelector('#proxyList').value = proxyList;

    // Функция определения типа прокси
    async function determineProxyType(proxyStr) {
        if (proxyStr.toLowerCase().startsWith('socks5:')) return 'SOCKS5';
        if (proxyStr.toLowerCase().startsWith('http:')) return 'HTTP';
        
        const [host, port] = proxyStr.split(':');
        const socks5Ports = [1080, 1081, 1085, 9050, 9051];
        const httpPorts = [3128, 8080, 8081, 80, 8000];
        
        const portNum = parseInt(port);
        if (socks5Ports.includes(portNum)) return 'SOCKS5';
        if (httpPorts.includes(portNum)) return 'HTTP';
        
        return 'HTTP';
    }

    // Helper function to show status badge
    function showStatusBadge(button, message, type = 'success') {
        const badge = document.createElement('span');
        badge.className = `status-badge ${type}`;
        badge.textContent = message;
        button.parentNode.appendChild(badge);
        setTimeout(() => badge.remove(), 3000);
    }

    // Функция получения флага страны
    function getCountryFlag(countryCode) {
        if (!countryCode || countryCode.length !== 2) return '';
        const codePoints = [...countryCode.toUpperCase()].map(char => 
            127397 + char.charCodeAt(0)
        );
        return String.fromCodePoint(...codePoints);
    }

    // Функция получения информации о стране по IP
    async function getProxyCountryInfo(ip) {
        try {
            const response = await fetch(`https://ip2c.org/${ip}`);
            const data = await response.text();
            const [status, countryCode] = data.split(';');
            if (status === '1') {
                const flag = getCountryFlag(countryCode);
                return { code: countryCode, flag };
            }
            return { code: 'Unknown', flag: '' };
        } catch (error) {
            console.error('Error fetching country info:', error);
            return { code: 'Unknown', flag: '' };
        }
    }

    // Import UA List
    document.getElementById('importUaList').addEventListener('click', async () => {
        const button = document.getElementById('importUaList');
        button.disabled = true;
        
        try {
            const response = await fetch('https://seojacky.github.io/pages/ua-blacklist-domen.txt');
            if (!response.ok) throw new Error('Network response was not ok');
            
            const text = await response.text();
            const domains = text.split('\n')
                              .map(domain => domain.trim())
                              .filter(Boolean);
            
            document.getElementById('domainList').value = domains.join('\n');
            showStatusBadge(button, `Imported ${domains.length} domains`);
        } catch (error) {
            console.error('Import error:', error);
            showStatusBadge(button, 'Import failed', 'error');
        } finally {
            button.disabled = false;
        }
    });

    // Import RU List
    document.getElementById('importRuList').addEventListener('click', async () => {
        const button = document.getElementById('importRuList');
        button.disabled = true;
        
        try {
            const response = await fetch('https://raw.githubusercontent.com/itdoginfo/allow-domains/main/Russia/outside-raw.lst');
            if (!response.ok) throw new Error('Network response was not ok');
            
            const text = await response.text();
            const domains = text.split('\n')
                              .map(domain => domain.trim())
                              .filter(Boolean);
            
            document.getElementById('domainList').value = domains.join('\n');
            showStatusBadge(button, `Imported ${domains.length} domains`);
        } catch (error) {
            console.error('Import error:', error);
            showStatusBadge(button, 'Import failed', 'error');
        } finally {
            button.disabled = false;
        }
    });

    // Import from file
    document.getElementById('importDomainList').addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.txt';
        
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = event => {
                const domains = event.target.result
                    .split('\n')
                    .map(domain => domain.trim())
                    .filter(Boolean);
                
                document.getElementById('domainList').value = domains.join('\n');
                showStatusBadge(document.getElementById('importDomainList'), 
                    `Imported ${domains.length} domains`);
            };
            
            reader.onerror = () => {
                showStatusBadge(document.getElementById('importDomainList'), 
                    'Failed to read file', 'error');
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    });

    // Export to file
    document.getElementById('exportDomainList').addEventListener('click', () => {
        const domains = document.getElementById('domainList').value;
        if (!domains.trim()) {
            showStatusBadge(document.getElementById('exportDomainList'), 
                'No domains to export', 'error');
            return;
        }
        
        const blob = new Blob([domains], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'domain-list.txt';
        a.click();
        URL.revokeObjectURL(url);
        
        const domainCount = domains.split('\n').filter(Boolean).length;
        showStatusBadge(document.getElementById('exportDomainList'), 
            `Exported ${domainCount} domains`);
    });

    // Функция установки состояния загрузки кнопки
    function setButtonLoading(button, isLoading) {
        button.disabled = isLoading;
        if (isLoading) {
            button.textContent = 'Saving...';
            button.style.opacity = '0.7';
        } else {
            button.textContent = 'Save Settings';
            button.style.opacity = '1';
        }
    }

    // Обработчики событий для radio кнопок
    document.querySelectorAll('input[name="proxyMode"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const domainListTextarea = document.querySelector('#domainList');
            if (this.value === 'proxyAll') {
                domainListTextarea.disabled = true;
                domainListTextarea.style.opacity = '0.5';
            } else {
                domainListTextarea.disabled = false;
                domainListTextarea.style.opacity = '1';
            }
        });
    });

    // Инициализация состояния текстового поля доменов
    const initialMode = document.querySelector('input[name="proxyMode"]:checked').value;
    const domainListTextarea = document.querySelector('#domainList');
    if (initialMode === 'proxyAll') {
        domainListTextarea.disabled = true;
        domainListTextarea.style.opacity = '0.5';
    }

    // Обработчик сохранения настроек
    document.querySelector('#saveSettings').addEventListener('click', async function() {
        const saveButton = this;
        setButtonLoading(saveButton, true);

        try {
            const mode = document.querySelector('input[name="proxyMode"]:checked').value;
            const domains = document.querySelector('#domainList').value.trim();
            const proxies = document.querySelector('#proxyList').value.trim();

            // Валидация списка прокси
            const proxyLines = proxies.split('\n').filter(line => line.trim());
            const validProxies = proxyLines.every(line => {
                const parts = line.split(':');
                const type = parts[0].toLowerCase();
                return parts.length === 2 ||
                    parts.length === 4 ||
                    (parts.length === 3 && (type === 'http' || type === 'socks5')) ||
                    (parts.length === 5 && (type === 'http' || type === 'socks5'));
            });

            if (!validProxies) {
                alert('Invalid proxy format! Please use one of:\nhost:port\nhost:port:username:password\ntype:host:port\ntype:host:port:username:password\n\n(type = http or socks5)');
                return;
            }

            // Получаем информацию о странах и типах для каждого прокси
            console.log('Getting proxy information...');
            const proxyInfoList = await Promise.all(proxyLines.map(async (proxyStr) => {
                const parts = proxyStr.split(':');
                const host = (parts.length === 5 || parts.length === 3) ? parts[1] : parts[0];
                
                console.log(`Checking proxy ${host}...`);
                
                const [countryInfo, proxyType] = await Promise.all([
                    getProxyCountryInfo(host),
                    determineProxyType(proxyStr)
                ]);

                return {
                    proxy: proxyStr,
                    countryInfo,
                    type: proxyType
                };
            }));

            // Сохраняем настройки
            localStorage.setItem('proxyMode', mode);
            localStorage.setItem('domainList', domains);
            localStorage.setItem('proxyList', proxies);
            localStorage.setItem('proxyInfoList', JSON.stringify(proxyInfoList));

            // Парсим и сохраняем текущий активный прокси
            if (proxyLines.length > 0) {
                const firstProxy = proxyLines[0];
                const parts = firstProxy.split(':');
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
                    'type': proxyInfoList[0].type,
                    'http_host': host,
                    'http_port': port,
                    ...(user && pass ? { 'auth': { 'enable': true, 'user': user, 'pass': pass } } : {})
                };
                localStorage.setItem('proxySetting', JSON.stringify(proxySetting));
            }

            // Проверяем, включен ли прокси
            chrome.proxy.settings.get({'incognito': false}, function(config) {
                if (config.value.mode === 'pac_script') {
                    onProxy();
                }
            });

            // Показываем уведомление об успехе
            showStatusBadge(saveButton, 'Settings saved successfully!');

        } catch (error) {
            console.error('Error saving settings:', error);
            showStatusBadge(saveButton, 'Error saving settings', 'error');
        } finally {
            setButtonLoading(saveButton, false);
        }
    });
});