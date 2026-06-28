'use client';

import { useState } from 'react';
import { SidePanel } from '@/components/ui/SidePanel';

const DEFAULT_PHASES = [
  'Discovery',
  'Concept Design',
  'Schematic Design',
  'Design Development',
  'Construction Documentation',
  'Contract Administration',
  'FF&E Selection',
];

export default function SettingsPage() {
  const [studioName, setStudioName] = useState('Design Studio HQ');
  const [yourName, setYourName] = useState('Ellie Sanders');
  const [email, setEmail] = useState('ellie@studio.com');
  const [saved, setSaved] = useState(false);
  const [phases, setPhases] = useState(DEFAULT_PHASES);
  const [showAddPhase, setShowAddPhase] = useState(false);
  const [editingPhase, setEditingPhase] = useState<{ index: number; value: string } | null>(null);
  const [newPhase, setNewPhase] = useState('');

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const addPhase = () => {
    if (!newPhase.trim()) return;
    setPhases(prev => [...prev, newPhase.trim()]);
    setNewPhase('');
    setShowAddPhase(false);
  };

  const savePhaseEdit = () => {
    if (!editingPhase) return;
    setPhases(prev => prev.map((p, i) => i === editingPhase.index ? editingPhase.value : p));
    setEditingPhase(null);
  };

  const deletePhase = (index: number) => {
    setPhases(prev => prev.filter((_, i) => i !== index));
  };

  const movePhase = (index: number, dir: -1 | 1) => {
    setPhases(prev => {
      const arr = [...prev];
      const tmp = arr[index];
      arr[index] = arr[index + dir];
      arr[index + dir] = tmp;
      return arr;
    });
  };

  return (
    <>
      {showAddPhase && (
        <SidePanel title="Add Phase" onClose={() => setShowAddPhase(false)} footer={
          <><div /><div className="flex gap-2">
            <button onClick={() => setShowAddPhase(false)} className="notion-button border border-border">Cancel</button>
            <button onClick={addPhase} className="btn-primary">Add Phase</button>
          </div></>
        }>
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Phase Name *</label>
              <input value={newPhase} onChange={e => setNewPhase(e.target.value)} placeholder="e.g. Post-Construction Review"
                className="modal-input" onKeyDown={e => { if (e.key === 'Enter') addPhase(); }} autoFocus />
            </div>
            <p className="text-xs text-muted-foreground">The new phase will be added to the end of your project workflow.</p>
          </div>
        </SidePanel>
      )}

      {editingPhase !== null && (
        <SidePanel title="Edit Phase" onClose={() => setEditingPhase(null)} footer={
          <><div /><div className="flex gap-2">
            <button onClick={() => setEditingPhase(null)} className="notion-button border border-border">Cancel</button>
            <button onClick={savePhaseEdit} className="btn-primary">Save</button>
          </div></>
        }>
          <div className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-xs text-muted-foreground mb-1.5">Phase Name</label>
              <input value={editingPhase.value} onChange={e => setEditingPhase(p => p && ({ ...p, value: e.target.value }))}
                className="modal-input" autoFocus />
            </div>
          </div>
        </SidePanel>
      )}

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Settings</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Manage your studio preferences</p>
        </div>

        {saved && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-foreground text-background text-sm px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2">
            <span className="material-icons-outlined" style={{ fontSize: 16 }}>check_circle</span>
            Settings saved successfully.
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Studio Profile */}
          <div className="card-base p-5">
            <h2 className="font-medium mb-4">Studio Profile</h2>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Studio Name</label>
                <input type="text" value={studioName} onChange={e => setStudioName(e.target.value)} className="modal-input" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Your Name</label>
                <input type="text" value={yourName} onChange={e => setYourName(e.target.value)} className="modal-input" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="modal-input" />
              </div>
              <button onClick={handleSave} className="btn-primary mt-2">
                <span className="material-icons-outlined" style={{ fontSize: 16 }}>save</span>
                Save Changes
              </button>
            </div>
          </div>

          {/* Project Phases */}
          <div className="card-base p-5">
            <h2 className="font-medium mb-0.5">Project Phases</h2>
            <p className="text-xs text-muted-foreground mb-4">Customise your project workflow stages</p>
            <div className="space-y-1">
              {phases.map((phase, i) => (
                <div key={`${phase}-${i}`}
                  className="flex items-center gap-2 px-2 py-2 hover:bg-muted/40 rounded-lg group">
                  <span className="material-icons-outlined text-muted-foreground/40" style={{ fontSize: 16 }}>drag_indicator</span>
                  <span className="text-sm flex-1">{phase}</span>
                  <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => i > 0 && movePhase(i, -1)} disabled={i === 0}
                      className="p-1 hover:bg-muted rounded disabled:opacity-30 text-muted-foreground">
                      <span className="material-icons-outlined" style={{ fontSize: 13 }}>arrow_upward</span>
                    </button>
                    <button onClick={() => i < phases.length - 1 && movePhase(i, 1)} disabled={i === phases.length - 1}
                      className="p-1 hover:bg-muted rounded disabled:opacity-30 text-muted-foreground">
                      <span className="material-icons-outlined" style={{ fontSize: 13 }}>arrow_downward</span>
                    </button>
                    <button onClick={() => setEditingPhase({ index: i, value: phase })}
                      className="p-1 hover:bg-muted rounded text-muted-foreground">
                      <span className="material-icons-outlined" style={{ fontSize: 13 }}>edit</span>
                    </button>
                    <button onClick={() => deletePhase(i)}
                      className="p-1 hover:bg-muted rounded text-muted-foreground hover:text-red-500">
                      <span className="material-icons-outlined" style={{ fontSize: 13 }}>delete_outline</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setShowAddPhase(true)} className="notion-button border border-border mt-3 w-full justify-center text-sm">
              <span className="material-icons-outlined" style={{ fontSize: 16 }}>add</span>
              Add Phase
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
