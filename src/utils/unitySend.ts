export function sendSimulationData(
    iframe: HTMLIFrameElement | null,
    simulationData: unknown,         
    unityOrigin: string                
  ) {
    if (!iframe?.contentWindow) return;
    iframe.contentWindow.postMessage(
      { type: "SIMULATION_DATA", payload: simulationData },
      unityOrigin 
    );
  }