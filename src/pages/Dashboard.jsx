import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../App.jsx';
import Header from '../components/Header.jsx';
import BagTrendChart from '../components/scoreboard/BagTrendChart.jsx';
import BagProgressBar from '../components/scoreboard/BagProgressBar.jsx';
import LeadMeasureGrid from '../components/scoreboard/LeadMeasureGrid.jsx';
import LeadMeasureBarChart from '../components/scoreboard/LeadMeasureBarChart.jsx';
import LeadInput from '../components/LeadInput.jsx';
import LagInput from '../components/LagInput.jsx';
import StyleSwitcher from '../components/StyleSwitcher.jsx';
import { getLeadEntries, getLagEntries, getUsers } from '../utils/sheets';
import { dateKey } from '../utils/progress';

// Whether a user is allowed to enter a given measure, based on the measure's
// "who enters data" setting.
function canEnter(user, measure) {
  const by = measure.enteredBy;
  if (user.role === 'admin') return by === 'admin' || by === 'both';
  return by === 'team' || by === 'both';
}

function nextUpdateDate(lagEntries, cadence) {
  const ordered = [...lagEntries].sort((a, b) =>
    String(a.timestamp).localeCompare(String(b.timestamp))
  );
  const last = ordered[ordered.length - 1];
  const base = last ? new Date(last.timestamp) : new Date();
  const d = new Date(base);
  if (cadence === 'monthly') d.setMonth(d.getMonth() + 1);
  else d.setDate(d.getDate() + 7);
  return dateKey(d);
}

export default function Dashboard() {
  const { user, config, reloadConfig } = useApp();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  const notSetUp = !config?.setupComplete;
  const isAdmin = user?.role === 'admin';

  // Admins are sent to the wizard until setup is complete.
  useEffect(() => {
    if (notSetUp && isAdmin) navigate('/setup', { replace: true });
  }, [notSetUp, isAdmin, navigate]);

  const loadData = useCallback(async () => {
    const [entries, lagEntries, users] = await Promise.all([
      getLeadEntries(),
      getLagEntries(),
      getUsers(),
    ]);
    setData({ entries, lagEntries, users });
  }, []);

  useEffect(() => {
    if (notSetUp) return;
    let active = true;
    (async () => {
      try {
        await loadData();
      } catch (e) {
        if (active) setError(e.message || 'Could not load scoreboard data.');
      }
    })();
    return () => {
      active = false;
    };
  }, [notSetUp, loadData]);

  if (notSetUp) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-md mx-auto text-center px-4 py-20">
          <h1 className="text-lg font-semibold text-primary mb-2">Not set up yet</h1>
          <p className="text-muted">
            The scoreboard hasn’t been configured yet. Please check back soon.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="max-w-md mx-auto text-center px-4 py-20">
          <p className="text-behind-text">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen">
        <Header />
        <div className="text-center py-20 text-muted">Loading scoreboard…</div>
      </div>
    );
  }

  const { entries, lagEntries, users } = data;
  const activeMeasures = config.leadMeasures.filter((m) => (m.name || '').trim());
  const BagComponent = config.scoreboardStyle === 'progress_bars' ? BagProgressBar : BagTrendChart;

  const lastLag = [...lagEntries].sort((a, b) => String(a.timestamp).localeCompare(String(b.timestamp))).slice(-1)[0];
  const myMeasures = activeMeasures.filter((m) => canEnter(user, m));

  return (
    <div className="min-h-screen">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Scoreboard — the three sections */}
          <div className="lg:col-span-2 space-y-6">
            <BagComponent
              bag={config.bag}
              lagEntries={lagEntries}
              updatedByName={lastLag?.updated_by}
              nextUpdateDate={nextUpdateDate(lagEntries, config.bag.lagCadence)}
            />

            {activeMeasures.map((m) =>
              config.trackingMode === 'individual' ? (
                <LeadMeasureGrid
                  key={m.id}
                  measure={m}
                  users={users.filter((u) => canEnter(u, m))}
                  entries={entries}
                />
              ) : (
                <LeadMeasureBarChart key={m.id} measure={m} entries={entries} />
              )
            )}
          </div>

          {/* Sidebar — personal log + admin controls */}
          <div className="space-y-6">
            {myMeasures.length > 0 && (
              <LeadInput
                measures={myMeasures}
                user={user}
                entries={entries}
                trackingMode={config.trackingMode}
                onSubmitted={loadData}
              />
            )}

            {isAdmin && (
              <>
                <LagInput bag={config.bag} user={user} lagEntries={lagEntries} onSubmitted={loadData} />
                <StyleSwitcher current={config.scoreboardStyle} onChanged={reloadConfig} />
                <button
                  onClick={() => navigate('/admin')}
                  className="w-full rounded-2xl border border-gray-300 py-3 font-semibold text-primary hover:bg-primary/5"
                >
                  Admin settings
                </button>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
