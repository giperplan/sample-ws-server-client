# Используем официальный образ Node.js
FROM node:14

# Устанавливаем рабочую директорию в контейнере
WORKDIR /app

# Копируем package.json и package-lock.json в контейнер
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем исходный код сервера в контейнер
COPY . .

# Открываем порт, на котором будет работать WebSocket-сервер
EXPOSE 3001

# Запускаем WebSocket-сервер
CMD ["node", "server.js"]