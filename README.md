# Дело рядом

Full-stack приложение для поиска исполнителей бытовых задач. Заказчик публикует заявку, исполнитель откликается, а участники ведут переписку и отслеживают выполнение работы.

Проект для портфолио: демонстрирует интерфейс на React, REST API на Django и отдельный WebSocket-сервис на FastAPI. Это локальный прототип, а не запущенная коммерческая площадка.

## Возможности

- Регистрация, JWT-аутентификация и роли заказчика и исполнителя.
- Каталог заявок с поиском и фильтрами по категориям и статусам.
- Создание заявки с ценой, адресом и выбором точки на карте.
- Отклики исполнителей и выбор исполнителя заказчиком.
- Профили, отзывы и оценки.
- Переписка по заявке через WebSocket и сохранение сообщений через REST API.
- Этапы расширенных заказов, сроки и гарантийные обращения.

## Технологии и устройство

| Часть | Стек | Каталог |
| --- | --- | --- |
| Интерфейс | React 18, Vite, React Router, Zustand, Axios, Framer Motion | `frontend/` |
| REST API | Python 3.11, Django 4.2, Django REST Framework, Simple JWT | `backend/` |
| Чат | FastAPI, Uvicorn, WebSocket, HTTPX | `fastapi_service/` |
| Данные | PostgreSQL 15 | Docker volume `postgres_data` |
| Окружение | Docker Compose, Nginx | `docker-compose.yml`, `nginx/` |

Браузер обращается к Django за пользователями, заявками и сообщениями. FastAPI принимает WebSocket-соединения и передаёт сообщения в Django. Nginx объединяет доступ к сервисам.

## Локальный запуск

Нужны Docker с работающим Docker Compose.

1. Скопируйте `.env.example` в `.env`:

   ```powershell
   Copy-Item .env.example .env
   ```

   На Linux/macOS: `cp .env.example .env`.

2. Замените `POSTGRES_PASSWORD` и `SECRET_KEY` в `.env` собственными значениями. Для генерации ключа можно использовать Python:

   ```sh
   python -c "import secrets; print(secrets.token_urlsafe(48))"
   ```

3. Запустите сервисы:

   ```sh
   docker compose up --build
   ```

4. Откройте [приложение](http://localhost:5173) или [вход через Nginx](http://localhost). Django API: `http://localhost:8000/api/`, FastAPI: `http://localhost:8001`.

Миграции применяются при запуске backend. Пользователи и демонстрационные заказы автоматически не создаются.

### Демонстрационные данные

Для локального просмотра можно явно загрузить синтетические профили, заказы, этапы и переписку. Скрипт создаёт и демонстрационного администратора, поэтому запускайте его только в отдельной локальной базе.

В PowerShell задайте отдельный пароль для демо-аккаунтов и выполните:

```powershell
$env:DEMO_PASSWORD = Read-Host 'Пароль для локальных демо-аккаунтов'
docker compose exec -e DEMO_PASSWORD=$env:DEMO_PASSWORD backend python init_db.py
Remove-Item Env:DEMO_PASSWORD
```

Примеры логинов: `maria_customer` (заказчик), `ivan_santehnik` (исполнитель), `admin` (администратор). Пароль задаётся вами через `DEMO_PASSWORD` и в репозитории не хранится. Почта использует домен `example.com`, номера телефонов пустые, адреса обозначены как демонстрационные.

### Карта

Для карты заявок нужен ключ Yandex Maps. В `docker-compose.yml` в `frontend.environment` добавьте `VITE_YANDEX_MAPS_API_KEY` со своим браузерным ключом и пересоздайте frontend. При запуске Vite вне Docker можно использовать `frontend/.env` по образцу `frontend/.env.example`. Браузерный ключ виден посетителям: ограничьте его разрешёнными доменами в кабинете провайдера.

## Проверка

```sh
# Backend: внутри запущенного Compose
docker compose exec backend python manage.py check
docker compose exec backend python manage.py makemigrations --check --dry-run

# Frontend: Node.js 20+ и pnpm
cd frontend
pnpm install --frozen-lockfile
pnpm run build
```

## Границы прототипа

Окружение предназначено для локальной демонстрации. Используются Django development server, Vite dev server, DEBUG и упрощённая CORS-конфигурация. Чат и API требуют дополнительной проверки прав доступа перед работой с реальными пользователями; WebSocket передаёт токен в URL. Перед внешним развёртыванием нужны доработка авторизации чатов, TLS, ограничение CORS/ALLOWED_HOSTS, обновление и аудит зависимостей и тесты доступа. Контактные и юридические страницы — демонстрационные макеты.

## Состав публичной версии

Опубликованы исходники, миграции, Docker-конфигурация и шаблоны переменных окружения. Локальный `.env`, настоящие учётные данные, базы и дампы, загруженные файлы, настройки IDE, кэши и старая история Git не включены. Эта версия начинается с отдельного чистого коммита.
