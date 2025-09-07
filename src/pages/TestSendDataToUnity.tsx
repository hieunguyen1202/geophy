import { useRef, useState } from "react";

function sendSimulationData(
  iframe: HTMLIFrameElement | null,
  simulationData: unknown,
  unityOrigin: string
) {
  if (!iframe?.contentWindow) {
    console.warn("[React] iframe contentWindow chưa sẵn sàng");
    return;
  }
  console.log("[React] parent origin =", window.location.origin);
  console.log("[React] Sending SIMULATION_DATA to", unityOrigin, simulationData);
  iframe.contentWindow.postMessage({ type: "SIMULATION_DATA", payload: simulationData }, unityOrigin);
}

export default function Parent() {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [ready, setReady] = useState(false);

  // ✅ origin đúng (KHÔNG kèm /index.html)
  const UNITY_ORIGIN = "http://127.0.0.1:5500";
  // ✅ URL thực tế để iframe load
  const UNITY_URL = `${UNITY_ORIGIN}/WebGL-Build/index.html`;

  const onIframeLoad = () => {
    console.log("[React] iframe loaded:", UNITY_URL);
    setReady(true);
    // Ping thử cho vui (bạn sẽ thấy [WebGL] GOT message from ... trong console WebGL)
    iframeRef.current?.contentWindow?.postMessage({ type: "PING" }, UNITY_ORIGIN);
  };

  const onSend = () => {
    const simulation_data = {
      shape_type: "pyramid",
      vertices: [{ name: "A", x: 0, y: 0, z: 0 }],
    };
    sendSimulationData(iframeRef.current, simulation_data, UNITY_ORIGIN);
  };

  // (tuỳ chọn) Nghe READY/ACK từ WebGL
  // useEffect(() => {
  //   const h = (e: MessageEvent) => {
  //     if (e.origin !== UNITY_ORIGIN) return;
  //     console.log("[React] from WebGL:", e.data);
  //   };
  //   window.addEventListener("message", h);
  //   return () => window.removeEventListener("message", h);
  // }, []);

  return (
    <div>
      <iframe
        ref={iframeRef}
        src={UNITY_URL}
        title="UnityWebGL"
        style={{ width: 960, height: 600 }}
        onLoad={onIframeLoad}
      />
      <button onClick={onSend} disabled={!ready}>
        Gửi simulation_data → Unity
      </button>
      {!ready && <p>Đang tải WebGL…</p>}
    </div>
  );
}
