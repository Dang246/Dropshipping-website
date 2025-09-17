import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, Truck, Shield, Leaf, Heart, Play, Sparkles, ShoppingBag } from 'lucide-react';
import { CartContext } from '../App';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = ({ products }) => {
  const { addToCart } = useContext(CartContext);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);

  const featuredProducts = products.filter(product => product.is_featured).slice(0, 6);
  const newProducts = products.filter(product => product.is_new).slice(0, 3);

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

  const handleNewsletterSubmit = async (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;

    setIsSubscribing(true);
    try {
      await axios.post(`${API}/newsletter`, {
        email: newsletterEmail.trim()
      });
      toast.success('Successfully subscribed!', {
        description: 'Check your email for a 10% off coupon.',
      });
      setNewsletterEmail('');
    } catch (error) {
      if (error.response?.status === 400) {
        toast.error('Already subscribed', {
          description: 'This email is already in our newsletter.',
        });
      } else {
        toast.error('Subscription failed', {
          description: 'Please try again later.',
        });
      }
    } finally {
      setIsSubscribing(false);
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
    <div className="homepage">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <div className="hero-badge">
              <Sparkles size={16} />
              New Collection Available
            </div>
            <h1 className="hero-title">
              Radiant Skin 
              <br />
              Starts Here
            </h1>
            <p className="hero-subtitle">
              Discover our curated collection of natural, cruelty-free beauty products 
              that enhance your natural glow and boost your confidence.
            </p>
            <div className="cta-buttons">
              <Link to="/shop" className="cta-primary">
                Shop Now
                <ArrowRight size={16} />
              </Link>
              <Link to="/about" className="cta-secondary">
                <Play size={16} />
                Watch Story
              </Link>
            </div>
            <div className="hero-stats">
              <div className="stat-item">
                <span className="stat-number">10K+</span>
                <span className="stat-label">Happy Customers</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">100%</span>
                <span className="stat-label">Cruelty-Free</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">4.9</span>
                <span className="stat-label">Average Rating</span>
              </div>
            </div>
          </div>
          <div className="hero-image">
            <img 
              src="https://images.unsplash.com/photo-1581182800629-7d90925ad072" 
              alt="Beautiful woman with natural makeup" 
            />
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-section">
        <div className="section-container">
          <div className="section-header">
            <div className="section-badge">
              <Star size={16} />
              Featured Collections
            </div>
            <h2 className="section-title">Best-Selling Beauty Essentials</h2>
            <p className="section-subtitle">
              Hand-picked products loved by thousands of customers worldwide. 
              Discover what makes these items so special.
            </p>
          </div>
          
          <div className="products-grid">
            {featuredProducts.map((product) => (
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

          <div style={{ textAlign: 'center', marginTop: '60px' }}>
            <Link to="/shop" className="cta-primary">
              View All Products
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="why-choose-section">
        <div className="section-container">
          <div className="section-header">
            <div className="section-badge">
              <Shield size={16} />
              Why Choose Us
            </div>
            <h2 className="section-title">Beauty with Purpose</h2>
            <p className="section-subtitle">
              We're committed to bringing you the finest natural beauty products 
              with transparency, quality, and care.
            </p>
          </div>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <Shield size={24} />
              </div>
              <h3 className="feature-title">100% Cruelty-Free</h3>
              <p className="feature-description">
                Never tested on animals. We believe beauty should never come at the cost of animal welfare.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <Leaf size={24} />
              </div>
              <h3 className="feature-title">Organic Ingredients</h3>
              <p className="feature-description">
                Sourced from sustainable farms, our organic ingredients nourish your skin naturally.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <Truck size={24} />
              </div>
              <h3 className="feature-title">Free Worldwide Shipping</h3>
              <p className="feature-description">
                Enjoy complimentary shipping on all orders. Beauty delivered to your doorstep.
              </p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <Heart size={24} />
              </div>
              <h3 className="feature-title">Loved by 10,000+</h3>
              <p className="feature-description">
                Join thousands of satisfied customers who trust us for their beauty needs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <div className="section-container">
          <div className="section-header">
            <div className="section-badge">
              <Heart size={16} />
              Customer Love
            </div>
            <h2 className="section-title">What Our Customers Say</h2>
            <p className="section-subtitle">
              Real reviews from real people who've transformed their beauty routine with our products.
            </p>
          </div>
          
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-rating">
                {renderStars(5)}
              </div>
              <p className="testimonial-text">
                "The Vitamin C serum is absolutely amazing! My skin has never looked brighter. 
                I've been using it for 3 months and the compliments keep coming!"
              </p>
              <div className="testimonial-author">
                <img 
                  src="https://images.unsplash.com/photo-1594744803329-e58b31de8bf5" 
                  alt="Sarah Johnson" 
                  className="author-avatar"
                />
                <div className="author-info">
                  <h4>Sarah Johnson</h4>
                  <p>Verified Customer</p>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-rating">
                {renderStars(5)}
              </div>
              <p className="testimonial-text">
                "Finally found a moisturizer that works for my sensitive skin! It's gentle, 
                hydrating, and doesn't cause any irritation. Highly recommend!"
              </p>
              <div className="testimonial-author">
                <img 
                  src="https://images.unsplash.com/photo-1580489944761-15a19d654956" 
                  alt="Emma Davis" 
                  className="author-avatar"
                />
                <div className="author-info">
                  <h4>Emma Davis</h4>
                  <p>Verified Customer</p>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-rating">
                {renderStars(5)}
              </div>
              <p className="testimonial-text">
                "The lip tint is my new obsession! Perfect color, lasts all day, and feels 
                so comfortable. I've ordered 3 different shades already."
              </p>
              <div className="testimonial-author">
                <img 
                  src="https://images.unsplash.com/photo-1592621385612-4d7129426394" 
                  alt="Lisa Chen" 
                  className="author-avatar"
                />
                <div className="author-info">
                  <h4>Lisa Chen</h4>
                  <p>Verified Customer</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="newsletter-section">
        <div className="section-container">
          <div className="newsletter-content">
            <h2 className="newsletter-title">Get 10% Off Your First Order</h2>
            <p className="newsletter-subtitle">
              Subscribe to our newsletter for exclusive offers, beauty tips, and new product launches.
            </p>
            <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
              <input
                type="email"
                placeholder="Enter your email address"
                className="newsletter-input"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                required
              />
              <button 
                type="submit" 
                className="newsletter-button"
                disabled={isSubscribing}
              >
                {isSubscribing ? 'Subscribing...' : 'Subscribe'}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-brand">
            <h3>Radiant Beauty</h3>
            <p>
              Empowering natural beauty through clean, cruelty-free products that enhance 
              your confidence and celebrate your unique glow.
            </p>
            <div className="social-links">
              <a href="#" className="social-link">
                <span>IG</span>
              </a>
              <a href="#" className="social-link">
                <span>TT</span>
              </a>
              <a href="#" className="social-link">
                <span>PT</span>
              </a>
            </div>
          </div>
          
          <div className="footer-section">
            <h4>Shop</h4>
            <ul className="footer-links">
              <li><a href="/shop?category=skincare">Skincare</a></li>
              <li><a href="/shop?category=lips">Lips</a></li>
              <li><a href="/shop?category=eyes">Eyes</a></li>
              <li><a href="/shop?category=tools">Tools</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Support</h4>
            <ul className="footer-links">
              <li><a href="#">FAQ</a></li>
              <li><a href="#">Returns</a></li>
              <li><a href="#">Shipping</a></li>
              <li><a href="#">Contact Us</a></li>
            </ul>
          </div>
          
          <div className="footer-section">
            <h4>Company</h4>
            <ul className="footer-links">
              <li><a href="#">About Us</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Privacy Policy</a></li>
            </ul>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; 2025 Radiant Beauty. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;