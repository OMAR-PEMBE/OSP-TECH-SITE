"use client";

import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Svg } from "@react-three/drei";
import * as THREE from "three";
import { readBrandColors } from "@/lib/brand/tokens";

/**
 * Tier 3 of 3: the full hero scene (prd.md 5.2, UI-UX.md 8).
 *
 * A rotating OSP mark in front of a network of glowing blue/teal nodes that
 * leans toward the pointer. Loaded only by hero-visual.tsx, only through
 * next/dynamic with `ssr: false`, and only on a device that passed the
 * capability check -- so three.js never reaches the server render, never
 * blocks first paint, and never ships to a phone that cannot use it.
 *
 * Budget (architecture.md 8.4): no lights and no shadows, one BufferGeometry
 * for every link, pixel ratio capped at 1.5, and `frameloop="never"` whenever
 * the hero is off screen or the tab is hidden.
 *
 * Colours are read from the live `--color-*` tokens, so there is no brand hex
 * in this file and the scene follows globals.css automatically.
 *
 * On the brand don'ts: static logo use forbids rotation. The hero 3D is the
 * one place UI-UX.md 8 and prd.md 5.2 explicitly ask for a "rotating 3D OSP
 * logo", and it turns the unmodified kit SVG -- no recolour, no rebuilt
 * wordmark.
 */

const NODE_COUNT = 46;

/** Nodes closer than this, in world units, get a connecting line. */
const LINK_DISTANCE = 1.5;

const FIELD = { x: 9, y: 5, z: 3.2 };

type NodeField = {
  /** Home position of each node. */
  home: Float32Array;
  /** Live position of each node, rewritten every frame. */
  live: Float32Array;
  /** Per-node drift speed and phase, so the field breathes unevenly. */
  drift: Float32Array;
  /** Flat list of node indices, two per line segment. */
  linkIndices: number[];
  /** Line endpoint buffer, rewritten every frame. */
  linkPositions: Float32Array;
};

/**
 * Lays out the node field and works out which pairs are close enough to link.
 *
 * Done once. The link list never changes at runtime -- only the positions move
 * -- which keeps the per-frame cost to two buffer writes and no allocation.
 *
 * The layout uses a seeded generator rather than Math.random so the hero looks
 * identical on every load, which also keeps visual regression shots stable.
 */
function buildField(): NodeField {
  let seed = 20_251_004;
  const rand = () => {
    seed = (seed * 1_664_525 + 1_013_904_223) % 4_294_967_296;
    return seed / 4_294_967_296;
  };

  const home = new Float32Array(NODE_COUNT * 3);
  const drift = new Float32Array(NODE_COUNT * 2);

  for (let i = 0; i < NODE_COUNT; i++) {
    home[i * 3] = (rand() * 2 - 1) * FIELD.x;
    home[i * 3 + 1] = (rand() * 2 - 1) * FIELD.y;
    home[i * 3 + 2] = (rand() * 2 - 1) * FIELD.z;
    drift[i * 2] = 0.25 + rand() * 0.5;
    drift[i * 2 + 1] = rand() * Math.PI * 2;
  }

  const linkIndices: number[] = [];
  for (let a = 0; a < NODE_COUNT; a++) {
    for (let b = a + 1; b < NODE_COUNT; b++) {
      const dx = home[a * 3] - home[b * 3];
      const dy = home[a * 3 + 1] - home[b * 3 + 1];
      const dz = home[a * 3 + 2] - home[b * 3 + 2];
      if (Math.hypot(dx, dy, dz) < LINK_DISTANCE) linkIndices.push(a, b);
    }
  }

  return {
    home,
    live: home.slice(),
    drift,
    linkIndices,
    linkPositions: new Float32Array(linkIndices.length * 3),
  };
}

function NodeNetwork({ blue, teal }: { blue: string; teal: string }) {
  const field = useMemo(() => buildField(), []);
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  /* eslint-disable react-hooks/immutability --
     `field.live` and `field.linkPositions` ARE the GPU buffers: they were
     handed to <bufferAttribute> once and three.js re-reads them in place on
     every frame. Writing into them is the entire mechanism, and it happens
     inside useFrame, which runs outside React's render cycle and never
     triggers a re-render. Copying them instead would allocate ~1.6 kB of
     Float32Array 60 times a second on a phone, which is precisely what the
     performance budget forbids. The arrays are never read during render. */
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const { home, live, drift, linkIndices, linkPositions } = field;

    for (let i = 0; i < NODE_COUNT; i++) {
      const speed = drift[i * 2];
      const phase = drift[i * 2 + 1];
      live[i * 3] = home[i * 3] + Math.sin(t * speed + phase) * 0.22;
      live[i * 3 + 1] =
        home[i * 3 + 1] + Math.cos(t * speed * 0.8 + phase) * 0.22;
    }

    for (let l = 0; l < linkIndices.length; l++) {
      const n = linkIndices[l];
      linkPositions[l * 3] = live[n * 3];
      linkPositions[l * 3 + 1] = live[n * 3 + 1];
      linkPositions[l * 3 + 2] = live[n * 3 + 2];
    }

    const points = pointsRef.current?.geometry.attributes.position;
    if (points) points.needsUpdate = true;

    const lines = linesRef.current?.geometry.attributes.position;
    if (lines) lines.needsUpdate = true;
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <group>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[field.linkPositions, 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color={teal}
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </lineSegments>

      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[field.live, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          color={blue}
          size={0.14}
          sizeAttenuation
          transparent
          opacity={0.95}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}

/**
 * The kit's compact mark, loaded as vector geometry and turned slowly.
 *
 * The compact mark rather than the on-dark one: it is drawn in blue and teal
 * with the navy bars dropped, so a turning silhouette stays clean. The on-dark
 * variant carries a white bar that, once the mark is edge-on, reads as a stray
 * slab rather than part of the logo.
 *
 * Scale is deliberately restrained. At the camera's framing the mark spans
 * about a fifth of the viewport width, which keeps the hero near the 60/30/10
 * ratio and leaves the headline the dominant element (UI-UX.md 2.2).
 */
const MARK = { width: 182, height: 70, scale: 0.0125 };

function RotatingMark() {
  const group = useRef<THREE.Group>(null);
  const viewport = useThree((state) => state.viewport);

  /* Place the mark against the live viewport rather than at a fixed point.
     On a wide screen it sits to the right of the headline column; on a phone
     the hero is a single text column, so it moves up into the space above the
     eyebrow instead of drifting off the right edge. */
  const portrait = viewport.aspect < 1;
  const home: [number, number, number] = portrait
    ? [viewport.width * 0.19, viewport.height * 0.24, 0]
    : [viewport.width * 0.27, 0.5, 0];

  useFrame(({ clock, pointer }) => {
    const g = group.current;
    if (!g) return;
    const t = clock.getElapsedTime();
    g.rotation.y = t * 0.3 + pointer.x * 0.25;
    g.rotation.x = Math.sin(t * 0.4) * 0.08 - pointer.y * 0.12;
    g.position.y = home[1] + Math.sin(t * 0.6) * 0.12;
  });

  return (
    <group ref={group} position={home} scale={portrait ? 0.78 : 1}>
      {/* The SVG is authored with y running downward, so it is scaled down,
          flipped on Y, and shifted so its own centre lands on the group
          origin -- otherwise it would orbit its top-left corner. */}
      <group
        scale={MARK.scale}
        position={[
          (-MARK.width / 2) * MARK.scale,
          (MARK.height / 2) * MARK.scale,
          0,
        ]}
        rotation={[Math.PI, 0, 0]}
      >
        <Svg src="/brand/osp-mark-compact.svg" />
      </group>
    </group>
  );
}

/** Leans the whole field toward the pointer -- the "reacts to mouse" behaviour. */
function PointerLean({ children }: { children: React.ReactNode }) {
  const group = useRef<THREE.Group>(null);
  const { pointer } = useThree();

  useFrame(() => {
    const g = group.current;
    if (!g) return;
    /* Damped, so a fast flick eases in rather than snapping. */
    g.rotation.y += (pointer.x * 0.12 - g.rotation.y) * 0.04;
    g.rotation.x += (-pointer.y * 0.08 - g.rotation.x) * 0.04;
  });

  return <group ref={group}>{children}</group>;
}

export default function HeroScene({ active }: { active: boolean }) {
  /* Read once on mount: the tokens do not change within a page view. */
  const colors = useMemo(() => readBrandColors(), []);

  return (
    <Canvas
      dpr={[1, 1.5]}
      frameloop={active ? "always" : "never"}
      camera={{ position: [0, 0, 7.5], fov: 50 }}
      gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
      /* Decorative. The headline next to it carries all the meaning, and it
         must never swallow a tap meant for the buttons underneath. */
      aria-hidden="true"
      style={{ pointerEvents: "none" }}
    >
      <PointerLean>
        <NodeNetwork blue={colors.blue} teal={colors.teal} />
        <RotatingMark />
      </PointerLean>
    </Canvas>
  );
}
