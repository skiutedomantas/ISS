import { useEffect, useRef } from "react";
import Globe from "globe.gl";
import "./App.css"

function App() {
  const containerRef = useRef(null);

  useEffect(() => {
    const globe = Globe()(containerRef.current)
      .backgroundColor("#111")
      .globeImageUrl('//cdn.jsdelivr.net/npm/three-globe/example/img/earth-night.jpg')
      .atmosphereAltitude(0);

    return () => {
      globe._destructor?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        width: "100vw",
        height: "100vh",
      }}
    />
  );
}

export default App;