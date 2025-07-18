// app/diabetes/layout.tsx
import React from 'react';

export default function DiabetesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section className="p-6 max-w-3xl mx-auto">
      
      

      <main>{children}</main>
    </section>
  );
}
