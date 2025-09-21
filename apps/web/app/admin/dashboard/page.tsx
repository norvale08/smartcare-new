// app/admin/dashboard/page.tsx
"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import  {Card,CardContent} from "@repo/ui"
import { Button } from "@repo/ui";

const AdminDashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // ✅ Check if user exists in localStorage
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);

      // 🔐 Redirect if not admin
      if (parsedUser.role !== "admin") {
        router.replace("/login");
      }
    } else {
      router.replace("/login");
    }
  }, [router]);

  if (!user) {
    return <p className="text-center mt-20">Loading...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-2xl font-bold text-blue-900 mb-6">
        Welcome, {user.name} (Admin)
      </h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card className="bg-white shadow-lg rounded-xl">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold">Total Users</h2>
            <p className="text-3xl font-bold text-blue-600">1,245</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-lg rounded-xl">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold">Doctors</h2>
            <p className="text-3xl font-bold text-green-600">120</p>
          </CardContent>
        </Card>
        <Card className="bg-white shadow-lg rounded-xl">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold">Patients</h2>
            <p className="text-3xl font-bold text-emerald-600">980</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Users Table */}
      <div className="bg-white shadow-md rounded-xl p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Registrations</h2>
        <table className="w-full border-collapse border border-gray-200">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-3 border">Name</th>
              <th className="p-3 border">Email</th>
              <th className="p-3 border">Role</th>
              <th className="p-3 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Static example data (later fetch from backend) */}
            <tr>
              <td className="p-3 border">John Doe</td>
              <td className="p-3 border">john@example.com</td>
              <td className="p-3 border">Patient</td>
              <td className="p-3 border">
                <Button size="sm" className="bg-blue-500 text-white">
                  View
                </Button>
              </td>
            </tr>
            <tr>
              <td className="p-3 border">Dr. Sarah Lee</td>
              <td className="p-3 border">sarah@hospital.com</td>
              <td className="p-3 border">Doctor</td>
              <td className="p-3 border">
                <Button size="sm" className="bg-blue-500 text-white">
                  View
                </Button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminDashboard;
