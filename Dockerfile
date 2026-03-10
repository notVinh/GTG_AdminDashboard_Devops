# Bước 1: Build code
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Bước 2: Chạy với Nginx
FROM nginx:alpine
# Copy kết quả build vào thư mục của Nginx (thường là folder dist hoặc build)
COPY --from=build /app/dist /usr/share/nginx/html/admin
# Copy file config vừa tạo ở trên vào
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]