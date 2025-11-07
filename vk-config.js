// VK Configuration
const VK_CONFIG = {
    APP_ID: 54305771,
    SECURE_KEY: 'REfGUI6IP8l756Ibw1qD',
    SERVICE_TOKEN: '6ada21246ada21246ada21244e69e682cf66ada6ada212403d408b13c0ec4b08a662583',
    API_VERSION: '5.199',
    
    // VK Pay (настроим позже)
    VK_PAY_MERCHANT_ID: '',
    VK_PAY_SECRET: '',
    
    // URLs
    REDIRECT_URI: 'https://your-domain.vercel.app/auth/vk',
    API_URL: 'https://api.vk.com/method/'
};

// Scopes для авторизации
const VK_SCOPES = [
    'friends',
    'photos', 
    'docs',
    'messages',
    'pay',
    'email',
    'offline'
];

// VK API Methods
const VK_METHODS = {
    USERS_GET: 'users.get',
    MESSAGES_SEND: 'messages.send',
    GROUPS_GET: 'groups.get',
    WALL_POST: 'wall.post'
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VK_CONFIG, VK_SCOPES, VK_METHODS };
} else {
    window.VK_CONFIG = VK_CONFIG;
    window.VK_SCOPES = VK_SCOPES;
    window.VK_METHODS = VK_METHODS;
}