const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// VK конфигурация
const VK_CONFIG = {
    APP_ID: 54305771,
    SECURE_KEY: 'REfGUI6IP8l756Ibw1qD',
    SERVICE_TOKEN: '6ada21246ada21246ada21244e69e682cf66ada6ada212403d408b13c0ec4b08a662583'
};

// База данных в памяти
const storage = {
    users: new Map(),
    tasks: [],
    deals: [],
    reviews: [],
    notifications: []
};

// VK API клиент
class VKAPI {
    constructor() {
        this.accessToken = VK_CONFIG.SERVICE_TOKEN;
        this.apiVersion = '5.199';
    }

    async call(method, params = {}) {
        try {
            const url = `https://api.vk.com/method/${method}?access_token=${this.accessToken}&v=${this.apiVersion}&${new URLSearchParams(params)}`;
            const response = await fetch(url);
            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('VK API Error:', error);
            throw error;
        }
    }

    async getUserInfo(userId) {
        return this.call('users.get', {
            user_ids: userId,
            fields: 'photo_200,first_name,last_name,sex,bdate,city'
        });
    }

    async sendMessage(userId, message) {
        return this.call('messages.send', {
            user_id: userId,
            message: message,
            random_id: Math.floor(Math.random() * 1000000)
        });
    }
}

const vkAPI = new VKAPI();

// Middleware аутентификации VK
const authenticateVK = async (req, res, next) => {
    try {
        const vkUserId = req.headers['x-vk-user-id'];
        const vkAccessToken = req.headers['x-vk-access-token'];
        
        if (!vkUserId || !vkAccessToken) {
            return res.status(401).json({ error: 'VK authentication required' });
        }

        let user = storage.users.get(vkUserId);
        
        if (!user) {
            // Получаем данные из VK API
            const vkUserInfo = await vkAPI.getUserInfo(vkUserId);
            if (vkUserInfo && vkUserInfo[0]) {
                user = {
                    id: vkUserId,
                    accessToken: vkAccessToken,
                    firstName: vkUserInfo[0].first_name,
                    lastName: vkUserInfo[0].last_name,
                    photo: vkUserInfo[0].photo_200,
                    balance: 0,
                    rating: 5.0,
                    completedTasks: 0,
                    createdAt: new Date()
                };
                storage.users.set(vkUserId, user);
            }
        }

        if (user) {
            req.user = user;
            next();
        } else {
            res.status(401).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error('Auth error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
};

// ==================== API ENDPOINTS ====================

// Получить текущего пользователя
app.get('/api/user', authenticateVK, (req, res) => {
    res.json({ success: true, user: req.user });
});

// Получить популярные задания
app.get('/api/tasks/popular', async (req, res) => {
    try {
        const popularTasks = storage.tasks
            .filter(task => task.status === 'active')
            .slice(0, 10)
            .map(task => ({
                ...task,
                client: storage.users.get(task.clientId),
                responsesCount: task.responses.length
            }));

        res.json({ success: true, tasks: popularTasks });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получить все задания
app.get('/api/tasks', async (req, res) => {
    try {
        const { category, search } = req.query;
        
        let tasks = storage.tasks.filter(task => task.status === 'active');
        
        if (category && category !== 'all') {
            tasks = tasks.filter(task => task.category === category);
        }
        
        if (search) {
            const searchLower = search.toLowerCase();
            tasks = tasks.filter(task => 
                task.title.toLowerCase().includes(searchLower) || 
                task.description.toLowerCase().includes(searchLower)
            );
        }

        const tasksWithUsers = tasks.map(task => ({
            ...task,
            client: storage.users.get(task.clientId),
            responsesCount: task.responses.length
        }));

        res.json({ success: true, tasks: tasksWithUsers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Создать задание
app.post('/api/tasks', authenticateVK, (req, res) => {
    try {
        const { title, description, price, category, safeDeal = true } = req.body;
        
        if (!title || !description || !price || !category) {
            return res.status(400).json({ error: 'Все поля обязательны' });
        }

        const newTask = {
            id: Date.now().toString(),
            title,
            description,
            price: parseInt(price),
            category,
            clientId: req.user.id,
            status: 'active',
            safeDeal,
            responses: [],
            files: [],
            createdAt: new Date(),
            views: 0
        };

        storage.tasks.push(newTask);

        res.json({
            success: true,
            task: {
                ...newTask,
                client: req.user,
                responsesCount: 0
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Откликнуться на задание
app.post('/api/tasks/:taskId/respond', authenticateVK, (req, res) => {
    try {
        const { taskId } = req.params;
        const { message, proposedPrice } = req.body;
        
        const task = storage.tasks.find(t => t.id === taskId);
        if (!task) {
            return res.status(404).json({ error: 'Задание не найдено' });
        }

        const response = {
            id: Date.now().toString(),
            freelancerId: req.user.id,
            message: message || 'Готов выполнить задание',
            proposedPrice: proposedPrice || task.price,
            createdAt: new Date()
        };

        task.responses.push(response);

        // Создаем уведомление для заказчика
        const notification = {
            id: Date.now().toString(),
            userId: task.clientId,
            type: 'new_response',
            title: 'Новый отклик',
            message: `${req.user.firstName} откликнулся на ваше задание "${task.title}"`,
            data: { taskId: task.id, freelancerId: req.user.id },
            read: false,
            createdAt: new Date()
        };
        storage.notifications.push(notification);

        res.json({
            success: true,
            response: response,
            message: 'Отклик отправлен'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Создать сделку
app.post('/api/deals', authenticateVK, (req, res) => {
    try {
        const { taskId, freelancerId } = req.body;
        
        const task = storage.tasks.find(t => t.id === taskId);
        if (!task) {
            return res.status(404).json({ error: 'Задание не найдено' });
        }

        if (task.clientId !== req.user.id) {
            return res.status(403).json({ error: 'Недостаточно прав' });
        }

        const freelancer = storage.users.get(freelancerId);
        if (!freelancer) {
            return res.status(404).json({ error: 'Исполнитель не найден' });
        }

        const deal = {
            id: Date.now().toString(),
            taskId,
            taskTitle: task.title,
            clientId: req.user.id,
            freelancerId,
            amount: task.price,
            status: 'in_progress',
            commission: 0.1,
            progress: 0,
            messages: [],
            files: [],
            deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // +7 дней
            createdAt: new Date()
        };

        storage.deals.push(deal);
        task.status = 'in_progress';

        // Уведомление для исполнителя
        const notification = {
            id: Date.now().toString(),
            userId: freelancerId,
            type: 'deal_started',
            title: 'Новая сделка',
            message: `Вы начали сотрудничество по заданию "${task.title}"`,
            data: { dealId: deal.id },
            read: false,
            createdAt: new Date()
        };
        storage.notifications.push(notification);

        res.json({
            success: true,
            deal: {
                ...deal,
                client: req.user,
                freelancer: freelancer
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получить сделки пользователя
app.get('/api/deals', authenticateVK, (req, res) => {
    try {
        const { status } = req.query;
        
        let deals = storage.deals.filter(deal => 
            deal.clientId === req.user.id || deal.freelancerId === req.user.id
        );
        
        if (status && status !== 'all') {
            deals = deals.filter(deal => deal.status === status);
        }

        const dealsWithUsers = deals.map(deal => ({
            ...deal,
            client: storage.users.get(deal.clientId),
            freelancer: storage.users.get(deal.freelancerId)
        }));

        res.json({ success: true, deals: dealsWithUsers });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Отправить сообщение в сделке
app.post('/api/deals/:dealId/messages', authenticateVK, (req, res) => {
    try {
        const { dealId } = req.params;
        const { message } = req.body;
        
        const deal = storage.deals.find(d => d.id === dealId);
        if (!deal) {
            return res.status(404).json({ error: 'Сделка не найдена' });
        }

        if (deal.clientId !== req.user.id && deal.freelancerId !== req.user.id) {
            return res.status(403).json({ error: 'Нет доступа к сделке' });
        }

        const newMessage = {
            id: Date.now().toString(),
            userId: req.user.id,
            message: message,
            createdAt: new Date(),
            read: false
        };

        if (!deal.messages) deal.messages = [];
        deal.messages.push(newMessage);

        // Уведомление другому участнику
        const otherUserId = req.user.id === deal.clientId ? deal.freelancerId : deal.clientId;
        const notification = {
            id: Date.now().toString(),
            userId: otherUserId,
            type: 'new_message',
            title: 'Новое сообщение',
            message: `Новое сообщение в сделке "${deal.taskTitle}"`,
            data: { dealId: deal.id },
            read: false,
            createdAt: new Date()
        };
        storage.notifications.push(notification);

        res.json({
            success: true,
            message: newMessage
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Завершить сделку
app.post('/api/deals/:dealId/complete', authenticateVK, (req, res) => {
    try {
        const { dealId } = req.params;
        
        const deal = storage.deals.find(d => d.id === dealId);
        if (!deal) {
            return res.status(404).json({ error: 'Сделка не найдена' });
        }

        if (deal.clientId !== req.user.id) {
            return res.status(403).json({ error: 'Только заказчик может завершить сделку' });
        }

        deal.status = 'completed';
        deal.completedAt = new Date();

        // Обновляем баланс исполнителя
        const freelancer = storage.users.get(deal.freelancerId);
        if (freelancer) {
            const freelancerAmount = deal.amount - (deal.amount * deal.commission);
            freelancer.balance += freelancerAmount;
            freelancer.completedTasks += 1;
        }

        // Обновляем задание
        const task = storage.tasks.find(t => t.id === deal.taskId);
        if (task) {
            task.status = 'completed';
        }

        res.json({
            success: true,
            message: 'Сделка завершена',
            deal: deal
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получить уведомления
app.get('/api/notifications', authenticateVK, (req, res) => {
    try {
        const userNotifications = storage.notifications
            .filter(notif => notif.userId === req.user.id)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({ success: true, notifications: userNotifications });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Получить статистику пользователя
app.get('/api/user/stats', authenticateVK, (req, res) => {
    try {
        const userDeals = storage.deals.filter(deal => 
            deal.clientId === req.user.id || deal.freelancerId === req.user.id
        );
        
        const completedDeals = userDeals.filter(deal => deal.status === 'completed').length;
        const activeDeals = userDeals.filter(deal => deal.status === 'in_progress').length;

        res.json({
            success: true,
            stats: {
                completedTasks: completedDeals,
                rating: req.user.rating,
                balance: req.user.balance,
                activeDeals: activeDeals
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Обслуживание фронтенда
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 WorkVK сервер запущен на порту ${PORT}`);
    console.log(`✅ VK интеграция активна`);
    console.log(`👉 Открой: http://localhost:${PORT}`);
});