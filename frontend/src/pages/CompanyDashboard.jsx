import { Building2, ExternalLink, FileText, Plus, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';

const EMPTY_JOB = {
  role_title: '',
  description: '',
  package_lpa: '',
  min_cgpa: '',
  max_backlogs: '0',
  allowed_branches: 'ALL',
};

export default function CompanyDashboard() {
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newJob, setNewJob] = useState(EMPTY_JOB);
  const [offerDrafts, setOfferDrafts] = useState({});
  const [interviewDrafts, setInterviewDrafts] = useState({});
  const [interviewNotes, setInterviewNotes] = useState({});

  const loadAll = async () => {
    const [jobsRes, appsRes] = await Promise.all([api.get('/jobs/mine'), api.get('/applications/company/mine')]);
    setJobs(jobsRes.data);
    setApplications(appsRes.data);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const createJob = async (e) => {
    e.preventDefault();
    await api.post('/jobs', {
      ...newJob,
      package_lpa: parseFloat(newJob.package_lpa) || 0,
      min_cgpa: parseFloat(newJob.min_cgpa) || 0,
      max_backlogs: parseInt(newJob.max_backlogs) || 0,
      allowed_branches: newJob.allowed_branches.trim() || 'ALL',
    });
    setNewJob(EMPTY_JOB);
    setShowForm(false);
    await loadAll();
  };

  const setAppStatus = async (applicationId, status) => {
    await api.patch(`/applications/${applicationId}/status`, { status });
    await loadAll();
  };

  const scheduleInterview = async (applicationId) => {
    const when = interviewDrafts[applicationId];
    if (!when) {
      alert('Please select an interview date and time.');
      return;
    }
    const notes = interviewNotes[applicationId] || 'Technical Round';
    await api.post('/interviews/schedule', {
      application_id: applicationId,
      scheduled_at: new Date(when).toISOString(),
      notes,
    });
    await loadAll();
  };

  const recordResult = async (applicationId, result) => {
    await api.patch(`/interviews/${applicationId}/result`, { result });
    await loadAll();
  };

  const issueOffer = async (applicationId) => {
    const pkg = parseFloat(offerDrafts[applicationId]);
    if (!pkg) {
      alert('Please enter a valid package in LPA.');
      return;
    }
    try {
      await api.post('/offers', { application_id: applicationId, package_lpa: pkg });
      await loadAll();
    } catch (err) {
      alert(err?.response?.data?.detail || 'Failed to issue offer.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Job Posting */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-indigo-400 text-xl font-semibold">
            <Building2 /> Company Recruiter Portal
          </div>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="flex items-center gap-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition"
          >
            <Plus className="w-4 h-4" /> {showForm ? 'Cancel' : 'Post Placement Drive'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={createJob} className="bg-slate-900 p-5 rounded-lg grid grid-cols-2 gap-4 mb-4 border border-slate-700">
            <div className="col-span-2">
              <label className="text-xs text-slate-400">Role Title *</label>
              <input
                placeholder="e.g. Software Engineer, QA Specialist"
                value={newJob.role_title}
                onChange={(e) => setNewJob({ ...newJob, role_title: e.target.value })}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                required
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-slate-400">Job Description</label>
              <textarea
                placeholder="Key technical responsibilities and requirements..."
                value={newJob.description}
                onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                rows={2}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Package (LPA)</label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 8.5"
                value={newJob.package_lpa}
                onChange={(e) => setNewJob({ ...newJob, package_lpa: e.target.value })}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Minimum CGPA</label>
              <input
                type="number"
                step="0.01"
                placeholder="e.g. 7.00"
                value={newJob.min_cgpa}
                onChange={(e) => setNewJob({ ...newJob, min_cgpa: e.target.value })}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Max Active Backlogs Allowed</label>
              <input
                type="number"
                placeholder="0"
                value={newJob.max_backlogs}
                onChange={(e) => setNewJob({ ...newJob, max_backlogs: e.target.value })}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
                required
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Allowed Branches (Rule R4 Whitelist)</label>
              <input
                placeholder="e.g. Computer Science, Information Technology (or ALL)"
                value={newJob.allowed_branches}
                onChange={(e) => setNewJob({ ...newJob, allowed_branches: e.target.value })}
                className="w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white"
              />
            </div>
            <button
              type="submit"
              className="col-span-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg py-2.5 text-sm font-semibold text-white transition mt-2"
            >
              Publish Job Listing
            </button>
          </form>
        )}

        {/* Existing Jobs List */}
        <div className="space-y-2">
          {jobs.map((job) => (
            <div key={job.id} className="bg-slate-900 p-3.5 rounded-lg flex justify-between items-center text-sm border border-slate-800">
              <div>
                <div className="font-semibold text-white">{job.role_title}</div>
                <div className="text-xs text-slate-400 mt-1 flex gap-3">
                  <span><strong>{job.package_lpa} LPA</strong></span>
                  <span>Min CGPA: <strong>{job.min_cgpa}</strong></span>
                  <span>Max Backlogs: <strong>{job.max_backlogs}</strong></span>
                  <span>Branches: <strong className="text-indigo-400">{job.allowed_branches || 'ALL'}</strong></span>
                </div>
              </div>
              <span className="text-xs bg-emerald-950/60 text-emerald-300 border border-emerald-700 px-2.5 py-1 rounded-full">
                Active Drive
              </span>
            </div>
          ))}
          {jobs.length === 0 && <p className="text-slate-400 text-sm">No job listings posted yet.</p>}
        </div>
      </div>

      {/* Applicants Pipeline */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-indigo-400" /> Candidate Pipeline & Interview Funnel
        </h3>
        <div className="space-y-4">
          {applications.map((a) => (
            <div key={a.id} className="bg-slate-900 p-5 rounded-lg space-y-3 border border-slate-800">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <div className="font-semibold text-base text-white flex items-center gap-2">
                    {a.student_name}
                    {a.student_usn && (
                      <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                        {a.student_usn}
                      </span>
                    )}
                    <span className="text-xs text-slate-400 font-normal">for</span>
                    <span className="text-indigo-300 text-sm font-medium">{a.job_title}</span>
                  </div>
                  <div className="text-xs text-slate-400 flex gap-4">
                    <span>Branch: <strong className="text-slate-300">{a.student_branch || '-'}</strong></span>
                    <span>CGPA: <strong className="text-emerald-400">{a.student_cgpa}</strong></span>
                    <span>Active Backlogs: <strong className="text-slate-300">{a.student_backlogs}</strong></span>
                    {a.student_resume_url && (
                      <a
                        href={a.student_resume_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-400 hover:underline flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" /> Resume <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
                <StatusBadge status={a.status} />
              </div>

              {/* Stage 1: APPLIED -> Shortlist / Reject */}
              {a.status === 'APPLIED' && (
                <div className="flex gap-2 pt-1 border-t border-slate-800">
                  <button
                    onClick={() => setAppStatus(a.id, 'SHORTLISTED')}
                    className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 rounded-md text-xs font-medium text-white transition"
                  >
                    Shortlist Candidate
                  </button>
                  <button
                    onClick={() => setAppStatus(a.id, 'REJECTED')}
                    className="px-3 py-1.5 bg-rose-800 hover:bg-rose-700 rounded-md text-xs font-medium text-white transition"
                  >
                    Reject
                  </button>
                </div>
              )}

              {/* Stage 2: SHORTLISTED or INTERVIEW_SCHEDULED */}
              {(a.status === 'SHORTLISTED' || a.status === 'INTERVIEW_SCHEDULED') && !a.offer && (
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
                  <input
                    type="datetime-local"
                    onChange={(e) => setInterviewDrafts({ ...interviewDrafts, [a.id]: e.target.value })}
                    className="bg-slate-800 border border-slate-700 rounded-md px-2.5 py-1 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Interview Notes (e.g. Technical Round)"
                    onChange={(e) => setInterviewNotes({ ...interviewNotes, [a.id]: e.target.value })}
                    className="bg-slate-800 border border-slate-700 rounded-md px-2.5 py-1 text-xs text-white w-48"
                  />
                  <button
                    onClick={() => scheduleInterview(a.id)}
                    className="px-3 py-1 bg-sky-700 hover:bg-sky-600 rounded-md text-xs font-medium text-white transition"
                  >
                    {a.interview ? 'Reschedule Interview' : 'Schedule Interview'}
                  </button>

                  {/* Interview Result Recording */}
                  {a.interview && (
                    <div className="flex items-center gap-2 ml-auto">
                      <span className="text-xs text-slate-400">Result:</span>
                      <button
                        onClick={() => recordResult(a.id, 'PASS')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                          a.interview.result === 'PASS'
                            ? 'bg-emerald-600 text-white font-bold ring-1 ring-emerald-400'
                            : 'bg-emerald-950/80 text-emerald-300 border border-emerald-700 hover:bg-emerald-800'
                        }`}
                      >
                        PASS
                      </button>
                      <button
                        onClick={() => recordResult(a.id, 'FAIL')}
                        className={`px-3 py-1 rounded-md text-xs font-medium transition ${
                          a.interview.result === 'FAIL'
                            ? 'bg-rose-700 text-white font-bold ring-1 ring-rose-400'
                            : 'bg-rose-950/80 text-rose-300 border border-rose-800 hover:bg-rose-800'
                        }`}
                      >
                        FAIL
                      </button>
                    </div>
                  )}

                  {/* Stage 3: Offer Generation (Strictly Gated on PASS) */}
                  {a.interview && a.interview.result === 'PASS' && (
                    <div className="w-full flex items-center gap-2 pt-2 mt-1 border-t border-slate-800/60">
                      <span className="text-xs font-semibold text-emerald-400">Candidate Passed:</span>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="Offer Package (LPA)"
                        onChange={(e) => setOfferDrafts({ ...offerDrafts, [a.id]: e.target.value })}
                        className="w-36 bg-slate-800 border border-slate-700 rounded-md px-2.5 py-1 text-xs text-white"
                      />
                      <button
                        onClick={() => issueOffer(a.id)}
                        className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-500 rounded-md text-xs font-semibold text-white transition"
                      >
                        Issue Formal Offer
                      </button>
                    </div>
                  )}

                  {a.interview && a.interview.result !== 'PASS' && (
                    <div className="w-full text-[11px] text-amber-400/90 italic pt-1">
                      Offer cannot be issued until the interview result is explicitly marked PASS.
                    </div>
                  )}
                </div>
              )}

              {/* Offer Issued Details */}
              {a.offer && (
                <div className="text-xs text-slate-300 bg-slate-800/80 p-2.5 rounded-md flex justify-between items-center border border-slate-700/60">
                  <div>
                    Offer Package: <strong className="text-emerald-400">{a.offer.package_lpa} LPA</strong>
                    <span className="ml-3 text-slate-400">Issued on {new Date(a.offer.issued_at).toLocaleDateString()}</span>
                  </div>
                  <StatusBadge status={a.offer.status} />
                </div>
              )}
            </div>
          ))}
          {applications.length === 0 && <p className="text-slate-400 text-sm">No applicants yet.</p>}
        </div>
      </div>
    </div>
  );
}
