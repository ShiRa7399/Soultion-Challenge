import { Bell, Search, User, Zap } from 'lucide-react';

export default function Navbar() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-800 bg-gray-950/50 px-8 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-900/20">
          <Zap className="fill-white text-white" size={24} />
        </div>
        <div>
          <h1 className="text-lg font-black tracking-tight text-white">Emergency Response <span className="text-blue-500">Dashboard</span></h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Grand Azure Resort & Spa</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input 
            type="text" 
            placeholder="Search alerts or rooms..." 
            className="h-10 w-64 rounded-xl border border-gray-800 bg-gray-900 pl-10 pr-4 text-xs text-white placeholder:text-gray-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 border-l border-gray-800 pl-6">
          <button className="relative rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-900 hover:text-white">
            <Bell size={20} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-gray-950 bg-blue-500"></span>
          </button>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-bold text-white">Cmdr. Marcus</p>
              <p className="text-[10px] font-medium text-blue-500">Security Head</p>
            </div>
            <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-gray-800 bg-gray-900">
              <img 
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Marcus" 
                alt="Avatar" 
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
