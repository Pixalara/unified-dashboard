export const metadata = {
  title: "Job Seeker Dashboard | Pixalara",
};

export default function JobSeekerDashboard() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <div className="max-w-md w-full p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur">
        <h1 className="text-2xl font-semibold mb-2">
          Job Seeker Dashboard
        </h1>

        <p className="text-sm text-white/70 mb-4">
          Job listings, applications, and profile tools are under development.
        </p>

        <div className="text-xs text-white/50">
          Status: <span className="text-yellow-400">Coming Soon</span>
        </div>
      </div>
    </div>
  );
}
