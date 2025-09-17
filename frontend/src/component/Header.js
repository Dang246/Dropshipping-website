import React, { useContext, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Sparkles } from 'lucide-react';
import { CartContext } from '../App';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { itemCount } = useContext(CartContext);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <div className="logo-icon">
            <Sparkles size={16} />
          </div>
          <span className="logo-text">Radiant Beauty</span>
        </Link>

        <nav>
          <ul className="nav-menu">
            <li>
              <Link 
                to="/" 
                className={location.pathname === '/' ? 'active' : ''}
              >
                Home
              </Link>
            </li>
            <li>
              <Link 
                to="/shop" 
                className={location.pathname === '/shop' ? 'active' : ''}
              >
                Shop
              </Link>
            </li>
            <li>
              <Link to="/about">About</Link>
            </li>
            <li>
              <Link to="/blog">Blog</Link>
            </li>
            <li>
              <Link to="/contact">Contact</Link>
            </li>
            <li>
              <Link to="/track">Track Order</Link>
            </li>
          </ul>
        </nav>

        <div className="header-actions">
          <form className="search-container" onSubmit={handleSearch}>
            <Search className="search-icon" size={16} />
            <input
              type="text"
              placeholder="Search products..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          <Link to="/cart" className="cart-button">
            <ShoppingBag size={20} />
            {itemCount > 0 && (
              <span className="cart-count">{itemCount}</span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;