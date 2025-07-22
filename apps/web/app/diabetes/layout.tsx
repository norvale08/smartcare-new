
import React from 'react';
import Header from '../components/diabetesPages/header';

export default function DiabetesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <section >
      <Header />
      <main>{children}</main>
    </section>
  );
}
