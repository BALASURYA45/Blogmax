import { Link } from 'react-router-dom';
import '../App.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-info">
            <Link to="/" className="footer-logo nav-logo">BlogMax</Link>
            <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: '1.6', maxWidth: '300px' }}>
              The ultimate destination for tech enthusiasts and storytellers. Sharing insights from the world of design and code.
            </p>
          </div>
          <div className="footer-links">
            <h4>Platform</h4>
            <ul>
              <li><Link to="/latest">Latest Stories</Link></li>
              <li><Link to="/featured">Featured</Link></li>
              <li><Link to="/categories">Categories</Link></li>
              <li><Link to="/authors">Authors</Link></li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>Company</h4>
            <ul>
              <li><Link to="/about">About Us</Link></li>
              <li><Link to="/careers">Careers</Link></li>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/contact">Contact</Link></li>
            </ul>
          </div>
          <div className="footer-links">
            <h4>Social</h4>
            <ul>
              <li><a href="https://twitter.com">Twitter</a></li>
              <li><a href="https://linkedin.com">LinkedIn</a></li>
              <li><a href="https://instagram.com">Instagram</a></li>
              <li><a href="https://github.com">GitHub</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} BlogMax. Designed for the future of the web.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
