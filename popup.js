document.addEventListener('DOMContentLoaded', function() {
    const toggleButton = document.getElementById('toggleProxy');
    const proxySelect = document.getElementById('proxySelect');
    const settingsButton = document.getElementById('openSettings');
    
    // Загружаем список прокси
    const proxyList = localStorage.getItem('proxyList') || '';
    const proxies = proxyList.split('\n').filter(line => line.trim());
    const currentProxyIndex = localStorage.getItem('currentProxyIndex') || '0';

    // Заполняем выпадающий список
    proxies.forEach((proxy, index) => {
        const [host, port] = proxy.split(':');
        const option = document.createElement('option');
        option.value = index;
        option.textContent = `${host}:${port}`;
        option.selected = index.toString() === currentProxyIndex;
        proxySelect.appendChild(option);
    });

    // Проверяем текущее состояние прокси
    chrome.proxy.settings.get({'incognito': false}, function(config) {
        try {
            const isEnabled = config.value.mode === 'pac_script' || config.value.mode === 'fixed_servers';
            updateButtonState(isEnabled);
            setIcon(isEnabled ? 'on' : 'off');
        } catch (error) {
            console.error('Error checking proxy state:', error);
            updateButtonState(false);
            setIcon('off');
        }
    });

    // Обработчик открытия настроек
    settingsButton.addEventListener('click', function() {
        chrome.runtime.openOptionsPage();
        window.close(); // Закрываем popup после открытия настроек
    });

    // Обработчик изменения прокси
    proxySelect.addEventListener('change', function() {
        const selectedIndex = this.value;
        const selectedProxy = proxies[selectedIndex];
        const [host, port, user, pass] = selectedProxy.split(':');
        
        // Сохраняем выбранный прокси
        const proxySetting = {
            'http_host': host,
            'http_port': port,
            'auth': {
                'enable': true,
                'user': user,
                'pass': pass
            }
        };
        localStorage.setItem('proxySetting', JSON.stringify(proxySetting));
        localStorage.setItem('currentProxyIndex', selectedIndex);

        // Если прокси включен, применяем новые настройки
        chrome.proxy.settings.get({'incognito': false}, function(config) {
            if (config.value.mode === 'pac_script') {
                onProxy();
            }
        });
    });

    // Обработчик включения/выключения прокси
    toggleButton.addEventListener('click', function() {
        try {
            const isEnabled = toggleButton.classList.contains('enabled');
            
            if (isEnabled) {
                offProxy();
                setIcon('off');
                updateButtonState(false);
            } else {
                const proxy = onProxy();
                if (proxy) {
                    setIcon('on');
                    updateButtonState(true);
                }
            }
        } catch (error) {
            console.error('Error toggling proxy:', error);
        }
    });

    function updateButtonState(isEnabled) {
        toggleButton.textContent = isEnabled ? 'ON' : 'OFF';
        toggleButton.className = isEnabled ? 'enabled' : 'disabled';
    }
});