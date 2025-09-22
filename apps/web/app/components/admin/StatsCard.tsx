"use client";

export default function StatsCard({
  title,
  value,
  subtitle,
  icon,
  bgColor,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  bgColor: string;
}) {
  return (
    <div className="bg-white shadow-sm flex justify-between h-[100px] w-[250px] p-4 items-center rounded-lg">
      <div className="flex flex-col">
        <p className="text-gray-600">{title}</p>
        <h1 className="text-2xl font-bold">{value}</h1>
        <p className="text-emerald-500 text-sm">{subtitle}</p>
      </div>
      <div className={`p-3 rounded-lg ${bgColor}`}>{icon}</div>
    </div>
  );
}
