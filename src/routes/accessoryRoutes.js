import express from 'express';
import Accessory from '../models/Accessory.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Tüm aksesuarları getir
router.get('/', async (req, res) => {
  try {
    const { category, status, search, page = 1, limit = 50 } = req.query;
    
    const filter = {};
    
    if (category && category !== 'all') {
      filter.category = category;
    }
    
    if (status && status !== 'all') {
      filter.status = status;
    }
    
    // Arama için regex kullan (daha esnek)
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i'); // case-insensitive
      filter.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { colors: { $in: [searchRegex] } }
      ];
    }
    
    const skip = (page - 1) * limit;
    
    const accessories = await Accessory.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
      
    const total = await Accessory.countDocuments(filter);
    
    res.json({
      accessories,
      total,
      pages: Math.ceil(total / limit),
      currentPage: parseInt(page)
    });
  } catch (error) {
    console.error('Aksesuarları getirme hatası:', error);
    res.status(500).json({ error: 'Aksesuarlar getirilirken hata oluştu' });
  }
});

// Kategorileri getir
router.get('/categories', async (req, res) => {
  try {
    const categories = await Accessory.distinct('category');
    res.json(categories);
  } catch (error) {
    console.error('Kategorileri getirme hatası:', error);
    res.status(500).json({ error: 'Kategoriler getirilirken hata oluştu' });
  }
});

// Tek aksesuar getir
router.get('/:id', async (req, res) => {
  try {
    const accessory = await Accessory.findById(req.params.id);
    if (!accessory) {
      return res.status(404).json({ error: 'Aksesuar bulunamadı' });
    }
    res.json(accessory);
  } catch (error) {
    console.error('Aksesuar getirme hatası:', error);
    res.status(500).json({ error: 'Aksesuar getirilirken hata oluştu' });
  }
});

// Yeni aksesuar oluştur (Admin only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, price, category, colors, image, stock } = req.body;
    
    const accessory = new Accessory({
      name,
      description,
      price,
      category,
      colors: colors || [],
      image: image || '',
      stock: stock || 0
    });
    
    await accessory.save();
    res.status(201).json(accessory);
  } catch (error) {
    console.error('Aksesuar oluşturma hatası:', error);
    res.status(400).json({ error: 'Aksesuar oluşturulurken hata oluştu', details: error.message });
  }
});

// Aksesuar güncelle (Admin only)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, price, category, colors, image, stock, status } = req.body;
    
    const accessory = await Accessory.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        price,
        category,
        colors: colors || [],
        image: image || '',
        stock: stock || 0,
        status: status || 'active'
      },
      { new: true, runValidators: true }
    );
    
    if (!accessory) {
      return res.status(404).json({ error: 'Aksesuar bulunamadı' });
    }
    
    res.json(accessory);
  } catch (error) {
    console.error('Aksesuar güncelleme hatası:', error);
    res.status(400).json({ error: 'Aksesuar güncellenirken hata oluştu', details: error.message });
  }
});

// Aksesuar sil (Admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const accessory = await Accessory.findByIdAndDelete(req.params.id);
    if (!accessory) {
      return res.status(404).json({ error: 'Aksesuar bulunamadı' });
    }
    res.json({ message: 'Aksesuar başarıyla silindi' });
  } catch (error) {
    console.error('Aksesuar silme hatası:', error);
    res.status(500).json({ error: 'Aksesuar silinirken hata oluştu' });
  }
});

// Aksesuar durumunu değiştir (Admin only)
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Geçersiz durum' });
    }
    
    const accessory = await Accessory.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!accessory) {
      return res.status(404).json({ error: 'Aksesuar bulunamadı' });
    }
    
    res.json(accessory);
  } catch (error) {
    console.error('Aksesuar durum değiştirme hatası:', error);
    res.status(500).json({ error: 'Aksesuar durumu değiştirilirken hata oluştu' });
  }
});

export default router;