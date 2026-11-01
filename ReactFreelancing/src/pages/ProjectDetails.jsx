import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth, api } from '../context/AuthContext';

export default function ProjectDetails() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState(null);
  const [proposal, setProposal] = useState('');
  const [bidAmount, setBidAmount] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const response = await api.get(`/api/projects/${projectId}`);
        setProject(response.data);
        setBidAmount(response.data.budget); // Default bid to budget
      } catch (e) {
        setError('Project details could not be loaded.');
      }
    };
    fetchProjectDetails();
  }, [projectId]);

  const handleApply = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await api.post('/api/applications', {
        projectId: parseInt(projectId),
        proposal,
        bidAmount: parseFloat(bidAmount),
      });

      setSuccess('Application submitted successfully! Redirecting to dashboard...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      setError(err.response?.data || 'Failed to submit proposal');
    } finally {
      setLoading(false);
    }
  };

  if (!project) {
    return (
      <div style={{ padding: '4rem 2rem', textAlign: 'center' }}>
        {error ? <div className="alert-banner alert-error">{error}</div> : <p>Loading project details...</p>}
        <Link to="/" style={{ color: 'var(--primary)', textDecoration: 'underline', marginTop: '1rem', display: 'inline-block' }}>Back to Home</Link>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ padding: '3rem 2rem', maxWidth: '800px', margin: '0 auto' }}>
      <Link to="/dashboard" style={{ color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '5px', marginBottom: '1.5rem' }}>
        ⬅️ Back to Dashboard
      </Link>

      {error && <div className="alert-banner alert-error"><span>⚠️</span> {error}</div>}
      {success && <div className="alert-banner alert-success"><span>✅</span> {success}</div>}

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <span className="badge badge-open">{project.status}</span>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Job ID: #{project.projectId}</span>
        </div>
        <h1 style={{ fontSize: '2.2rem', marginBottom: '1rem', fontFamily: 'var(--font-heading)' }}>{project.title}</h1>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '1.5rem', whiteSpace: 'pre-wrap' }}>
          {project.description}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: 'rgba(255,255,255,0.02)', padding: '1rem 1.5rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Client's Budget</span>
            <h3 style={{ fontSize: '1.5rem', marginTop: '4px' }}>₹{parseFloat(project.budget).toLocaleString('en-IN')}</h3>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Deadline</span>
            <h3 style={{ fontSize: '1.5rem', marginTop: '4px' }}>{project.deadline}</h3>
          </div>
        </div>

        <div>
          <h4 style={{ marginBottom: '8px' }}>Skills Required</h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {project.skills.split(',').map((skill, index) => (
              <span key={index} style={{ fontSize: '0.8rem', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', padding: '4px 10px', borderRadius: '4px', fontWeight: '500' }}>
                {skill.trim()}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* APPLICATION FORM (Freelancers Only) */}
      {user?.role === 'FREELANCER' && project.status === 'OPEN' && (
        <div className="card">
          <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: '1.2rem', color: 'var(--primary)' }}>Submit a Proposal</h2>
          <form onSubmit={handleApply}>
            <div className="form-group">
              <label htmlFor="bid">Your Bid Amount (₹)</label>
              <input
                type="number"
                id="bid"
                required
                className="form-control"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="proposal">Cover Letter / Proposal</label>
              <textarea
                id="proposal"
                required
                className="form-control"
                placeholder="Introduce yourself, list your experience relative to this job, and outline your approach..."
                value={proposal}
                onChange={(e) => setProposal(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
              {loading ? 'Submitting Bid...' : 'Submit Application'}
            </button>
          </form>
        </div>
      )}

      {user?.role !== 'FREELANCER' && project.status === 'OPEN' && (
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '1rem', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
          💡 Only users registered as <strong>FREELANCER</strong> can apply for project jobs.
        </div>
      )}
    </div>
  );
}
