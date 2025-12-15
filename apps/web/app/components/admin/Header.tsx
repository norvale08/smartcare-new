"use client";
import { Bell, User } from "lucide-react";

export default function Header() {
  return (
    <div className="bg-white shadow-sm w-full flex flex-row justify-between items-center p-4">
      <div>
        <h1 className="text-xl font-semibold">Dashboard Overview</h1>
        <p className="text-gray-600">Manage healthcare providers and patients</p>
      </div>
      <div className="flex items-center gap-4">
        {/* <Bell color="#6b7280" size={20} /> */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
            <User color="white" size={18} />
          </div>
          <div>
            <p className="font-medium">Healthcare Admin</p>
            <p className="text-sm text-gray-500">Administrator</p>
          </div>
        </div>
      </div>
    </div>
  );
}
