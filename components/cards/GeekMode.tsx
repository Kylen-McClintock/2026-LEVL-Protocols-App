import { Modality } from '@/lib/types'
import { Microscope, AlertTriangle, Coins, Target } from 'lucide-react'

type GeekModeProps = {
  modality: Modality
}

export default function GeekMode({ modality }: GeekModeProps) {
  return (
    <div className="bg-black/40 rounded-xl p-4 border border-levl-purple/20 space-y-4 animate-in fade-in slide-in-from-top-2 mt-4 text-sm">
      <div className="flex items-center gap-2 text-levl-purple font-bold border-b border-white/10 pb-2">
        <Microscope size={16} /> Geek Mode
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <span className="text-[10px] text-levl-text-secondary uppercase block mb-1">Evidence Quality</span>
          <span className="font-medium text-white">{modality.evidence_quality ? `${modality.evidence_quality}/5` : 'Unknown'}</span>
        </div>
        <div>
          <span className="text-[10px] text-levl-text-secondary uppercase block mb-1">Effect Size</span>
          <span className="font-medium text-white">{modality.effect_size_estimate || 'Unknown'}</span>
        </div>
        <div>
          <span className="text-[10px] text-levl-text-secondary uppercase block mb-1">Safety Level</span>
          <span className="font-medium text-white capitalize">{modality.safety_level?.replace('_', ' ') || 'General'}</span>
        </div>
        <div>
          <span className="text-[10px] text-levl-text-secondary uppercase block mb-1">Cost / Effort</span>
          <span className="font-medium text-white capitalize">
            {modality.cost_tier || 'Free'} • {modality.effort_level?.replace('_', ' ') || 'Low'}
          </span>
        </div>
      </div>

      {modality.mechanism_of_action && (
        <div className="pt-2">
          <span className="text-[10px] text-levl-text-secondary uppercase block mb-1">Mechanism of Action</span>
          <p className="text-gray-300 text-xs leading-relaxed">{modality.mechanism_of_action}</p>
        </div>
      )}

      {(modality.contraindications?.length ?? 0) > 0 && (
        <div className="bg-red-950/30 p-3 rounded-lg border border-red-900/50">
          <div className="flex items-center gap-1 text-red-400 font-bold mb-1 text-xs">
            <AlertTriangle size={12} /> Contraindications
          </div>
          <ul className="list-disc pl-4 text-xs text-red-200/80 space-y-1">
            {modality.contraindications?.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      {modality.hallmarks_of_aging_impact && (
        <div className="pt-2">
          <span className="text-[10px] text-levl-text-secondary uppercase block mb-1">Hallmarks of Aging</span>
          <div className="flex flex-wrap gap-1">
            {/* MVP stub: assume array of strings for simplicity if jsonb is simple */}
            {Array.isArray(modality.hallmarks_of_aging_impact) 
              ? modality.hallmarks_of_aging_impact.map((h: string, i: number) => (
                <span key={i} className="text-[10px] bg-white/5 border border-white/10 px-2 py-0.5 rounded text-levl-text-secondary">
                  {h}
                </span>
              ))
              : <span className="text-xs text-levl-text-secondary">See deeper literature for hallmark impact.</span>
            }
          </div>
        </div>
      )}
    </div>
  )
}
