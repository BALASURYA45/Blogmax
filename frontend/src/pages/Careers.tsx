import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import '../App.css';

const Careers = () => {
  const jobs = [
    { title: 'Frontend Engineer', type: 'Full-time', location: 'Remote' },
    { title: 'Content Strategist', type: 'Part-time', location: 'Hybrid' },
    { title: 'UI/UX Designer', type: 'Full-time', location: 'New York' },
    { title: 'Backend Developer', type: 'Full-time', location: 'Remote' }
  ];

  return (
    <div className="careers-page">
      <Helmet>
        <title>Careers | BlogMax</title>
      </Helmet>
      
      <div className="container">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="hero-section"
        >
          <h1 className="auth-title">Join Our Team</h1>
          <p className="auth-subtitle">Help us build the future of digital storytelling.</p>
        </motion.div>

        <div className="editor-container" style={{ maxWidth: '800px', marginTop: '40px' }}>
          <div style={{ color: 'var(--text-color)' }}>
            <p style={{ fontSize: '18px', lineHeight: '1.8', marginBottom: '40px' }}>
              We're always looking for talented individuals who are passionate about technology, design, and community building. Explore our current openings below.
            </p>

            <div style={{ display: 'grid', gap: '20px' }}>
              {jobs.map((job, index) => (
                <motion.div 
                  key={index}
                  whileHover={{ scale: 1.02 }}
                  style={{ 
                    background: 'var(--glass-bg)', 
                    padding: '24px', 
                    borderRadius: '16px', 
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0, color: 'var(--primary-bright)' }}>{job.title}</h3>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
                      {job.type} • {job.location}
                    </p>
                  </div>
                  <button className="btn-edit">Apply Now</button>
                </motion.div>
              ))}
            </div>

            <p style={{ marginTop: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              Don't see a role that fits? Send your resume to <a href="mailto:careers@blogmax.com" style={{ color: 'var(--primary)' }}>careers@blogmax.com</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Careers;
