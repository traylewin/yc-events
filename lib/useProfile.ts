"use client";

import { useEffect, useRef } from "react";
import { id, tx } from "@instantdb/react";
import db from "./instant";

export function useProfile() {
  const { user, isLoading: authLoading } = db.useAuth();
  const email = user?.email ?? "";
  const creatingRef = useRef(false);

  const { data, isLoading: queryLoading } = db.useQuery(
    email ? { users: { $: { where: { email } } } } : null
  );

  const profile = data?.users?.[0] ?? null;
  const isLoading = authLoading || queryLoading;

  useEffect(() => {
    if (!email || isLoading || profile || creatingRef.current) return;
    creatingRef.current = true;
    db.transact(
      tx.users[id()].update({
        email,
        firstName: email.split("@")[0],
        lastName: "",
        isAdmin: false,
        createdAt: new Date().toISOString(),
      })
    ).finally(() => {
      creatingRef.current = false;
    });
  }, [email, isLoading, profile]);

  return { user, profile, isLoading };
}
