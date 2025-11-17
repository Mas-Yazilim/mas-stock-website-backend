import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import Admin from '../models/Admin.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Giriş yapma
router.post('/login', [
  body('email').isEmail().normalizeEmail().withMessage('Geçerli bir email adresi giriniz'),
  body('password').isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalıdır')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Geçersiz veri',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Admin kullanıcısını bul
    const admin = await Admin.findOne({ email, isActive: true });
    if (!admin) {
      return res.status(401).json({ 
        message: 'Geçersiz email veya şifre' 
      });
    }

    // Şifreyi kontrol et
    const isPasswordValid = await admin.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Geçersiz email veya şifre' 
      });
    }

    // JWT token oluştur
    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Son giriş zamanını güncelle
    admin.lastLogin = new Date();
    await admin.save();

    res.json({
      message: 'Giriş başarılı',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      message: 'Giriş sırasında bir hata oluştu' 
    });
  }
});

// Mevcut kullanıcı bilgilerini getir
router.get('/me', authenticateToken, async (req, res) => {
  try {
    res.json({
      message: 'Kullanıcı bilgileri',
      admin: req.admin
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      message: 'Kullanıcı bilgileri alınamadı' 
    });
  }
});

// Çıkış yapma (token'ı geçersiz kılma)
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Frontend'te token'ı silmek yeterli
    res.json({ 
      message: 'Çıkış başarılı' 
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ 
      message: 'Çıkış sırasında bir hata oluştu' 
    });
  }
});

// İlk admin oluşturma (sadece hiç admin yoksa)
router.post('/init-admin', [
  body('name').notEmpty().trim().withMessage('İsim gereklidir'),
  body('email').isEmail().normalizeEmail().withMessage('Geçerli bir email adresi giriniz'),
  body('password').isLength({ min: 6 }).withMessage('Şifre en az 6 karakter olmalıdır')
], async (req, res) => {
  try {
    // Zaten admin var mı kontrol et
    const existingAdmin = await Admin.findOne();
    if (existingAdmin) {
      return res.status(400).json({ 
        message: 'Sistem zaten yapılandırılmış' 
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Geçersiz veri',
        errors: errors.array()
      });
    }

    const { name, email, password } = req.body;

    const admin = new Admin({
      name,
      email,
      password,
      role: 'super_admin'
    });

    await admin.save();

    res.status(201).json({
      message: 'İlk admin oluşturuldu',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role
      }
    });

  } catch (error) {
    console.error('Init admin error:', error);
    res.status(500).json({ 
      message: 'Admin oluşturulurken bir hata oluştu' 
    });
  }
});

export default router;
