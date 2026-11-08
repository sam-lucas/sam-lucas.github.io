import * as THREE from 'three';

const canvas = document.getElementById('bg');
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
camera.position.z = 6;

const orb = new THREE.Group();
scene.add(orb);

// Particle sphere: points on a Fibonacci sphere, displaced by animated waves in the shader
const N = 9000;
const pts = new Float32Array(N * 3);
for (let i = 0; i < N; i++) {
  const y = 1 - (2 * (i + 0.5)) / N;
  const r = Math.sqrt(1 - y * y);
  const t = i * Math.PI * (3 - Math.sqrt(5));
  pts.set([Math.cos(t) * r * 1.6, y * 1.6, Math.sin(t) * r * 1.6], i * 3);
}
const sphereGeo = new THREE.BufferGeometry();
sphereGeo.setAttribute('position', new THREE.BufferAttribute(pts, 3));

const uniforms = {
  uTime: { value: 0 },
  uPixelRatio: { value: renderer.getPixelRatio() },
  uColorA: { value: new THREE.Color('#4b95db') },
  uColorB: { value: new THREE.Color('#c5e2ff') },
};

orb.add(new THREE.Points(sphereGeo, new THREE.ShaderMaterial({
  uniforms,
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  vertexShader: /* glsl */ `
    uniform float uTime;
    uniform float uPixelRatio;
    varying float vWave;
    void main() {
      vec3 n = normalize(position);
      float w = sin(n.x * 4.0 + uTime) * sin(n.y * 5.0 + uTime * 1.3) * sin(n.z * 3.0 + uTime * 0.7);
      vWave = w;
      vec4 mv = modelViewMatrix * vec4(position + n * w * 0.35, 1.0);
      gl_Position = projectionMatrix * mv;
      gl_PointSize = (2.0 + w * 2.0) * uPixelRatio * (6.0 / -mv.z);
    }`,
  fragmentShader: /* glsl */ `
    uniform vec3 uColorA;
    uniform vec3 uColorB;
    varying float vWave;
    void main() {
      float d = length(gl_PointCoord - 0.5);
      if (d > 0.5) discard;
      gl_FragColor = vec4(mix(uColorA, uColorB, vWave * 0.5 + 0.5), smoothstep(0.5, 0.0, d) * 0.9);
    }`,
})));

orb.add(new THREE.LineSegments(
  new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(0.9, 1)),
  new THREE.LineBasicMaterial({ color: '#4b95db', transparent: true, opacity: 0.35 }),
));

const rings = [2.2, 2.6].map((radius, i) => {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.006, 8, 200),
    new THREE.MeshBasicMaterial({ color: '#9cc6f0', transparent: true, opacity: 0.4 }),
  );
  ring.rotation.set(1.2 + i * 0.4, i * 0.6, 0);
  orb.add(ring);
  return ring;
});

// Distant starfield
const STARS = 1500;
const starPts = new Float32Array(STARS * 3).map(() => (Math.random() - 0.5) * 60);
const starGeo = new THREE.BufferGeometry();
starGeo.setAttribute('position', new THREE.BufferAttribute(starPts, 3));
const stars = new THREE.Points(starGeo, new THREE.PointsMaterial({ color: '#8aa0c8', size: 0.05, transparent: true, opacity: 0.7 }));
scene.add(stars);

let wide = true;
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  wide = w > 900;
}
addEventListener('resize', resize);
resize();

const pointer = { x: 0, y: 0 };
addEventListener('pointermove', (e) => {
  pointer.x = e.clientX / innerWidth - 0.5;
  pointer.y = e.clientY / innerHeight - 0.5;
});

const clock = new THREE.Clock();
let t = 0;
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  if (!reduceMotion) t += dt;
  uniforms.uTime.value = t;

  // 0 at top of page, 1 after scrolling one viewport: orb drifts from the right to center and grows
  const p = Math.min(scrollY / innerHeight, 1);
  const targetX = wide ? 2.2 * (1 - p) : 0;
  orb.position.x += (targetX - orb.position.x) * 0.08;
  orb.position.y = wide ? 0 : 1.2 * (1 - p);
  orb.scale.setScalar(1 + p * 0.5);

  orb.rotation.y = t * 0.15 + scrollY * 0.0015 + pointer.x * 0.6;
  orb.rotation.x += (pointer.y * 0.4 - orb.rotation.x) * 0.05;
  rings.forEach((r, i) => { r.rotation.z = t * (i ? -0.2 : 0.3); });
  stars.rotation.y = t * 0.01 + scrollY * 0.0002;

  camera.position.x += (pointer.x * 0.5 - camera.position.x) * 0.05;
  camera.position.y += (-pointer.y * 0.5 - camera.position.y) * 0.05;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
});
