import { useEffect, useRef, useState } from "react";
import Globe from "globe.gl";
import "./App.css";
import Space from "./assets/Stars.png";
import ISS from './assets/iss.glb';
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

function App() {

  const issModelRef = useRef(null);

  useEffect(() => {
  const loader = new GLTFLoader();
  loader.load(ISS, (gltf) => {
    issModelRef.current = gltf.scene;
  });
}, []);
  

  const containerRef = useRef(null);
  const globeRef = useRef(null);

  const [location, setLocation] = useState(null);

  useEffect(() => {
    async function fetchLocation() {
      try {
        const response = await fetch(
          "http://api.open-notify.org/iss-now.json"
        );

        if (!response.ok) {
          throw new Error("Something went wrong");
        }

        const data = await response.json();
        setLocation(data);
      } catch (error) {
        console.log(error.message);
      }
    }

    fetchLocation();

    const interval = setInterval(fetchLocation, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {

          const path = [
      { lat: 0, lng: 0 },
      {lat: 0, lng: 180},
      { lat: 0, lng: 360 },
    ];

    const otherpath = [
      {lat: 0, lng: 0},
      {lat:180, lng: 0},
      {lat: 360, lng: 0}
    ]

    globeRef.current = Globe()(containerRef.current)
      .backgroundImageUrl(Space)
      .globeImageUrl(
        "https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/144000/144898/BlackMarble_2016_01deg.jpg"
      )
      .atmosphereAltitude(0.2)
      .atmosphereColor("grey")
      .pathsData([path, otherpath])
      .pathPointLat("lat")
      .pathPointLng("lng")
      .pathColor(() => "grey")
      .pathStroke(.5)
      .pathDashLength(0.5)
      .pathDashGap(0.5)
      .pathDashAnimateTime(2000);

    return () => {
      globeRef.current?._destructor?.();
    };
  }, []);

  useEffect(() => {
    if (!location?.iss_position || !globeRef.current) return;
    if (!globeRef.current) return;
    if (!issModelRef.current) return;

    const lat = Number(location.iss_position.latitude);
    const lng = Number(location.iss_position.longitude);

    globeRef.current
  .customLayerData([
    {
      lat,
      lng,
      altitude: 0.1,
    },
  ])
  .customThreeObject(() => issModelRef.current.clone(true))
  .customThreeObjectUpdate((obj, data) => {
    const coords = globeRef.current.getCoords(
      data.lat,
      data.lng,
      data.altitude
    );

    obj.position.set(
      coords.x,
      coords.y,
      coords.z
    );
    const up = obj.position.clone().normalize();

    const reference = new THREE.Vector3(0, 1, 0);

    const forward = new THREE.Vector3()
        .crossVectors(reference, up)
        .normalize();

    const right = new THREE.Vector3()
        .crossVectors(up, forward)
        .normalize();

    const matrix = new THREE.Matrix4();

    matrix.makeBasis(
        right,
        up,
        forward
      );

    obj.quaternion.setFromRotationMatrix(matrix);

  });
  }, [location]);

  return (
    <>
    <div
      ref={containerRef}
      className="w-screen h-screen"
    />
    <div className="absolute top-10 left-10 flex flex-col gap-3">
     <p className="font-michroma text-2xl text-neutral-300">ISS Tracker</p>
     <p className="text-white font-michroma">Latitude: {location ? location.iss_position.latitude : '...'}</p>
     <p className="text-white font-michroma">Longitude: {location ? location.iss_position.longitude : '...'}</p>
    </div>
    </>
  );
}

export default App;