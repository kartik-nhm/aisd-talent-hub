import { BarChart3, Download, RefreshCw, Search, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import api from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';

export default function CoordinatorDashboard() {
  const [stats, setStats] = useState(null);
  const [applications, setApplications] = useState([]);
  const [students, setStudents] = useState([]);
  const [activeTab, setActiveTab] = useState('applications'); // 'applications' | 'students'
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const loadData = async () => {
    const [statsRes, appsRes, studentsRes] = await Promise.all([
      api.get('/coordinator/stats'),
      api.get('/coordinator/applications'),
      api.get('/coordinator/students'),
    ]);
    setStats(statsRes.data);
    setApplications(appsRes.data);
    setStudents(studentsRes.data);
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetPlacement = async (studentId, studentName) => {
    if (!confirm(`Are you sure you want to reset placement lock for ${studentName}?`)) return;
    try {
      await api.patch(`/coordinator/students/${studentId}/reset-placement`);
      alert(`Placement lock reset for ${studentName}. Candidate can now apply again.`);
      await loadData();
    } catch (err) {
      alert('Failed to reset placement lock.');
    }
  };

  const exportCSV = () => {
    const headers = ['Application ID', 'Student USN', 'Student Name', 'Branch', 'Company', 'Role', 'Status', 'Offer LPA'];
    const rows = applications.map((a) => [
      a.id,
      a.student_usn || '-',
      `"${a.student_name || ''}"`,
      a.student_branch || '-',
      `"${a.company_name || ''}"`,
      `"${a.job_title || ''}"`,
      a.status,
      a.offer ? a.offer.package_lpa : '-',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TalentHub_Placement_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!stats) return <p className="text-slate-400">Loading placement statistics...</p>;

  const filteredApplications = applications.filter((a) => {
    const matchesSearch =
      (a.student_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.student_usn || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.company_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.job_title || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const cards = [
    { label: 'Total Students', value: stats.total_students, color: 'text-indigo-400' },
    { label: 'Total Companies', value: stats.total_companies, color: 'text-indigo-400' },
    { label: 'Active Job Drives', value: stats.total_jobs, color: 'text-amber-400' },
    { label: 'Total Applications', value: stats.total_applications, color: 'text-slate-200' },
    { label: 'Offers Issued', value: stats.total_offers, color: 'text-emerald-400' },
    { label: 'Placed Students', value: stats.total_placed || stats.total_accepted, color: 'text-emerald-400' },
    { label: 'Placement %', value: `${stats.placement_percentage}%`, color: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-6">
      {/* Analytics Summary */}
      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2 text-indigo-400 text-xl font-semibold">
            <BarChart3 /> Placement Coordinator Governance & Analytics
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-xs font-semibold text-white transition"
          >
            <Download className="w-3.5 h-3.5" /> Export Report (CSV)
          </button>
        </div>
        <div className="grid grid-cols-4 gap-3.5">
          {cards.map((c) => (
            <div key={c.label} className="bg-slate-900 p-3.5 rounded-lg text-center border border-slate-800">
              <div className={`text-2xl font-bold ${c.color}`}>{c.value}</div>
              <div className="text-xs text-slate-400 mt-1">{c.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('applications')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === 'applications'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          All Applications ({applications.length})
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition ${
            activeTab === 'students'
              ? 'bg-indigo-600 text-white'
              : 'bg-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" /> Student Placement Roster ({students.length})
        </button>
      </div>

      {/* Tab 1: Applications */}
      {activeTab === 'applications' && (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
          <div className="flex justify-between items-center gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search by student name, USN, company, or job role..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-white"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPLIED">Applied</option>
              <option value="SHORTLISTED">Shortlisted</option>
              <option value="INTERVIEW_SCHEDULED">Interview Scheduled</option>
              <option value="OFFERED">Offered</option>
              <option value="ACCEPTED">Accepted</option>
              <option value="DECLINED">Declined</option>
              <option value="WITHDRAWN">Withdrawn</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-700">
                  <th className="py-2.5">Student / USN</th>
                  <th className="py-2.5">Branch</th>
                  <th className="py-2.5">Company</th>
                  <th className="py-2.5">Role</th>
                  <th className="py-2.5">Status</th>
                  <th className="py-2.5">Offer</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((a) => (
                  <tr key={a.id} className="border-b border-slate-800/80 hover:bg-slate-900/40">
                    <td className="py-2.5">
                      <div className="font-medium text-white">{a.student_name}</div>
                      <div className="text-xs font-mono text-slate-400">{a.student_usn || '-'}</div>
                    </td>
                    <td className="py-2.5 text-slate-300">{a.student_branch || '-'}</td>
                    <td className="py-2.5 text-slate-300">{a.company_name}</td>
                    <td className="py-2.5 text-slate-300">{a.job_title}</td>
                    <td className="py-2.5"><StatusBadge status={a.status} /></td>
                    <td className="py-2.5 text-slate-300">
                      {a.offer ? <strong className="text-emerald-400">{a.offer.package_lpa} LPA</strong> : '-'}
                    </td>
                  </tr>
                ))}
                {filteredApplications.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-slate-400">
                      No applications matching the specified criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Students Roster */}
      {activeTab === 'students' && (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-semibold text-lg text-white">Institutional Student Placement Roster</h3>
            <span className="text-xs text-slate-400">Total Registered: {students.length} students</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-700">
                  <th className="py-2.5">USN</th>
                  <th className="py-2.5">Student Name</th>
                  <th className="py-2.5">Branch</th>
                  <th className="py-2.5">CGPA</th>
                  <th className="py-2.5">Active Backlogs</th>
                  <th className="py-2.5">Placement Status</th>
                  <th className="py-2.5 text-right">Administrative Action</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s.id} className="border-b border-slate-800/80 hover:bg-slate-900/40">
                    <td className="py-2.5 font-mono text-xs text-indigo-300 font-semibold">{s.usn}</td>
                    <td className="py-2.5 font-medium text-white">{s.name}</td>
                    <td className="py-2.5 text-slate-300">{s.branch}</td>
                    <td className="py-2.5 text-emerald-400 font-semibold">{s.cgpa}</td>
                    <td className="py-2.5 text-slate-300">{s.active_backlogs}</td>
                    <td className="py-2.5">
                      {s.has_accepted_offer ? (
                        <span className="text-xs bg-emerald-950/80 text-emerald-300 border border-emerald-600 px-2.5 py-1 rounded-full font-semibold">
                          PLACED (Locked)
                        </span>
                      ) : (
                        <span className="text-xs bg-slate-800 text-slate-400 border border-slate-700 px-2.5 py-1 rounded-full">
                          Seeking
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      {s.has_accepted_offer && (
                        <button
                          onClick={() => resetPlacement(s.id, s.name)}
                          className="flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 bg-amber-950/40 border border-amber-800 px-2.5 py-1 rounded-md transition ml-auto"
                        >
                          <RefreshCw className="w-3 h-3" /> Reset Lock
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
