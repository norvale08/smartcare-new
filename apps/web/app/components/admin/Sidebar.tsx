"use client";

import Link from "next/link";
import {
  HeartPulse,
  PieChart,
  BriefcaseMedical,
  Hospital,
  UsersRound,
  Pill,
  ClipboardCheck,
  TrendingUp,
  Settings,
} from "lucide-react";

export default function Sidebar() {
  return (
    <div className="shadow-lg bg-white px-2 py-2 w-[250px] h-screen flex flex-col">
      {/* Logo / Title */}
      <div className="flex items-center justify-center text-center p-5 gap-1">
        <HeartPulse color="#21a136" size={24} />
        <div>
          <h1 className="font-semibold">HealthAdmin</h1>
          <h2 className="text-sm text-gray-600">Dashboard</h2>
        </div>
      </div>

      <hr className="bg-gray-200 mb-2" />

      {/* Navigation */}
      <ul className="space-y-1">
        <NavItem href="/admin" icon={<PieChart size={20} />} label="Overview" />
        <NavItem href="/admin/doctors" icon={<BriefcaseMedical size={20} />} label="Doctors" />
        <NavItem href="/admin/hospitals" icon={<Hospital size={20} />} label="Hospitals" />
        <NavItem href="/admin/patients" icon={<UsersRound size={20} />} label="Patients" />
        <NavItem href="/admin/medications" icon={<Pill size={20} />} label="Medications" />
        <NavItem href="/admin/appointments" icon={<ClipboardCheck size={20} />} label="Appointments" />
        <NavItem href="/admin/analytics" icon={<TrendingUp size={20} />} label="Analytics" />
        <NavItem href="/admin/settings" icon={<Settings size={20} />} label="Settings" />
      </ul>
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-2 px-3 py-2 rounded-md text-gray-700 hover:bg-emerald-100 hover:text-emerald-600"
      >
        {icon}
        <span>{label}</span>
      </Link>
    </li>
  );
}
