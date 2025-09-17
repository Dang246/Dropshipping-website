import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { CartContext } from '../App';
import { toast } from 'sonner';

const CartPage = ({ products }) => {
  const { items, removeFromCart, updateCartItem, clearCart, total } = useContext(CartContext);

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      await removeFromCart(itemId);
      toast.success('Item removed from cart');
    } else {
      await updateCartItem(itemId, newQuantity);
    }
  };

  const handleRemoveItem = async (itemId) => {
    await removeFromCart(itemId);
    toast.success('Item removed from cart');
  };

  const handleClearCart = async () => {
    await clearCart();
    toast.success('Cart cleared');
  };

  if (items.length === 0) {
    return (
      <div className="cart-page empty">
        <div className="cart-container">
          <div className="empty-cart">
            <ShoppingBag size={64} className="empty-icon" />
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added anything to your cart yet.</p>
            <Link to="/shop" className="cta-primary">
              <ArrowLeft size={16} />
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const cartItemsWithDetails = items.map(item => {
    const product = products.find(p => p.id === item.product_id);
    return { ...item, product };
  }).filter(item => item.product);

  const subtotal = cartItemsWithDetails.reduce((sum, item) => 
    sum + (item.product.price * item.quantity), 0
  );
  const shipping = 0; // Free shipping
  const tax = subtotal * 0.08; // 8% tax
  const finalTotal = subtotal + shipping + tax;

  return (
    <div className="cart-page">
      <div className="cart-container">
        <div className="cart-header">
          <Link to="/shop" className="back-button">
            <ArrowLeft size={16} />
            Continue Shopping
          </Link>
          <h1>Shopping Cart ({items.length} items)</h1>
          <button onClick={handleClearCart} className="clear-cart">
            Clear Cart
          </button>
        </div>

        <div className="cart-content">
          <div className="cart-items">
            {cartItemsWithDetails.map((item) => (
              <div key={item.id} className="cart-item">
                <div className="item-image">
                  <img src={item.product.image_url} alt={item.product.name} />
                </div>
                
                <div className="item-details">
                  <Link to={`/product/${item.product.id}`} className="item-name">
                    {item.product.name}
                  </Link>
                  <p className="item-description">{item.product.short_description}</p>
                  <div className="item-category">{item.product.category}</div>
                  
                  {item.product.original_price && (
                    <div className="item-discount">
                      <span className="original-price">${item.product.original_price}</span>
                      <span className="discount-text">
                        Save ${(item.product.original_price - item.product.price).toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>

                <div className="item-quantity">
                  <label>Quantity</label>
                  <div className="quantity-controls">
                    <button 
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      className="qty-btn"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="quantity">{item.quantity}</span>
                    <button 
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      className="qty-btn"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="item-price">
                  <div className="unit-price">${item.product.price} each</div>
                  <div className="total-price">${(item.product.price * item.quantity).toFixed(2)}</div>
                </div>

                <button 
                  onClick={() => handleRemoveItem(item.id)}
                  className="remove-item"
                  title="Remove item"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="cart-summary">
            <div className="summary-card">
              <h3>Order Summary</h3>
              
              <div className="summary-line">
                <span>Subtotal ({items.length} items)</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              
              <div className="summary-line">
                <span>Shipping</span>
                <span className="free">Free</span>
              </div>
              
              <div className="summary-line">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              
              <div className="summary-line total">
                <span>Total</span>
                <span>${finalTotal.toFixed(2)}</span>
              </div>

              <div className="checkout-section">
                <button className="checkout-btn">
                  Proceed to Checkout
                  <ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />
                </button>
                
                <div className="payment-methods">
                  <span>We accept:</span>
                  <div className="payment-icons">
                    <span>💳</span>
                    <span>🅿️</span>
                    <span>📱</span>
                  </div>
                </div>
              </div>

              <div className="cart-benefits">
                <div className="benefit-item">
                  <span>✅</span>
                  <span>Free worldwide shipping</span>
                </div>
                <div className="benefit-item">
                  <span>✅</span>
                  <span>30-day money-back guarantee</span>
                </div>
                <div className="benefit-item">
                  <span>✅</span>
                  <span>Secure checkout</span>
                </div>
              </div>
            </div>

            <div className="promo-section">
              <h4>Have a promo code?</h4>
              <div className="promo-input">
                <input type="text" placeholder="Enter code" />
                <button>Apply</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;