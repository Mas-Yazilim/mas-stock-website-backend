import express from 'express'
import { body, validationResult } from 'express-validator'
import Product from '../models/Product.js'
import { authenticateToken } from '../middleware/auth.js'

const router = express.Router()

// Tüm kategorileri getir
router.get('/', async (req, res) => {
  try {
    const categories = await Product.distinct('category', { isActive: true })
    res.json({
      message: 'Kategoriler başarıyla getirildi',
      categories: categories.sort(),
    })
  } catch (error) {
    console.error('Get categories error:', error)
    res.status(500).json({ message: 'Kategoriler getirilemedi' })
  }
})

// Kategori ekle/güncelle (ürün ile birlikte)
router.post('/', authenticateToken, [
  body('name').notEmpty().trim().withMessage('Kategori adı gereklidir'),
], async (req, res) => {
  try {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Geçersiz veri',
        errors: errors.array()
      })
    }

    const categoryName = req.body.name.toUpperCase().trim()
    
    // Kategorinin mevcut olup olmadığını kontrol et
    const existingCategory = await Product.findOne({ 
      category: categoryName, 
      isActive: true 
    })

    if (existingCategory) {
      return res.status(200).json({
        message: 'Kategori zaten mevcut',
        category: categoryName,
        exists: true
      })
    }

    res.status(201).json({
      message: 'Kategori kullanıma hazır',
      category: categoryName,
      exists: false
    })

  } catch (error) {
    console.error('Add category error:', error)
    res.status(500).json({ message: 'Kategori eklenirken bir hata oluştu' })
  }
})

// Kategori sil (tüm ürünleri pasifleştir)
router.delete('/:categoryName', authenticateToken, async (req, res) => {
  try {
    const categoryName = req.params.categoryName

    // Kategorideki tüm ürünleri bul ve pasifleştir
    const result = await Product.updateMany(
      { category: categoryName },
      { isActive: false }
    )

    res.json({
      message: `Kategori silindi ve ${result.modifiedCount} ürün pasifleştirildi`,
      category: categoryName,
      affectedProducts: result.modifiedCount
    })

  } catch (error) {
    console.error('Delete category error:', error)
    res.status(500).json({ message: 'Kategori silinirken bir hata oluştu' })
  }
})

// Kategoriye göre ürünleri getir
router.get('/:categoryName/products', async (req, res) => {
  try {
    const categoryName = req.params.categoryName
    const products = await Product.find({ 
      category: categoryName, 
      isActive: true 
    }).populate('createdBy', 'name email')

    res.json({
      message: 'Kategori ürünleri başarıyla getirildi',
      category: categoryName,
      products: products,
      count: products.length
    })

  } catch (error) {
    console.error('Get category products error:', error)
    res.status(500).json({ message: 'Kategori ürünleri getirilemedi' })
  }
})

export default router