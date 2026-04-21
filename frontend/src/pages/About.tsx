import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import '../App.css';

const About = () => {
  return (
    <div className="about-page">
      <Helmet>
        <title>About Us | BlogMax</title>
      </Helmet>
      
      <div className="container">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="hero-section"
        >
          <h1 className="auth-title">About BlogMax</h1>
          <p className="auth-subtitle">Empowering storytellers through design and code.</p>
        </motion.div>

        <div className="editor-container" style={{ maxWidth: '800px', marginTop: '40px' }}>
          <div style={{ color: 'var(--text-color)', lineHeight: '1.8' }}>
            <h2>Our Mission</h2>
            <p>
              At BlogMax, we believe that everyone has a story worth telling. Our platform is designed to provide a premium, seamless experience for writers and readers alike, focusing on high-quality content and an aesthetic that inspires creativity.
            </p>
            
            <h2 style={{ marginTop: '32px' }}>The Platform</h2>
            <p>
              Built for the modern web, BlogMax integrates cutting-edge technology to ensure fast performance, real-time interactions, and a secure environment for our community. Whether you're a developer sharing technical insights or a designer showcasing your latest project, BlogMax is your home.
            </p>

            <h2 style={{ marginTop: '32px' }}>Our Values</h2>
            <ul>
              <li><strong>Quality First:</strong> We prioritize meaningful content over clickbait.</li>
              <li><strong>Design-Centric:</strong> A beautiful interface makes for a better reading experience.</li>
              <li><strong>Open Community:</strong> We foster a diverse environment where every voice is heard.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
