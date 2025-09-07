# Dự Án Nền tảng học tập trực tuyến tương tác hỗ trợ học sinh THPT học Hình học và Vật lý qua mô phỏng trực quan

## Mô tả
Đây là dự án sử dụng React, TypeScript và Vite để xây dựng một ứng dụng web hiện đại.

## Cài đặt

### Bước 1: Cài đặt các thư viện
Chạy lệnh sau để cài đặt tất cả các thư viện cần thiết:

```bash
npm install
```

### Bước 2: Cấu hình môi trường
Tạo file `.env.local` trong thư mục gốc với nội dung sau:

```env
API_URL=http://localhost:5000
```

**Lưu ý**: Điều chỉnh `API_URL` tùy theo cấu hình backend của bạn.

## Chạy dự án

### Môi trường phát triển
Để chạy ứng dụng trong môi trường phát triển, sử dụng lệnh:

```bash
npm run dev
```

### Triển khai ứng dụng

#### Sử dụng Docker
Để xây dựng Docker image, chạy lệnh sau:

```bash
docker build -t geophy-fe .
```

Để chạy container, sử dụng lệnh:

```bash
docker run -p 80:80 geophy-fe
```

## Liên hệ
Nếu bạn có bất kỳ câu hỏi nào, hãy liên hệ với nhóm phát triển.
