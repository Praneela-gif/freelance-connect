import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, api } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Client States
  const [clientProjects, setClientProjects] = useState([]);
  const [newProject, setNewProject] = useState({ title: '', description: '', budget: '', deadline: '', skills: '' });
  const [projectApps, setProjectApps] = useState({}); // map projectId -> list of applications

  // Freelancer States
  const [allProjects, setAllProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSkill, setSearchSkill] = useState('');
  const [myBids, setMyBids] = useState([]);
  const [myEarnings, setMyEarnings] = useState({ totalEarnings: 0, paymentCount: 0 });
  const [activeWork, setActiveWork] = useState([]);
  const [submission, setSubmission] = useState({ appId: '', url: '', notes: '' });

  // Admin / Assistant States
  const [usersList, setUsersList] = useState([]);
  const [activeDelegations, setActiveDelegations] = useState([]);
  const [assistantsList, setAssistantsList] = useState([]);
  const [delegationForm, setDelegationForm] = useState({ assistantEmail: '', privilege: 'MANAGE_USERS', durationMinutes: '' });

  // Load contextual dashboard data based on role
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role === 'CLIENT') {
      setActiveTab('my-projects');
      fetchClientProjects();
    } else if (user.role === 'FREELANCER') {
      setActiveTab('browse-jobs');
      fetchFreelancerData();
    } else if (user.role === 'ADMIN' || user.role === 'ASSISTANT') {
      if (user.role === 'ADMIN') {
        setActiveTab('manage-users');
        fetchAdminData();
      } else {
        const privs = user.privileges || [];
        if (privs.includes('MANAGE_USERS')) {
          setActiveTab('manage-users');
          fetchUsers();
        } else if (privs.includes('REMOVE_PROJECTS')) {
          setActiveTab('moderate-projects');
          fetchModerateProjects();
        } else {
          setActiveTab('no-privileges');
        }
      }
    }
  }, [user]);

  // ==========================================
  // CLIENT HANDLERS
  // ==========================================
  const fetchClientProjects = async () => {
    try {
      const response = await api.get('/api/projects/client');
      setClientProjects(response.data);

      response.data.forEach(p => {
        fetchApplicationsForProject(p.projectId);
      });
    } catch (e) {
      console.error("Failed to load client projects", e);
    }
  };

  const fetchApplicationsForProject = async (projectId) => {
    try {
      const response = await api.get(`/api/applications/project/${projectId}`);
      setProjectApps(prev => ({ ...prev, [projectId]: response.data }));
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/api/projects', newProject);
      setSuccess('Job project posted successfully!');
      setNewProject({ title: '', description: '', budget: '', deadline: '', skills: '' });
      fetchClientProjects();
      setActiveTab('my-projects');
    } catch (err) {
      setError(err.response?.data || 'Failed to create project');
    }
  };

  const handleHire = async (projectId, application) => {
    setError('');
    setSuccess('');
    try {
      // Step 1: Update application status to ACCEPTED
      await api.put(`/api/applications/${application.id}/status?status=ACCEPTED`);
      // Step 2: Update project status to IN_PROGRESS and assign freelancer
      await api.put(`/api/projects/${projectId}/hire?freelancerId=${application.freelancerId}`);

      setSuccess('Freelancer hired successfully! Project is now In Progress.');
      fetchClientProjects();
    } catch (err) {
      setError('Hiring process failed');
    }
  };

  const handleReviewWork = async (appId, status) => {
    setError('');
    setSuccess('');
    try {
      await api.put(`/api/applications/${appId}/review-work`, {
        deliveryStatus: status,
        notes: `Work reviewed. Outcome: ${status}`
      });

      setSuccess(`Work reviewed successfully as: ${status}`);
      fetchClientProjects();
    } catch (err) {
      setError('Failed to review work');
    }
  };

  const handleCompleteProject = async (projectId) => {
    setError('');
    setSuccess('');
    try {
      await api.put(`/api/projects/${projectId}/complete`);
      setSuccess('Project marked as COMPLETED successfully!');
      fetchClientProjects();
    } catch (err) {
      setError('Failed to complete project');
    }
  };

  // ==========================================
  // FREELANCER HANDLERS
  // ==========================================
  const fetchFreelancerData = async () => {
    try {
      // 1. All open projects
      const projRes = await api.get('/api/projects');
      setAllProjects(projRes.data);

      // 2. Freelancer's applications
      const appsRes = await api.get('/api/applications/freelancer');
      setMyBids(appsRes.data);

      // 3. Active jobs (hired)
      const activeRes = await api.get('/api/projects/freelancer');
      const inProgress = activeRes.data.filter(p => p.status === 'IN_PROGRESS');
      const completed = activeRes.data.filter(p => p.status === 'COMPLETED');
      setActiveWork(inProgress);

      const totalVal = completed.reduce((acc, curr) => acc + (parseFloat(curr.budget) || 0), 0);
      setMyEarnings({ totalEarnings: totalVal, paymentCount: completed.length });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const response = await api.get(`/api/projects?query=${searchQuery}&skill=${searchSkill}`);
      setAllProjects(response.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.put(`/api/applications/${submission.appId}/submit-work`, {
        deliverableUrl: submission.url,
        notes: submission.notes
      });
      setSuccess('Deliverables submitted successfully!');
      setSubmission({ appId: '', url: '', notes: '' });
      fetchFreelancerData();
    } catch (err) {
      setError('Submission failed.');
    }
  };

  // ==========================================
  // ADMIN & ASSISTANT HANDLERS
  // ==========================================
  const fetchAdminData = async () => {
    fetchUsers();
    fetchModerateProjects();
    fetchDelegations();
    fetchAssistants();
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/users');
      setUsersList(response.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchModerateProjects = async () => {
    try {
      const response = await api.get('/api/projects');
      setAllProjects(response.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDelegations = async () => {
    try {
      const response = await api.get('/api/admin/delegations');
      setActiveDelegations(response.data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchAssistants = async () => {
    try {
      const response = await api.get('/api/admin/assistants');
      setAssistantsList(response.data);
      if (response.data.length > 0) {
        setDelegationForm(prev => ({ ...prev, assistantEmail: response.data[0].email }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleBlockUser = async (targetUserId, action) => {
    setError('');
    setSuccess('');
    try {
      await api.post(`/api/users/${targetUserId}/${action}`);
      setSuccess(`User accounts status updated to: ${action}ed`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data || 'Failed to update user block status');
    }
  };

  const handleModerateDeleteProject = async (projectId) => {
    setError('');
    setSuccess('');
    try {
      await api.delete(`/api/projects/${projectId}`);
      setSuccess('Project moderated and deleted.');
      fetchModerateProjects();
    } catch (err) {
      setError(err.response?.data || 'Failed to delete project');
    }
  };

  const handleSaveDelegation = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await api.post('/api/admin/delegate', {
        assistantEmail: delegationForm.assistantEmail,
        privilege: delegationForm.privilege,
        durationMinutes: delegationForm.durationMinutes ? parseInt(delegationForm.durationMinutes) : null
      });

      setSuccess('Assistant privileges delegated successfully!');
      fetchDelegations();
    } catch (err) {
      setError(err.response?.data || 'Failed to delegate privilege');
    }
  };

  const handleRevokeDelegation = async (delegationId) => {
    setError('');
    setSuccess('');
    try {
      await api.delete(`/api/admin/delegate/${delegationId}`);
      setSuccess('Assistant privilege revoked.');
      fetchDelegations();
    } catch (err) {
      setError('Failed to revoke delegation');
    }
  };

  const hasPrivilege = (privilege) => {
    if (user?.role === 'ADMIN') return true;
    if (user?.role === 'ASSISTANT' && user.privileges) {
      return user.privileges.includes(privilege);
    }
    return false;
  };

  return (
    <div className="dashboard-grid fade-in">
      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <h3 style={{ fontFamily: 'var(--font-heading)', color: 'var(--text-primary)' }}>Workspace</h3>
        <ul className="sidebar-menu">
          {/* CLIENT TABS */}
          {user?.role === 'CLIENT' && (
            <>
              <li className={`sidebar-item ${activeTab === 'my-projects' ? 'active' : ''}`} onClick={() => { setActiveTab('my-projects'); fetchClientProjects(); }}>
                📁 Posted Projects
              </li>
              <li className={`sidebar-item ${activeTab === 'post-project' ? 'active' : ''}`} onClick={() => setActiveTab('post-project')}>
                ✏️ Post a Project
              </li>
            </>
          )}

          {/* FREELANCER TABS */}
          {user?.role === 'FREELANCER' && (
            <>
              <li className={`sidebar-item ${activeTab === 'browse-jobs' ? 'active' : ''}`} onClick={() => { setActiveTab('browse-jobs'); fetchFreelancerData(); }}>
                🔍 Search Projects
              </li>
              <li className={`sidebar-item ${activeTab === 'my-bids' ? 'active' : ''}`} onClick={() => setActiveTab('my-bids')}>
                📝 My Active Bids
              </li>
              <li className={`sidebar-item ${activeTab === 'submit-work' ? 'active' : ''}`} onClick={() => setActiveTab('submit-work')}>
                🚀 Submit Deliverable
              </li>
            </>
          )}

          {/* ADMIN & ASSISTANT TABS */}
          {(user?.role === 'ADMIN' || user?.role === 'ASSISTANT') && (
            <>
              {hasPrivilege('MANAGE_USERS') && (
                <li className={`sidebar-item ${activeTab === 'manage-users' ? 'active' : ''}`} onClick={() => { setActiveTab('manage-users'); fetchUsers(); }}>
                  👥 Manage Users
                </li>
              )}
              {hasPrivilege('REMOVE_PROJECTS') && (
                <li className={`sidebar-item ${activeTab === 'moderate-projects' ? 'active' : ''}`} onClick={() => { setActiveTab('moderate-projects'); fetchModerateProjects(); }}>
                  🛡️ Moderate Projects
                </li>
              )}
              {user?.role === 'ADMIN' && (
                <li className={`sidebar-item ${activeTab === 'delegation-panel' ? 'active' : ''}`} onClick={() => { setActiveTab('delegation-panel'); fetchDelegations(); fetchAssistants(); }}>
                  🔑 Delegate Access
                </li>
              )}
            </>
          )}
        </ul>
      </aside>

      {/* DASHBOARD CONTENT BODY */}
      <main className="dashboard-content">
        {error && <div className="alert-banner alert-error"><span>⚠️</span> {error}</div>}
        {success && <div className="alert-banner alert-success"><span>✅</span> {success}</div>}

        {/* Tab 1: Client's Posted Projects */}
        {activeTab === 'my-projects' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: '1.5rem' }}>Your Job Postings</h2>
            {clientProjects.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>You haven't posted any projects yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                {clientProjects.map(project => {
                  const apps = projectApps[project.projectId] || [];
                  const hiredApp = apps.find(a => a.status === 'ACCEPTED');

                  return (
                    <div key={project.projectId} className="card" style={{ padding: '1.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 className="project-title">{project.title}</h3>
                        <span className={`badge badge-${project.status.toLowerCase()}`}>{project.status}</span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', margin: '10px 0' }}>{project.description}</p>
                      <div className="project-meta" style={{ margin: '5px 0 15px 0' }}>
                        <span>💰 Budget: ₹{parseFloat(project.budget).toLocaleString('en-IN')}</span>
                        <span>📅 Deadline: {project.deadline}</span>
                      </div>

                      {/* Review deliverables if active / in progress */}
                      {project.status === 'IN_PROGRESS' && hiredApp && (
                        <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)', marginTop: '1rem' }}>
                          <h4 style={{ color: 'var(--primary)', marginBottom: '8px' }}>Milestone Deliverable Reviews</h4>
                          {hiredApp.deliverableUrl ? (
                            <div>
                              <p style={{ fontSize: '0.9rem' }}>
                                <strong>Link: </strong>
                                <a href={hiredApp.deliverableUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline' }}>
                                  {hiredApp.deliverableUrl}
                                </a>
                              </p>
                              <p style={{ fontSize: '0.9rem', margin: '5px 0' }}><strong>Notes: </strong>{hiredApp.deliveryNotes}</p>
                              <p style={{ fontSize: '0.9rem', marginBottom: '10px' }}>
                                <strong>Status: </strong>
                                <span style={{ fontWeight: 'bold', color: 'var(--warning)' }}>{hiredApp.deliveryStatus || 'SUBMITTED'}</span>
                              </p>

                              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                                <button className="btn btn-primary" onClick={() => handleReviewWork(hiredApp.id, 'APPROVED')}>
                                  Approve Work
                                </button>
                                <button className="btn btn-secondary" onClick={() => handleReviewWork(hiredApp.id, 'CHANGES_REQUESTED')}>
                                  Request Changes
                                </button>
                                <button className="btn btn-danger" onClick={() => handleReviewWork(hiredApp.id, 'REJECTED')}>
                                  Reject Deliverable
                                </button>
                              </div>

                              {hiredApp.deliveryStatus === 'APPROVED' && (
                                <div style={{ marginTop: '15px' }}>
                                  <button
                                    className="btn btn-primary"
                                    style={{ background: 'var(--secondary-gradient)', boxShadow: '0 4px 14px rgba(16, 185, 129, 0.2)' }}
                                    onClick={() => handleCompleteProject(project.projectId)}
                                  >
                                    ✅ Complete & Close Project
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p style={{ fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Freelancer has not uploaded source code or files yet.</p>
                          )}
                        </div>
                      )}

                      {/* Display Applications/Bids (OPEN status only) */}
                      {project.status === 'OPEN' && (
                        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                          <h4 style={{ marginBottom: '10px' }}>Applications ({apps.length})</h4>
                          {apps.length === 0 ? (
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No active bids on this project.</p>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                              {apps.map(app => (
                                <div key={app.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h5>Freelancer ID: {app.freelancerId}</h5>
                                    <strong style={{ color: 'var(--primary)' }}>₹{parseFloat(app.bidAmount).toLocaleString('en-IN')}</strong>
                                  </div>
                                  <p style={{ fontSize: '0.9rem', margin: '8px 0', color: 'var(--text-secondary)' }}>
                                    {app.proposal}
                                  </p>
                                  <button onClick={() => handleHire(project.projectId, app)} className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.85rem' }}>
                                    Accept Proposal & Hire
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Client Post Project Form */}
        {activeTab === 'post-project' && (
          <div style={{ maxWidth: '600px' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: '1.5rem' }}>Post a New Job</h2>
            <form onSubmit={handleCreateProject} className="card">
              <div className="form-group">
                <label>Project Title</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="Need React Developer for Freelance App"
                  value={newProject.title}
                  onChange={e => setNewProject({ ...newProject, title: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Job Description</label>
                <textarea
                  required
                  className="form-control"
                  placeholder="Detail the scope of work, technical guidelines, and requirements..."
                  value={newProject.description}
                  onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div className="form-group">
                  <label>Budget (₹)</label>
                  <input
                    type="number"
                    required
                    className="form-control"
                    placeholder="50000"
                    value={newProject.budget}
                    onChange={e => setNewProject({ ...newProject, budget: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Deadline Date</label>
                  <input
                    type="date"
                    required
                    className="form-control"
                    value={newProject.deadline}
                    onChange={e => setNewProject({ ...newProject, deadline: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Required Skills (comma separated)</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  placeholder="React, Spring Boot, MySQL"
                  value={newProject.skills}
                  onChange={e => setNewProject({ ...newProject, skills: e.target.value })}
                />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
                Publish Project
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Freelancer Browse Projects */}
        {activeTab === 'browse-jobs' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)' }}>Browse Open Jobs</h2>

            <form onSubmit={handleSearch} style={{ display: 'flex', gap: '15px', margin: '1.5rem 0' }}>
              <input
                type="text"
                className="form-control"
                placeholder="Search description/title..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <input
                type="text"
                className="form-control"
                placeholder="Filter by skill (e.g. React)..."
                value={searchSkill}
                onChange={e => setSearchSkill(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">Search</button>
            </form>

            {allProjects.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>No jobs match your search keywords.</p>
            ) : (
              <div className="projects-grid">
                {allProjects.filter(p => p.status === 'OPEN').map(project => (
                  <div key={project.projectId} className="card project-card">
                    <span className="badge badge-open" style={{ marginBottom: '10px' }}>{project.status}</span>
                    <h3 className="project-title">{project.title}</h3>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', minHeight: '60px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {project.description}
                    </p>
                    <div className="project-meta">
                      <span>💰 ₹{parseFloat(project.budget).toLocaleString('en-IN')}</span>
                      <span>📅 {project.deadline}</span>
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '1.2rem' }}>
                      {project.skills.split(',').map((skill, index) => (
                        <span key={index} style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                          {skill.trim()}
                        </span>
                      ))}
                    </div>
                    <Link to={`/project/${project.projectId}`} className="btn btn-primary" style={{ width: '100%' }}>
                      Apply Now
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Freelancer Bids */}
        {activeTab === 'my-bids' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: '1.5rem' }}>Your Bids & Proposals</h2>
            {myBids.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>You haven't bid on any projects yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {myBids.map(bid => (
                  <div key={bid.id} className="card" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4>Project ID: #{bid.projectId}</h4>
                      <span className={`badge badge-${bid.status.toLowerCase()}`}>{bid.status}</span>
                    </div>
                    <p style={{ margin: '10px 0', fontSize: '0.95rem' }}><strong>Proposal: </strong>{bid.proposal}</p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      <span>💸 Your Bid: ₹{parseFloat(bid.bidAmount).toLocaleString('en-IN')}</span>
                      <span>📅 Submitted: {new Date(bid.submittedAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Freelancer Submit deliverables */}
        {activeTab === 'submit-work' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: '1.5rem' }}>Active Work & Deliverables</h2>
            
            {/* Project Metrics Widget */}
            <div className="card" style={{ padding: '1.2rem', marginBottom: '2rem', display: 'inline-flex', gap: '2rem', background: 'var(--primary-gradient)' }}>
              <div>
                <span style={{ fontSize: '0.8rem', opacity: '0.8', textTransform: 'uppercase' }}>Completed Project Volume</span>
                <h3 style={{ fontSize: '1.8rem', marginTop: '4px' }}>₹{myEarnings.totalEarnings.toLocaleString('en-IN')}</h3>
              </div>
              <div style={{ borderLeft: '1px solid rgba(255,255,255,0.2)', paddingLeft: '2rem' }}>
                <span style={{ fontSize: '0.8rem', opacity: '0.8', textTransform: 'uppercase' }}>Completed Jobs</span>
                <h3 style={{ fontSize: '1.8rem', marginTop: '4px' }}>{myEarnings.paymentCount}</h3>
              </div>
            </div>

            {activeWork.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)' }}>You don't have any active project contracts in progress.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                {activeWork.map(project => {
                  const correspondingBid = myBids.find(b => b.projectId === project.projectId && b.status === 'ACCEPTED');
                  return (
                    <div key={project.projectId} className="card">
                      <h3 className="project-title">{project.title}</h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '5px 0' }}>Client User: #{project.clientId}</p>
                      
                      {correspondingBid && (
                        <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                          <h4 style={{ marginBottom: '10px', color: 'var(--primary)' }}>Submit Source Code / Deliverables</h4>
                          <form onSubmit={handleSubmitWork}>
                            <div className="form-group">
                              <label>Deliverables URL (e.g. GitHub Repository, ZIP cloud link)</label>
                              <input
                                type="url"
                                required
                                className="form-control"
                                placeholder="https://github.com/freelancer/myproject"
                                value={submission.appId === String(correspondingBid.id) ? submission.url : ''}
                                onChange={e => setSubmission({ appId: String(correspondingBid.id), url: e.target.value, notes: submission.notes })}
                              />
                            </div>
                            <div className="form-group">
                              <label>Submission Comments / Notes</label>
                              <textarea
                                required
                                className="form-control"
                                placeholder="Describe components built, architecture, and deployment instructions..."
                                value={submission.appId === String(correspondingBid.id) ? submission.notes : ''}
                                onChange={e => setSubmission({ appId: String(correspondingBid.id), url: submission.url, notes: e.target.value })}
                              />
                            </div>
                            <button
                              type="submit"
                              className="btn btn-primary"
                              style={{ width: '100%' }}
                              onClick={() => setSubmission(prev => ({ ...prev, appId: String(correspondingBid.id) }))}
                            >
                              Submit Work
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Admin / Assistant Manage Users */}
        {activeTab === 'manage-users' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: '1rem' }}>User Accounts Management</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {usersList.map(u => (
                  <tr key={u.id}>
                    <td>#{u.id}</td>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td><span className="badge badge-completed" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)' }}>{u.role}</span></td>
                    <td>
                      {u.blocked ? (
                        <span className="badge badge-rejected">Blocked</span>
                      ) : (
                        <span className="badge badge-accepted">Active</span>
                      )}
                    </td>
                    <td>
                      {u.blocked ? (
                        <button onClick={() => handleBlockUser(u.id, 'unblock')} className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.8rem', background: 'var(--secondary-gradient)' }}>
                          Unblock User
                        </button>
                      ) : (
                        <button onClick={() => handleBlockUser(u.id, 'block')} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.8rem' }} disabled={u.role === 'ADMIN'}>
                          Block User
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 7: Admin / Assistant Moderate Projects */}
        {activeTab === 'moderate-projects' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: '1rem' }}>Moderation: Manage Published Projects</h2>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Budget</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {allProjects.map(p => (
                  <tr key={p.projectId}>
                    <td>#{p.projectId}</td>
                    <td>{p.title}</td>
                    <td>₹{parseFloat(p.budget).toLocaleString('en-IN')}</td>
                    <td>Client #{p.clientId}</td>
                    <td><span className={`badge badge-${p.status.toLowerCase()}`}>{p.status}</span></td>
                    <td>
                      <button onClick={() => handleModerateDeleteProject(p.projectId)} className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.8rem' }}>
                        Remove Project
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 8: Admin-Only Privilege Delegation */}
        {activeTab === 'delegation-panel' && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', marginBottom: '1.5rem' }}>Delegate Assistant Access</h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              <form onSubmit={handleSaveDelegation} className="card">
                <h3 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Create Privilege Rule</h3>
                
                <div className="form-group">
                  <label>Select Assistant Account</label>
                  {assistantsList.length === 0 ? (
                    <p style={{ color: 'var(--danger)', fontSize: '0.9rem' }}>No assistant accounts registered.</p>
                  ) : (
                    <select
                      className="form-control"
                      value={delegationForm.assistantEmail}
                      onChange={e => setDelegationForm({ ...delegationForm, assistantEmail: e.target.value })}
                    >
                      {assistantsList.map(a => (
                        <option key={a.id} value={a.email}>{a.name} ({a.email})</option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="form-group">
                  <label>Select Administrative Privilege</label>
                  <select
                    className="form-control"
                    value={delegationForm.privilege}
                    onChange={e => setDelegationForm({ ...delegationForm, privilege: e.target.value })}
                  >
                    <option value="MANAGE_USERS">MANAGE_USERS (Block/Unblock users)</option>
                    <option value="REMOVE_PROJECTS">REMOVE_PROJECTS (Delete flagged projects)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Authorization Lifespan (Minutes, blank for permanent)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 60"
                    value={delegationForm.durationMinutes}
                    onChange={e => setDelegationForm({ ...delegationForm, durationMinutes: e.target.value })}
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={assistantsList.length === 0}>
                  Authorize Assistant
                </button>
              </form>

              {/* Active list */}
              <div className="card">
                <h3 style={{ marginBottom: '1rem' }}>Active Authorization List</h3>
                {activeDelegations.length === 0 ? (
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>No delegations defined.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {activeDelegations.filter(d => d.active).map(del => (
                      <div key={del.id} style={{ background: 'rgba(255,255,255,0.02)', padding: '1rem', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <strong>Assistant: {del.assistant?.name || 'Assistant'}</strong>
                          <button onClick={() => handleRevokeDelegation(del.id)} className="btn btn-danger" style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
                            Revoke
                          </button>
                        </div>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '5px' }}>
                          Permission: <code style={{ color: 'var(--primary)' }}>{del.privilege}</code>
                        </p>
                        {del.expiresAt && (
                          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            Expires: {new Date(del.expiresAt).toLocaleTimeString()}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 9: No privileges delegated view for assistant */}
        {activeTab === 'no-privileges' && (
          <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h2>No Delegated Authority</h2>
            <p style={{ color: 'var(--text-secondary)', marginTop: '10px' }}>
              You are signed in as an Assistant, but the Administrator has not granted you any active privileges yet.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
