// Parallel Internet - Base Globe Component
// Reusable Three.js globe visualization

const PIGlobe = (function() {
  'use strict';

  let scene, camera, renderer, globe, markers = [];
  let raycaster, mouse;
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  let autoRotate = true;
  let glowMeshes = [];
  let onMarkerClick = null;
  let onMarkerHover = null;

  // ============================================
  // GLOBE INITIALIZATION
  // ============================================

  function init(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('[PIGlobe] Container not found:', containerId);
      return false;
    }

    // Check if Three.js is loaded
    if (typeof THREE === 'undefined') {
      console.warn('[PIGlobe] Three.js not loaded, using fallback');
      initFallback(container, options);
      return false;
    }

    try {
      // Scene setup
      scene = new THREE.Scene();

      // Camera
      camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
      camera.position.z = options.cameraZ || 2.8;

      // Renderer
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.domElement.style.cursor = 'grab';
      container.appendChild(renderer.domElement);

      // Raycaster for click detection
      raycaster = new THREE.Raycaster();
      mouse = new THREE.Vector2();

      // Create globe
      createGlobe(options);

      // Setup interactions
      setupInteractions(container);

      // Start animation
      animate();

      // Handle resize
      window.addEventListener('resize', () => onWindowResize(container));

      return true;
    } catch (error) {
      console.error('[PIGlobe] Initialization error:', error);
      return false;
    }
  }

  function createGlobe(options = {}) {
    const geometry = new THREE.SphereGeometry(1, 64, 64);

    // Globe shader material
    const globeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        baseColor: { value: new THREE.Color(options.baseColor || '#0a0a1a') },
        glowColor: { value: new THREE.Color(options.glowColor || '#3b82f6') }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec2 vUv;
        varying vec3 vPosition;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          vUv = uv;
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 baseColor;
        uniform vec3 glowColor;
        varying vec3 vNormal;
        varying vec2 vUv;
        varying vec3 vPosition;

        void main() {
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          vec3 atmosphere = glowColor * intensity;
          vec3 base = baseColor;

          // Grid lines
          float latLines = smoothstep(0.02, 0.0, abs(fract(vUv.y * 12.0) - 0.5));
          float lonLines = smoothstep(0.02, 0.0, abs(fract(vUv.x * 24.0) - 0.5));
          vec3 grid = glowColor * max(latLines, lonLines) * 0.3;

          gl_FragColor = vec4(base + atmosphere + grid, 1.0);
        }
      `,
      transparent: true
    });

    globe = new THREE.Mesh(geometry, globeMaterial);
    scene.add(globe);

    // Atmosphere glow
    const atmosphereGeometry = new THREE.SphereGeometry(1.15, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(options.glowColor || '#3b82f6') }
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying vec3 vNormal;
        void main() {
          float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
          gl_FragColor = vec4(glowColor, intensity * 0.4);
        }
      `,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      transparent: true
    });

    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);
  }

  // ============================================
  // MARKER MANAGEMENT
  // ============================================

  function addMarker(data) {
    if (!globe) return null;

    const color = data.color || '#4ade80';
    const size = data.size || 0.025;

    // Main marker
    const markerGeometry = new THREE.SphereGeometry(size, 16, 16);
    const markerMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.9
    });
    const marker = new THREE.Mesh(markerGeometry, markerMaterial);

    // Glow effect
    const glowGeometry = new THREE.SphereGeometry(size * 1.6, 16, 16);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);

    // Position
    const pos = latLonToVector3(data.lat, data.lon, 1.02);
    marker.position.copy(pos);
    glow.position.copy(pos);

    // Store data
    marker.userData = data;
    glow.userData = { isGlow: true, markerId: data.id };

    // Add to globe
    globe.add(marker);
    globe.add(glow);

    markers.push(marker);
    glowMeshes.push(glow);

    return marker;
  }

  function addMarkers(dataArray) {
    dataArray.forEach(data => addMarker(data));
  }

  function clearMarkers() {
    markers.forEach(marker => {
      globe.remove(marker);
      marker.geometry.dispose();
      marker.material.dispose();
    });
    glowMeshes.forEach(glow => {
      globe.remove(glow);
      glow.geometry.dispose();
      glow.material.dispose();
    });
    markers = [];
    glowMeshes = [];
  }

  function latLonToVector3(lat, lon, radius) {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lon + 180) * (Math.PI / 180);

    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);

    return new THREE.Vector3(x, y, z);
  }

  // ============================================
  // INTERACTIONS
  // ============================================

  function setupInteractions(container) {
    const canvas = renderer.domElement;

    canvas.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging) {
        const deltaX = event.clientX - previousMousePosition.x;
        const deltaY = event.clientY - previousMousePosition.y;

        if (globe) {
          globe.rotation.y += deltaX * 0.005;
          globe.rotation.x += deltaY * 0.005;
          globe.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, globe.rotation.x));
        }

        previousMousePosition = { x: event.clientX, y: event.clientY };
      } else {
        checkHover(event);
      }
    });

    canvas.addEventListener('mousedown', (event) => {
      isDragging = true;
      autoRotate = false;
      previousMousePosition = { x: event.clientX, y: event.clientY };
      canvas.style.cursor = 'grabbing';
    });

    canvas.addEventListener('mouseup', (event) => {
      isDragging = false;
      canvas.style.cursor = 'grab';
      setTimeout(() => { if (!isDragging) autoRotate = true; }, 3000);
    });

    canvas.addEventListener('click', checkClick);

    canvas.addEventListener('dblclick', () => {
      if (globe) {
        globe.rotation.x = 0;
        globe.rotation.y = 0;
      }
      autoRotate = true;
    });
  }

  function checkHover(event) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(markers);

    if (intersects.length > 0) {
      const marker = intersects[0].object;
      renderer.domElement.style.cursor = 'pointer';

      if (onMarkerHover) {
        onMarkerHover(marker.userData, event);
      }
    } else {
      if (!isDragging) {
        renderer.domElement.style.cursor = 'grab';
      }
      if (onMarkerHover) {
        onMarkerHover(null, event);
      }
    }
  }

  function checkClick(event) {
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(markers);

    if (intersects.length > 0 && onMarkerClick) {
      const marker = intersects[0].object;
      onMarkerClick(marker.userData, event);
    }
  }

  // ============================================
  // ANIMATION
  // ============================================

  function animate() {
    requestAnimationFrame(animate);

    if (autoRotate && globe) {
      globe.rotation.y += 0.001;
    }

    // Pulse glow meshes
    const time = Date.now() * 0.001;
    glowMeshes.forEach((glow, i) => {
      const scale = 1 + Math.sin(time * 2 + i) * 0.2;
      glow.scale.setScalar(scale);
    });

    if (renderer && scene && camera) {
      renderer.render(scene, camera);
    }
  }

  function onWindowResize(container) {
    if (!camera || !renderer) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }

  // ============================================
  // FALLBACK (CSS-based)
  // ============================================

  function initFallback(container, options) {
    container.innerHTML = `
      <div class="pi-fallback-globe">
        <div class="globe-sphere"></div>
        <div class="globe-grid"></div>
        <div class="marker-container"></div>
      </div>
    `;
    // Fallback implementation for non-WebGL browsers
  }

  // ============================================
  // PUBLIC API
  // ============================================

  function rotateToMarker(markerId) {
    const marker = markers.find(m => m.userData.id === markerId);
    if (!marker || !globe) return;

    const pos = marker.position;
    const targetRotationY = Math.atan2(pos.x, pos.z);

    const startRotation = globe.rotation.y;
    const diff = targetRotationY - startRotation;
    const normalizedDiff = ((diff + Math.PI) % (2 * Math.PI)) - Math.PI;

    let progress = 0;
    const animateRotation = () => {
      progress += 0.05;
      if (progress < 1) {
        globe.rotation.y = startRotation + normalizedDiff * (1 - Math.pow(1 - progress, 3));
        requestAnimationFrame(animateRotation);
      }
    };
    autoRotate = false;
    animateRotation();
  }

  function highlightMarker(markerId) {
    markers.forEach(marker => {
      if (marker.userData.id === markerId) {
        marker.scale.setScalar(2);
      } else {
        marker.scale.setScalar(1);
      }
    });
  }

  return {
    init,
    addMarker,
    addMarkers,
    clearMarkers,
    rotateToMarker,
    highlightMarker,
    setAutoRotate: (val) => { autoRotate = val; },
    onMarkerClick: (fn) => { onMarkerClick = fn; },
    onMarkerHover: (fn) => { onMarkerHover = fn; },
    latLonToVector3
  };
})();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PIGlobe;
}
