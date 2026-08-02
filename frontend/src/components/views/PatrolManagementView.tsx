import React, { useEffect, useState } from 'react';
import { Siren, Navigation, Radio, CheckCircle, Clock, Send, RefreshCw, Car, Shield, Phone, MapPin } from 'lucide-react';
import { GlassCard, GlassPanel, Button, Badge, Select, Input } from '../ui';
import { LeafletMap } from '../map/LeafletMap';
import { patrolApi } from '../../lib/api';
import { PatrolUnit, DispatchRoute } from '../../lib/types';

export const PatrolManagementView: React.FC = () => {
  const [patrolUnits, setPatrolUnits] = useState<PatrolUnit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<PatrolUnit | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dispatchTarget, setDispatchTarget] = useState<string>('');
  useEffect(() => { patrolApi.getPatrolUnits().then(setPatrolUnits).catch(() => setPatrolUnits([])); }, []);

  const filteredUnits = patrolUnits.filter((unit) => {
    if (filterStatus === 'all') return true;
    return unit.status === filterStatus;
  });

  const handleDispatch = async (unitId: string) => {
    if (!dispatchTarget) return;
    try {
      const result = await patrolApi.dispatchUnit(unitId, dispatchTarget);
      setPatrolUnits((prev) => prev.map((u) => u.id === unitId ? result.unit : u));
      setSelectedUnit(result.unit);
    } catch (error) {
      console.error("Dispatch failed", error);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold font-montserrat text-on-surface flex items-center gap-2">
            <Siren className="text-primary" size={28} />
            Patrol Route & Beat Management
          </h2>
          <p className="text-sm text-on-surface-variant font-inter mt-1">
            Real-time PCR unit tracking, OSRM dispatch routing, and beat corridor monitoring
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="success" dot className="px-3 py-1.5 text-sm">
            {patrolUnits.filter((u) => u.status !== 'at_station').length} Active Units On Duty
          </Badge>
          <Button variant="glass" onClick={() => patrolApi.getPatrolUnits().then(setPatrolUnits)}>
            <RefreshCw size={16} /> Sync Units
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Unit Roster Sidebar */}
        <div className="flex flex-col gap-4">
          <GlassPanel title="PCR Fleet Roster" subtitle="Filter by status or assigned ward">
            <div className="flex gap-2 mb-4">
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                options={[
                  { value: 'all', label: 'All Units (5)' },
                  { value: 'patrolling', label: 'Patrolling (3)' },
                  { value: 'dispatched', label: 'Dispatched (1)' },
                  { value: 'available', label: 'Available (1)' },
                ]}
              />
            </div>

            <div className="flex flex-col gap-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredUnits.map((unit) => {
                const isSelected = selectedUnit?.id === unit.id;
                return (
                  <div
                    key={unit.id}
                    onClick={() => setSelectedUnit(unit)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-primary-container/20 border-primary shadow-md'
                        : 'bg-surface-variant/30 border-outline-variant hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Car size={18} className="text-primary" />
                        <span className="font-bold font-montserrat text-sm text-on-surface">{unit.callsign}</span>
                      </div>
                      <Badge
                        variant={
                          unit.status === 'dispatched'
                            ? 'error'
                            : unit.status === 'patrolling'
                            ? 'primary'
                            : 'success'
                        }
                        pulseDot={unit.status === 'dispatched'}
                      >
                        {unit.status.toUpperCase()}
                      </Badge>
                    </div>

                    <div className="text-xs text-on-surface-variant flex flex-col gap-1">
                      <p className="flex items-center gap-1">
                        <MapPin size={12} /> Ward: <span className="font-medium text-on-surface">{unit.assigned_ward}</span>
                      </p>
                      <p className="flex items-center gap-1">
                        <Phone size={12} /> Contact: <span className="font-mono text-on-surface">+91 98000 00000</span>
                      </p>
                      <p className="flex items-center gap-1">
                        <Shield size={12} /> Unit ID: <span className="font-medium text-on-surface">{unit.id}</span>
                      </p>
                    </div>

                    {unit.status !== 'dispatched' && (
                      <Button
                        variant="alert"
                        className="w-full mt-3 py-1.5 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDispatch(unit.id);
                        }}
                      >
                        <Send size={12} /> Rapid Dispatch
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </GlassPanel>
        </div>

        {/* Live GIS Map & Dispatch Panel */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <GlassCard className="h-[480px] p-2 overflow-hidden flex flex-col">
            <div className="p-3 flex items-center justify-between border-b border-outline-variant/30">
              <span className="text-xs font-mono font-bold text-primary flex items-center gap-2">
                <Navigation size={14} /> LIVE OSRM DISPATCH CORRIDOR MAP
              </span>
              <span className="text-xs text-on-surface-variant font-mono">
                {selectedUnit ? `Selected: ${selectedUnit.callsign}` : 'Click unit to highlight route'}
              </span>
            </div>
            <div className="flex-1 w-full h-full rounded-xl overflow-hidden">
              <LeafletMap
                showPatrols={true}
                showRoutes={true}
                showWards={true}
                showCctv={false}
                selectedPatrolId={selectedUnit?.id}
                onPatrolSelect={(unit) => setSelectedUnit(unit)}
              />
            </div>
          </GlassCard>

          {selectedUnit && (
            <GlassPanel title={`Dispatch Controls — ${selectedUnit.callsign}`}>
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="flex-1">
                  <Input
                    label="Target Incident FIR ID"
                    value={dispatchTarget}
                    onChange={(e) => setDispatchTarget(e.target.value)}
                    isMonospace
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="alert" onClick={() => handleDispatch(selectedUnit.id)}>
                    <Send size={16} /> Confirm OSRM Dispatch
                  </Button>
                  <Button variant="glass" onClick={() => setSelectedUnit(null)}>
                    Clear Selection
                  </Button>
                </div>
              </div>
            </GlassPanel>
          )}
        </div>
      </div>
    </div>
  );
};
