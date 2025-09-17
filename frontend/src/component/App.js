import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import axios from 'axios';
import './App.css';

// Components
import Header from './components/Header';
import HomePage from './components/HomePage';
import ShopPage from './components/ShopPage';
import ProductPage from './components/ProductPage';
import CartPage from './components/CartPage';
import { Toaster } from './components/ui/sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Context for cart
export const CartContext = React.createContext();

function App() {
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch products on app load
  useEffect(() => {
    fetchProducts();
    fetchCart();
    initializeProducts();
  }, []);

  const initializeProducts = async () => {
    try {
      await axios.post(`${API}/init-products`);
    } catch (error) {
      console.error('Error initializing products:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCart = async () => {
    try {
      const response = await axios.get(`${API}/cart`);
      setCartItems(response.data);
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      await axios.post(`${API}/cart`, {
        product_id: productId,
        quantity: quantity
      });
      fetchCart(); // Refresh cart
      return true;
    } catch (error) {
      console.error('Error adding to cart:', error);
      return false;
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      await axios.delete(`${API}/cart/${itemId}`);
      fetchCart(); // Refresh cart
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const updateCartItem = async (itemId, quantity) => {
    try {
      await axios.put(`${API}/cart/${itemId}?quantity=${quantity}`);
      fetchCart(); // Refresh cart
    } catch (error) {
      console.error('Error updating cart item:', error);
    }
  };

  const clearCart = async () => {
    try {
      await axios.delete(`${API}/cart`);
      fetchCart(); // Refresh cart
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const cartValue = {
    items: cartItems,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
    total: cartItems.reduce((sum, item) => {
      const product = products.find(p => p.id === item.product_id);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0)
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner"></div>
        <p>Loading beautiful products...</p>
      </div>
    );
  }

  return (
    <CartContext.Provider value={cartValue}>
      <div className="App">
        <BrowserRouter>
          <Header />
          <Routes>
            <Route path="/" element={<HomePage products={products} />} />
            <Route path="/shop" element={<ShopPage products={products} />} />
            <Route path="/product/:id" element={<ProductPage products={products} />} />
            <Route path="/cart" element={<CartPage products={products} />} />
          </Routes>
          <Toaster position="top-right" />
        </BrowserRouter>
      </div>
    </CartContext.Provider>
  );
}

export default App;