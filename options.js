document.addEventListener('DOMContentLoaded', function() {
    // Загружаем сохраненные настройки
    const proxyMode = localStorage.getItem('proxyMode') || 'proxyAll';
    const domainList = localStorage.getItem('domainList') || '';
    const proxyList = localStorage.getItem('proxyList') || '';

    // Устанавливаем значения
    document.querySelector(`#${proxyMode}`).checked = true;
    document.querySelector('#domainList').value = domainList;
    document.querySelector('#proxyList').value = proxyList;

    // Обработчик сохранения настроек
    document.querySelector('#saveSettings').addEventListener('click', function() {
        const mode = document.querySelector('input[name="proxyMode"]:checked').value;
        const domains = document.querySelector('#domainList').value.trim();
        const proxies = document.querySelector('#proxyList').value.trim();

        // Валидация списка прокси
        const proxyLines = proxies.split('\n').filter(line => line.trim());
        const validProxies = proxyLines.every(line => {
            const parts = line.split(':');
            return parts.length === 4;
        });

        if (!validProxies) {
            alert('Invalid proxy format! Please use: host:port:username:password');
            return;
        }

        localStorage.setItem('proxyMode', mode);
        localStorage.setItem('domainList', domains);
        localStorage.setItem('proxyList', proxies);

        // Парсим и сохраняем текущий активный прокси
        if (proxyLines.length > 0) {
            const [host, port, user, pass] = proxyLines[0].split(':');
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
            localStorage.setItem('currentProxyIndex', '0');
        }

        // Проверяем, включен ли прокси
        chrome.proxy.settings.get({'incognito': false}, function(config) {
            if (config.value.mode === 'pac_script') {
                // Если прокси включен, применяем новые настройки
                onProxy();
            }
        });

        // Уведомляем пользователя
        alert('Settings saved!');
    });
});