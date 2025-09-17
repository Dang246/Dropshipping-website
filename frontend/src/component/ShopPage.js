import React, { useState, useContext, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, Grid, List, Star, ShoppingBag } from 'lucide-react';
import { CartContext } from '../App';
import { toast } from 'sonner';

const ShopPage = ({ products }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useContext(CartContext);
  
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    skinType: '',
    minPrice: '',
    maxPrice: '',
    search: searchParams.get('search') || ''
  });
  const [sortBy, setSortBy] = useState('featured');
  const [viewMode, setViewMode] = useState('grid');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    applyFilters();
  }, [products, filters, sortBy]);

  const applyFilters = () => {
    let filtered = [...products];

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(filters.search.toLowerCase()) ||
        product.description.toLowerCase().includes(filters.search.toLowerCase()) ||
        product.short_description.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(product => product.category === filters.category);
    }

    // Skin type filter
    if (filters.skinType) {
      filtered = filtered.filter(product => 
        product.skin_types.includes(filters.skinType)
      );
    }

    // Price filter
    if (filters.minPrice) {
      filtered = filtered.filter(product => product.price >= parseFloat(filters.minPrice));
    }
    if (filters.maxPrice) {
      filtered = filtered.filter(product => product.price <= parseFloat(filters.maxPrice));
    }

    // Sort products
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        break;
      case 'featured':
      default:
        filtered.sort((a, b) => {
          if (a.is_featured && !b.is_featured) return -1;
          if (!a.is_featured && b.is_featured) return 1;
          return b.rating - a.rating;
        });
        break;
    }

    setFilteredProducts(filtered);
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    // Update URL parameters
    const newSearchParams = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) newSearchParams.set(k, v);
    });
    setSearchParams(newSearchParams);
  };

  const clearFilters = () => {
    setFilters({
      category: '',
      skinType: '',
      minPrice: '',
      maxPrice: '',
      search: ''
    });
    setSearchParams({});
  };

  const handleAddToCart = async (productId) => {
    const success = await addToCart(productId);
    if (success) {
      toast.success('Added to cart!', {
        description: 'Product has been added to your cart.',
      });
    } else {
      toast.error('Failed to add to cart', {
        description: 'Please try again.',
      });
    }
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={14}
        className={i < Math.floor(rating) ? 'fill-current text-yellow-400' : 'text-gray-300'}
      />
    ));
  };

  return (
    <div className="shop-page">
      <div className="shop-container">
        {/* Header */}
        <div className="shop-header">
          <div className="shop-title-section">
            <h1 className="shop-title">Beauty Collection</h1>
            <p className="shop-subtitle">
              Discover {filteredProducts.length} products in our curated beauty collection
            </p>
          </div>
          
          <div className="shop-controls">
            <div className="search-bar">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search products..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="search-input"
              />
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="featured">Featured</option>
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="filter-toggle"
            >
              <Filter size={16} />
              Filters
            </button>
            
            <div className="view-toggle">
              <button
                onClick={() => setViewMode('grid')}
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="shop-content">
          {/* Sidebar Filters */}
          <div className={`shop-sidebar ${showFilters ? 'show' : ''}`}>
            <div className="filter-header">
              <h3>Filters</h3>
              <button onClick={clearFilters} className="clear-filters">
                Clear All
              </button>
            </div>
            
            <div className="filter-group">
              <h4>Category</h4>
              <div className="filter-options">
                <label className="filter-option">
                  <input
                    type="radio"
                    name="category"
                    value=""
                    checked={filters.category === ''}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  />
                  All Categories
                </label>
                <label className="filter-option">
                  <input
                    type="radio"
                    name="category"
                    value="skincare"
                    checked={filters.category === 'skincare'}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  />
                  Skincare
                </label>
                <label className="filter-option">
                  <input
                    type="radio"
                    name="category"
                    value="lips"
                    checked={filters.category === 'lips'}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  />
                  Lips
                </label>
                <label className="filter-option">
                  <input
                    type="radio"
                    name="category"
                    value="eyes"
                    checked={filters.category === 'eyes'}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  />
                  Eyes
                </label>
                <label className="filter-option">
                  <input
                    type="radio"
                    name="category"
                    value="tools"
                    checked={filters.category === 'tools'}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                  />
                  Tools
                </label>
              </div>
            </div>
            
            <div className="filter-group">
              <h4>Skin Type</h4>
              <div className="filter-options">
                <label className="filter-option">
                  <input
                    type="radio"
                    name="skinType"
                    value=""
                    checked={filters.skinType === ''}
                    onChange={(e) => handleFilterChange('skinType', e.target.value)}
                  />
                  All Skin Types
                </label>
                <label className="filter-option">
                  <input
                    type="radio"
                    name="skinType"
                    value="dry"
                    checked={filters.skinType === 'dry'}
                    onChange={(e) => handleFilterChange('skinType', e.target.value)}
                  />
                  Dry
                </label>
                <label className="filter-option">
                  <input
                    type="radio"
                    name="skinType"
                    value="oily"
                    checked={filters.skinType === 'oily'}
                    onChange={(e) => handleFilterChange('skinType', e.target.value)}
                  />
                  Oily
                </label>
                <label className="filter-option">
                  <input
                    type="radio"
                    name="skinType"
                    value="sensitive"
                    checked={filters.skinType === 'sensitive'}
                    onChange={(e) => handleFilterChange('skinType', e.target.value)}
                  />
                  Sensitive
                </label>
                <label className="filter-option">
                  <input
                    type="radio"
                    name="skinType"
                    value="combination"
                    checked={filters.skinType === 'combination'}
                    onChange={(e) => handleFilterChange('skinType', e.target.value)}
                  />
                  Combination
                </label>
              </div>
            </div>
            
            <div className="filter-group">
              <h4>Price Range</h4>
              <div className="price-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                  className="price-input"
                />
                <span>to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                  className="price-input"
                />
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="shop-main">
            {filteredProducts.length === 0 ? (
              <div className="no-products">
                <h3>No products found</h3>
                <p>Try adjusting your filters or search terms.</p>
                <button onClick={clearFilters} className="cta-primary">
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className={`products-grid ${viewMode}`}>
                {filteredProducts.map((product) => (
                  <div key={product.id} className="product-card" onClick={() => window.location.href = `/product/${product.id}`}>
                    <div className="product-image">
                      <img src={product.image_url} alt={product.name} />
                      <div className="product-badges">
                        {product.is_viral && <span className="product-badge viral">Viral</span>}
                        {product.is_new && <span className="product-badge new">New</span>}
                        {product.original_price && (
                          <span className="product-badge">
                            -{Math.round(((product.original_price - product.price) / product.original_price) * 100)}%
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="product-info">
                      <div className="product-category">{product.category}</div>
                      <h3 className="product-name">{product.name}</h3>
                      <p className="product-description">{product.short_description}</p>
                      
                      <div className="product-rating">
                        <div className="rating-stars">
                          {renderStars(product.rating)}
                        </div>
                        <span className="rating-text">({product.review_count})</span>
                      </div>
                      
                      <div className="product-price">
                        <span className="current-price">${product.price}</span>
                        {product.original_price && (
                          <>
                            <span className="original-price">${product.original_price}</span>
                            <span className="discount-badge">
                              Save ${(product.original_price - product.price).toFixed(2)}
                            </span>
                          </>
                        )}
                      </div>
                      
                      <div className="product-actions">
                        <button 
                          className="add-to-cart-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(product.id);
                          }}
                        >
                          <ShoppingBag size={16} />
                          Add to Cart
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShopPage;