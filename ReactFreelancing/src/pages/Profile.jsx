import React, { useEffect, useState } from 'react';
import { useAuth, api } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();
  
  const [profile, setProfile] = useState(null);
  const [companyName, setCompanyName] = useState('');
  const [skills, setSkills] = useState('');
  const [experience, setExperience] = useState('');
  const [portfolio, setPortfolio] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/api/users/profile');
      setProfile(response.data);
      setCompanyName(response.data.companyName || '');
      setSkills(response.data.skills || '');
      setExperience(response.data.experience || '');
      setPortfolio(response.data.portfolio || '');
    } catch (e) {
      setError('Failed to fetch profile.');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const payload = {
        companyName: user.role === 'CLIENT' ? companyName : '',
        skills: user.role === 'FREELANCER' ? skills : '',
        experience: user.role === 'FREELANCER' ? experience : '',
        portfolio: user.role === 'FREELANCER' ? portfolio : ''
      };

      const response = await api.put('/api/users/profile', payload);
      setProfile(response.data);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError('Profile update failed.');
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
    return <p style={{ textAlign: 'center', padding: '4rem' }}>Loading profile...</p>;
  }

  return (
    <div className="fade-in" style={{ padding: '3rem 2rem', maxWidth: '850px', margin: '0 auto' }}>
      
      {error && <div className="alert-banner alert-error"><span>⚠️</span> {error}</div>}
      {success && <div className="alert-banner alert-success"><span>✅</span> {success}</div>}

      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)' }}>Professional Profile</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
              Manage your credentials, expertise, and public profile data.
            </p>
          </div>
          <span className="badge badge-completed" style={{ background: 'var(--primary-glow)', color: 'var(--primary)', padding: '6px 12px', fontSize: '0.85rem' }}>
            {user.role}
          </span>
        </div>

        <form onSubmit={handleUpdateProfile}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '1rem' }}>
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" className="form-control" value={user.name} disabled />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="text" className="form-control" value={user.email} disabled />
            </div>
          </div>

          {/* CLIENT EXCLUSIVE FIELDS */}
          {user.role === 'CLIENT' && (
            <div className="form-group">
              <label htmlFor="comp">Company Name</label>
              <input
                type="text"
                id="comp"
                className="form-control"
                placeholder="e.g. Acme Corporation"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
              />
            </div>
          )}

          {/* FREELANCER EXCLUSIVE FIELDS */}
          {user.role === 'FREELANCER' && (
            <>
              <div className="form-group">
                <label htmlFor="sk">Skills (comma separated)</label>
                <input
                  type="text"
                  id="sk"
                  className="form-control"
                  placeholder="e.g. React, Spring Boot, Kafka, Docker"
                  value={skills}
                  onChange={e => setSkills(e.target.value)}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="form-group">
                  <label htmlFor="exp">Experience Summary</label>
                  <input
                    type="text"
                    id="exp"
                    className="form-control"
                    placeholder="e.g. 5 years in full-stack web development"
                    value={experience}
                    onChange={e => setExperience(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="port">Portfolio / GitHub Link</label>
                  <input
                    type="url"
                    id="port"
                    className="form-control"
                    placeholder="https://github.com/my-profile"
                    value={portfolio}
                    onChange={e => setPortfolio(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? 'Updating Profile...' : 'Save Profile Changes'}
          </button>
        </form>
      </div>

      {/* Profile Overview Card */}
      <div className="card" style={{ background: 'rgba(255, 255, 255, 0.02)' }}>
        <h3 style={{ fontFamily: 'var(--font-heading)', marginBottom: '1rem' }}>Account Summary</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>USER ID</span>
            <p style={{ fontWeight: '600' }}>#{user.id}</p>
          </div>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>ROLE</span>
            <p style={{ fontWeight: '600' }}>{user.role}</p>
          </div>
          {user.privileges && user.privileges.length > 0 && (
            <div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>DELEGATED PRIVILEGES</span>
              <p style={{ fontWeight: '600', color: 'var(--primary)' }}>{user.privileges.join(', ')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
