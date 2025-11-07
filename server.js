const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: ['https://vk.com', 'https://vk.ru', 'https://workvk.onrender.com'],
    credentials: true
}));
app.use(express.json());
app.use(express.static(__dirname));

// База данных в памяти
const storage = {
    users: new Map(),
    tasks: [
        {
            id: '1',
            title: "Дизайн логотипа для кофейни",
            description: "Нужен современный логотип в синих тонах. Бренд: Coffee Morning. Требуется создать запоминающийся логотип который будет хорошо смотреться на вывеске и в социальных сетях.",
            price: 5000,
            category: "design",
            clientId: '1',
            status: 'active',
            safeDeal: true,
            responses: [
                {
                    id: '1',
                    freelancerId: '2',
                    message: "Здравствуйте! Я профессиональный дизайнер с опытом создания логотипов для HoReCa. Готова взяться за ваш проект.",
                    proposedPrice: 5000,
                    createdAt: new Date()
                }
            ],
            files: [],
            createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            views: 15
        },
        {
            id: '2',
            title: "Написать статью о технологиях",
            description: "Статья для блога IT компании. Тема: будущее искусственного интеллекта в веб-разработке. Объем: 3000-5000 знаков. Требуется глубокое погружение в тему.",
            price: 2000,
            category: "text",
            clientId: '1',
            status: 'active',
            safeDeal: true,
            responses: [
                {
                    id: '2',
                    freelancerId: '3',
                    message: "Пишу технические статьи более 3 лет. Имею опыт работы с IT компаниями. Готов выполнить в срок.",
                    proposedPrice: 2000,
                    createdAt: new Date()
                }
            ],
            files: [],
            createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
            views: 8
        },
        {
            id: '3',
            title: "Сверстать landing page",
            description: "Адаптивный лендинг для сервиса доставки еды. Есть готовый дизайн в Figma. Требуется чистая верстка без использования конструкторов.",
            price: 15000,
            category: "development",
            clientId: '1',
            status: 'active',
            safeDeal: true,
            responses: [],
            files: [],
            createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
            views: 12
        }
    ],
    deals: [
        {
            id: '1',
            taskId: '1',
            taskTitle: "Дизайн логотипа для кофейни",
            clientId: '1',
            freelancerId: '2',
            amount: 5000,
            status: 'in_progress',
            commission: 0.1,
            progress: 60,
            messages: [
                {
                    id: '1',
                    userId: '1',
                    message: "Здравствуйте! Какие сроки по логотипу?",
                    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
                    read: true
                },
                {
                    id: '2',
                    userId: '2',
                    message: "Добрый день! Первые варианты подготовлю завтра к 18:00",
                    createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
                    read: true
                }
            ],
            files: [],
            deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        }
    ],
    reviews: [],
    notifications: []
};

// Демо пользователи
storage.users.set('1', {
    id: '1',
    firstName: 'Иван',
    lastName: 'Петров',
    photo: 'https://via.placeholder.com/200/4f46e5/ffffff?text=IP',
    balance: 5000,
    rating: 4.8,
    completedTasks: 12,
    createdAt: new Date()
});

storage.users.set('2', {
    id: '2',
    firstName: 'Анна',
    lastName: 'Ковалева',
    photo: 'https://via.placeholder.com/200/10b981/ffffff?text=AK',
    balance: 12000,
    rating: 4.9,
    completedTasks: 24,
    createdAt: new Date()
});

storage.users.set('3', {
    id: '3',
    firstName: 'Максим',
    lastName: 'Орлов',
    photo: 'https://via.placeholder.com/200/f59e0b/ffffff?text=MO',
    balance: 8000,
    rating: 4.7,
    completedTasks: 18,
    createdAt: new Date()
});

// ==================== API ENDPOINTS ====================

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        success: true, 
        status: 'OK', 
        timestamp: new Date(),
        version: '1.0.0'
    });
});

// Получить текущего пользователя
app.get('/api/user', (req, res) => {
    const user = storage.users.get('1'); // Демо пользователь
    res.json({ 
        success: true, 
        user: user
    });
});

// Получить популярные задания
app.get('/api/tasks/popular', (req, res) => {
    try {
        const popularTasks = storage.tasks
            .filter(task => task.status === 'active')
            .slice(0, 6)
            .map(task => ({
                ...task,
                client: storage.users.get(task.clientId),
                responsesCount: task.responses.length
            }));

        res.json({ 
            success: true, 
            tasks: popularTasks 
        });
    } catch (error) {
        console.error('Error in /api/tasks/popular:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// Получить все задания
app.get('/api/tasks', (req, res) => {
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

        res.json({ 
            success: true, 
            tasks: tasksWithUsers 
        });
    } catch (error) {
        console.error('Error in /api/tasks:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// Создать задание
app.post('/api/tasks', (req, res) => {
    try {
        const { title, description, price, category, safeDeal = true } = req.body;
        
        if (!title || !description || !price || !category) {
            return res.status(400).json({ 
                success: false, 
                error: 'Все поля обязательны' 
            });
        }

        const newTask = {
            id: Date.now().toString(),
            title,
            description,
            price: parseInt(price),
            category,
            clientId: '1', // Демо пользователь
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
                client: storage.users.get('1'),
                responsesCount: 0
            }
        });
    } catch (error) {
        console.error('Error in POST /api/tasks:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// Откликнуться на задание
app.post('/api/tasks/:taskId/respond', (req, res) => {
    try {
        const { taskId } = req.params;
        const { message, proposedPrice } = req.body;
        
        const task = storage.tasks.find(t => t.id === taskId);
        if (!task) {
            return res.status(404).json({ 
                success: false, 
                error: 'Задание не найдено' 
            });
        }

        const response = {
            id: Date.now().toString(),
            freelancerId: '2', // Демо исполнитель
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
            message: `Анна Ковалева откликнулась на ваше задание "${task.title}"`,
            data: { taskId: task.id, freelancerId: '2' },
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
        console.error('Error in POST /api/tasks/respond:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// Получить сделки пользователя
app.get('/api/deals', (req, res) => {
    try {
        const userId = '1'; // Демо пользователь
        
        let deals = storage.deals.filter(deal => 
            deal.clientId === userId || deal.freelancerId === userId
        );

        const dealsWithUsers = deals.map(deal => ({
            ...deal,
            client: storage.users.get(deal.clientId),
            freelancer: storage.users.get(deal.freelancerId)
        }));

        res.json({ 
            success: true, 
            deals: dealsWithUsers 
        });
    } catch (error) {
        console.error('Error in /api/deals:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// Отправить сообщение в сделке
app.post('/api/deals/:dealId/messages', (req, res) => {
    try {
        const { dealId } = req.params;
        const { message } = req.body;
        
        const deal = storage.deals.find(d => d.id === dealId);
        if (!deal) {
            return res.status(404).json({ 
                success: false, 
                error: 'Сделка не найдена' 
            });
        }

        const newMessage = {
            id: Date.now().toString(),
            userId: '1', // Демо пользователь
            message: message,
            createdAt: new Date(),
            read: false
        };

        if (!deal.messages) deal.messages = [];
        deal.messages.push(newMessage);

        res.json({
            success: true,
            message: newMessage
        });
    } catch (error) {
        console.error('Error in POST /api/deals/messages:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// Завершить сделку
app.post('/api/deals/:dealId/complete', (req, res) => {
    try {
        const { dealId } = req.params;
        
        const deal = storage.deals.find(d => d.id === dealId);
        if (!deal) {
            return res.status(404).json({ 
                success: false, 
                error: 'Сделка не найдена' 
            });
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

        res.json({
            success: true,
            message: 'Сделка завершена',
            deal: deal
        });
    } catch (error) {
        console.error('Error in POST /api/deals/complete:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// Получить уведомления
app.get('/api/notifications', (req, res) => {
    try {
        const userId = '1'; // Демо пользователь
        const userNotifications = storage.notifications
            .filter(notif => notif.userId === userId)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({ 
            success: true, 
            notifications: userNotifications 
        });
    } catch (error) {
        console.error('Error in /api/notifications:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// Получить статистику пользователя
app.get('/api/user/stats', (req, res) => {
    try {
        const userId = '1'; // Демо пользователь
        const user = storage.users.get(userId);
        
        const userDeals = storage.deals.filter(deal => 
            deal.clientId === userId || deal.freelancerId === userId
        );
        
        const completedDeals = userDeals.filter(deal => deal.status === 'completed').length;
        const activeDeals = userDeals.filter(deal => deal.status === 'in_progress').length;

        res.json({
            success: true,
            stats: {
                completedTasks: completedDeals,
                rating: user.rating,
                balance: user.balance,
                activeDeals: activeDeals
            }
        });
    } catch (error) {
        console.error('Error in /api/user/stats:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Internal server error' 
        });
    }
});

// Обслуживание фронтенда
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Обработка ошибок
app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({ 
        success: false, 
        error: 'Internal server error' 
    });
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 WorkVK сервер запущен на порту ${PORT}`);
    console.log(`✅ API endpoints готовы к работе`);
    console.log(`👉 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📊 Всего заданий: ${storage.tasks.length}`);
    console.log(`👥 Всего пользователей: ${storage.users.size}`);
});