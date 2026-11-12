import { Briefcase, CheckCircle2, ExternalLink, FileText, GraduationCap, Trophy, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function StudentDashboard() {
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [message, setMessage] = useState(null);
  const [resumeUrl, setResumeUrl] = useState('');
  const [editingResume, setEditingResume] = useState(false);

  const loadAll = async () => {
    const [profileRes, jobsRes, appsRes] = await Promise.all([
      api.get('/students/me'),
      api.get('/jobs'),
      api.get('/applications/me'),
    ]);
    setProfile(profileRes.data);
    setResumeUrl(profileRes.data.resume_url || '');
    setJobs(jobsRes.data);
    setApplications(appsRes.data);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const appliedJobIds = new Set(
    applications.filter((a) => a.status !== 'WITHDRAWN').map((a) => a.job_id)
  );

  const apply = async (jobId) => {
    setMessage(null);
    try {
      await api.post('/applications', { job_id: jobId });
      setMessage({ ok: true, text: 'Application submitted successfully!' });
      await loadAll();
    } catch (err) {
      setMessage({ ok: false, text: err?.response?.data?.detail || 'Could not submit application.' });
    }
  };

  const withdraw = async (applicationId) => {
    if (!confirm('Are you sure you want to withdraw this application?')) return;
    try {
      await api.patch(`/applications/${applicationId}/withdraw`);
      setMessage({ ok: true, text: 'Application withdrawn successfully.' });
      await loadAll();
    } catch (err) {
      setMessage({ ok: false, text: err?.response?.data?.detail || 'Could not withdraw application.' });
    }
  };

  const respondToOffer = async (applicationId, accept) => {
    const promptText = accept
      ? 'Accepting this offer activates the One-Company Rule: all other applications will be withdrawn and no further applications will be allowed. Proceed?'
      : 'Are you sure you want to decline this offer?';
    if (!confirm(promptText)) return;
    try {
      await api.patch(`/offers/${applicationId}/respond`, { accept });
      setMessage({
        ok: true,
        text: accept ? 'Congratulations on accepting your placement offer!' : 'Offer declined.',
      });
      await loadAll();
    } catch (err) {
      setMessage({ ok: false, text: err?.response?.data?.detail || 'Could not process offer response.' });
    }
  };

  const saveResume = async () => {
    try {
      await api.patch('/students/me', { resume_url: resumeUrl });
      setEditingResume(false);
      setMessage({ ok: true, text: 'Resume URL updated successfully!' });
      await loadAll();
    } catch (err) {
      setMessage({ ok: false, text: 'Failed to update resume URL.' });
    }
  };

  if (!profile) return <p className="text-slate-400">Loading student profile...</p>;

  return (
    <div className="space-y-6">
      {/* Placed Celebratory Banner */}
      {profile.has_accepted_offer && (
        <div className="bg-gradient-to-r from-emerald-950/90 to-indigo-950/90 border border-emerald-500/50 rounded-xl p-5 flex items-center gap-4 text-emerald-200 shadow-lg">
          <Trophy className="w-10 h-10 text-amber-400 shrink-0" />
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Congratulations! You are officially Placed.
            </h2>
            <p className="text-xs text-emerald-300/90 mt-1">
              You have accepted a corporate placement offer this season. In accordance with the institutional
              <strong> One-Company Rule</strong>, all competing applications have been cleanly withdrawn, and further
              applications are locked to ensure fair placement opportunities for your peers.
            </p>
          </div>
        </div>
      )}

      {/* Student Profile Card */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-indigo-400 text-xl font-semibold">
            <GraduationCap /> Student Portal ({profile.name})
          </div>
          <span className="text-xs bg-indigo-950/80 text-indigo-300 border border-indigo-700 px-3 py-1 rounded-full font-mono">
            USN: {profile.usn}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-4 text-sm bg-slate-900/50 p-4 rounded-lg">
          <div><span className="text-slate-400">Branch:</span> <span className="font-medium">{profile.branch}</span></div>
          <div><span className="text-slate-400">CGPA:</span> <span className="font-medium text-emerald-400">{profile.cgpa}</span></div>
          <div><span className="text-slate-400">Active Backlogs:</span> <span className="font-medium">{profile.active_backlogs}</span></div>
          <div>
            <span className="text-slate-400">Status:</span>{' '}
            <span className={`font-semibold ${profile.has_accepted_offer ? 'text-emerald-400' : 'text-amber-400'}`}>
              {profile.has_accepted_offer ? 'PLACED' : 'SEEKING'}
            </span>
          </div>
        </div>

        {/* Resume Management */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-700/60">
          <div className="flex items-center gap-2 text-slate-400">
            <FileText className="w-4 h-4 text-indigo-400" />
            <span>Resume:</span>
            {profile.resume_url ? (
              <a
                href={profile.resume_url}
                target="_blank"
                rel="noreferrer"
                className="text-indigo-400 hover:underline flex items-center gap-1 font-mono"
              >
                {profile.resume_url} <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="italic text-slate-500">No resume URL linked yet</span>
            )}
          </div>
          {editingResume ? (
            <div className="flex gap-2 items-center">
              <input
                type="url"
                placeholder="https://..."
                value={resumeUrl}
                onChange={(e) => setResumeUrl(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200 w-64"
              />
              <button
                onClick={saveResume}
                className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 rounded text-xs text-white"
              >
                Save
              </button>
              <button
                onClick={() => setEditingResume(false)}
                className="px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-300"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingResume(true)}
              className="text-indigo-400 hover:underline text-xs"
            >
              {profile.resume_url ? 'Edit Resume URL' : '+ Add Resume URL'}
            </button>
          )}
        </div>
      </div>

      {message && (
        <div
          className={`p-4 rounded-lg flex items-center gap-3 ${
            message.ok
              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
              : 'bg-rose-950/80 text-rose-300 border border-rose-800'
          }`}
        >
          {message.ok ? <CheckCircle2 className="shrink-0" /> : <XCircle className="shrink-0" />}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {/* Job Listings with Rules R1-R4 Live Checking */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <h3 className="font-semibold text-lg flex items-center gap-2 mb-4">
          <Briefcase className="w-5 h-5 text-indigo-400" /> Active Placement Drives
        </h3>
        <div className="space-y-3">
          {jobs.map((job) => (
            <div key={job.id} className="bg-slate-900 p-4 rounded-lg flex justify-between items-center">
              <div className="space-y-1">
                <div className="font-medium text-base text-white">
                  {job.company_name} — <span className="text-indigo-300">{job.role_title}</span>
                </div>
                <div className="text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                  <span>Package: <strong className="text-slate-200">{job.package_lpa} LPA</strong></span>
                  <span>Min CGPA: <strong className="text-slate-200">{job.min_cgpa}</strong></span>
                  <span>Max Backlogs: <strong className="text-slate-200">{job.max_backlogs}</strong></span>
                  <span>Allowed Branches: <strong className="text-indigo-300">{job.allowed_branches || 'ALL'}</strong></span>
                </div>
                {!job.eligible && (
                  <div className="text-xs text-rose-400 font-medium">
                    {job.reason}
                  </div>
                )}
              </div>
              {appliedJobIds.has(job.id) ? (
                <span className="text-xs text-slate-400 px-3 py-1.5 bg-slate-800 rounded-md border border-slate-700">
                  Applied
                </span>
              ) : (
                <button
                  onClick={() => apply(job.id)}
                  disabled={!job.eligible || profile.has_accepted_offer}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-white text-sm font-medium transition"
                >
                  Apply
                </button>
              )}
            </div>
          ))}
          {jobs.length === 0 && <p className="text-slate-400 text-sm">No job listings available yet.</p>}
        </div>
      </div>

      {/* Applications List */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <h3 className="font-semibold text-lg mb-4">My Applications & Placement Track</h3>
        <div className="space-y-3">
          {applications.map((a) => (
            <div key={a.id} className="bg-slate-900 p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium text-white">{a.company_name} — {a.job_title}</div>
                  <div className="text-xs text-slate-400">
                    Applied on {new Date(a.applied_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {a.status === 'APPLIED' && (
                    <button
                      onClick={() => withdraw(a.id)}
                      className="text-xs text-rose-400 hover:underline px-2 py-1"
                    >
                      Withdraw
                    </button>
                  )}
                  <StatusBadge status={a.status} />
                </div>
              </div>

              {a.interview && (
                <div className="text-xs text-slate-400 bg-slate-800/60 p-2.5 rounded-md flex justify-between items-center">
                  <div>
                    Interview Scheduled: <span className="text-slate-200">{new Date(a.interview.scheduled_at).toLocaleString()}</span>
                    {a.interview.notes && <span className="ml-2 italic text-slate-400">({a.interview.notes})</span>}
                  </div>
                  <StatusBadge status={a.interview.result} />
                </div>
              )}

              {a.offer && a.status === 'OFFERED' && (
                <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-700/50 p-3 rounded-lg mt-2">
                  <div className="text-xs text-emerald-200">
                    <strong>Official Corporate Offer:</strong> {a.offer.package_lpa} LPA
                    {a.offer.secure_token && (
                      <span className="ml-2 font-mono text-[10px] text-emerald-400/80">Token: {a.offer.secure_token}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => respondToOffer(a.id, true)}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 rounded-md text-xs font-semibold text-white transition shadow"
                    >
                      Accept Offer
                    </button>
                    <button
                      onClick={() => respondToOffer(a.id, false)}
                      className="px-3 py-1.5 bg-rose-800 hover:bg-rose-700 rounded-md text-xs font-medium text-rose-200 transition"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {applications.length === 0 && <p className="text-slate-400 text-sm">You haven't applied to any jobs yet.</p>}
        </div>
      </div>
    </div>
  );
}
