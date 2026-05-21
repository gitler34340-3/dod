"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.achievements = exports.documents = exports.shifts = exports.users = exports.teams = void 0;
exports.teams = [
    { id: 'team-moscow-001', name: 'Dodo Pizza Тверская', city: 'Москва' },
];
exports.users = [
    {
        id: 'u-manager-1',
        email: 'gm.tverskaya@dodo.pizza',
        password: 'manager123',
        name: 'Ирина Кузнецова',
        role: 'manager',
        teamId: 'team-moscow-001',
        position: 'Главный менеджер',
    },
    {
        id: 'u-worker-2',
        email: 'kassir.anna@dodo.pizza',
        password: 'worker123',
        name: 'Анна Кассиер',
        role: 'worker',
        teamId: 'team-moscow-001',
        position: 'Кассир',
    },
];
exports.shifts = [
    {
        id: 'shift-1',
        teamId: 'team-moscow-001',
        userId: 'u-worker-1',
        start: '2026-02-20T09:00:00+03:00',
        end: '2026-02-20T17:00:00+03:00',
        role: 'Пиццамейкер',
        comment: 'Утренний прайм, упор на доставку',
        status: 'confirmed',
    },
    {
        id: 'shift-2',
        teamId: 'team-moscow-001',
        userId: 'u-worker-2',
        start: '2026-02-20T12:00:00+03:00',
        end: '2026-02-20T20:00:00+03:00',
        role: 'Кассир',
        comment: 'Дневная смена, высокий трафик в зале',
        status: 'confirmed',
    },
];
exports.documents = [
    {
        id: 'doc-1',
        teamId: 'team-moscow-001',
        title: 'Стандарты выкладки ингредиентов',
        content: 'Подробные стандарты выкладки ингредиентов на станции пиццамейкера.',
        createdByUserId: 'u-manager-1',
        createdAt: '2026-02-15T10:00:00+03:00',
    },
    {
        id: 'doc-2',
        teamId: 'team-moscow-001',
        title: 'Скрипты сервиса для кассиров',
        content: 'Актуальные скрипты приветствия, апсейла и работы с возражениями.',
        createdByUserId: 'u-manager-1',
        createdAt: '2026-02-16T14:30:00+03:00',
    },
];
exports.achievements = [];
//# sourceMappingURL=seed.js.map