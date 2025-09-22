"use client";
import { useState } from "react";
import { Card,CardContent,CardHeader} from "@repo/ui";
import { Button} from "@repo/ui"

type Doctor = {
  _id: string;
  firstName: string;
  lastName: string;
  specialty: string;
  allocated?: boolean;
};

interface DoctorManagementProps {
  doctors: Doctor[];
  onAdd: (doctor: Doctor) => void;
}

export default function DoctorManagement({ doctors, onAdd }: DoctorManagementProps) {
  const [showForm, setShowForm] = useState(false);
  const [newDoctor, setNewDoctor] = useState({
    firstName: "",
    lastName: "",
    specialty: "",
  });

  const totalDoctors = doctors.length;
  const allocatedDoctors = doctors.filter((doc) => doc.allocated).length;

  const handleSubmit = () => {
    if (!newDoctor.firstName || !newDoctor.lastName || !newDoctor.specialty) return;
    const doctor = {
      _id: Date.now().toString(),
      ...newDoctor,
      allocated: false,
    };
    onAdd(doctor);
    setNewDoctor({ firstName: "", lastName: "", specialty: "" });
    setShowForm(false);
  };

  return (
    <Card className="w-1/2 shadow-md">
      <CardHeader>
        <h2 className="text-xl font-bold">Doctor Management</h2>
        <p className="text-gray-600">Manage all registered doctors.</p>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-4">
          <div>
            <p>Total Doctors: <span className="font-semibold">{totalDoctors}</span></p>
            <p>Allocated: <span className="font-semibold">{allocatedDoctors}</span></p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "Add Doctor"}
          </Button>
        </div>

        {showForm && (
          <div className="p-4 border rounded mb-4">
            <input
              type="text"
              placeholder="First Name"
              className="border p-2 w-full mb-2"
              value={newDoctor.firstName}
              onChange={(e) => setNewDoctor({ ...newDoctor, firstName: e.target.value })}
            />
            <input
              type="text"
              placeholder="Last Name"
              className="border p-2 w-full mb-2"
              value={newDoctor.lastName}
              onChange={(e) => setNewDoctor({ ...newDoctor, lastName: e.target.value })}
            />
            <input
              type="text"
              placeholder="Specialty"
              className="border p-2 w-full mb-2"
              value={newDoctor.specialty}
              onChange={(e) => setNewDoctor({ ...newDoctor, specialty: e.target.value })}
            />
            <Button className="mt-2" onClick={handleSubmit}>Save Doctor</Button>
          </div>
        )}

        <div>
          {doctors.length === 0 ? (
            <p className="text-gray-500">No doctors registered yet.</p>
          ) : (
            <ul className="divide-y">
              {doctors.map((doc) => (
                <li key={doc._id} className="py-2 flex justify-between items-center">
                  <span>{doc.firstName} {doc.lastName} – <i>{doc.specialty}</i></span>
                  <span className={doc.allocated ? "text-green-600" : "text-red-600"}>
                    {doc.allocated ? "Allocated" : "Not Allocated"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
