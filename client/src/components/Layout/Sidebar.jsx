import { Clock, Cloud, HardDrive, LayoutDashboard, Settings, Video, Image as ImageIcon, Music, FileText, Trash2, Shield } from "lucide-react";

const Sidebar = ({ stats, view, setView, onSettingsClick, user }) => {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    { id: "files", label: "My Files", icon: <HardDrive size={18} /> },
    { id: "recent", label: "Recent", icon: <Clock size={18} /> },
    { id: "trash", label: "Trash", icon: <Trash2 size={18} /> },
  ];

  if (user?.isAdmin) {
    menuItems.push({ id: "admin", label: "Admin", icon: <Shield size={18} /> });
  }

  const storageUsed = user?.storageUsed || stats.size || 0;
  const storageLimit = user?.storageLimit || 1073741824; // 1GB default
  const usagePercent = Math.min((storageUsed / storageLimit) * 100, 100);

  // Level Calculation (Same as ProfileModal)
  const level = Math.floor(storageUsed / (100 * 1024 * 1024)) + 1;

  const getTitle = (lvl) => {
    if (lvl < 5) return "Novice Villager";
    if (lvl < 10) return "Apprentice Mage";
    if (lvl < 20) return "Dungeon Explorer";
    if (lvl < 50) return "High Wizard";
    if (lvl < 100) return "Demon Lord";
    return "Isekai Protagonist";
  };

  return (
    <aside className="w-full md:w-72 bg-ctp-mantle/95 backdrop-blur-xl border-r border-ctp-surface0/20 flex flex-col h-full shrink-0 relative overflow-hidden z-20">
      {/* Ambient Glow */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-ctp-blue/5 to-transparent pointer-events-none" />

      {/* Brand */}
      <div className="p-5 border-b border-ctp-surface0/10 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-ctp-blue/20 rounded-lg text-ctp-blue">
            <Cloud size={20} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-ctp-text leading-tight">bello drive</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="px-1.5 py-0.5 rounded bg-ctp-mauve/20 text-ctp-mauve text-[9px] font-bold border border-ctp-mauve/30">
                Lv.{level}
              </span>
              <span className="text-[9px] text-ctp-subtext0 font-bold uppercase tracking-wider truncate max-w-[120px]">
                {getTitle(level)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto relative z-10">
        <div className="text-[10px] uppercase font-bold text-ctp-subtext0/50 px-3 mb-2 tracking-widest">Menu</div>

        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all border ${view === item.id
              ? "bg-ctp-blue/15 text-ctp-blue border-ctp-blue/20 shadow-sm"
              : "text-ctp-subtext0/60 border-transparent hover:bg-ctp-surface0/50 hover:text-ctp-text"
              }`}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}

        <div className="text-[10px] uppercase font-bold text-ctp-subtext0/50 px-3 mt-6 mb-2 tracking-widest">
          Storage
        </div>

        {/* Storage Widget */}
        <div className="bg-ctp-base/40 rounded-xl p-4 border border-ctp-surface0/10 backdrop-blur-sm relative group overflow-hidden">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-[10px] font-black text-ctp-subtext0/60 uppercase tracking-widest">Used Space</span>
            <span className="text-xs font-black text-ctp-blue">{formatSize(storageUsed)}</span>
          </div>

          <progress
            className="progress progress-primary w-full h-1 bg-ctp-surface0 rounded-full overflow-hidden mb-4"
            value={usagePercent}
            max="100"
          ></progress>

          <div className="space-y-2">
            <SimpleStorageItem icon={<Video size={12} />} label="Videos" count={stats.types?.video || 0} size={stats.sizes?.video || 0} color="text-ctp-mauve" />
            <SimpleStorageItem icon={<ImageIcon size={12} />} label="Images" count={stats.types?.image || 0} size={stats.sizes?.image || 0} color="text-ctp-blue" />
            <SimpleStorageItem icon={<Music size={12} />} label="Audio" count={stats.types?.audio || 0} size={stats.sizes?.audio || 0} color="text-ctp-green" />
            <SimpleStorageItem icon={<FileText size={12} />} label="Other" count={stats.types?.other || 0} size={stats.sizes?.other || 0} color="text-ctp-subtext1" />
          </div>

        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-ctp-surface0/10 relative z-10 space-y-1">
        <button
          onClick={onSettingsClick}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-ctp-subtext0/60 hover:text-ctp-text transition-all text-sm hover:bg-ctp-surface0/5"
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
};

const SimpleStorageItem = ({ icon, label, count, size, color }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2.5 text-ctp-subtext1">
      <div className={`${color} opacity-90`}>{icon}</div>
      <span className="text-xs font-semibold">{label}</span>
      <span className="text-[10px] opacity-40 font-black">({count})</span>
    </div>
    <span className="text-xs font-bold text-ctp-text/60">{formatSize(size)}</span>
  </div>
);

const formatSize = (bytes) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

export default Sidebar;
