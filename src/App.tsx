import { useEffect, useRef, useState } from "react";
import Globe, { type GlobeInstance } from "globe.gl";
import "./App.css";
import Space from "./assets/Stars.png";
import ISS from "./assets/iss.glb";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

interface ISSLocation {
  iss_position: {
    latitude: string;
    longitude: string;
  };
}

interface ISSMarker {
  lat: number;
  lng: number;
  altitude: number;
}

function App() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const globeRef = useRef<GlobeInstance | null>(null);
  const issModelRef = useRef<THREE.Object3D | null>(null);

  const [location, setLocation] = useState<ISSLocation | null>(null);
  const [modelLoaded, setModelLoaded] = useState(false);

  useEffect(() => {
    const loader = new GLTFLoader();

    loader.load(
      ISS,
      (gltf) => {
        issModelRef.current = gltf.scene;
        setModelLoaded(true);
      },
      undefined,
      (error: unknown) => {
        console.error("Failed to load ISS model:", error);
      }
    );
  }, []);

  useEffect(() => {
    let active = true;

    async function fetchLocation() {
      try {
        const response = await fetch(
          "https://api.open-notify.org/iss-now.json"
        );

        if (!response.ok) {
          throw new Error(`ISS API error: ${response.status}`);
        }

        const data: unknown = await response.json();

        if (
          typeof data === "object" &&
          data !== null &&
          "iss_position" in data
        ) {
          const result = data as ISSLocation;

          if (active) {
            setLocation(result);
          }
        }
      } catch (error: unknown) {
        console.error(
          "Failed to fetch ISS location:",
          error instanceof Error ? error.message : String(error)
        );
      }
    }

    void fetchLocation();

    const interval = window.setInterval(() => {
      void fetchLocation();
    }, 5000);

    return () => {
      active = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) return;

    const path = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 180 },
      { lat: 0, lng: 360 },
    ];

    const otherPath = [
      { lat: 0, lng: 0 },
      { lat: 180, lng: 0 },
      { lat: 360, lng: 0 },
    ];

    const globe = new Globe(container);

    globeRef.current = globe;

    globe
      .backgroundImageUrl(Space)
      .globeImageUrl(
        "https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/144000/144898/BlackMarble_2016_01deg.jpg"
      )
      .atmosphereAltitude(0.2)
      .atmosphereColor("grey")
      .pathsData([path, otherPath])
      .pathPointLat("lat")
      .pathPointLng("lng")
      .pathColor(() => "grey")
      .pathStroke(0.5)
      .pathDashLength(0.5)
      .pathDashGap(0.5)
      .pathDashAnimateTime(2000);

    return () => {
      const disposableGlobe = globe as GlobeInstance & {
        _destructor?: () => void;
      };

      disposableGlobe._destructor?.();
      globeRef.current = null;
    };
  }, []);

  useEffect(() => {
    const globe = globeRef.current;
    const model = issModelRef.current;
    const position = location?.iss_position;

    if (!globe || !model || !position || !modelLoaded) return;

    const lat = Number(position.latitude);
    const lng = Number(position.longitude);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    const marker: ISSMarker = {
      lat,
      lng,
      altitude: 0.1,
    };

    globe
      .customLayerData([marker])
      .customThreeObject(() => model.clone(true))
      .customThreeObjectUpdate((obj, data) => {
        const currentMarker = data as ISSMarker;
        const object = obj as THREE.Object3D;

        const coords = globe.getCoords(
          currentMarker.lat,
          currentMarker.lng,
          currentMarker.altitude
        );

        object.position.set(coords.x, coords.y, coords.z);

        const up = object.position.clone().normalize();
        const reference = new THREE.Vector3(0, 1, 0);

        const forward = new THREE.Vector3()
          .crossVectors(reference, up)
          .normalize();

        const right = new THREE.Vector3()
          .crossVectors(up, forward)
          .normalize();

        const matrix = new THREE.Matrix4();

        matrix.makeBasis(right, up, forward);

        object.quaternion.setFromRotationMatrix(matrix);
      });
  }, [location, modelLoaded]);

  return (
    <>
      <div ref={containerRef} className="w-screen h-screen" />

      <div className="absolute top-10 left-10 flex flex-col gap-3">
        <p className="font-michroma text-2xl text-neutral-300">
          ISS Tracker
        </p>

        <p className="text-white font-michroma">
          Latitude: {location ? location.iss_position.latitude : "..."}
        </p>

        <p className="text-white font-michroma">
          Longitude: {location ? location.iss_position.longitude : "..."}
        </p>
      </div>
    </>
  );
}

export default App;
