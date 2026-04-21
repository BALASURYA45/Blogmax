import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import '../App.css';

const Contact = () => {
  return (
    <div className="contact-page">
      <Helmet>
        <title>Contact Us | BlogMax</title>
      </Helmet>
      
      <div className="container">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="hero-section"
        >
          <h1 className="auth-title">Get in Touch</h1>
          <p className="auth-subtitle">We'd love to hear from you. Send us a message below.</p>
        </motion.div>

        <div className="editor-container" style={{ maxWidth: '800px', marginTop: '40px' }}>
          <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
            <div className="form-group">
              <label>Name</label>
              <input type="text" className="form-input" placeholder="Your name" required />
            </div>
            
            <div className="form-group">
              <label>Email</label>
              <input type="email" className="form-input" placeholder="Your email address" required />
            </div>

            <div className="form-group">
              <label>Subject</label>
              <select className="form-input">
                <option>General Inquiry</option>
                <option>Technical Support</option>
                <option>Partnership</option>
                <option>Feedback</option>
              </select>
            </div>

            <div className="form-group">
              <label>Message</label>
              <textarea 
                className="form-input" 
                placeholder="How can we help?" 
                style={{ height: '150px', paddingTop: '15px', resize: 'none' }}
                required
              ></textarea>
            </div>

            <button type="submit" className="btn-primary">Send Message</button>
          </form>

          <div style={{ marginTop: '60px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '40px', textAlign: 'center' }}>
            <div>
              <h4 style={{ color: 'var(--primary-bright)', marginBottom: '10px' }}>Email</h4>
              <p style={{ color: 'var(--text-secondary)' }}>support@blogmax.com</p>
            </div>
            <div>
              <h4 style={{ color: 'var(--primary-bright)', marginBottom: '10px' }}>Office</h4>
              <p style={{ color: 'var(--text-secondary)' }}>123 Creator Lane, Suite 400<br/>San Francisco, CA 94103</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
