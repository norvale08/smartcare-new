"use client";
import { useState } from "react";

import DoctorsRegistration from "@/app/components/admin/doctorsRegistration";

export default function Page() {
  const [doctors, setDoctors] = useState([
    { _id: "1", firstName: "Alice", lastName: "Kim", specialty: "Cardiology", allocated: true },
    { _id: "2", firstName: "Brian", lastName: "Omondi", specialty: "Neurology", allocated: false },
  ]);

  const handleAddDoctor = (doctor: any) => {
    setDoctors((prev) => [...prev, doctor]);
  };

  return (
    <div className="p-6">
      
      <DoctorsRegistration/>
    </div>
  );
}
