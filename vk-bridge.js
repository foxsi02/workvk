// VK Bridge Integration
class VKBridge {
    constructor() {
        this.bridge = null;
        this.user = null;
        this.launchParams = null;
    }

    async init() {
        try {
            if (window.vkBridge) {
                this.bridge = window.vkBridge;
                
                // Инициализация VK Bridge
                await this.bridge.send('VKWebAppInit');
                console.log('✅ VK Bridge инициализирован');
                
                // Получение параметров запуска
                this.launchParams = await this.bridge.send('VKWebAppGetLaunchParams');
                console.log('🚀 Launch params:', this.launchParams);
                
                return true;
            } else {
                console.log('⚠️ VK Bridge не доступен, работаем в браузерном режиме');
                return false;
            }
        } catch (error) {
            console.error('❌ VK Bridge init error:', error);
            return false;
        }
    }

    // Авторизация через VK
    async auth() {
        try {
            const auth = await this.bridge.send('VKWebAppAuth', {
                app_id: VK_CONFIG.APP_ID,
                scope: VK_SCOPES.join(',')
            });
            
            if (auth.access_token) {
                // Получаем информацию о пользователе
                this.user = await this.getUserInfo();
                return this.user;
            }
        } catch (error) {
            console.error('VK Auth error:', error);
            throw error;
        }
    }

    // Получение информации о пользователе
    async getUserInfo() {
        try {
            const userInfo = await this.bridge.send('VKWebAppGetUserInfo');
            return userInfo;
        } catch (error) {
            console.error('Get user info error:', error);
            throw error;
        }
    }

    // Открытие VK Pay
    async openPay(amount, description, data = {}) {
        try {
            const payment = await this.bridge.send('VKWebAppOpenPayForm', {
                app_id: VK_CONFIG.APP_ID,
                action: 'pay',
                params: {
                    amount: amount,
                    description: description,
                    data: JSON.stringify(data)
                }
            });
            
            return payment;
        } catch (error) {
            console.error('VK Pay error:', error);
            throw error;
        }
    }

    // Отправка сообщения
    async sendMessage(userId, message) {
        try {
            const result = await this.bridge.send('VKWebAppSendMessage', {
                peer_id: userId,
                message: message
            });
            
            return result;
        } catch (error) {
            console.error('Send message error:', error);
            throw error;
        }
    }

    // Поделиться приложением
    async shareApp() {
        try {
            await this.bridge.send('VKWebAppShare', {
                link: 'https://vk.com/app' + VK_CONFIG.APP_ID
            });
        } catch (error) {
            console.error('Share error:', error);
        }
    }

    // Показать уведомление
    async showNotification(text) {
        try {
            await this.bridge.send('VKWebAppShowNotification', {
                text: text
            });
        } catch (error) {
            console.error('Notification error:', error);
        }
    }

    // Закрыть приложение
    async closeApp() {
        try {
            await this.bridge.send('VKWebAppClose', {
                status: 'success'
            });
        } catch (error) {
            console.error('Close app error:', error);
        }
    }
}

// Создаем глобальный экземпляр
const vkBridge = new VKBridge();

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', async () => {
    const isVK = await vkBridge.init();
    
    if (isVK) {
        console.log('📱 Работаем внутри VK Mini App');
        document.body.classList.add('vk-environment');
    } else {
        console.log('🌐 Работаем в браузерном режиме');
        document.body.classList.add('browser-environment');
    }
});

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VKBridge, vkBridge };
} else {
    window.vkBridge = vkBridge;
}