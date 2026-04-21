import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import '../App.css';

const Privacy = () => {
  return (
    <div className="privacy-page">
      <Helmet>
        <title>Privacy Policy | BlogMax</title>
      </Helmet>
      
      <div className="container">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="hero-section"
        >
          <h1 className="auth-title">Privacy Policy</h1>
          <p className="auth-subtitle">How we protect and manage your data.</p>
        </motion.div>

        <div className="editor-container" style={{ maxWidth: '800px', marginTop: '40px' }}>
          <div style={{ color: 'var(--text-color)', lineHeight: '1.8' }}>
            <p>Last updated: January 14, 2026</p>
            
            <h2>1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us when you create an account, post content, or communicate with us. This may include your username, email address, profile information, and any content you upload.
            </p>
            
            <h2 style={{ marginTop: '32px' }}>2. How We Use Information</h2>
            <p>
              We use the information we collect to provide, maintain, and improve our services, to develop new features, and to protect BlogMax and our users. This includes personalizing your experience and sending you technical notices.
            </p>

            <h2 style={{ marginTop: '32px' }}>3. Data Security</h2>
            <p>
              We take reasonable measures to help protect information about you from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction.
            </p>

            <h2 style={{ marginTop: '32px' }}>4. Your Choices</h2>
            <p>
              You may update or delete your account information at any time by logging into your account settings. You can also manage your communication preferences.
            </p>

            <h2 style={{ marginTop: '32px' }}>5. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at <a href="mailto:privacy@blogmax.com" style={{ color: 'var(--primary)' }}>privacy@blogmax.com</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Privacy;
