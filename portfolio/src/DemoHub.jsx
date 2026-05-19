import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import projects from "./data/projects.json";

/**
 * 3D demo hub. Mario-64-inspired in *feel only* — no Nintendo IP, characters,
 * or assets. Player spawns at hub center; six double-doors line the perimeter,
 * each tied to one project. Each door requires a small unique task. When
 * unlocked, both door leaves swing open and a glow ring expands outward.
 * Walking through triggers a fade-to-white transition, then navigates to the
 * demo route. Returning to the hub always respawns the player at center.
 */

const STORAGE_KEY = "demo_hub_unlocked_v3";
const DOOR_RADIUS = 8.4;
const FLOOR_RADIUS = 11;
const SPAWN = new THREE.Vector3(0, 0.4, 0);

const DOOR_CONFIGS = [
  {
    id: "orbit-document-viewer",
    title: "Orbit",
    short: "Controlled document viewer",
    href: "/demos/orbit-document-viewer",
    color: 0x245ee8,
    accent: 0x9fc1ff,
    icon: "◉",
    task: { type: "collect", count: 3, label: "Collect 3 serial tokens" },
  },
  {
    id: "warehouse-management",
    title: "Warehouse",
    short: "Fulfillment workflows",
    href: "/demos/warehouse-management",
    color: 0xb7791f,
    accent: 0xffd277,
    icon: "▦",
    task: { type: "plate", label: "Step on the dispatch plate" },
  },
  {
    id: "ai-development-patterns",
    title: "AI Patterns",
    short: "Reusable AI dev skills",
    href: "/demos/ai-development-patterns",
    color: 0x7a3ad6,
    accent: 0xc9a8ff,
    icon: "✦",
    task: { type: "charge", seconds: 1.4, label: "Charge the AI core (stand on pad)" },
  },
  {
    id: "validation-graphing",
    title: "Validation",
    short: "Graphing + research tools",
    href: "/demos/validation-graphing",
    color: 0x0f766e,
    accent: 0x6ee2cf,
    icon: "▨",
    task: { type: "sequence", order: ["r", "g", "b"], label: "Hit plates: red → green → blue" },
  },
  {
    id: "mes-electronic-traveler",
    title: "MES",
    short: "Electronic traveler",
    href: "/demos/mes-electronic-traveler",
    color: 0xc2410c,
    accent: 0xffae7c,
    icon: "⚙",
    task: { type: "walk", label: "Walk to the traveler marker" },
  },
  {
    id: "program-management-platform",
    title: "Programs",
    short: "Power Platform program tools",
    href: "/demos/program-management-platform",
    color: 0x1d4ed8,
    accent: 0x93c5fd,
    icon: "☰",
    task: { type: "waypoints", count: 4, label: "Sync the 4 program checkpoints" },
  },
];

function loadUnlocked() {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function saveUnlocked(set) {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch {
    /* ignore */
  }
}

export default function DemoHub() {
  const mountRef = useRef(null);
  const faderRef = useRef(null);
  const [hint, setHint] = useState("Move with W A S D or arrow keys. Approach a door to see its task.");
  const [nearDoor, setNearDoor] = useState(null);
  const [unlockedDoors, setUnlockedDoors] = useState(() => loadUnlocked());
  const [progress, setProgress] = useState({});
  const [fadeActive, setFadeActive] = useState(false);

  const doorTitleById = useMemo(() => {
    const map = {};
    for (const d of DOOR_CONFIGS) map[d.id] = d.title;
    return map;
  }, []);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "low-power" });
    } catch (err) {
      setHint("WebGL not available — use the list below to browse demos.");
      return undefined;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdfe7ef);
    scene.fog = new THREE.Fog(0xdfe7ef, 14, 38);

    const camera = new THREE.PerspectiveCamera(56, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 9.5, 13);
    camera.lookAt(0, 0, 0);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x8898a8, 1.0));
    const sun = new THREE.DirectionalLight(0xffffff, 1.7);
    sun.position.set(6, 12, 7);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 40;
    sun.shadow.camera.left = -16;
    sun.shadow.camera.right = 16;
    sun.shadow.camera.top = 16;
    sun.shadow.camera.bottom = -16;
    scene.add(sun);

    const rim = new THREE.DirectionalLight(0xfff1d4, 0.55);
    rim.position.set(-8, 6, -6);
    scene.add(rim);

    // ── Floor ─────────────────────────────────────────────────────────
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(FLOOR_RADIUS, 6),
      new THREE.MeshStandardMaterial({ color: 0xefe9da, roughness: 0.9 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const innerRing = new THREE.Mesh(
      new THREE.RingGeometry(2.2, 2.6, 48),
      new THREE.MeshStandardMaterial({ color: 0xc8b78a, roughness: 0.85 })
    );
    innerRing.rotation.x = -Math.PI / 2;
    innerRing.position.y = 0.001;
    scene.add(innerRing);

    const spawnPad = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.5, 0.12, 32),
      new THREE.MeshStandardMaterial({ color: 0x2b4a6f, emissive: 0x0a1a2e, roughness: 0.5 })
    );
    spawnPad.position.set(0, 0.06, 0);
    spawnPad.receiveShadow = true;
    scene.add(spawnPad);

    // Decorative star on the spawn pad
    const star = makeTextSprite("★", "#ffd277", "rgba(0,0,0,0)");
    star.position.set(0, 0.13, 0);
    star.scale.set(1.4, 1.4, 1);
    scene.add(star);

    // ── Player (richer sprite: head, hat, torso, arms, legs) ──────────
    const player = new THREE.Group();
    const playerRig = buildPlayer();
    player.add(playerRig.root);
    player.position.copy(SPAWN);
    scene.add(player);

    const facingDir = new THREE.Vector3(0, 0, 1);

    // ── Doors ─────────────────────────────────────────────────────────
    const doors = [];

    DOOR_CONFIGS.forEach((door, index) => {
      const angle = (Math.PI * 2 * index) / DOOR_CONFIGS.length + Math.PI;
      const dx = Math.sin(angle) * DOOR_RADIUS;
      const dz = Math.cos(angle) * DOOR_RADIUS;

      const group = new THREE.Group();
      group.position.set(dx, 0, dz);
      group.lookAt(0, 0, 0);
      group.rotation.y += Math.PI;

      // Frame
      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(2.5, 3.1, 0.32),
        new THREE.MeshStandardMaterial({ color: 0x2a261f, roughness: 0.7 })
      );
      frame.position.y = 1.55;
      frame.castShadow = true;
      frame.receiveShadow = true;

      // Top arch with category color glow
      const arch = new THREE.Mesh(
        new THREE.TorusGeometry(1.18, 0.16, 14, 28, Math.PI),
        new THREE.MeshStandardMaterial({
          color: door.accent,
          emissive: door.accent,
          emissiveIntensity: 0.25,
          roughness: 0.4,
        })
      );
      arch.position.y = 3.0;
      arch.rotation.z = Math.PI;
      arch.castShadow = true;

      // Two door leaves
      const leafMaterial = new THREE.MeshStandardMaterial({
        color: door.color,
        roughness: 0.5,
        metalness: 0.1,
        emissive: 0x000000,
      });
      const leftLeaf = new THREE.Group();
      const leftSlab = new THREE.Mesh(new THREE.BoxGeometry(0.92, 2.55, 0.16), leafMaterial.clone());
      leftSlab.position.set(0.46, 0, 0); // pivot on left edge of leaf -> slab offset to right
      leftSlab.castShadow = true;
      leftLeaf.add(leftSlab);
      leftLeaf.position.set(-0.46, 1.32, 0.16);

      const rightLeaf = new THREE.Group();
      const rightSlab = new THREE.Mesh(new THREE.BoxGeometry(0.92, 2.55, 0.16), leafMaterial.clone());
      rightSlab.position.set(-0.46, 0, 0); // pivot on right edge
      rightSlab.castShadow = true;
      rightLeaf.add(rightSlab);
      rightLeaf.position.set(0.46, 1.32, 0.16);

      // Category icon embossed on each leaf
      const iconLeft = makeTextSprite(door.icon, "#ffffff", "rgba(0,0,0,0)");
      iconLeft.scale.set(0.55, 0.55, 1);
      iconLeft.position.set(0.46, 1.5, 0.26);
      leftLeaf.add(iconLeft);

      const iconRight = makeTextSprite(door.icon, "#ffffff", "rgba(0,0,0,0)");
      iconRight.scale.set(0.55, 0.55, 1);
      iconRight.position.set(-0.46, 1.5, 0.26);
      rightLeaf.add(iconRight);

      // Handles
      const handleMat = new THREE.MeshStandardMaterial({ color: 0xfff3c4, emissive: 0x9c7400, metalness: 0.5 });
      const handleL = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), handleMat);
      handleL.position.set(0.38, 1.2, 0.25);
      leftLeaf.add(handleL);
      const handleR = new THREE.Mesh(new THREE.SphereGeometry(0.08, 12, 10), handleMat);
      handleR.position.set(-0.38, 1.2, 0.25);
      rightLeaf.add(handleR);

      // Title plaque above arch
      const plaque = makeTextSprite(door.title, "#ffffff", "#171717");
      plaque.position.set(0, 3.45, 0.3);
      plaque.scale.set(2.0, 0.6, 1);

      // Glow ring (hidden until unlock)
      const glow = new THREE.Mesh(
        new THREE.RingGeometry(0.6, 1.4, 32),
        new THREE.MeshBasicMaterial({ color: door.accent, transparent: true, opacity: 0, side: THREE.DoubleSide })
      );
      glow.rotation.x = -Math.PI / 2;
      glow.position.set(0, 0.08, 0.5);
      glow.scale.set(0.01, 0.01, 0.01);

      group.add(frame, arch, leftLeaf, rightLeaf, plaque, glow);
      scene.add(group);

      const door3D = {
        id: door.id,
        config: door,
        group,
        leftLeaf,
        rightLeaf,
        leftSlab,
        rightSlab,
        plaque,
        glow,
        sparks: [],
        sparkActive: false,
        sparkLife: 0,
        front: new THREE.Vector3(dx * 0.78, 0, dz * 0.78),
        taskObjects: [],
        taskState: {},
        unlocked: false,
        openProgress: 0,
      };

      buildTaskObjects(scene, door3D);
      doors.push(door3D);
    });

    // Pre-applied unlocks
    const initialUnlocks = loadUnlocked();
    doors.forEach((d) => {
      if (initialUnlocks.has(d.id)) {
        d.unlocked = true;
        d.taskState.completed = true;
        d.openProgress = 1;
        if (d.taskObjects.length) d.taskObjects.forEach((o) => (o.visible = false));
      }
    });

    // ── Pillars between doors ─────────────────────────────────────────
    for (let i = 0; i < DOOR_CONFIGS.length; i += 1) {
      const a = (Math.PI * 2 * (i + 0.5)) / DOOR_CONFIGS.length + Math.PI;
      const px = Math.sin(a) * (DOOR_RADIUS + 0.4);
      const pz = Math.cos(a) * (DOOR_RADIUS + 0.4);
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.36, 3.4, 14),
        new THREE.MeshStandardMaterial({ color: 0xb6ad94, roughness: 0.8 })
      );
      pillar.position.set(px, 1.7, pz);
      pillar.castShadow = true;
      pillar.receiveShadow = true;
      scene.add(pillar);

      const cap2 = new THREE.Mesh(
        new THREE.CylinderGeometry(0.42, 0.42, 0.22, 14),
        new THREE.MeshStandardMaterial({ color: 0x6b6450, roughness: 0.7 })
      );
      cap2.position.set(px, 3.52, pz);
      scene.add(cap2);
    }

    // ── Controls ──────────────────────────────────────────────────────
    const keys = new Set();
    const onKeyDown = (e) => {
      const k = e.key.toLowerCase();
      if (["w", "a", "s", "d", "arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) {
        e.preventDefault();
      }
      keys.add(k);
    };
    const onKeyUp = (e) => keys.delete(e.key.toLowerCase());
    window.addEventListener("keydown", onKeyDown, { passive: false });
    window.addEventListener("keyup", onKeyUp);

    const setMove = (key, enabled) => { if (enabled) keys.add(key); else keys.delete(key); };
    mount._demoHubSetMove = setMove;
    mount._demoHubRespawn = () => {
      player.position.copy(SPAWN);
      facingDir.set(0, 0, 1);
      player.rotation.y = 0;
    };

    const resize = () => {
      if (!mount.clientWidth || !mount.clientHeight) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", resize);

    // ── Animation loop ────────────────────────────────────────────────
    const clock = new THREE.Clock();
    let navigating = false;
    let lastHint = "";
    let lastNear = null;
    let lastProgress = {};
    let walkPhase = 0;

    const tmpVec = new THREE.Vector3();
    const playerPlanar = new THREE.Vector3();

    const triggerNavigation = (href) => {
      navigating = true;
      setFadeActive(true);
      setTimeout(() => {
        window.location.href = href;
      }, 460);
    };

    const animate = () => {
      const delta = Math.min(clock.getDelta(), 0.05);
      const speed = 4.6 * delta;

      const move = new THREE.Vector3(0, 0, 0);
      if (keys.has("w") || keys.has("arrowup")) move.z -= 1;
      if (keys.has("s") || keys.has("arrowdown")) move.z += 1;
      if (keys.has("a") || keys.has("arrowleft")) move.x -= 1;
      if (keys.has("d") || keys.has("arrowright")) move.x += 1;

      const isWalking = move.lengthSq() > 0;

      if (isWalking) {
        move.normalize().multiplyScalar(speed);
        const next = player.position.clone().add(move);
        const r = Math.sqrt(next.x * next.x + next.z * next.z);
        if (r > FLOOR_RADIUS - 0.5) {
          next.x = (next.x / r) * (FLOOR_RADIUS - 0.5);
          next.z = (next.z / r) * (FLOOR_RADIUS - 0.5);
        }
        doors.forEach((d) => {
          if (d.unlocked) return;
          const dx2 = next.x - d.group.position.x;
          const dz2 = next.z - d.group.position.z;
          const dist2 = Math.sqrt(dx2 * dx2 + dz2 * dz2);
          const minDist = 1.0;
          if (dist2 < minDist && dist2 > 0.0001) {
            next.x = d.group.position.x + (dx2 / dist2) * minDist;
            next.z = d.group.position.z + (dz2 / dist2) * minDist;
          }
        });
        player.position.x = next.x;
        player.position.z = next.z;
        facingDir.copy(move).setY(0).normalize();
        player.rotation.y = Math.atan2(facingDir.x, facingDir.z);
        walkPhase += delta * 12;
      } else {
        walkPhase *= 0.86;
      }

      // Animate player parts
      animatePlayer(playerRig, isWalking, walkPhase, clock.elapsedTime);

      playerPlanar.set(player.position.x, 0, player.position.z);

      let nearestDoor = null;
      let nearestDist = Infinity;
      const progressSnap = {};

      doors.forEach((d) => {
        const dist = d.group.position.distanceTo(playerPlanar);

        if (!d.unlocked) {
          updateTask(d, player, playerPlanar, delta);
          if (d.taskState.completed) {
            d.unlocked = true;
            d.sparkActive = true;
            d.sparkLife = 0;
            // Spawn sparks
            for (let i = 0; i < 14; i += 1) {
              const spark = new THREE.Mesh(
                new THREE.SphereGeometry(0.06, 6, 6),
                new THREE.MeshBasicMaterial({ color: d.config.accent, transparent: true, opacity: 1 })
              );
              const a = (Math.PI * 2 * i) / 14 + Math.random() * 0.3;
              const sp = 2.4 + Math.random() * 0.8;
              spark.userData = {
                vx: Math.cos(a) * sp,
                vy: 1.5 + Math.random() * 1.5,
                vz: Math.sin(a) * sp,
                life: 0.9 + Math.random() * 0.3,
              };
              spark.position.set(d.group.position.x, 0.5, d.group.position.z);
              scene.add(spark);
              d.sparks.push(spark);
            }
            initialUnlocks.add(d.id);
            saveUnlocked(initialUnlocks);
          }
        }
        progressSnap[d.id] = taskProgress(d);

        // Door open animation
        const targetOpen = d.unlocked ? 1 : 0;
        d.openProgress = THREE.MathUtils.lerp(d.openProgress, targetOpen, 0.06);
        const swing = d.openProgress * Math.PI * 0.55; // ~99° max
        d.leftLeaf.rotation.y = swing;
        d.rightLeaf.rotation.y = -swing;
        if (d.unlocked) {
          d.leftSlab.material.emissive.setHex(0x222222);
          d.rightSlab.material.emissive.setHex(0x222222);
        }

        // Glow ring expansion + fade
        if (d.unlocked) {
          d.glow.scale.x = THREE.MathUtils.lerp(d.glow.scale.x, 1.6, 0.04);
          d.glow.scale.y = THREE.MathUtils.lerp(d.glow.scale.y, 1.6, 0.04);
          d.glow.material.opacity = Math.max(0, 0.7 - d.openProgress * 0.7);
        }

        // Sparks
        if (d.sparkActive) {
          d.sparkLife += delta;
          d.sparks.forEach((s) => {
            const u = s.userData;
            s.position.x += u.vx * delta;
            s.position.y += u.vy * delta;
            s.position.z += u.vz * delta;
            u.vy -= 5.5 * delta;
            const t = d.sparkLife / u.life;
            s.material.opacity = Math.max(0, 1 - t);
            if (s.position.y < 0.05) s.position.y = 0.05;
          });
          if (d.sparkLife > 1.4) {
            d.sparks.forEach((s) => {
              scene.remove(s);
              s.geometry.dispose();
              s.material.dispose();
            });
            d.sparks = [];
            d.sparkActive = false;
          }
        }

        if (dist < nearestDist) {
          nearestDist = dist;
          nearestDoor = d;
        }
      });

      let newHint = "Move with W A S D / arrows. Approach a door to start its task.";
      let newNear = null;
      if (nearestDoor && nearestDist < 3.4) {
        newNear = nearestDoor.id;
        if (nearestDoor.unlocked) {
          newHint = `${nearestDoor.config.title}: door open — walk through to enter the demo.`;
          if (!navigating && nearestDist < 1.2) {
            newHint = `Entering ${nearestDoor.config.title} demo…`;
            try { window.sessionStorage.setItem("demo_hub_return_to_center", "1"); } catch {}
            triggerNavigation(nearestDoor.config.href);
          }
        } else {
          newHint = `${nearestDoor.config.title} — ${nearestDoor.config.task.label}`;
        }
      }

      if (newHint !== lastHint) { lastHint = newHint; setHint(newHint); }
      if (newNear !== lastNear) { lastNear = newNear; setNearDoor(newNear); }
      let progressChanged = false;
      for (const k of Object.keys(progressSnap)) {
        if (progressSnap[k] !== lastProgress[k]) { progressChanged = true; break; }
      }
      if (progressChanged) { lastProgress = progressSnap; setProgress(progressSnap); }

      const camTarget = tmpVec.set(player.position.x * 0.35, 9.4, player.position.z * 0.35 + 12);
      camera.position.lerp(camTarget, 0.05);
      camera.lookAt(player.position.x * 0.5, 0.6, player.position.z * 0.5 - 1.4);

      renderer.render(scene, camera);
      mount._demoHubFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(mount._demoHubFrame);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", resize);
      scene.traverse((obj) => {
        if (obj.geometry) obj.geometry.dispose?.();
        if (obj.material) {
          const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
          mats.forEach((m) => { if (m.map) m.map.dispose?.(); m.dispose?.(); });
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      delete mount._demoHubSetMove;
      delete mount._demoHubFrame;
      delete mount._demoHubRespawn;
    };
  }, []);

  useEffect(() => {
    try { window.sessionStorage.removeItem("demo_hub_return_to_center"); } catch {}
    const respawn = () => mountRef.current?._demoHubRespawn?.();
    respawn();
    const onHashChange = () => {
      if (window.location.hash === "#demos" || window.location.hash === "") respawn();
    };
    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("popstate", onHashChange);
    const onVisibility = () => { if (document.visibilityState === "visible") respawn(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("popstate", onHashChange);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  const resetProgress = () => {
    try { window.sessionStorage.removeItem(STORAGE_KEY); } catch {}
    setUnlockedDoors(new Set());
    window.location.hash = "#demos";
    window.location.reload();
  };

  const unlockedCount = useMemo(() => {
    let n = 0;
    for (const d of DOOR_CONFIGS) {
      if (progress[d.id] >= 1) n += 1;
      else if (unlockedDoors.has(d.id)) n += 1;
    }
    return n;
  }, [progress, unlockedDoors]);

  const moveButton = (key, label, glyph) => (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => { e.preventDefault(); mountRef.current?._demoHubSetMove?.(key, true); }}
      onPointerUp={() => mountRef.current?._demoHubSetMove?.(key, false)}
      onPointerLeave={() => mountRef.current?._demoHubSetMove?.(key, false)}
      onPointerCancel={() => mountRef.current?._demoHubSetMove?.(key, false)}
    >
      {glyph}
    </button>
  );

  return (
    <div className="demo-hub-wrapper">
      <div className="demo-hub">
        <div
          className="demo-hub-canvas"
          ref={mountRef}
          role="application"
          aria-label="Interactive 3D demo hub. Use W A S D or arrow keys to move. Approach a door for its task."
          tabIndex={0}
        />
        <div className="demo-hub-overlay">
          <div className="demo-hub-task" aria-live="polite">
            <small>Task</small>
            <strong>{hint}</strong>
          </div>
          <div className="demo-hub-stat">
            <small>Doors open</small>
            <strong>{unlockedCount}/{DOOR_CONFIGS.length}</strong>
          </div>
          <div className="demo-hub-stat">
            <small>Near door</small>
            <strong>{nearDoor ? doorTitleById[nearDoor] : "—"}</strong>
          </div>
        </div>
        <div className="demo-hub-controls" aria-label="Movement controls">
          {moveButton("w", "Move up", "▲")}
          <div>
            {moveButton("a", "Move left", "◀")}
            {moveButton("s", "Move down", "▼")}
            {moveButton("d", "Move right", "▶")}
          </div>
        </div>
        <button type="button" className="demo-hub-reset" onClick={resetProgress} aria-label="Reset hub progress">
          Reset
        </button>
        <div className="demo-hub-legend" aria-hidden="true">
          <span>WASD / Arrows to move</span>
          <span>Walk through an open door to enter that demo</span>
        </div>
        <div ref={faderRef} className={`demo-hub-fader${fadeActive ? " active" : ""}`} aria-hidden="true" />
      </div>

      <details className="demo-hub-skip">
        <summary>Prefer a list? Skip the game and browse demos directly.</summary>
        <div className="demo-card-grid demo-hub-cards">
          {projects.map((p) => {
            const doorCfg = DOOR_CONFIGS.find((d) => d.id === p.id);
            const href = doorCfg?.href || `/demos/${p.id}`;
            return (
              <a key={p.id} className="demo-card demo-hub-card" href={href}>
                <span className="category-pill">{p.category}</span>
                <h3>{p.title}</h3>
                <p>{p.shortDescription}</p>
                <span className="project-demo-link">Open demo &rarr;</span>
              </a>
            );
          })}
        </div>
      </details>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────────────
 *  Player rig + animation
 * ────────────────────────────────────────────────────────────────────── */

function buildPlayer() {
  const root = new THREE.Group();

  // Torso (red)
  const torso = new THREE.Mesh(
    new THREE.CylinderGeometry(0.26, 0.3, 0.5, 16),
    new THREE.MeshStandardMaterial({ color: 0xd24a3c, roughness: 0.5 })
  );
  torso.position.y = 0.55;
  torso.castShadow = true;
  root.add(torso);

  // Head
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.28, 24, 18),
    new THREE.MeshStandardMaterial({ color: 0xffd9b5, roughness: 0.55 })
  );
  head.position.y = 1.05;
  head.castShadow = true;
  root.add(head);

  // Eyes (two tiny white spheres + pupils)
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const pupilMat = new THREE.MeshStandardMaterial({ color: 0x171717 });
  const eyeL = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), eyeMat);
  eyeL.position.set(-0.1, 1.07, 0.23);
  const eyeR = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), eyeMat);
  eyeR.position.set(0.1, 1.07, 0.23);
  const pupilL = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), pupilMat);
  pupilL.position.set(-0.1, 1.07, 0.27);
  const pupilR = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), pupilMat);
  pupilR.position.set(0.1, 1.07, 0.27);
  root.add(eyeL, eyeR, pupilL, pupilR);

  // Hat (cone)
  const hat = new THREE.Mesh(
    new THREE.ConeGeometry(0.32, 0.42, 18),
    new THREE.MeshStandardMaterial({ color: 0x245ee8, roughness: 0.55 })
  );
  hat.position.y = 1.4;
  hat.castShadow = true;
  root.add(hat);

  // Hat brim
  const brim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.34, 0.06, 18),
    new THREE.MeshStandardMaterial({ color: 0x1a3f9c, roughness: 0.6 })
  );
  brim.position.y = 1.2;
  root.add(brim);

  // Arms (two boxes)
  const armMat = new THREE.MeshStandardMaterial({ color: 0xd24a3c, roughness: 0.55 });
  const armGeo = new THREE.BoxGeometry(0.12, 0.42, 0.12);
  const armL = new THREE.Group();
  const armLMesh = new THREE.Mesh(armGeo, armMat);
  armLMesh.position.y = -0.21;
  armLMesh.castShadow = true;
  armL.add(armLMesh);
  armL.position.set(-0.32, 0.78, 0);
  const armR = new THREE.Group();
  const armRMesh = new THREE.Mesh(armGeo, armMat);
  armRMesh.position.y = -0.21;
  armRMesh.castShadow = true;
  armR.add(armRMesh);
  armR.position.set(0.32, 0.78, 0);
  root.add(armL, armR);

  // Legs (jeans color)
  const legMat = new THREE.MeshStandardMaterial({ color: 0x1d3a8a, roughness: 0.6 });
  const legGeo = new THREE.BoxGeometry(0.14, 0.36, 0.14);
  const legL = new THREE.Group();
  const legLMesh = new THREE.Mesh(legGeo, legMat);
  legLMesh.position.y = -0.18;
  legLMesh.castShadow = true;
  legL.add(legLMesh);
  legL.position.set(-0.13, 0.32, 0);
  const legR = new THREE.Group();
  const legRMesh = new THREE.Mesh(legGeo, legMat);
  legRMesh.position.y = -0.18;
  legRMesh.castShadow = true;
  legR.add(legRMesh);
  legR.position.set(0.13, 0.32, 0);
  root.add(legL, legR);

  return { root, torso, head, hat, armL, armR, legL, legR };
}

function animatePlayer(rig, walking, walkPhase, time) {
  if (walking) {
    const sw = Math.sin(walkPhase) * 0.6;
    const swA = Math.sin(walkPhase + Math.PI) * 0.5;
    rig.legL.rotation.x = sw;
    rig.legR.rotation.x = -sw;
    rig.armL.rotation.x = swA;
    rig.armR.rotation.x = -swA;
    // Slight body bounce
    rig.root.position.y = Math.abs(Math.sin(walkPhase)) * 0.06;
  } else {
    rig.legL.rotation.x *= 0.85;
    rig.legR.rotation.x *= 0.85;
    rig.armL.rotation.x *= 0.85;
    rig.armR.rotation.x *= 0.85;
    rig.root.position.y = Math.sin(time * 2.2) * 0.025;
  }
  // Subtle hat spin
  rig.hat.rotation.y += 0.02;
}

/* ──────────────────────────────────────────────────────────────────────
 *  Task object builders + per-frame updaters
 * ────────────────────────────────────────────────────────────────────── */

function buildTaskObjects(scene, door3D) {
  const { config, front } = door3D;
  const task = config.task;
  const at = (inward, side = 0, y = 0.2) => {
    const towardCenter = new THREE.Vector3(-front.x, 0, -front.z).normalize();
    const sideVec = new THREE.Vector3(-towardCenter.z, 0, towardCenter.x);
    return new THREE.Vector3(
      front.x + towardCenter.x * inward + sideVec.x * side,
      y,
      front.z + towardCenter.z * inward + sideVec.z * side
    );
  };

  if (task.type === "collect") {
    const positions = [at(1.2, -1.0, 0.6), at(1.8, 0.4, 0.6), at(2.4, -0.6, 0.6)];
    for (let i = 0; i < task.count; i += 1) {
      const token = new THREE.Mesh(
        new THREE.TorusGeometry(0.28, 0.08, 14, 28),
        new THREE.MeshStandardMaterial({ color: config.accent, emissive: 0x664400, metalness: 0.4, roughness: 0.35 })
      );
      token.position.copy(positions[i] || at(1.5 + i * 0.5, 0, 0.6));
      token.rotation.x = Math.PI / 2;
      token.castShadow = true;
      token.userData = { type: "token", baseY: token.position.y, phase: i, collected: false };
      scene.add(token);
      door3D.taskObjects.push(token);
    }
    door3D.taskState = { type: "collect", collected: 0, target: task.count };
  } else if (task.type === "plate") {
    const plate = makePlate(config.color, config.accent);
    plate.position.copy(at(1.6, 0, 0.04));
    scene.add(plate);
    door3D.taskObjects.push(plate);
    door3D.taskState = { type: "plate" };
  } else if (task.type === "charge") {
    const pad = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.9, 0.1, 24),
      new THREE.MeshStandardMaterial({ color: 0x2a1a45, emissive: 0x2a1f55, emissiveIntensity: 0.6, roughness: 0.4 })
    );
    pad.position.copy(at(1.5, 0, 0.05));
    scene.add(pad);
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.55, 0.78, 28, 1, 0, 0.001),
      new THREE.MeshBasicMaterial({ color: config.accent, side: THREE.DoubleSide })
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.copy(pad.position.clone().setY(0.11));
    scene.add(ring);
    door3D.taskObjects.push(pad, ring);
    door3D.taskState = { type: "charge", elapsed: 0, target: task.seconds, ring };
  } else if (task.type === "sequence") {
    const colors = { r: 0xd84747, g: 0x3aa86b, b: 0x3a72d8 };
    const order = task.order;
    const layout = [-1.1, 0, 1.1];
    const plates = {};
    for (let i = 0; i < 3; i += 1) {
      const key = order[i];
      const plate = makePlate(colors[key], colors[key]);
      plate.position.copy(at(1.6, layout[i], 0.04));
      plate.userData.key = key;
      scene.add(plate);
      door3D.taskObjects.push(plate);
      plates[key] = plate;
    }
    door3D.taskState = { type: "sequence", order, idx: 0, plates };
  } else if (task.type === "walk") {
    const marker = new THREE.Mesh(
      new THREE.ConeGeometry(0.35, 0.7, 14),
      new THREE.MeshStandardMaterial({ color: config.accent, emissive: 0x3a1b00, emissiveIntensity: 0.5, roughness: 0.4 })
    );
    marker.position.copy(at(1.6, 0, 0.55));
    marker.castShadow = true;
    marker.userData.baseY = marker.position.y;
    scene.add(marker);
    door3D.taskObjects.push(marker);
    door3D.taskState = { type: "walk" };
  } else if (task.type === "waypoints") {
    const positions = [at(1.1, -1.1, 0.18), at(1.1, 1.1, 0.18), at(2.4, -1.1, 0.18), at(2.4, 1.1, 0.18)];
    const wps = [];
    for (let i = 0; i < task.count; i += 1) {
      const wp = new THREE.Mesh(
        new THREE.CylinderGeometry(0.32, 0.32, 0.18, 18),
        new THREE.MeshStandardMaterial({ color: config.accent, emissive: 0x000022, roughness: 0.5 })
      );
      wp.position.copy(positions[i]);
      wp.userData = { hit: false, index: i };
      wp.castShadow = true;
      scene.add(wp);
      door3D.taskObjects.push(wp);
      wps.push(wp);
    }
    door3D.taskState = { type: "waypoints", hits: 0, target: task.count, list: wps };
  }
}

function updateTask(door3D, player, playerPlanar, delta) {
  const t = door3D.taskState;
  if (!t || t.completed) return;
  const time = performance.now() * 0.001;

  if (t.type === "collect") {
    door3D.taskObjects.forEach((token) => {
      if (token.userData.collected) return;
      token.rotation.z += delta * 2.6;
      token.position.y = token.userData.baseY + Math.sin(time * 2.8 + token.userData.phase) * 0.08;
      if (token.position.distanceTo(player.position) < 0.85) {
        token.userData.collected = true;
        token.visible = false;
        t.collected += 1;
        if (t.collected >= t.target) t.completed = true;
      }
    });
  } else if (t.type === "plate") {
    const plate = door3D.taskObjects[0];
    plate.userData.glow = THREE.MathUtils.lerp(plate.userData.glow || 0, 0, 0.1);
    if (playerPlanar.distanceTo(plate.position) < 0.85) {
      plate.userData.glow = 1;
      t.completed = true;
    }
    plate.material.emissiveIntensity = 0.3 + (plate.userData.glow || 0) * 0.7;
  } else if (t.type === "charge") {
    const pad = door3D.taskObjects[0];
    const onPad = playerPlanar.distanceTo(pad.position) < 0.9;
    if (onPad) t.elapsed = Math.min(t.target, t.elapsed + delta);
    else t.elapsed = Math.max(0, t.elapsed - delta * 0.6);
    const ratio = t.elapsed / t.target;
    if (t.ring) {
      t.ring.geometry.dispose();
      t.ring.geometry = new THREE.RingGeometry(0.55, 0.78, 32, 1, -Math.PI / 2, Math.max(0.001, ratio * Math.PI * 2));
    }
    if (ratio >= 0.999) t.completed = true;
  } else if (t.type === "sequence") {
    const next = t.order[t.idx];
    Object.entries(t.plates).forEach(([k, plate]) => {
      if (k === next) plate.material.emissiveIntensity = 0.85 + Math.sin(time * 4) * 0.25;
      else plate.material.emissiveIntensity = 0.25;
    });
    Object.entries(t.plates).forEach(([k, plate]) => {
      if (playerPlanar.distanceTo(plate.position) < 0.7) {
        if (k === next) {
          if (!plate.userData.hit) {
            plate.userData.hit = true;
            plate.material.emissive.setHex(0x222222);
            t.idx += 1;
            if (t.idx >= t.order.length) t.completed = true;
          }
        } else if (!plate.userData.hit) {
          Object.values(t.plates).forEach((p) => {
            p.userData.hit = false;
            p.material.emissive.setHex(0x000000);
          });
          t.idx = 0;
        }
      }
    });
  } else if (t.type === "walk") {
    const marker = door3D.taskObjects[0];
    marker.rotation.y += delta * 1.6;
    marker.position.y = marker.userData.baseY + Math.sin(time * 2.4) * 0.08;
    if (playerPlanar.distanceTo(marker.position) < 0.85) {
      marker.visible = false;
      t.completed = true;
    }
  } else if (t.type === "waypoints") {
    t.list.forEach((wp) => {
      if (wp.userData.hit) return;
      wp.rotation.y += delta * 1.1;
      if (playerPlanar.distanceTo(wp.position) < 0.78) {
        wp.userData.hit = true;
        wp.material.emissive.setHex(0x114411);
        wp.material.color.setHex(0x6ee27a);
        t.hits += 1;
        if (t.hits >= t.target) t.completed = true;
      }
    });
  }
}

function taskProgress(door3D) {
  const t = door3D.taskState;
  if (!t) return 0;
  if (t.completed || door3D.unlocked) return 1;
  if (t.type === "collect") return t.collected / t.target;
  if (t.type === "charge") return t.elapsed / t.target;
  if (t.type === "sequence") return t.idx / t.order.length;
  if (t.type === "waypoints") return t.hits / t.target;
  return 0;
}

function makePlate(color, accent) {
  const plate = new THREE.Mesh(
    new THREE.CylinderGeometry(0.7, 0.78, 0.12, 24),
    new THREE.MeshStandardMaterial({ color, emissive: accent, emissiveIntensity: 0.3, roughness: 0.4, metalness: 0.1 })
  );
  plate.castShadow = false;
  plate.receiveShadow = true;
  plate.userData = { glow: 0 };
  return plate;
}

function makeTextSprite(text, color, background) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  if (background && background !== "rgba(0,0,0,0)") {
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.fillStyle = color;
  context.font = "700 110px Arial, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  return new THREE.Sprite(material);
}
