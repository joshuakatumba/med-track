import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  Activity, 
  CheckCircle, 
  Clock, 
  Plus, 
  Search, 
  Trash2, 
  UserPlus,
  ArrowRight,
  Filter,
  LayoutDashboard
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithCustomToken
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  serverTimestamp 
} from 'firebase/firestore';

// --- Firebase Configuration & Initialization ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

// Collection Reference Helper
const getCollectionRef = () => {
  return collection(db, 'artifacts', appId, 'public', 'data', 'patient_visits');
};

const SERVICES = [
  "General Consultation",
  "Laboratory",
  "Pharmacy",
  "Dental",
  "Maternity",
  "Emergency",
  "Triage"
];

/**
 * Main Application Component
 * Handles Patient Tracking with a blue/light-blue professional theme.
 */
export default function App() {
  const [user, setUser] = useState(null);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('dashboard'); // 'dashboard' or 'list'
  
  // Form State
  const [patientName, setPatientName] = useState('');
  const [selectedService, setSelectedService] = useState(SERVICES[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- Authentication ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth initialization failed:", error);
        // Fallback to anonymous if custom token fails
        try {
          await signInAnonymously(auth);
        } catch (anonError) {
          console.error("Critical: Anonymous auth fallback failed", anonError);
        }
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // --- Data Sync ---
  useEffect(() => {
    if (!user) return;

    const collRef = getCollectionRef();
    const unsubscribe = onSnapshot(collRef, 
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date()
        }));
        
        // Sort in memory (Rule 2: No complex Firestore queries)
        data.sort((a, b) => b.createdAt - a.createdAt);
        
        setVisits(data);
        setLoading(false);
      },
      (error) => {
        console.error("Firestore sync error:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // --- Actions ---
  const handleCheckIn = async (e) => {
    e.preventDefault();
    if (!patientName.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await addDoc(getCollectionRef(), {
        name: patientName,
        service: selectedService,
        status: 'waiting',
        createdAt: serverTimestamp(),
        createdBy: user.uid
      });
      setPatientName('');
    } catch (err) {
      console.error("Error adding document:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const markAsSeen = async (id) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'patient_visits', id);
      await updateDoc(docRef, { status: 'seen', seenAt: serverTimestamp() });
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const deleteVisit = async (id) => {
    // Custom UI for confirm is preferred, but for logic clarity:
    const confirmed = window.confirm('Are you sure you want to remove this record?');
    if (!confirmed || !user) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'patient_visits', id);
      await deleteDoc(docRef);
    } catch (err) {
      console.error("Error deleting:", err);
    }
  };

  // --- Derived Stats (JS side filtering) ---
  const stats = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const todayVisits = visits.filter(v => v.createdAt >= startOfDay);
    const totalToday = todayVisits.length;
    const waitingToday = todayVisits.filter(v => v.status === 'waiting').length;
    const seenToday = todayVisits.filter(v => v.status === 'seen').length;

    const byService = todayVisits.reduce((acc, curr) => {
      acc[curr.service] = (acc[curr.service] || 0) + 1;
      return acc;
    }, {});

    return { totalToday, waitingToday, seenToday, byService, todayVisits };
  }, [visits]);


  if (loading) {
    return (
      <div className="min-h-screen bg-sky-50 flex items-center justify-center">
        <div className="animate-spin text-blue-600">
          <Activity size={48} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-sky-50/30 font-sans text-slate-800">
      {/* Navbar */}
      <nav className="bg-slate-900 shadow-lg sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg text-white shadow-blue-500/20 shadow-lg">
                <Activity size={20} />
              </div>
              <h1 className="text-xl font-bold text-white tracking-tight hidden sm:block">
                Med<span className="text-sky-400">Track</span>
              </h1>
            </div>
            
            <div className="flex bg-slate-800 p-1 rounded-xl">
              <button 
                onClick={() => setView('dashboard')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  view === 'dashboard' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <LayoutDashboard size={16} />
                Dashboard
              </button>
              <button 
                onClick={() => setView('list')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                  view === 'list' 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Users size={16} />
                All Logs
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {view === 'dashboard' && (
          <div className="space-y-8">
            {/* Header / Date */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <CheckCircle className="text-blue-600" size={24} />
                  Facility Overview
                </h2>
                <span className="text-sm font-medium text-blue-600 bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">
                  {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-lg shadow-blue-900/5 border border-slate-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <CheckCircle size={80} className="text-blue-600" />
                  </div>
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2 block">Seen Today</span>
                  <div className="flex items-baseline gap-2">
                    <div className="text-5xl font-extrabold text-slate-900">{stats.seenToday}</div>
                    <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-md">Completed</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1 mt-4 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full transition-all duration-700" style={{ width: stats.totalToday ? `${(stats.seenToday/stats.totalToday)*100}%` : '0%' }}></div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-lg shadow-blue-900/5 border border-slate-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Clock size={80} className="text-sky-500" />
                  </div>
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2 block">Pending</span>
                  <div className="flex items-baseline gap-2">
                    <div className="text-5xl font-extrabold text-slate-900">{stats.waitingToday}</div>
                    <span className="text-sm font-medium text-sky-600 bg-sky-50 px-2 py-1 rounded-md">In Queue</span>
                  </div>
                   <div className="w-full bg-slate-100 h-1 mt-4 rounded-full overflow-hidden">
                    <div className="bg-sky-400 h-full transition-all duration-700" style={{ width: stats.totalToday ? `${(stats.waitingToday/stats.totalToday)*100}%` : '0%' }}></div>
                  </div>
                </div>

                 <div className="bg-white p-6 rounded-2xl shadow-lg shadow-blue-900/5 border border-slate-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Users size={80} className="text-slate-600" />
                  </div>
                  <span className="text-slate-500 text-xs font-bold uppercase tracking-widest mb-2 block">Total Traffic</span>
                  <div className="flex items-baseline gap-2">
                    <div className="text-5xl font-extrabold text-slate-900">{stats.totalToday}</div>
                    <span className="text-sm font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded-md">Arrivals</span>
                  </div>
                   <div className="w-full bg-slate-100 h-1 mt-4 rounded-full overflow-hidden">
                    <div className="bg-slate-800 h-full w-full"></div>
                  </div>
                </div>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Form Section */}
                <section className="bg-white rounded-2xl shadow-lg shadow-blue-900/5 border border-slate-100 overflow-hidden">
                  <div className="p-5 border-b border-slate-100 bg-sky-50/30 flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                      <UserPlus size={20} />
                    </div>
                    <h3 className="font-bold text-slate-800">New Patient Entry</h3>
                  </div>
                  <div className="p-6">
                    <form onSubmit={handleCheckIn} className="flex flex-col sm:flex-row gap-4 items-end">
                      <div className="flex-1 w-full space-y-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase">Patient Name</label>
                        <input
                          type="text"
                          required
                          value={patientName}
                          onChange={(e) => setPatientName(e.target.value)}
                          placeholder="Full Name"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-sky-50/50"
                        />
                      </div>
                      <div className="flex-1 w-full space-y-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase">Service</label>
                        <select
                          value={selectedService}
                          onChange={(e) => setSelectedService(e.target.value)}
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-sky-50/50"
                        >
                          {SERVICES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        <Plus size={20} />
                        Register
                      </button>
                    </form>
                  </div>
                </section>

                {/* Queue Section */}
                <section>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 px-1">
                    <Clock size={20} className="text-slate-400" />
                    Live Waiting List
                  </h3>
                  
                  {stats.todayVisits.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-sky-100">
                      <Users size={48} className="mx-auto text-sky-200 mb-3" />
                      <p className="text-slate-400">The queue is currently empty.</p>
                    </div>
                  ) : (
                    <div className="bg-white rounded-2xl shadow-lg shadow-blue-900/5 border border-slate-100 overflow-hidden divide-y divide-slate-100">
                      {stats.todayVisits.map((visit) => (
                        <div key={visit.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-sky-50/30 transition-colors">
                          <div className="flex items-center gap-4">
                             <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                               visit.status === 'seen' 
                               ? 'bg-blue-100 text-blue-600' 
                               : 'bg-sky-100 text-sky-600'
                             }`}>
                               {visit.name.charAt(0).toUpperCase()}
                             </div>
                            <div>
                              <p className="font-bold text-slate-800 text-lg leading-tight">{visit.name}</p>
                              <div className="flex items-center gap-2 mt-1 text-sm font-medium">
                                <span className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">{visit.service}</span>
                                <span className="text-slate-300">•</span>
                                <span className="text-slate-500">{visit.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {visit.status === 'waiting' ? (
                              <button
                                onClick={() => markAsSeen(visit.id)}
                                className="flex-1 sm:flex-none px-5 py-2.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                              >
                                <CheckCircle size={18} />
                                Check Out
                              </button>
                            ) : (
                              <span className="flex items-center gap-2 text-blue-600 bg-blue-50 border border-blue-100 text-sm font-bold px-4 py-2 rounded-xl">
                                <CheckCircle size={18} />
                                Completed
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>

              {/* Sidebar Stats */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-lg shadow-blue-900/5 border border-slate-100">
                  <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Activity size={20} className="text-blue-600"/>
                    Department Load
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(stats.byService).map(([service, count]) => (
                      <div key={service}>
                        <div className="flex items-center justify-between mb-1.5 text-sm">
                          <span className="font-medium text-slate-600">{service}</span>
                          <span className="font-bold text-slate-900">{count}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                            style={{ width: `${(count / stats.totalToday) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    {stats.totalToday === 0 && (
                      <p className="text-sm text-slate-400 italic text-center py-4">Waiting for data...</p>
                    )}
                  </div>
                </div>

                <div className="bg-slate-900 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden">
                  <div className="absolute -bottom-4 -right-4 opacity-10">
                    <Activity size={100} />
                  </div>
                  <h3 className="font-bold text-lg mb-4 relative z-10">Live Status</h3>
                  <div className="space-y-3 relative z-10 text-slate-300 text-sm">
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span>Server Sync</span>
                      <span className="text-sky-400 font-bold">Active</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Database</span>
                      <span className="text-sky-400 font-bold">Connected</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'list' && (
          <div className="bg-white rounded-2xl shadow-lg shadow-blue-900/5 border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-200 bg-sky-50/30 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <LayoutDashboard className="text-blue-600" size={20} />
                Historical Logs
              </h3>
              <div className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">
                {visits.length} Total Records
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/50">
                    <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">Date / Time</th>
                    <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">Patient Name</th>
                    <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">Department</th>
                    <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest">Status</th>
                    <th className="px-6 py-4 font-bold uppercase text-[10px] tracking-widest text-right">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visits.map((visit) => (
                    <tr key={visit.id} className="hover:bg-sky-50/30 transition-colors group">
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        <span className="font-bold text-slate-700">{visit.createdAt.toLocaleDateString()}</span>
                        <span className="block text-xs mt-0.5">{visit.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">{visit.name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-bold bg-sky-50 text-sky-700 border border-sky-100">
                          {visit.service}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                          visit.status === 'seen' 
                            ? 'bg-blue-50 text-blue-700 border-blue-100' 
                            : 'bg-sky-50 text-sky-700 border-sky-100'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${visit.status === 'seen' ? 'bg-blue-600' : 'bg-sky-400'}`} />
                          {visit.status === 'seen' ? 'Completed' : 'Waiting'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => deleteVisit(visit.id)}
                          className="text-slate-300 hover:text-rose-600 p-2 rounded-lg hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}