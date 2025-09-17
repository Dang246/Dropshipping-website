import React, { useState, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Star, ShoppingBag, Heart, Share2, Truck, Shield, RotateCcw } from 'lucide-react';
import { CartContext } from '../App';
import { toast } from 'sonner';

const ProductPage = ({ products }) => {
  const { id } = useParams();
  const { addToCart } = useContext(CartContext);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  
  const product = products.find(p => p.id === id);
  
  if (!product) {
    return (
      <div className="product-not-found">
        <div className="container">
          <h2>Product Not Found</h2>
          <p>The product you're looking for doesn't exist.</p>
          <Link to="/shop" className="cta-primary">
            <ArrowLeft size={16} />
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images && product.images.length > 0 ? product.images : [product.image_url];
  const relatedProducts = products.filter(p => 
    p.category === product.category && p.id !== product.id
  ).slice(0, 4);

  const handleAddToCart = async () => {
    const success = await addToCart(product.id, quantity);
    if (success) {
      toast.success('Added to cart!', {
        description: `${quantity} ${product.name} added to your cart.`,
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
        size={16}
        className={i < Math.floor(rating) ? 'fill-current text-yellow-400' : 'text-gray-300'}
      />
    ));
  };

  return (
    <div className="product-page">
      <div className="product-container">
        {/* Breadcrumb */}
        <div className="breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <Link to="/shop">Shop</Link>
          <span>/</span>
          <Link to={`/shop?category=${product.category}`}>{product.category}</Link>
          <span>/</span>
          <span>{product.name}</span>
        </div>

        <div className="product-content">
          {/* Product Images */}
          <div className="product-images">
            <div className="main-image">
              <img src={images[selectedImage]} alt={product.name} />
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
            {images.length > 1 && (
              <div className="image-thumbnails">
                {images.map((image, index) => (
                  <button
                    key={index}
                    className={`thumbnail ${index === selectedImage ? 'active' : ''}`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img src={image} alt={`${product.name} ${index + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="product-details">
            <div className="product-category">{product.category}</div>
            <h1 className="product-title">{product.name}</h1>
            
            <div className="product-rating">
              <div className="rating-stars">
                {renderStars(product.rating)}
              </div>
              <span className="rating-text">({product.review_count} reviews)</span>
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

            <p className="product-description">{product.description}</p>

            {/* Benefits */}
            {product.benefits && product.benefits.length > 0 && (
              <div className="product-benefits">
                <h3>Key Benefits</h3>
                <ul>
                  {product.benefits.map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Ingredients */}
            {product.ingredients && product.ingredients.length > 0 && (
              <div className="product-ingredients">
                <h3>Key Ingredients</h3>
                <div className="ingredients-list">
                  {product.ingredients.map((ingredient, index) => (
                    <span key={index} className="ingredient-tag">{ingredient}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Skin Types */}
            {product.skin_types && product.skin_types.length > 0 && (
              <div className="skin-types">
                <h3>Suitable for</h3>
                <div className="skin-types-list">
                  {product.skin_types.map((type, index) => (
                    <span key={index} className="skin-type-tag">{type}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Add to Cart */}
            <div className="purchase-section">
              <div className="quantity-selector">
                <label>Quantity</label>
                <div className="quantity-controls">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="qty-btn"
                  >
                    -
                  </button>
                  <span className="quantity">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(quantity + 1)}
                    className="qty-btn"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="purchase-buttons">
                <button onClick={handleAddToCart} className="add-to-cart-btn primary">
                  <ShoppingBag size={16} />
                  Add to Cart - ${(product.price * quantity).toFixed(2)}
                </button>
                
                <div className="secondary-actions">
                  <button className="wishlist-btn">
                    <Heart size={16} />
                    Save for Later
                  </button>
                  <button className="share-btn">
                    <Share2 size={16} />
                    Share
                  </button>
                </div>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="shipping-info">
              <div className="info-item">
                <Truck size={16} />
                <span>Free worldwide shipping on all orders</span>
              </div>
              <div className="info-item">
                <Shield size={16} />
                <span>30-day money-back guarantee</span>
              </div>
              <div className="info-item">
                <RotateCcw size={16} />
                <span>Easy returns and exchanges</span>
              </div>
            </div>
          </div>
        </div>

        {/* How to Use */}
        {product.how_to_use && (
          <div className="how-to-use">
            <h2>How to Use</h2>
            <p>{product.how_to_use}</p>
          </div>
        )}

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="related-products">
            <h2>You Might Also Like</h2>
            <div className="related-grid">
              {relatedProducts.map((relatedProduct) => (
                <Link key={relatedProduct.id} to={`/product/${relatedProduct.id}`} className="related-card">
                  <div className="related-image">
                    <img src={relatedProduct.image_url} alt={relatedProduct.name} />
                  </div>
                  <div className="related-info">
                    <h4>{relatedProduct.name}</h4>
                    <div className="related-rating">
                      <div className="rating-stars">
                        {renderStars(relatedProduct.rating)}
                      </div>
                      <span>({relatedProduct.review_count})</span>
                    </div>
                    <div className="related-price">
                      <span className="current-price">${relatedProduct.price}</span>
                      {relatedProduct.original_price && (
                        <span className="original-price">${relatedProduct.original_price}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductPage;