'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, ShieldCheck, Users, Activity, Settings, MapPin, Database, RefreshCw, Trash2, X, Camera, Globe, MonitorSmartphone, Clock, History, ChevronRight, Cpu, Wifi, Battery } from 'lucide-react';
import { logoutAdmin } from '../login/actions';
import { getTelemetryData, clearTelemetryData } from '../actions';

export default function AdminDashboard() {
  const router = useRouter();
  const [telemetry, setTelemetry] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Array of logs for a specific device (Full Screen View)
  const [selectedDeviceLogs, setSelectedDeviceLogs] = useState<any[] | null>(null);
  
  // Specific single session log (Nested Window View)
  const [selectedSession, setSelectedSession] = useState<any | null>(null);

  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      const data = await getTelemetryData();
      setTelemetry(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  const handleLogout = async () => {
    await logoutAdmin();
    router.push('/login');
  };

  const handleClear = async () => {
    await clearTelemetryData();
    setTelemetry([]);
    setSelectedDeviceLogs(null);
    setSelectedSession(null);
  };

  // Group telemetry by device ID
  const groupedDevices = useMemo(() => {
    const groups: { [key: string]: any[] } = {};
    
    // Process oldest to newest so the array naturally sorts newest first via unshift
    const reversedTelemetry = [...telemetry].reverse(); 

    reversedTelemetry.forEach(log => {
      // Use deviceId if available, fallback to IP/UA combo for older logs
      const deviceId = log.browser?.deviceId || log.browser?.userAgent || 'unknown';
      if (!groups[deviceId]) {
        groups[deviceId] = [];
      }
      groups[deviceId].unshift(log); // Keep newest at the top of the device's array
    });

    // Return as array of objects, sorted by the most recent activity
    return Object.entries(groups).map(([id, logs]) => ({
      id,
      logs,
      latestLog: logs[0], // the most recent one
      visitCount: logs.length
    })).sort((a, b) => new Date(b.latestLog.timestamp).getTime() - new Date(a.latestLog.timestamp).getTime());
  }, [telemetry]);

  return (
    <div className="min-h-screen bg-slate-950 flex relative">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col z-10">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center border border-blue-500/20">
            <ShieldCheck className="w-6 h-6 text-blue-400" />
          </div>
          <span className="font-semibold text-white tracking-wide">Admin Panel</span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          {[
            { icon: Users, label: 'Unique Users', active: true },
            { icon: Activity, label: 'Raw Event Stream' },
            { icon: MapPin, label: 'Global Map' },
            { icon: Database, label: 'Supabase Settings' },
            { icon: Settings, label: 'Project Config' },
          ].map((item, idx) => (
            <button
              key={idx}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                item.active 
                  ? 'bg-blue-600/10 text-blue-400 font-medium' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-2">
          <a 
            href="/"
            className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-xl transition-all"
          >
            <Activity className="w-5 h-5" />
            View Live Site
          </a>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8 relative z-0">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
        
        <header className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Unique User Dashboard</h1>
            <p className="text-slate-400 mt-2">Monitoring returning devices and consent logs.</p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={handleClear}
              className="px-4 py-2 bg-slate-900 border border-slate-800 text-slate-300 rounded-xl hover:bg-slate-800 hover:text-white flex items-center gap-2 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              Clear Data
            </button>
            <button 
              onClick={fetchTelemetry}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { label: 'Unique Devices Tracked', value: groupedDevices.length.toString(), trend: 'Active' },
            { label: 'Total Portal Visits', value: telemetry.length.toString(), trend: 'All Time' },
            { label: 'Latest Status', value: telemetry[0]?.status ? telemetry[0].status.toUpperCase() : 'N/A', trend: 'Last Event' },
          ].map((stat, idx) => (
            <div key={idx} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6">
              <h3 className="text-slate-400 text-sm font-medium">{stat.label}</h3>
              <p className="text-3xl font-bold text-white mt-2">{stat.value}</p>
              <p className="text-blue-400 text-sm mt-2">{stat.trend}</p>
            </div>
          ))}
        </div>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex justify-between items-center">
            <h3 className="text-lg font-medium text-white">Tracked User Devices</h3>
            <span className="text-xs text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">Click any user for full-screen analysis</span>
          </div>
          
          {groupedDevices.length === 0 ? (
            <div className="p-12 text-center">
              <Database className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white">No Tracked Devices</h3>
              <p className="text-slate-400 mt-2 max-w-md mx-auto">
                No users have interacted with the secure portal yet.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-400">
                <thead className="bg-slate-900/80 text-slate-300 uppercase font-semibold">
                  <tr>
                    <th className="px-6 py-4">Last Active</th>
                    <th className="px-6 py-4">Latest Photo</th>
                    <th className="px-6 py-4">Visits</th>
                    <th className="px-6 py-4">Latest Location</th>
                    <th className="px-6 py-4">Device Info</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {groupedDevices.map((device) => {
                    const log = device.latestLog;
                    return (
                      <tr 
                        key={device.id} 
                        onClick={() => setSelectedDeviceLogs(device.logs)}
                        className="hover:bg-slate-800/60 cursor-pointer transition-colors group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleTimeString()}
                          <div className="text-xs text-slate-500 mt-1">{new Date(log.timestamp).toLocaleDateString()}</div>
                        </td>
                        <td className="px-6 py-4">
                          {log.photo ? (
                            <div className="relative inline-block">
                              <img src={log.photo} alt="Verification Snapshot" className="w-12 h-12 object-cover rounded-lg border border-slate-700 shadow-sm group-hover:border-blue-500/50 transition-colors" />
                              <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-slate-900 shadow-sm">
                                {device.visitCount}
                              </div>
                            </div>
                          ) : (
                            <div className="w-12 h-12 bg-slate-800/50 rounded-lg flex items-center justify-center border border-slate-700 relative">
                              <Camera className="w-4 h-4 text-slate-500" />
                              <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-slate-900 shadow-sm">
                                {device.visitCount}
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className="bg-slate-800 px-3 py-1 rounded-full text-slate-300 font-medium border border-slate-700">
                            {device.visitCount} Sessions
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {log.location ? (
                            <div className="flex flex-col">
                              <span>Lat: {log.location.latitude.toFixed(4)}</span>
                              <span>Lng: {log.location.longitude.toFixed(4)}</span>
                              <span className="text-xs text-slate-500 mt-0.5">Acc: ±{Math.round(log.location.accuracy)}m</span>
                            </div>
                          ) : (
                            <span className="text-slate-600">{log.error || 'N/A'}</span>
                          )}
                        </td>
                        <td className="px-6 py-4 max-w-xs truncate">
                          <div className="flex flex-col gap-1">
                            <span className="truncate text-slate-300 font-mono text-xs" title={device.id}>
                              ID: {device.id.split('-')[0]}...
                            </span>
                            <span className="text-xs text-slate-500">{log.browser?.platform} • {log.browser?.screenResolution}</span>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* FULL SCREEN Detailed View Modal */}
      {selectedDeviceLogs && selectedDeviceLogs.length > 0 && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-slate-900 w-full h-full overflow-hidden flex flex-col">
            
            {/* Full Screen Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900 z-10 shadow-md">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center border border-blue-500/20 shadow-inner">
                  <MonitorSmartphone className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">User Device Analysis</h2>
                  <p className="text-sm text-slate-400 font-mono mt-1 flex items-center gap-2">
                    Target ID: {selectedDeviceLogs[0].browser?.deviceId || 'Unknown'} 
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-xs">
                      {selectedDeviceLogs.length} Total Visits
                    </span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setSelectedDeviceLogs(null);
                  setSelectedSession(null);
                }}
                className="p-3 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-xl text-slate-400 transition-all shadow-sm border border-slate-700 hover:border-slate-600"
              >
                <span className="flex items-center gap-2 text-sm font-medium">
                  Close Dashboard <X className="w-5 h-5" />
                </span>
              </button>
            </div>

            {/* Full Screen Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8">
              <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Left Column: Device Identity (Fixed/Sticky) */}
                <div className="lg:col-span-1 space-y-6">
                  <div className="bg-slate-950/80 rounded-3xl border border-slate-800 p-6 sticky top-0 shadow-xl">
                    <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-6 pb-4 border-b border-slate-800">
                      <Globe className="w-4 h-4 text-blue-400" /> Identity Fingerprint
                    </h3>
                    
                    <div className="space-y-6">
                      <div>
                        <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Primary Target Photo</span>
                        {selectedDeviceLogs[0].photo ? (
                          <div className="rounded-2xl border-2 border-slate-800 overflow-hidden shadow-2xl relative">
                            <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-2xl pointer-events-none"></div>
                            <img src={selectedDeviceLogs[0].photo} alt="Target" className="w-full object-cover" />
                          </div>
                        ) : (
                          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-8 text-center">
                            <Camera className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                            <p className="text-slate-500 text-sm">No photo available</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-6 pt-4 border-t border-slate-800">
                        
                        {/* Hardware & Platform */}
                        <div className="space-y-4">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                            <Cpu className="w-4 h-4 text-slate-500" /> Hardware & Platform
                          </h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <span className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Platform Architecture</span>
                              <span className="text-sm text-slate-200 font-medium">{selectedDeviceLogs[0].browser?.platform || 'Unknown'}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Logical Cores</span>
                              <span className="text-sm text-slate-200 font-medium">{selectedDeviceLogs[0].browser?.hardwareConcurrency || 'Unknown'}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Estimated Memory</span>
                              <span className="text-sm text-slate-200 font-medium">{selectedDeviceLogs[0].browser?.deviceMemory || 'Unknown'}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Display Stats</span>
                              <span className="text-sm text-slate-200 font-medium block">{selectedDeviceLogs[0].browser?.screenResolution || 'Unknown'}</span>
                              <span className="text-xs text-slate-500 font-medium block">Depth: {selectedDeviceLogs[0].browser?.colorDepth || 'Unknown'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Power & Network */}
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/50">
                          <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                              <Battery className="w-4 h-4 text-slate-500" /> Power
                            </h4>
                            {selectedDeviceLogs[0].browser?.battery ? (
                              <div className="flex flex-col gap-1">
                                <span className="text-sm text-slate-200 font-medium">{selectedDeviceLogs[0].browser.battery.level}</span>
                                <span className={`text-xs ${selectedDeviceLogs[0].browser.battery.charging ? 'text-emerald-400' : 'text-slate-500'}`}>
                                  {selectedDeviceLogs[0].browser.battery.charging ? 'Charging' : 'On Battery'}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500">API Restricted</span>
                            )}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                              <Wifi className="w-4 h-4 text-slate-500" /> Network
                            </h4>
                            {selectedDeviceLogs[0].browser?.network ? (
                              <div className="flex flex-col gap-1">
                                <span className="text-sm text-slate-200 font-medium uppercase">{selectedDeviceLogs[0].browser.network.type}</span>
                                <span className="text-xs text-slate-500">Ping: {selectedDeviceLogs[0].browser.network.rtt}</span>
                                <span className="text-xs text-slate-500">Speed: {selectedDeviceLogs[0].browser.network.downlink}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500">API Restricted</span>
                            )}
                          </div>
                        </div>

                        {/* Locale & Agent */}
                        <div className="space-y-4 pt-4 border-t border-slate-800/50">
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                            <Globe className="w-4 h-4 text-slate-500" /> Locale & Software
                          </h4>
                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                              <span className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">System Language</span>
                              <span className="text-sm text-slate-200 font-medium">{selectedDeviceLogs[0].browser?.language || 'Unknown'}</span>
                            </div>
                            <div>
                              <span className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Local Timezone</span>
                              <span className="text-sm text-slate-200 font-medium">{selectedDeviceLogs[0].browser?.timezone || 'Unknown'}</span>
                            </div>
                          </div>
                          <div>
                            <span className="block text-[10px] font-semibold text-slate-500 uppercase mb-1">Raw User Agent</span>
                            <code className="text-[10px] text-blue-400 font-mono bg-blue-500/10 p-3 rounded-xl block break-all border border-blue-500/20 leading-relaxed max-h-32 overflow-y-auto">
                              {selectedDeviceLogs[0].browser?.userAgent || 'Unknown'}
                            </code>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Clickable Session List */}
                <div className="lg:col-span-2 space-y-6">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2 mb-6">
                    <History className="w-4 h-4 text-blue-400" /> Session History List
                  </h3>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {selectedDeviceLogs.map((log, index) => (
                      <button 
                        key={log.id} 
                        onClick={() => setSelectedSession(log)}
                        className="bg-slate-950/50 hover:bg-slate-900 rounded-2xl border border-slate-800 hover:border-blue-500/50 p-5 flex items-center justify-between shadow-md transition-all group text-left w-full"
                      >
                        <div className="flex items-center gap-5">
                          <div className="bg-slate-800 text-slate-400 text-xs font-bold w-12 h-12 flex items-center justify-center rounded-xl border border-slate-700">
                            #{selectedDeviceLogs.length - index}
                          </div>
                          <div>
                            <span className="text-base font-semibold text-slate-200 flex items-center gap-2">
                              <Clock className="w-4 h-4 text-blue-400" />
                              {new Date(log.timestamp).toLocaleString()}
                            </span>
                            <div className="flex items-center gap-3 mt-1.5">
                              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                log.status === 'granted' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 
                                log.status === 'partial_denial' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                'bg-red-500/10 text-red-400 border border-red-500/20'
                              }`}>
                                {log.status}
                              </span>
                              {log.location && log.location.address && (
                                <span className="text-xs text-slate-500 truncate max-w-sm">
                                  {log.location.address}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="bg-slate-800 p-2 rounded-lg text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <ChevronRight className="w-5 h-5" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* Nested Single Session Modal */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-slate-950/90 backdrop-blur-md animate-in zoom-in-95 duration-200">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-4xl max-h-[95vh] overflow-y-auto shadow-2xl flex flex-col">
            
            <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-slate-900/95 backdrop-blur z-20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center border border-emerald-500/20">
                  <Activity className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Specific Session Record</h2>
                  <p className="text-sm text-slate-400">
                    {new Date(selectedSession.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedSession(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-colors border border-slate-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Side: Photo */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <Camera className="w-4 h-4 text-blue-400" /> Visual Capture
                  </h3>
                  {selectedSession.photo ? (
                    <div className="bg-slate-950 rounded-2xl border border-slate-800 p-2 overflow-hidden flex justify-center shadow-inner">
                      <img 
                        src={selectedSession.photo} 
                        alt="Session Capture" 
                        className="w-full max-h-[300px] object-contain rounded-xl"
                      />
                    </div>
                  ) : (
                    <div className="bg-slate-950/50 rounded-2xl border border-slate-800/50 h-[300px] flex flex-col items-center justify-center text-center">
                      <Camera className="w-12 h-12 text-slate-600 mb-3" />
                      <p className="text-slate-500 text-sm">No photo captured during this specific session.</p>
                    </div>
                  )}
                </div>

                {/* Right Side: Geolocation & Address */}
                <div className="space-y-3 flex flex-col h-full">
                  <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-400" /> Geographic Location
                  </h3>
                  
                  {selectedSession.location ? (
                    <div className="flex flex-col h-full gap-4">
                      {/* Map */}
                      <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden flex-1 relative min-h-[200px] shadow-inner">
                        <iframe 
                          width="100%" 
                          height="100%" 
                          frameBorder="0" 
                          scrolling="no" 
                          marginHeight={0} 
                          marginWidth={0} 
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${selectedSession.location.longitude - 0.01}%2C${selectedSession.location.latitude - 0.01}%2C${selectedSession.location.longitude + 0.01}%2C${selectedSession.location.latitude + 0.01}&layer=mapnik&marker=${selectedSession.location.latitude}%2C${selectedSession.location.longitude}`}
                          className="absolute inset-0 grayscale contrast-125 opacity-80"
                        ></iframe>
                        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 z-10 pointer-events-none">
                          <div className="bg-slate-900/95 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-mono text-blue-400 shadow-xl">
                            {selectedSession.location.latitude.toFixed(6)}, {selectedSession.location.longitude.toFixed(6)}
                          </div>
                          <div className="bg-slate-900/95 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-700 text-xs font-mono text-slate-400 shadow-xl">
                            Accuracy: ±{Math.round(selectedSession.location.accuracy)}m
                          </div>
                        </div>
                      </div>
                      
                      {/* Formatted Address Delivery Block */}
                      {selectedSession.location.address && (
                        <div className="bg-blue-500/10 border border-blue-500/20 p-5 rounded-2xl flex gap-4 items-start shadow-sm shrink-0">
                          <div className="bg-blue-600/20 p-2 rounded-xl border border-blue-500/30">
                            <MapPin className="w-6 h-6 text-blue-400 shrink-0" />
                          </div>
                          <div>
                            <span className="block text-xs font-bold text-blue-400 uppercase tracking-widest mb-1.5">Resolved Delivery Address</span>
                            <span className="text-sm md:text-base text-blue-100 font-medium leading-relaxed">{selectedSession.location.address}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-slate-950/50 rounded-2xl border border-slate-800/50 flex-1 flex flex-col items-center justify-center text-center">
                      <MapPin className="w-12 h-12 text-slate-600 mb-3" />
                      <p className="text-slate-500 text-sm">Location data not provided or denied for this session.</p>
                      {selectedSession.error && (
                        <p className="text-red-400/80 text-xs mt-2 max-w-xs">{selectedSession.error}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
