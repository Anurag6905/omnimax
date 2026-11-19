"use client";

import { useEffect, useState } from "react";

/**
 * Keep the open tab in the URL hash (#goals) so a refresh or a shared link
 * opens the same tab. `keys` are the valid tab keys; the first is the default.
 */
export function useHashTab(keys: string[]): [string, (key: string) => void] {
  const [tab, setTab] = useState(keys[0]);
  const joined = keys.join("|");
  useEffect(() => {
    const valid = joined.split("|");
    const read = () => {
      const h = window.location.hash.slice(1);
      setTab(valid.includes(h) ? h : valid[0]);
    };
    read();
    window.addEventListener("hashchange", read);
    return () => window.removeEventListener("hashchange", read);
  }, [joined]);
  const choose = (key: string) => {
    history.replaceState(null, "", `#${key}`);
    setTab(key);
  };
  return [tab, choose];
}
