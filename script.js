// WorkVK - Полностью рабочий код для VK
class WorkVK {
    constructor() {
        this.currentUser = null;
        this.tasks = [];
        this.deals = [];
        this.notifications = [];
        this.currentScreen = 'home';
        this.vkBridge = null;
        this.currentTask = null;
        this.currentDeal = null;
        
        this.init();
    }

    async init() {
        try {
            // Инициализация VK Bridge
            this.vkBridge = window.vkBridge;
            await this.vkBridge.send('VKWebAppInit');
            
            // Получаем параметры запуска
            const launchParams = await this.vkBridge.send('VKWebAppGetLaunchParams');
            console.log('🚀 VK Launch Params:', launchParams);
            
            // Авторизация и получение пользователя
            await this.authenticate();
            
            // Загрузка данных
            await this.loadData();
            
            // Настройка интерфейса
            this.setupEventListeners();
            this.renderCategories();
            
            console.log('✅ WorkVK инициализирован в VK');
            
        } catch (error) {
            console.error('❌ Ошибка инициализации:', error);
            this.showNotification('Ошибка загрузки приложения', 'error');
        }
    }

    async authenticate() {
        try {
            // Получаем информацию о пользователе VK
            const userInfo = await this.vkBridge.send('VKWebAppGetUserInfo');
            console.log('👤 VK User:', userInfo);
            
            // Получаем токен доступа
            const auth = await this.vkBridge.send('VKWebAppGetAuthToken', {
                app_id: 54305771,
                scope: 'friends,photos,docs,messages,pay'
            });
            
            // Сохраняем пользователя
            this.currentUser = {
                id: userInfo.id,
                accessToken: auth.access_token,
                firstName: userInfo.first_name,
                lastName: userInfo.last_name,
                photo: userInfo.photo_200
            };
            
            this.showUserInfo();
            this.showNotification(`Добро пожаловать, ${userInfo.first_name}! 🚀`);
            
        } catch (error) {
            console.error('Ошибка авторизации:', error);
            throw new Error('Не удалось авторизоваться в VK');
        }
    }

    async makeAPIRequest(url, options = {}) {
        try {
            const headers = {
                'Content-Type': 'application/json',
                'X-VK-User-ID': this.currentUser?.id,
                'X-VK-Access-Token': this.currentUser?.accessToken,
                ...options.headers
            };

            const response = await fetch(url, {
                ...options,
                headers
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Request error:', error);
            throw error;
        }
    }

    // ==================== СИСТЕМА ЭКРАНОВ ====================
    showScreen(screenName) {
        // Скрыть все экраны
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Скрыть все кнопки навигации
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Показать выбранный экран
        const targetScreen = document.getElementById(screenName + 'Screen');
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.currentScreen = screenName;
        }

        // Активировать кнопку навигации
        const targetNavBtn = document.querySelector(`.nav-btn[onclick="showScreen('${screenName}')"]`);
        if (targetNavBtn) {
            targetNavBtn.classList.add('active');
        }

        // Загрузить данные для экрана
        this.loadScreenData(screenName);
    }

    loadScreenData(screenName) {
        switch(screenName) {
            case 'home':
                this.loadHomeData();
                break;
            case 'tasks':
                this.loadTasksData();
                break;
            case 'profile':
                this.loadProfileData();
                break;
            case 'deals':
                this.loadDealsData();
                break;
            case 'notifications':
                this.loadNotificationsData();
                break;
            case 'create':
                this.updateTotalAmount();
                break;
        }
    }

    // ==================== ГЛАВНЫЙ ЭКРАН ====================
    async loadHomeData() {
        try {
            const data = await this.makeAPIRequest('/api/tasks/popular');
            this.renderTasks(data.tasks, 'tasksList');
            this.loadUserStats();
        } catch (error) {
            this.showNotification('Ошибка загрузки заданий', 'error');
        }
    }

    async loadUserStats() {
        try {
            const data = await this.makeAPIRequest('/api/user/stats');
            this.renderUserStats(data.stats);
        } catch (error) {
            console.error('Ошибка загрузки статистики:', error);
        }
    }

    renderUserStats(stats) {
        const statsContainer = document.querySelector('.hero-stats');
        if (!statsContainer) return;

        statsContainer.innerHTML = `
            <div class="stat">
                <div class="stat-number">${stats.activeDeals || 0}</div>
                <div class="stat-label">активных сделок</div>
            </div>
            <div class="stat">
                <div class="stat-number">${stats.completedTasks || 0}</div>
                <div class="stat-label">выполнено работ</div>
            </div>
            <div class="stat">
                <div class="stat-number">${stats.balance || 0}</div>
                <div class="stat-label">баланс (₽)</div>
            </div>
        `;
    }

    // ==================== СИСТЕМА ЗАДАНИЙ ====================
    async loadTasksData() {
        try {
            const data = await this.makeAPIRequest('/api/tasks');
            this.renderTasks(data.tasks, 'allTasksList');
        } catch (error) {
            this.showNotification('Ошибка загрузки заданий', 'error');
        }
    }

    renderTasks(tasks, containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        if (tasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <h3>Заданий пока нет</h3>
                    <p>Будьте первым, кто разместит задание!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = tasks.map(task => `
            <div class="task-card" onclick="workVK.showTaskDetails('${task.id}')">
                <div class="task-header">
                    <div class="task-title">${task.title}</div>
                    <div class="task-price">${task.price}₽</div>
                </div>
                <div class="task-description">${task.description}</div>
                <div class="task-meta">
                    <span class="task-category">${this.getCategoryName(task.category)}</span>
                    <span>${task.responsesCount || 0} откликов</span>
                </div>
                ${task.safeDeal ? '<div class="safe-deal-badge"><i class="fas fa-shield-alt"></i> Безопасная сделка</div>' : ''}
            </div>
        `).join('');
    }

    async showTaskDetails(taskId) {
        try {
            // Находим задание в списке
            this.currentTask = this.tasks.find(t => t.id === taskId) || 
                             (await this.makeAPIRequest(`/api/tasks`)).tasks.find(t => t.id === taskId);
            
            if (!this.currentTask) {
                this.showNotification('Задание не найдено', 'error');
                return;
            }

            this.showTaskModal(this.currentTask);
        } catch (error) {
            this.showNotification('Ошибка загрузки задания', 'error');
        }
    }

    showTaskModal(task) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${task.title}</h3>
                    <button class="btn btn-close" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                <div class="modal-body">
                    <div class="task-details">
                        <div class="detail-row">
                            <div class="detail-item">
                                <strong>Бюджет:</strong>
                                <span class="price">${task.price}₽</span>
                            </div>
                            <div class="detail-item">
                                <strong>Категория:</strong>
                                <span class="category-tag">${this.getCategoryName(task.category)}</span>
                            </div>
                        </div>
                        <div class="detail-item">
                            <strong>Заказчик:</strong>
                            <div class="user-info-small">
                                <img src="${task.client.photo}" alt="${task.client.firstName}" class="avatar-sm">
                                <span>${task.client.firstName} ${task.client.lastName}</span>
                            </div>
                        </div>
                        <div class="detail-item full-width">
                            <strong>Описание:</strong>
                            <p class="task-description">${task.description}</p>
                        </div>
                    </div>
                    
                    <div class="action-buttons">
                        <button class="btn btn-primary btn-large" onclick="workVK.respondToTask('${task.id}')">
                            <i class="fas fa-paper-plane"></i>Откликнуться на задание
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    async respondToTask(taskId) {
        try {
            const message = prompt('Напишите сообщение заказчику:');
            if (!message) return;

            await this.makeAPIRequest(`/api/tasks/${taskId}/respond`, {
                method: 'POST',
                body: JSON.stringify({
                    message: message,
                    proposedPrice: this.currentTask.price
                })
            });

            this.showNotification('Отклик отправлен заказчику! ✅');
            document.querySelector('.modal')?.remove();
        } catch (error) {
            this.showNotification('Ошибка отправки отклика', 'error');
        }
    }

    // ==================== СОЗДАНИЕ ЗАДАНИЯ ====================
    async createTask() {
        const title = document.getElementById('taskTitle').value;
        const description = document.getElementById('taskDescription').value;
        const price = parseInt(document.getElementById('taskPrice').value);
        const category = document.getElementById('taskCategory').value;
        const safeDeal = document.getElementById('safeDeal').checked;

        if (!title || !description || !price) {
            this.showNotification('Заполните все обязательные поля', 'error');
            return;
        }

        try {
            await this.makeAPIRequest('/api/tasks', {
                method: 'POST',
                body: JSON.stringify({
                    title,
                    description,
                    price,
                    category,
                    safeDeal
                })
            });

            this.showNotification('Задание успешно создано! 🎉');
            this.showScreen('home');
            this.resetCreateForm();
        } catch (error) {
            this.showNotification('Ошибка создания задания', 'error');
        }
    }

    resetCreateForm() {
        document.getElementById('taskTitle').value = '';
        document.getElementById('taskDescription').value = '';
        document.getElementById('taskPrice').value = '';
        document.getElementById('taskCategory').value = 'design';
        document.getElementById('safeDeal').checked = true;
    }

    updateTotalAmount() {
        const price = parseInt(document.getElementById('taskPrice').value) || 0;
        const commission = Math.floor(price * 0.1);
        const total = price + commission;
        
        const totalElement = document.getElementById('totalAmount');
        if (totalElement) {
            totalElement.textContent = total;
        }
    }

    // ==================== СИСТЕМА СДЕЛОК ====================
    async loadDealsData() {
        try {
            const data = await this.makeAPIRequest('/api/deals');
            this.deals = data.deals;
            this.renderDeals(this.deals);
        } catch (error) {
            this.showNotification('Ошибка загрузки сделок', 'error');
        }
    }

    renderDeals(deals) {
        const container = document.getElementById('dealsList');
        if (!container) return;

        if (deals.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-handshake"></i>
                    <h3>У вас пока нет сделок</h3>
                    <p>Найдите задание и начните сотрудничество!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = deals.map(deal => `
            <div class="task-card" onclick="workVK.showDealChat('${deal.id}')">
                <div class="task-header">
                    <div class="task-title">${deal.taskTitle}</div>
                    <div class="task-price">${deal.amount}₽</div>
                </div>
                <div class="task-meta">
                    <span>С ${deal.client.id === workVK.currentUser.id ? deal.freelancer.firstName : deal.client.firstName}</span>
                    <span class="deal-status ${deal.status}">${this.getDealStatusText(deal.status)}</span>
                </div>
                ${deal.status === 'in_progress' ? `
                    <div class="progress-section">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${deal.progress}%"></div>
                        </div>
                        <div class="progress-info">
                            <span>Выполнено: ${deal.progress}%</span>
                        </div>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    async showDealChat(dealId) {
        try {
            this.currentDeal = this.deals.find(d => d.id === dealId);
            if (!this.currentDeal) {
                this.showNotification('Сделка не найдена', 'error');
                return;
            }

            this.showDealChatModal(this.currentDeal);
        } catch (error) {
            this.showNotification('Ошибка загрузки сделки', 'error');
        }
    }

    showDealChatModal(deal) {
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content deal-chat-modal">
                <div class="modal-header">
                    <div class="deal-chat-header">
                        <button class="btn btn-back" onclick="this.closest('.modal').remove()">
                            <i class="fas fa-arrow-left"></i>
                        </button>
                        <div class="deal-info">
                            <h3>${deal.taskTitle}</h3>
                            <div class="deal-participants">
                                <span>Сделка с ${deal.client.id === this.currentUser.id ? deal.freelancer.firstName : deal.client.firstName}</span>
                                <span class="deal-status ${deal.status}">${this.getDealStatusText(deal.status)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="chat-container">
                    <div class="chat-messages" id="chatMessages">
                        ${(deal.messages || []).map(msg => `
                            <div class="message ${msg.userId === this.currentUser.id ? 'outgoing' : 'incoming'}">
                                <div class="message-content">
                                    <div class="message-text">${msg.message}</div>
                                    <div class="message-time">${this.formatTime(msg.createdAt)}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    
                    <div class="chat-input-container">
                        <div class="chat-input">
                            <input type="text" id="chatMessageInput" placeholder="Введите сообщение..." class="form-input">
                            <button class="btn btn-primary" onclick="workVK.sendMessage('${deal.id}')">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                        ${deal.status === 'in_progress' && deal.clientId === this.currentUser.id ? `
                            <div class="chat-actions">
                                <button class="btn btn-success" onclick="workVK.completeDeal('${deal.id}')">
                                    Завершить сделку
                                </button>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Прокрутка вниз
        setTimeout(() => {
            const messagesContainer = modal.querySelector('#chatMessages');
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        }, 100);
        
        // Отправка по Enter
        const input = modal.querySelector('#chatMessageInput');
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage(deal.id);
                }
            });
        }
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    async sendMessage(dealId) {
        const input = document.querySelector('#chatMessageInput');
        const message = input?.value.trim();
        
        if (!message) return;
        
        try {
            await this.makeAPIRequest(`/api/deals/${dealId}/messages`, {
                method: 'POST',
                body: JSON.stringify({ message })
            });
            
            input.value = '';
            // Обновляем чат
            this.showDealChat(dealId);
        } catch (error) {
            this.showNotification('Ошибка отправки сообщения', 'error');
        }
    }

    async completeDeal(dealId) {
        try {
            await this.makeAPIRequest(`/api/deals/${dealId}/complete`, {
                method: 'POST'
            });
            
            this.showNotification('Сделка завершена! Средства переведены исполнителю. ✅');
            document.querySelector('.modal')?.remove();
            this.loadDealsData();
        } catch (error) {
            this.showNotification('Ошибка завершения сделки', 'error');
        }
    }

    // ==================== ПРОФИЛЬ И УВЕДОМЛЕНИЯ ====================
    async loadProfileData() {
        try {
            const [statsData, tasksData] = await Promise.all([
                this.makeAPIRequest('/api/user/stats'),
                this.makeAPIRequest('/api/tasks')
            ]);
            
            this.renderProfileStats(statsData.stats);
            this.renderUserTasks(tasksData.tasks.filter(task => task.clientId === this.currentUser.id));
        } catch (error) {
            this.showNotification('Ошибка загрузки профиля', 'error');
        }
    }

    renderProfileStats(stats) {
        document.getElementById('completedTasks').textContent = stats.completedTasks || 0;
        document.getElementById('userRating').textContent = stats.rating || '5.0';
        document.getElementById('userBalance').textContent = `${stats.balance || 0}₽`;
    }

    renderUserTasks(tasks) {
        const container = document.getElementById('userTasksList');
        if (!container) return;

        if (tasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-tasks"></i>
                    <h3>У вас пока нет заданий</h3>
                    <p>Создайте первое задание и найдите исполнителя!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = tasks.map(task => `
            <div class="task-card">
                <div class="task-header">
                    <div class="task-title">${task.title}</div>
                    <div class="task-price">${task.price}₽</div>
                </div>
                <div class="task-description">${task.description}</div>
                <div class="task-meta">
                    <span class="task-category">${this.getCategoryName(task.category)}</span>
                    <span class="status-${task.status}">${this.getStatusText(task.status)}</span>
                </div>
                <div class="responses-count">
                    <i class="fas fa-users"></i> ${task.responsesCount || 0} откликов
                </div>
            </div>
        `).join('');
    }

    async loadNotificationsData() {
        try {
            const data = await this.makeAPIRequest('/api/notifications');
            this.notifications = data.notifications;
            this.renderNotifications();
        } catch (error) {
            this.showNotification('Ошибка загрузки уведомлений', 'error');
        }
    }

    renderNotifications() {
        const container = document.getElementById('notificationsList');
        if (!container) return;

        if (this.notifications.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bell-slash"></i>
                    <h3>Уведомлений нет</h3>
                    <p>Здесь будут появляться важные уведомления</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.notifications.map(notif => `
            <div class="notification-item ${notif.read ? 'read' : 'unread'}">
                <div class="notification-icon">
                    <i class="fas fa-bell"></i>
                </div>
                <div class="notification-content">
                    <div class="notification-title">${notif.title}</div>
                    <div class="notification-message">${notif.message}</div>
                    <div class="notification-time">${this.formatTime(notif.createdAt)}</div>
                </div>
            </div>
        `).join('');
    }

    // ==================== VK PAY ИНТЕГРАЦИЯ ====================
    async createVKPayment(amount, description, dealData = {}) {
        try {
            const payment = await this.vkBridge.send('VKWebAppOpenPayForm', {
                app_id: 54305771,
                action: 'pay',
                params: {
                    amount: amount,
                    description: description,
                    data: JSON.stringify(dealData)
                }
            });
            
            if (payment.success) {
                this.showNotification('Платеж успешно завершен! ✅');
                return true;
            } else {
                throw new Error('Payment failed');
            }
        } catch (error) {
            console.error('VK Pay error:', error);
            this.showNotification('Ошибка платежа', 'error');
            return false;
        }
    }

    // ==================== УТИЛИТЫ ====================
    showUserInfo() {
        const userInfo = document.getElementById('userInfo');
        const authSection = document.getElementById('authSection');
        
        if (this.currentUser && userInfo) {
            userInfo.style.display = 'flex';
            authSection.style.display = 'none';
            
            const avatar = userInfo.querySelector('img');
            const name = userInfo.querySelector('span');
            if (avatar) avatar.src = this.currentUser.photo;
            if (name) name.textContent = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
        }
    }

    setupEventListeners() {
        // Обработчики уже в HTML через onclick
        console.log('✅ Event listeners setup complete');
    }

    renderCategories() {
        const container = document.querySelector('.categories-grid');
        if (!container) return;
        
        const categories = this.getCategories();
        container.innerHTML = categories.map(cat => `
            <div class="category-card" onclick="workVK.filterCategory('${cat.id}')">
                <i class="${cat.icon}"></i>
                <span>${cat.name}</span>
            </div>
        `).join('');
    }

    getCategories() {
        return [
            { id: 'design', name: 'Дизайн', icon: 'fas fa-palette' },
            { id: 'development', name: 'Разработка', icon: 'fas fa-code' },
            { id: 'text', name: 'Тексты', icon: 'fas fa-pen' },
            { id: 'marketing', name: 'Маркетинг', icon: 'fas fa-chart-line' },
            { id: 'video', name: 'Видео', icon: 'fas fa-video' },
            { id: 'audio', name: 'Аудио', icon: 'fas fa-music' }
        ];
    }

    getCategoryName(category) {
        const categories = {
            'design': 'Дизайн',
            'development': 'Разработка', 
            'text': 'Тексты',
            'marketing': 'Маркетинг',
            'video': 'Видео',
            'audio': 'Аудио'
        };
        return categories[category] || category;
    }

    getDealStatusText(status) {
        const statuses = {
            'in_progress': 'В работе',
            'completed': 'Завершено',
            'disputed': 'Спор'
        };
        return statuses[status] || status;
    }

    getStatusText(status) {
        const statuses = {
            'active': 'Активно',
            'in_progress': 'В работе',
            'completed': 'Завершено'
        };
        return statuses[status] || status;
    }

    formatTime(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'только что';
        if (diffMins < 60) return `${diffMins} мин назад`;
        if (diffHours < 24) return `${diffHours} ч назад`;
        if (diffDays < 7) return `${diffDays} дн назад`;
        return date.toLocaleDateString('ru-RU');
    }

    async loadData() {
        try {
            await Promise.all([
                this.loadHomeData(),
                this.loadNotificationsData()
            ]);
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
        }
    }

    showNotification(message, type = 'success') {
        // Используем VK уведомления если доступны
        if (this.vkBridge) {
            this.vkBridge.send('VKWebAppShowNotification', {
                text: message
            }).catch(() => {
                // Fallback к alert
                alert(message);
            });
        } else {
            alert(message);
        }
    }

    filterCategory(category) {
        this.showNotification(`Фильтр: ${this.getCategoryName(category)}`);
        this.showScreen('tasks');
    }
}

// Глобальные функции для HTML
function showScreen(screenName) {
    if (window.workVK) {
        workVK.showScreen(screenName);
    }
}

function showTab(tabName) {
    // Реализация вкладок профиля
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
    
    document.querySelector(`.tab-btn[onclick="showTab('${tabName}')"]`).classList.add('active');
    document.getElementById(tabName + 'Tab').classList.add('active');
}

function createTask() {
    if (window.workVK) {
        workVK.createTask();
    }
}

function vkLogin() {
    // Уже авторизованы через VK
    if (window.workVK) {
        workVK.showNotification('Вы уже авторизованы через VK!');
    }
}

// Инициализация приложения
let workVK;
document.addEventListener('DOMContentLoaded', () => {
    workVK = new WorkVK();
    window.workVK = workVK;
});