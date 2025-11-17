# MAS Teknoloji Backend API

Node.js + Express + MongoDB backend API

## 🚀 Render'a Deploy

### 1. GitHub'a Push
```bash
git add .
git commit -m "Backend ready for deployment"
git push
```

### 2. Render.com'da Yeni Web Service

1. [Render Dashboard](https://dashboard.render.com/) → **New +** → **Web Service**
2. GitHub repo'nuzu bağlayın
3. Ayarları yapın:

**Basic Settings:**
- **Name:** `mas-teknoloji-backend`
- **Region:** `Frankfurt` (veya size yakın)
- **Branch:** `main`
- **Root Directory:** `backend`
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

**Environment Variables:**

Render dashboard'da **Environment** sekmesinden ekleyin:

```
MONGODB_URI=mongodb+srv://admin:admin@mas-stock-cluster.otehnsw.mongodb.net/?retryWrites=true&w=majority&appName=mas-stock-cluster
PORT=3001
NODE_ENV=production
JWT_SECRET=your-super-secret-jwt-key-here
ADMIN_EMAIL=admin@masteknoloji.com
ADMIN_PASSWORD=admin123
```

### 3. Deploy

**Deploy** butonuna tıklayın. İlk deploy 5-10 dakika sürebilir.

### 4. Backend URL'yi Alın

Deploy tamamlandıktan sonra:
```
https://mas-teknoloji-backend.onrender.com
```

Bu URL'yi frontend ve admin `.env` dosyalarında kullanın.

## 🔧 Local Development

```bash
npm install
npm run dev
```

Server: `http://localhost:3001`

## 📡 API Endpoints

### Public
- `GET /` - Health check
- `GET /api/products/public` - Tüm ürünler
- `GET /api/products/brands/list` - Markalar
- `GET /api/products/categories/list` - Kategoriler
- `GET /api/accessories` - Aksesuarlar

### Protected (JWT Required)
- `POST /api/auth/login` - Admin girişi
- `POST /api/products` - Ürün ekle
- `PUT /api/products/:id` - Ürün güncelle
- `DELETE /api/products/:id` - Ürün sil
- `POST /api/categories` - Kategori ekle
- `POST /api/accessories` - Aksesuar ekle

## 🔐 Admin Credentials

- **Email:** admin@masteknoloji.com
- **Password:** admin123

## 🗄️ Database

MongoDB Atlas kullanılıyor. Connection string `.env` dosyasında.

## 📝 Environment Variables

```env
MONGODB_URI=your_mongodb_connection_string
PORT=3001
NODE_ENV=development
JWT_SECRET=your_jwt_secret
ADMIN_EMAIL=admin@masteknoloji.com
ADMIN_PASSWORD=admin123
```

## 🐛 Troubleshooting

### MongoDB Connection Error
- MongoDB Atlas'ta IP whitelist kontrolü yapın
- `0.0.0.0/0` ekleyerek tüm IP'lere izin verin (production için)

### CORS Error
- Frontend URL'ini backend'de CORS ayarlarına ekleyin
- `backend/src/server.js` dosyasında `cors` ayarlarını kontrol edin

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3001 | xargs kill -9
```

## 📦 Dependencies

- **express** - Web framework
- **mongoose** - MongoDB ODM
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing
- **cors** - CORS middleware
- **dotenv** - Environment variables
- **multer** - File upload

## 🔄 Auto Deploy

Render otomatik olarak GitHub'a her push'ta deploy eder.

Manuel deploy için Render dashboard'dan **Manual Deploy** → **Deploy latest commit**
