import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, api } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();
  const [recentProjects, setRecentProjects] = useState([]);

  useEffect(() => {
    const fetchRecentProjects = async () => {
      try {
        const response = await api.get('/api/projects');
        setRecentProjects(response.data.slice(0, 3));
      } catch (e) {
        console.error("Failed to load recent projects", e);
      }
    };
    fetchRecentProjects();
  }, []);

  return (
    <div className="fade-in">
      <header className="hero">
        <h1 className="hero-title">Find the Best Freelancers for Your Next Big Project</h1>
        <p className="hero-subtitle">
          A streamlined 2-microservice platform powered by Spring Boot, Apache Kafka event streaming, and Docker containerization.
        </p>
        <div style={{ display: 'flex', gap: '15px' }}>
          {user ? (
            <Link to="/dashboard" className="btn btn-primary">
              Go to Dashboard
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary">
                Get Started
              </Link>
              <Link to="/login" className="btn btn-secondary">
                Sign In
              </Link>
            </>
          )}
        </div>
      </header>

      <section style={{ padding: '4rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: '2.2rem', fontFamily: 'var(--font-heading)' }}>
          Platform Architecture Highlights
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          <div className="card">
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🔒</div>
            <h3 style={{ marginBottom: '0.8rem' }}>User Service & JWT Security</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Autonomous user microservice handling BCrypt passwords, JWT authentication, and administrative assistant delegation.
            </p>
          </div>
          <div className="card">
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚡</div>
            <h3 style={{ marginBottom: '0.8rem' }}>Apache Kafka Event Streaming</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Real-time asynchronous messaging decoupling user lifecycle and project lifecycle events between microservices.
            </p>
          </div>
          <div className="card">
            <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🚀</div>
            <h3 style={{ marginBottom: '0.8rem' }}>Project & Milestone Lifecycle</h3>
            <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6' }}>
              Integrated project microservice managing job listings, bidding proposals, deliverable submissions, and client work approvals.
            </p>
          </div>
        </div>
      </section>

      <section style={{ padding: '4rem 2rem', background: 'rgba(255, 255, 255, 0.02)', borderTop: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '2.5rem', fontSize: '2.2rem', fontFamily: 'var(--font-heading)' }}>
            Recent Job Openings
          </h2>
          {recentProjects.length > 0 ? (
            <div className="projects-grid">
              {recentProjects.map((p) => (
                <div key={p.projectId} className="card project-card">
                  <span className="badge badge-open" style={{ marginBottom: '10px' }}>{p.status}</span>
                  <h3 className="project-title">{p.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', minHeight: '60px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {p.description}
                  </p>
                  <div className="project-meta">
                    <span>💰 ₹{parseFloat(p.budget).toLocaleString('en-IN')}</span>
                    <span>📅 {p.deadline}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '1.2rem' }}>
                    {p.skills.split(',').map((skill, index) => (
                      <span key={index} style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                  <Link to={`/project/${p.projectId}`} className="btn btn-primary" style={{ width: '100%' }}>
                    View Project
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>No active projects found. Check back later!</p>
          )}
        </div>
      </section>
    </div>
  );
}
