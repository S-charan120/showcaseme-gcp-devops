import React from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const empty = { slug: '', displayName: '', headline: '', bio: '', profession: '', experience: [], skills: [], projects: [], templateKey: 'minimal' };
const tokenKey = 'showcaseme_access_token';

function App() {
  const [token, setToken] = React.useState(() => sessionStorage.getItem(tokenKey) || '');
  const [authMode, setAuthMode] = React.useState('register');
  const [auth, setAuth] = React.useState({ email: '', password: '' });
  const [user, setUser] = React.useState(null);
  const [items, setItems] = React.useState([]);
  const [portfolio, setPortfolio] = React.useState(empty);
  const [activeSlug, setActiveSlug] = React.useState('');
  const [publicData, setPublicData] = React.useState(null);
  const [mode, setMode] = React.useState('builder');
  const [notice, setNotice] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [experienceText, setExperienceText] = React.useState('');
  const [skillsText, setSkillsText] = React.useState('');
  const [projectsText, setProjectsText] = React.useState('');
  const querySlug = new URLSearchParams(window.location.search).get('portfolio');

  async function request(path, options = {}) {
    const headers = { ...(options.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) };
    const response = await fetch(path, { ...options, headers });
    const data = response.status === 204 ? null : await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.details?.join(', ') || data?.error || `Request failed (${response.status})`);
    return data;
  }
  async function refreshAccount() {
    if (!token) return;
    try {
      const [me, list] = await Promise.all([request('/api/me'), request('/api/portfolios')]);
      setUser(me); setItems(list.items || []);
      if (list.items?.length && !activeSlug) selectPortfolio(list.items[0]);
    } catch (error) { setToken(''); sessionStorage.removeItem(tokenKey); setUser(null); setNotice(error.message); }
  }
  React.useEffect(() => { if (token) refreshAccount(); }, [token]);
  React.useEffect(() => { if (querySlug) loadPublic(querySlug); }, []);
  function selectPortfolio(p) {
    setPortfolio({ slug: p.slug, displayName: p.displayName, headline: p.headline, bio: p.bio, profession: p.profession, experience: p.experience || [], skills: p.skills || [], projects: p.projects || [], templateKey: p.templateKey || 'minimal' });
    setActiveSlug(p.slug); setExperienceText((p.experience || []).map(x => [x.role,x.organization,x.period,x.description].join(' | ')).join('\n'));
    setSkillsText((p.skills || []).join(', ')); setProjectsText((p.projects || []).map(x => [x.title,x.description,x.url || ''].join(' | ')).join('\n'));
    setMode('builder');
  }
  function newPortfolio() {
    setPortfolio(empty); setActiveSlug(''); setExperienceText(''); setSkillsText(''); setProjectsText(''); setMode('builder'); setNotice('New portfolio draft.');
  }
  async function authenticate(e) {
    e.preventDefault(); setBusy(true); setNotice('');
    try {
      const data = await fetch(`/api/auth/${authMode}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(auth) }).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.details?.join(', ') || d.error); return d; });
      sessionStorage.setItem(tokenKey, data.accessToken); setToken(data.accessToken); setUser(data.user); setNotice('Signed in successfully.');
    } catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  }
  function parseRows(value, fields) {
    return value.split('\n').map(line => line.trim()).filter(Boolean).map(line => { const parts = line.split('|').map(x => x.trim()); return Object.fromEntries(fields.map((field, i) => [field, parts[i] || ''])); });
  }
  function buildPayload() {
    return { ...portfolio, skills: skillsText.split(',').map(x => x.trim()).filter(Boolean), experience: parseRows(experienceText, ['role','organization','period','description']), projects: parseRows(projectsText, ['title','description','url']) };
  }
  async function savePortfolio(e) {
    e.preventDefault(); if (!token) return setNotice('Sign in to save your portfolio.'); setBusy(true); setNotice('Saving draft…');
    try {
      const body = buildPayload();
      const saved = activeSlug ? await request(`/api/portfolios/${encodeURIComponent(activeSlug)}`, { method: 'PUT', body: JSON.stringify(body) }) : await request('/api/portfolios', { method: 'POST', body: JSON.stringify(body) });
      setActiveSlug(saved.slug); setPortfolio({ ...body });
      const list = await request('/api/portfolios'); setItems(list.items || []); setNotice('Draft saved. Publish it when you are ready.');
    } catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  }
  async function publish() {
    if (!activeSlug) return setNotice('Save the portfolio before publishing.'); setBusy(true);
    try { await request(`/api/portfolios/${encodeURIComponent(activeSlug)}/publish`, { method: 'POST' }); setItems((await request('/api/portfolios')).items || []); await loadPublic(activeSlug); setNotice('Portfolio published. Public preview is ready.'); setMode('preview'); }
    catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  }
  async function unpublish() {
    if (!activeSlug) return; setBusy(true);
    try { await request(`/api/portfolios/${encodeURIComponent(activeSlug)}/unpublish`, { method: 'POST' }); setItems((await request('/api/portfolios')).items || []); setNotice('Portfolio unpublished.'); }
    catch (error) { setNotice(error.message); }
    finally { setBusy(false); }
  }
  async function loadPublic(slug) {
    try { const data = await fetch(`/api/public/${encodeURIComponent(slug)}`).then(async r => { const d = await r.json(); if (!r.ok) throw new Error(d.error); return d; }); setPublicData(data); setMode('preview'); setNotice('Public portfolio loaded.'); }
    catch (error) { setPublicData(null); setNotice(error.message); }
  }
  async function removePortfolio() {
    if (!activeSlug || !window.confirm('Delete this portfolio permanently?')) return;
    try { await request(`/api/portfolios/${encodeURIComponent(activeSlug)}`, { method: 'DELETE' }); setItems((await request('/api/portfolios')).items || []); newPortfolio(); setNotice('Portfolio deleted.'); }
    catch (error) { setNotice(error.message); }
  }
  function logout() { sessionStorage.removeItem(tokenKey); setToken(''); setUser(null); setItems([]); setActiveSlug(''); setNotice('Signed out.'); }
  const isPublicHost = window.location.hostname.split('.').length > 2 && !['www','app','portfolio'].includes(window.location.hostname.split('.')[0]);
  React.useEffect(() => { if (isPublicHost && !querySlug) loadPublic(window.location.hostname.split('.')[0]); }, []);

  if (querySlug || isPublicHost) return <PublicPortfolio data={publicData} notice={notice}/>;
  return <main>
    <header><a className="brand" href="/">showcase<span>me</span></a><div className="nav"><button className={mode === 'builder' ? 'active' : ''} onClick={() => setMode('builder')}>Builder</button><button className={mode === 'preview' ? 'active' : ''} onClick={() => activeSlug ? loadPublic(activeSlug) : setNotice('Save and publish a portfolio first.')}>Preview</button></div><div className="account">{user ? <><span>{user.email}</span><button onClick={logout}>Sign out</button></> : <a href="#account">Sign in</a>}</div></header>
    <section className="hero"><div><p className="eyebrow">YOUR WORK, WELL TOLD</p><h1>Build a portfolio<br/>that <em>moves you forward.</em></h1><p className="lead">Bring your experience, skills and selected work together in one professional home on the web.</p></div><div className="hero-art"><div className="circle">S</div><span>PROFILE · WORK · IMPACT</span></div></section>
    {!user ? <section className="auth" id="account"><div><p className="eyebrow">START YOUR STORY</p><h2>Create your account</h2><p>Sign up to build and manage your public portfolio. Use a unique password and never reuse credentials from another service.</p></div><form onSubmit={authenticate}><div className="switch"><button type="button" className={authMode==='register'?'selected':''} onClick={() => setAuthMode('register')}>Create account</button><button type="button" className={authMode==='login'?'selected':''} onClick={() => setAuthMode('login')}>Sign in</button></div><label>Email<input type="email" value={auth.email} onChange={e=>setAuth({...auth,email:e.target.value})} required autoComplete="email"/></label><label>Password<input type="password" value={auth.password} onChange={e=>setAuth({...auth,password:e.target.value})} required minLength="12" maxLength="72" autoComplete={authMode==='register'?'new-password':'current-password'}/><small>Minimum 12 characters.</small></label><button className="primary" disabled={busy}>{busy?'Please wait…':authMode==='register'?'Create account':'Sign in'} ↗</button><p className="status">{notice}</p></form></section> : <section className="studio"><aside><div className="side-head"><div><p className="eyebrow">YOUR WORKSPACE</p><h3>My portfolios</h3></div><button onClick={newPortfolio}>＋ New</button></div>{items.map(p=><button className={'portfolio-item '+(activeSlug===p.slug?'chosen':'')} key={p.slug} onClick={()=>selectPortfolio(p)}><b>{p.displayName}</b><span>/{p.slug} · {p.published?'Published':'Draft'}</span></button>)}</aside><form className="editor" onSubmit={savePortfolio}><div className="editor-head"><div><p className="eyebrow">PORTFOLIO EDITOR</p><h2>{activeSlug?'Edit your portfolio':'Create a portfolio'}</h2></div><span className="state">{activeSlug?'SAVED PROFILE':'NEW DRAFT'}</span></div><div className="fields"><label>Public slug<input value={portfolio.slug} onChange={e=>setPortfolio({...portfolio,slug:e.target.value.toLowerCase()})} required minLength="3" maxLength="50" pattern="[a-z0-9-]+" disabled={Boolean(activeSlug)}/><small>Unique URL identity. Set it when creating; use a new portfolio to choose a different slug.</small></label><label>Display name<input value={portfolio.displayName} onChange={e=>setPortfolio({...portfolio,displayName:e.target.value})} maxLength="120" required/></label><label>Professional headline<input value={portfolio.headline} onChange={e=>setPortfolio({...portfolio,headline:e.target.value})} maxLength="180" placeholder="Cloud Platform Engineer"/></label><label>Profession / category<input value={portfolio.profession} onChange={e=>setPortfolio({...portfolio,profession:e.target.value})} maxLength="100" placeholder="Cloud Engineering"/></label><label className="wide">Professional summary<textarea rows="4" value={portfolio.bio} onChange={e=>setPortfolio({...portfolio,bio:e.target.value})} maxLength="4000"/></label><label className="wide">Experience — one per line: Role | Organization | Period | Description<textarea rows="4" value={experienceText} onChange={e=>setExperienceText(e.target.value)} placeholder="Cloud Engineer | Example Co | 2024–Present | Platform engineering"/></label><label className="wide">Skills — comma separated<input value={skillsText} onChange={e=>setSkillsText(e.target.value)} placeholder="GCP, Kubernetes, Terraform, Argo CD"/></label><label className="wide">Projects — one per line: Title | Description | HTTPS URL<textarea rows="4" value={projectsText} onChange={e=>setProjectsText(e.target.value)} placeholder="GKE GitOps Platform | Terraform, Helm, Argo CD | https://github.com/..."/></label><label>Portfolio template<select value={portfolio.templateKey} onChange={e=>setPortfolio({...portfolio,templateKey:e.target.value})}><option value="minimal">Minimal</option><option value="editorial">Editorial</option><option value="technical">Technical</option></select></label></div><div className="actions"><button className="primary" disabled={busy}>{busy?'Saving…':'Save draft'}</button><button type="button" className="secondary" disabled={busy||!activeSlug} onClick={publish}>Publish ↗</button><button type="button" className="secondary" disabled={busy||!activeSlug} onClick={unpublish}>Unpublish</button><button type="button" className="danger" disabled={busy||!activeSlug} onClick={removePortfolio}>Delete</button></div><p className="status" role="status">{notice}</p>{activeSlug && <p className="share">Public preview: <a href={`/?portfolio=${encodeURIComponent(activeSlug)}`} target="_blank" rel="noreferrer">{window.location.origin}/?portfolio={activeSlug}</a></p>}</form></section>}
    <footer><b>showcaseme</b><span>Portfolio building & publishing platform</span><span>GCP · GKE · GitOps</span></footer>
  </main>;
}

function PublicPortfolio({data,notice}) {
  if (!data) return <main className="public-shell"><a className="brand" href="/">showcase<span>me</span></a><p className="status">{notice || 'Loading portfolio…'}</p></main>;
  return <main className={`public-shell template-${data.templateKey}`}><a className="brand" href="/">showcase<span>me</span></a><section className="public-hero"><p className="eyebrow">{data.profession}</p><h1>{data.displayName}</h1><h2>{data.headline}</h2><p>{data.bio}</p></section><section className="public-section"><h3>Skills</h3><div className="chips">{data.skills.map(s=><span key={s}>{s}</span>)}</div></section><section className="public-section"><h3>Experience</h3>{data.experience.map((x,i)=><article className="entry" key={i}><b>{x.role}</b><span>{x.organization} · {x.period}</span><p>{x.description}</p></article>)}</section><section className="public-section"><h3>Selected projects</h3><div className="project-grid">{data.projects.map((p,i)=><article className="project" key={i}><b>{p.title}</b><p>{p.description}</p>{p.url && <a href={p.url} target="_blank" rel="noreferrer">View project ↗</a>}</article>)}</div></section><footer><span>Published with Showcaseme</span><a href="/">Create your own portfolio ↗</a></footer></main>;
}

createRoot(document.getElementById('root')).render(<App />);
