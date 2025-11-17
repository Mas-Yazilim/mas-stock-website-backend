import mongoose from 'mongoose';

const colorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Renk adı gereklidir'],
    trim: true
  },
  hex: {
    type: String,
    required: [true, 'Renk kodu gereklidir'],
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Geçerli bir hex renk kodu giriniz']
  },
  available: {
    type: Boolean,
    default: true
  }
});

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Ürün adı gereklidir'],
    trim: true,
    //unique: true
  },
  brand: {
    type: String,
    required: [true, 'Marka adı gereklidir'],
    trim: true
  },
  model: {
    type: String,
    required: [true, 'Model adı gereklidir'],
    trim: true
  },
  storage: {
    type: String,
    required: [true, 'Depolama bilgisi gereklidir'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Kategori gereklidir'],
    trim: true,
    uppercase: true
  },
  colors: {
    type: [colorSchema],
    required: [true, 'En az bir renk seçeneği gereklidir'],
    validate: {
      validator: function(colors) {
        return colors && colors.length > 0;
      },
      message: 'En az bir renk seçeneği gereklidir'
    }
  },
  cashPrice: {
    type: Number,
    required: [true, 'Nakit fiyat gereklidir'],
    min: [0, 'Fiyat negatif olamaz']
  },
  visaPrice: {
    type: Number,
    required: [true, 'Visa fiyat gereklidir'],
    min: [0, 'Fiyat negatif olamaz']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  }
}, {
  timestamps: true
});

// İndeksler - name için unique zaten mevcut olduğu için manual indeksi kaldır
productSchema.index({ brand: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1 });

// Virtual alanlar
productSchema.virtual('fullName').get(function() {
  return `${this.brand} ${this.model} ${this.storage}`;
});

// JSON transform
productSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

export default mongoose.model('Product', productSchema);
