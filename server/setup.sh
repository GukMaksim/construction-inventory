#!/bin/bash

# Установка зависимостей
npm install

# Генерация клиента Prisma
npx prisma generate

# Создание миграции
npx prisma migrate dev --name init

# Запуск Prisma Studio для просмотра данных
npx prisma studio
