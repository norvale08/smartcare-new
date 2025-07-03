'use client';

import { SessionProvider } from "next-auth/react";
import type { ReactNode, FC } from "react";

interface Props {
  children: ReactNode;
}

export const AuthProvider: FC<Props> = ({ children }) => {
  return <SessionProvider>{children}</SessionProvider>;
};
