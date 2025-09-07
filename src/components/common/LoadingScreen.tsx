import { useEffect } from "react";
import { Spinner } from "react-bootstrap";

interface LoadingScreenProps {
  setLoading: (loading: boolean) => void;
}

export default function LoadingScreen({ setLoading }: LoadingScreenProps) {
  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 500);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        backgroundColor: "white",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 9999,
      }}
    >
      <Spinner animation="border" role="status" variant="primary">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    </div>
  );
}
