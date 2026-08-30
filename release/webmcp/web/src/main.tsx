import { useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";

import { AtlasApp } from "./atlas/AtlasApp";
import { AtlasMapController } from "./atlas/AtlasMapController";
import { mountAtlasWebMcp } from "./atlas/webmcpRegistry";

function ChallengeAtlas() {
  const controllerRef = useRef<AtlasMapController | null>(null);
  if (!controllerRef.current) controllerRef.current = new AtlasMapController({ level: "nation" });
  const controller = controllerRef.current;

  useEffect(() => mountAtlasWebMcp(controller), [controller]);
  return <AtlasApp controller={controller} />;
}

const root = document.getElementById("root");
if (!root) throw new Error("Missing #root element for Atlas.");

createRoot(root).render(<ChallengeAtlas />);

