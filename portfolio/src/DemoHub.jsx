import React, { useRef, useState } from "react";
import * as THREE from "three";

const demoDoors = [
  {
    id: "orbit",
    title: "Orbit",
    href: "/demos/orbit",
    position: [-5.6, 0, -7.8],
    color: 0x245ee8,
    task: "Collect 3 serial tokens to unlock",
    active: true,
  },
  {
    id: "automation",
    title: "Automation",
    href: "/#demos",
    position: [0, 0, -7.8],
    color: 0x0f766e,
    task: "Future workflow room",
    active: false,
  },
  {
    id: "data",
    title: "Data",
    href: "/#demos",
    position: [5.6, 0, -7.8],
    color: 0xb7791f,
    task: "Future analytics room",
    active: false,
  },
];

const tokenPositions = [
  [-4.2, 0.55, 3.8],
  [0.2, 0.55, -1.2],
  [4.1, 0.55, 3.1],
];

export default function DemoHub() {
  const mountRef = useRef(null);
  const [tokens, setTokens] = useState(0);
  const [activeHint, setActiveHint] = useState("Collect 3 serial tokens to open the Orbit door.");
  const [orbitOpen, setOrbitOpen] = useState(false);

  React.useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xdfe7ef);
    scene.fog = new THREE.Fog(0xdfe7ef, 12, 34);

    const camera = new THREE.PerspectiveCamera(58, mount.clientWidth / mount.clientHeight, 0.1, 100);
    camera.position.set(0, 8.8, 10.8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth, mount.clientHeight);
    renderer.shadowMap.enabled = true;
    mount.appendChild(renderer.domElement);

    const ambient = new THREE.HemisphereLight(0xffffff, 0x6b7280, 1.4);
    scene.add(ambient);

    const sun = new THREE.DirectionalLight(0xffffff, 1.9);
    sun.position.set(4, 9, 7);
    sun.castShadow = true;
    scene.add(sun);

    const floor = new THREE.Mesh(
      new THREE.BoxGeometry(15, 0.28, 18),
      new THREE.MeshStandardMaterial({ color: 0xebe7dc, roughness: 0.85 })
    );
    floor.position.y = -0.14;
    floor.receiveShadow = true;
    scene.add(floor);

    const wallMaterial = new THREE.MeshStandardMaterial({ color: 0xfaf8f1, roughness: 0.9 });
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(15, 4, 0.35), wallMaterial);
    backWall.position.set(0, 2, -8.95);
    backWall.receiveShadow = true;
    scene.add(backWall);

    const sideWallGeometry = new THREE.BoxGeometry(0.35, 4, 18);
    const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    leftWall.position.set(-7.7, 2, 0);
    const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
    rightWall.position.set(7.7, 2, 0);
    scene.add(leftWall, rightWall);

    const player = new THREE.Mesh(
      new THREE.SphereGeometry(0.34, 24, 16),
      new THREE.MeshStandardMaterial({ color: 0xd24a3c, roughness: 0.45 })
    );
    player.position.set(0, 0.38, 4.8);
    player.castShadow = true;
    scene.add(player);

    const playerCap = new THREE.Mesh(
      new THREE.ConeGeometry(0.36, 0.45, 20),
      new THREE.MeshStandardMaterial({ color: 0x245ee8, roughness: 0.55 })
    );
    playerCap.position.set(0, 0.82, 4.8);
    playerCap.castShadow = true;
    scene.add(playerCap);

    const doorRefs = {};
    demoDoors.forEach((door) => {
      const group = new THREE.Group();
      group.position.set(...door.position);

      const frame = new THREE.Mesh(
        new THREE.BoxGeometry(2.25, 2.8, 0.26),
        new THREE.MeshStandardMaterial({ color: 0x24211b, roughness: 0.6 })
      );
      frame.position.y = 1.38;
      frame.castShadow = true;

      const slab = new THREE.Mesh(
        new THREE.BoxGeometry(1.75, 2.35, 0.32),
        new THREE.MeshStandardMaterial({
          color: door.active ? door.color : 0x8a8478,
          roughness: 0.52,
          metalness: 0.05,
        })
      );
      slab.position.y = 1.18;
      slab.position.z = 0.08;
      slab.castShadow = true;

      const sign = makeTextSprite(
        door.title,
        door.active ? "#ffffff" : "#f3f1eb",
        door.active ? "#171717" : "#5f5a50"
      );
      sign.position.set(0, 2.95, 0.28);
      sign.scale.set(1.7, 0.55, 1);

      group.add(frame, slab, sign);
      scene.add(group);
      doorRefs[door.id] = { group, slab, door };
    });

    const tokenRefs = tokenPositions.map((position, index) => {
      const token = new THREE.Mesh(
        new THREE.TorusGeometry(0.28, 0.08, 12, 28),
        new THREE.MeshStandardMaterial({ color: 0xffcc4d, emissive: 0x5c3c00, roughness: 0.3 })
      );
      token.position.set(...position);
      token.rotation.x = Math.PI / 2;
      token.castShadow = true;
      token.userData = { index, collected: false };
      scene.add(token);
      return token;
    });

    const keys = new Set();
    const collected = new Set();
    const state = { tokens: 0, orbitOpen: false, navigating: false };
    const clock = new THREE.Clock();

    const onKeyDown = (event) => keys.add(event.key.toLowerCase());
    const onKeyUp = (event) => keys.delete(event.key.toLowerCase());
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    const setMove = (key, enabled) => {
      if (enabled) keys.add(key);
      else keys.delete(key);
    };
    mount._demoHubSetMove = setMove;

    const resize = () => {
      if (!mount.clientWidth || !mount.clientHeight) return;
      camera.aspect = mount.clientWidth / mount.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mount.clientWidth, mount.clientHeight);
    };
    window.addEventListener("resize", resize);

    const animate = () => {
      const delta = Math.min(clock.getDelta(), 0.04);
      const speed = 4.2 * delta;
      const move = new THREE.Vector3(0, 0, 0);
      if (keys.has("w") || keys.has("arrowup")) move.z -= speed;
      if (keys.has("s") || keys.has("arrowdown")) move.z += speed;
      if (keys.has("a") || keys.has("arrowleft")) move.x -= speed;
      if (keys.has("d") || keys.has("arrowright")) move.x += speed;

      player.position.x = THREE.MathUtils.clamp(player.position.x + move.x, -6.75, 6.75);
      player.position.z = THREE.MathUtils.clamp(player.position.z + move.z, -6.95, 7.1);
      playerCap.position.x = player.position.x;
      playerCap.position.z = player.position.z;
      playerCap.rotation.y += delta * 1.8;

      tokenRefs.forEach((token) => {
        if (token.userData.collected) return;
        token.rotation.z += delta * 2.4;
        token.position.y = 0.62 + Math.sin(clock.elapsedTime * 2.8 + token.userData.index) * 0.08;
        if (token.position.distanceTo(player.position) < 0.72) {
          token.userData.collected = true;
          token.visible = false;
          collected.add(token.userData.index);
          state.tokens = collected.size;
          setTokens(state.tokens);
          setActiveHint(
            state.tokens < 3
              ? `${3 - state.tokens} serial token${3 - state.tokens === 1 ? "" : "s"} left.`
              : "Orbit door unlocked. Walk into the blue door."
          );
        }
      });

      if (!state.orbitOpen && state.tokens >= 3) {
        state.orbitOpen = true;
        setOrbitOpen(true);
      }

      const orbitRef = doorRefs.orbit;
      if (orbitRef) {
        const targetY = state.orbitOpen ? 1.8 : 1.18;
        orbitRef.slab.position.y = THREE.MathUtils.lerp(orbitRef.slab.position.y, targetY, 0.08);
      }

      Object.values(doorRefs).forEach(({ group, door }) => {
        const distance = group.position.distanceTo(new THREE.Vector3(player.position.x, 0, player.position.z));
        if (distance < 1.35) {
          if (!door.active) {
            setActiveHint(`${door.title} door is a placeholder for a future demo.`);
          } else if (state.orbitOpen && !state.navigating) {
            state.navigating = true;
            setActiveHint("Entering Orbit demo...");
            window.location.href = door.href;
          } else if (!state.orbitOpen) {
            setActiveHint(door.task);
          }
        }
      });

      camera.position.x = THREE.MathUtils.lerp(camera.position.x, player.position.x * 0.22, 0.05);
      camera.position.z = THREE.MathUtils.lerp(camera.position.z, player.position.z + 8.8, 0.04);
      camera.lookAt(player.position.x, 0.3, player.position.z - 2.8);

      renderer.render(scene, camera);
      mount._demoHubFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(mount._demoHubFrame);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("resize", resize);
      renderer.dispose();
      mount.removeChild(renderer.domElement);
      delete mount._demoHubSetMove;
      delete mount._demoHubFrame;
    };
  }, []);

  const moveButton = (key, label) => (
    <button
      type="button"
      aria-label={label}
      onPointerDown={() => mountRef.current?._demoHubSetMove?.(key, true)}
      onPointerUp={() => mountRef.current?._demoHubSetMove?.(key, false)}
      onPointerLeave={() => mountRef.current?._demoHubSetMove?.(key, false)}
    >
      {label}
    </button>
  );

  return (
    <div className="demo-hub">
      <div className="demo-hub-canvas" ref={mountRef} aria-label="3D demo hub game"></div>
      <div className="demo-hub-overlay">
        <div>
          <small>Task</small>
          <strong>{activeHint}</strong>
        </div>
        <div>
          <small>Serial tokens</small>
          <strong>{tokens}/3</strong>
        </div>
        <div>
          <small>Orbit door</small>
          <strong>{orbitOpen ? "Open" : "Locked"}</strong>
        </div>
      </div>
      <div className="demo-hub-controls" aria-label="Movement controls">
        {moveButton("w", "Up")}
        <div>
          {moveButton("a", "Left")}
          {moveButton("s", "Down")}
          {moveButton("d", "Right")}
        </div>
      </div>
    </div>
  );
}

function makeTextSprite(text, color, background) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;
  const context = canvas.getContext("2d");
  context.fillStyle = background;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = color;
  context.font = "700 58px Arial";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
  return new THREE.Sprite(material);
}
