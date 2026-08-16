import { useEffect, useRef, useState } from "react";
import Globe from "globe.gl";
import "./App.css";
import Space from "./assets/Stars.png";

function App() {
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
    globeRef.current = Globe()(containerRef.current)
      .backgroundImageUrl(Space)
      .globeImageUrl(
        "https://assets.science.nasa.gov/content/dam/science/esd/eo/images/imagerecords/144000/144898/BlackMarble_2016_01deg.jpg"
      )
      .atmosphereAltitude(0.2)
      .atmosphereColor("grey");

    return () => {
      globeRef.current?._destructor?.();
    };
  }, []);

  useEffect(() => {
    if (!location?.iss_position || !globeRef.current) return;

    const lat = Number(location.iss_position.latitude);
    const lng = Number(location.iss_position.longitude);

    console.log("ISS:", lat, lng);

    globeRef.current
      .pointsData([
        {
          lat,
          lng,
          size: 1,
          color: "red",
        },
      ])
      .pointAltitude(0.1)
      .pointColor("color");
  }, [location]);

  return (
    <div
      ref={containerRef}
      className="globe-container"
    />
  );
}

export default App;