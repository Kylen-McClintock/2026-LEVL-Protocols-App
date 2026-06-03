'use client'

import { Settings as SettingsIcon, LogOut, RefreshCw } from 'lucide-react'

export default function SettingsPage() {
  const handleReset = () => {
    if (confirm('Reset all demo data? This will clear your local user id.')) {
      localStorage.removeItem('levl_local_user_id')
      window.location.href = '/'
    }
  }

  return (
    <div className="p-4 max-w-md mx-auto pt-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><SettingsIcon size={24} className="text-levl-accent" /> Settings</h1>
        <p className="text-levl-text-secondary text-sm">Manage your profile and data.</p>
      </header>

      <div className="space-y-4">
        <div className="glass-card p-4 rounded-xl">
          <h3 className="font-bold text-white mb-2">Profile</h3>
          <p className="text-sm text-levl-text-secondary mb-4">Edit your goals and preferences. (Stub)</p>
          <button className="bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg text-sm w-full transition-colors">
            Edit Profile
          </button>
        </div>

        <div className="glass-card p-4 rounded-xl border-red-900/30">
          <h3 className="font-bold text-red-400 mb-2">Danger Zone</h3>
          <p className="text-sm text-levl-text-secondary mb-4">Reset your local demo profile and data.</p>
          <button 
            onClick={handleReset}
            className="bg-red-950/50 hover:bg-red-900 border border-red-900/50 text-red-200 py-2 px-4 rounded-lg text-sm w-full flex items-center justify-center gap-2 transition-colors"
          >
            <RefreshCw size={16} /> Reset Demo Data
          </button>
        </div>
      </div>
    </div>
  )
}
