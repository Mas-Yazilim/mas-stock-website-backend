import express from 'express';
import { body, validationResult, query } from 'express-validator';
import Product from '../models/Product.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Tüm ürünleri getir (frontend için)
router.get('/public', async (req, res) => {
  try {
    const { category, brand, search } = req.query;
    
    let filter = { isActive: true };
    
    if (category) {
      filter.category = new RegExp(category, 'i');
    }
    
    if (brand) {
      filter.brand = new RegExp(brand, 'i');
    }
    
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { brand: new RegExp(search, 'i') },
        { model: new RegExp(search, 'i') }
      ];
    }

    const products = await Product.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json({
      message: 'Ürünler başarıyla getirildi',
      products,
      count: products.length
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ 
      message: 'Ürünler getirilemedi' 
    });
  }
});

// Admin: Tüm ürünleri getir
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const { category, brand, search, isActive } = req.query;
    
    let filter = {};
    
    if (category) {
      filter.category = new RegExp(category, 'i');
    }
    
    if (brand) {
      filter.brand = new RegExp(brand, 'i');
    }
    
    if (search) {
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { brand: new RegExp(search, 'i') },
        { model: new RegExp(search, 'i') }
      ];
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    const products = await Product.find(filter)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(filter);

    res.json({
      message: 'Ürünler başarıyla getirildi',
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ 
      message: 'Ürünler getirilemedi' 
    });
  }
});

// Markaları getir (MUST BE BEFORE /:id route)
router.get('/brands/list', async (req, res) => {
  try {
    const brands = await Product.distinct('brand', { isActive: true });

    res.json({
      message: 'Markalar başarıyla getirildi',
      brands: brands.sort()
    });

  } catch (error) {
    console.error('Get brands error:', error);
    res.status(500).json({
      message: 'Markalar getirilemedi'
    });
  }
});

// Kategorileri getir (MUST BE BEFORE /:id route)
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true });

    res.json({
      message: 'Kategoriler başarıyla getirildi',
      categories: categories.sort()
    });

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      message: 'Kategoriler getirilemedi'
    });
  }
});

// Model'leri getir (MUST BE BEFORE /:id route)
router.get('/models/list', async (req, res) => {
  try {
    const { brand } = req.query;
    const filter = { isActive: true };
    if (brand) filter.brand = new RegExp(brand, 'i');

    const models = await Product.distinct('model', filter);
    res.json({
      message: 'Modeller başarıyla getirildi',
      models: models.sort(),
    });
  } catch (error) {
    console.error('Get models error:', error);
    res.status(500).json({ message: 'Modeller getirilemedi' });
  }
});

// Depolamaları getir (MUST BE BEFORE /:id route)
router.get('/storages/list', async (req, res) => {
  try {
    const { brand, model } = req.query;
    const filter = { isActive: true };
    if (brand) filter.brand = new RegExp(brand, 'i');
    if (model) filter.model = new RegExp(model, 'i');

    const storages = await Product.distinct('storage', filter);
    res.json({
      message: 'Depolamalar başarıyla getirildi',
      storages: storages.sort(),
    });
  } catch (error) {
    console.error('Get storages error:', error);
    res.status(500).json({ message: 'Depolamalar getirilemedi' });
  }
});

// Tek ürün getir
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!product) {
      return res.status(404).json({
        message: 'Ürün bulunamadı'
      });
    }

    res.json({
      message: 'Ürün başarıyla getirildi',
      product
    });

  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      message: 'Ürün getirilemedi'
    });
  }
});

// Yeni ürün oluştur
router.post('/', authenticateToken, [
  body('name').notEmpty().trim().withMessage('Ürün adı gereklidir'),
  body('brand').notEmpty().trim().withMessage('Marka adı gereklidir'),
  body('model').notEmpty().trim().withMessage('Model adı gereklidir'),
  body('storage').notEmpty().trim().withMessage('Depolama bilgisi gereklidir'),
  body('category').notEmpty().trim().withMessage('Kategori gereklidir'),
  body('colors').isArray({ min: 1 }).withMessage('En az bir renk seçeneği gereklidir'),
  body('colors.*.name').notEmpty().trim().withMessage('Renk adı gereklidir'),
  body('colors.*.hex').matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Geçerli hex renk kodu giriniz'),
  body('accessories').optional().isArray().withMessage('Aksesuarlar dizi formatında olmalıdır'),
  body('accessories.*.name').optional().notEmpty().trim().withMessage('Aksesuar adı gereklidir'),
  body('accessories.*.price').optional().isNumeric().withMessage('Aksesuar fiyatı sayısal olmalıdır'),
  body('cashPrice').isNumeric().withMessage('Nakit fiyat sayısal olmalıdır'),
  body('visaPrice').isNumeric().withMessage('Visa fiyat sayısal olmalıdır'),
  body('installmentOptions').optional().isArray().withMessage('Taksit seçenekleri dizi formatında olmalıdır')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Geçersiz veri',
        errors: errors.array()
      });
    }

    const productData = {
      ...req.body,
      createdBy: req.admin._id
    };

    console.log('📦 Creating product with data:', {
      name: productData.name,
      installmentOptions: productData.installmentOptions
    });

    const product = new Product(productData);
    await product.save();

    console.log('✅ Product saved with installmentOptions:', product.installmentOptions);

    await product.populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Ürün başarıyla oluşturuldu',
      product
    });

  } catch (error) {
    console.error('Create product error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Bu ürün adı zaten kullanılıyor' 
      });
    }
    
    res.status(500).json({ 
      message: 'Ürün oluşturulamadı' 
    });
  }
});

// Ürün güncelle
router.put('/:id', authenticateToken, [
  body('name').optional().notEmpty().trim().withMessage('Ürün adı boş olamaz'),
  body('brand').optional().notEmpty().trim().withMessage('Marka adı boş olamaz'),
  body('model').optional().notEmpty().trim().withMessage('Model adı boş olamaz'),
  body('storage').optional().notEmpty().trim().withMessage('Depolama bilgisi boş olamaz'),
  body('category').optional().notEmpty().trim().withMessage('Kategori boş olamaz'),
  body('colors').optional().isArray({ min: 1 }).withMessage('En az bir renk seçeneği gereklidir'),
  body('colors.*.name').optional().notEmpty().trim().withMessage('Renk adı gereklidir'),
  body('colors.*.hex').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Geçerli hex renk kodu giriniz'),
  body('accessories').optional().isArray().withMessage('Aksesuarlar dizi formatında olmalıdır'),
  body('accessories.*.name').optional().notEmpty().trim().withMessage('Aksesuar adı gereklidir'),
  body('accessories.*.price').optional().isNumeric().withMessage('Aksesuar fiyatı sayısal olmalıdır'),
  body('cashPrice').optional().isNumeric().withMessage('Nakit fiyat sayısal olmalıdır'),
  body('visaPrice').optional().isNumeric().withMessage('Visa fiyat sayısal olmalıdır'),
  body('installmentOptions').optional().isArray().withMessage('Taksit seçenekleri dizi formatında olmalıdır')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Geçersiz veri',
        errors: errors.array()
      });
    }

    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        message: 'Ürün bulunamadı' 
      });
    }

    // Ürünü güncelle
    console.log('📝 Updating product with installmentOptions:', req.body.installmentOptions);
    Object.assign(product, req.body);
    await product.save();
    console.log('✅ Product updated with installmentOptions:', product.installmentOptions);

    await product.populate('createdBy', 'name email');

    res.json({
      message: 'Ürün başarıyla güncellendi',
      product
    });

  } catch (error) {
    console.error('Update product error:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Bu ürün adı zaten kullanılıyor' 
      });
    }
    
    res.status(500).json({ 
      message: 'Ürün güncellenemedi' 
    });
  }
});

// Ürün sil (varsayılan: soft delete -> isActive = false)
// Desteklenen query parametreleri:
// - hard=true : kalıcı silme (remove from DB)
// - toggle=true : aktiflik durumunu tersine çevir (aktif <-> pasif)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { hard, toggle } = req.query;

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    // Kalıcı silme isteniyorsa
    if (String(hard) === 'true') {
      await Product.findByIdAndDelete(req.params.id);
      return res.json({ message: 'Ürün kalıcı olarak silindi' });
    }

    // Toggle modu: aktiflik durumunu tersine çevir
    if (String(toggle) === 'true') {
      product.isActive = !product.isActive;
      await product.save();
      await product.populate('createdBy', 'name email');
      return res.json({ message: 'Ürün durumu güncellendi', product });
    }

    // Default: soft delete (isActive = false)
    product.isActive = false;
    await product.save();
    await product.populate('createdBy', 'name email');

    res.json({ message: 'Ürün başarıyla pasif duruma getirildi', product });

  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Ürün silinemedi' });
  }
});

// Ürünü geri yükle
router.patch('/:id/restore', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ 
        message: 'Ürün bulunamadı' 
      });
    }

    product.isActive = true;
    await product.save();

    await product.populate('createdBy', 'name email');

    res.json({
      message: 'Ürün başarıyla geri yüklendi',
      product
    });

  } catch (error) {
    console.error('Restore product error:', error);
    res.status(500).json({ 
      message: 'Ürün geri yüklenemedi' 
    });
  }
});

// Ürüne aksesuar ekle
router.post('/:id/accessories', authenticateToken, [
  body('name').notEmpty().trim().withMessage('Aksesuar adı gereklidir'),
  body('price').isNumeric().withMessage('Aksesuar fiyatı sayısal olmalıdır'),
  body('description').optional().trim(),
  body('available').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Geçersiz veri',
        errors: errors.array()
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    const newAccessory = {
      name: req.body.name,
      description: req.body.description || '',
      price: req.body.price,
      available: req.body.available !== undefined ? req.body.available : true
    };

    product.accessories.push(newAccessory);
    await product.save();
    await product.populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Aksesuar başarıyla eklendi',
      product,
      accessory: newAccessory
    });

  } catch (error) {
    console.error('Add accessory error:', error);
    res.status(500).json({ message: 'Aksesuar eklenirken bir hata oluştu' });
  }
});

// Üründen aksesuar güncelle
router.put('/:id/accessories/:accessoryIndex', authenticateToken, [
  body('name').optional().notEmpty().trim().withMessage('Aksesuar adı boş olamaz'),
  body('price').optional().isNumeric().withMessage('Aksesuar fiyatı sayısal olmalıdır'),
  body('description').optional().trim(),
  body('available').optional().isBoolean()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Geçersiz veri',
        errors: errors.array()
      });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    const accessoryIndex = parseInt(req.params.accessoryIndex);
    if (accessoryIndex < 0 || accessoryIndex >= product.accessories.length) {
      return res.status(404).json({ message: 'Aksesuar bulunamadı' });
    }

    // Aksesuar güncelle
    if (req.body.name !== undefined) product.accessories[accessoryIndex].name = req.body.name;
    if (req.body.description !== undefined) product.accessories[accessoryIndex].description = req.body.description;
    if (req.body.price !== undefined) product.accessories[accessoryIndex].price = req.body.price;
    if (req.body.available !== undefined) product.accessories[accessoryIndex].available = req.body.available;

    await product.save();
    await product.populate('createdBy', 'name email');

    res.json({
      message: 'Aksesuar başarıyla güncellendi',
      product,
      accessory: product.accessories[accessoryIndex]
    });

  } catch (error) {
    console.error('Update accessory error:', error);
    res.status(500).json({ message: 'Aksesuar güncellenirken bir hata oluştu' });
  }
});

// Üründen aksesuar sil
router.delete('/:id/accessories/:accessoryIndex', authenticateToken, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Ürün bulunamadı' });
    }

    const accessoryIndex = parseInt(req.params.accessoryIndex);
    if (accessoryIndex < 0 || accessoryIndex >= product.accessories.length) {
      return res.status(404).json({ message: 'Aksesuar bulunamadı' });
    }

    product.accessories.splice(accessoryIndex, 1);
    await product.save();
    await product.populate('createdBy', 'name email');

    res.json({
      message: 'Aksesuar başarıyla silindi',
      product
    });

  } catch (error) {
    console.error('Delete accessory error:', error);
    res.status(500).json({ message: 'Aksesuar silinirken bir hata oluştu' });
  }
});

export default router;
