# crm-notifications-service

Микросервис уведомлений CRM: колокольчик в интерфейсе.
Слушает события системы («лид назначен», «задача создана»…), решает, кому создать уведомление, хранит их и отдаёт список.

- транспорт: **RabbitMQ**, очередь `notifications_queue` (`@nestjs/microservices`, `Transport.RMQ`); HTTP нет
- база: **`notifications_db`** (PostgreSQL, **TypeORM**)
- общается только с [crm-gateway](https://github.com/kolya-zalev/crm-gateway)
- контракты: [@crm/shared](https://github.com/kolya-zalev/crm-shared) (`messagesNotifications`, `eventsNotifications`, `NotificationsContract`, `NotificationsEvents`)

В другие сервисы сервис **не ходит**: всё, чего нет в его базе (например, список руководителей `leaderIds`), gateway кладёт прямо в сообщение.

## Как это работает

```
gateway ──send / emit──► notifications_queue ──► notifications-service ──► notifications_db
   ▲                                                     │
   └──────────── gateway_events_queue ◄── emit("notifications.created")
   └─► SSE в браузер
```

1. Gateway отправляет **события** (`emit`) — сервис создаёт уведомления.
2. После сохранения сервис отправляет `notifications.created` в `gateway_events_queue`, и gateway пушит уведомление в браузер по SSE.
3. Gateway отправляет **запросы** (`send`) — сервис отвечает списком уведомлений.

Пока сервис выключен, события **ждут в очереди** и обрабатываются после запуска.

## Входящие запросы (`send` → ответ)

| Сообщение | Payload | Ответ |
|---|---|---|
| `notifications.list` | `{ userId }` | `NotificationListDto` — последние 20 + `unreadCount` |
| `notifications.markAsRead` | `{ userId, id }` | `NotificationListDto` (404, если уведомление не найдено или чужое) |
| `notifications.markAllAsRead` | `{ userId }` | `NotificationListDto` |
| `notifications.deleteAll` | `{ userId }` | `NotificationListDto` |

## Входящие события (`emit`, без ответа)

| Событие | Кому создаётся уведомление |
|---|---|
| `lead.assigned` | назначенному; плюс руководителям, если назначал сотрудник без права `lead:assign` |
| `lead.closed` | руководителям |
| `lead.status-changed` | руководителям |
| `task.created` | руководителям |
| `task.deleted` | руководителям |

Себе уведомление не создаётся: автор действия (`actor.id`) исключается.
Руководители — это `leaderIds` из события (пользователи с правом `notification:lead-events`).

## Исходящие события

| Событие | Очередь | Зачем |
|---|---|---|
| `notifications.created` | `gateway_events_queue` | gateway отправляет уведомление пользователю по SSE |

Если отправить не удалось, уведомление всё равно сохранено: пользователь увидит его при следующей загрузке списка.

Ошибки (`NotFoundException`…) превращаются в RPC-ошибки со `statusCode` через `HttpToRpcExceptionFilter`, и gateway возвращает правильный HTTP-статус.

## Данные

`notifications` — `id` (uuid), `userId`, `type`, `message`, `leadId?`, `actorId?`, `actorName`, `isRead`, `createdAt`.
Индексы: `(userId, createdAt)`, `(userId, isRead)`.

`userId`, `leadId`, `actorId` — ссылки на данные других сервисов **только по id**, без внешних ключей.

## Структура

| Файл | Что делает |
|---|---|
| `src/main.ts` | запуск RMQ-consumer очереди `notifications_queue` |
| `src/notifications-service.module.ts` | TypeORM, RMQ-клиент для `gateway_events_queue`, контроллер, провайдеры |
| `src/notifications.controller.ts` | `@MessagePattern` (запросы) и `@EventPattern` (события) |
| `src/notifications.service.ts` | логика: кому что создать, список, прочтение, удаление |
| `src/gateway-events.client.ts` | отправка `notifications.created` в gateway |
| `src/notifications.entity.ts` | таблица `notifications` |
| `src/data-source.ts` | подключение к БД (для Nest и CLI миграций) |
| `src/migrations/` | миграции TypeORM |

## Переменные окружения

| Переменная | Пример |
|---|---|
| `NOTIFICATIONS_DATABASE_URL` | `postgresql://USER:PASSWORD@localhost:5432/notifications_db` |
| `RABBIT_URL` | `amqp://USER:PASSWORD@localhost:5672` |

## Локальный запуск

Нужны Postgres и RabbitMQ из [crm-infra](https://github.com/kolya-zalev/crm-infra):

```bash
cd ../crm-infra && docker compose up -d db rabbitmq && cd -
cp .env.example .env        # подставить логин/пароль
npm install
npm run migration:run
npm run start:dev
```

Проверка: RabbitMQ UI http://localhost:15672 → **Queues** → у `notifications_queue` **Consumers: 1**.

Ручной тест события: в UI открыть `notifications_queue` → **Publish message**:

```json
{"pattern":"lead.assigned","data":{"actor":{"id":"a1","name":"Test","role":"member","permissions":[]},"assignedId":"u1","assignedName":"Ivan","leadId":"l1","leadName":"Acme","leaderIds":["u2"]}}
```

## Миграции

```bash
npm run migration:generate -- src/migrations/<Имя>   # создать по изменениям entity (прочитать SQL перед run!)
npm run migration:run                                # применить
npm run migration:revert                             # откатить последнюю
```

`synchronize` выключен — схема меняется только миграциями.
`migration:generate` сравнивает entity с **текущей** базой: перед ним всегда `migration:run`.

## Docker

`Dockerfile` → `npm ci` → `nest build`.
`start.sh` → `typeorm migration:run -d dist/data-source.js` → `node dist/main`.

Запуск вместе с остальными — [crm-infra](https://github.com/kolya-zalev/crm-infra):

```bash
docker compose up -d --build notifications-service
docker logs crm-notifications-service
```
