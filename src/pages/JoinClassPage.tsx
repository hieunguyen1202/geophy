import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

import classService from "../services/classService"; // must expose joinClass(code: string)
import { isLoggedIn, logout } from "../utils";

const JoinClassPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error">("success");

  useEffect(() => {
    // Not logged in? Go to login and keep full return path (including ?code=...)
    if (!isLoggedIn()) {
      logout();
      const returnTo = `${location.pathname}${location.search}`; // e.g. "/join?code=2ND4H2"
      navigate(`/login?redirect=${encodeURIComponent(returnTo)}`, { replace: true });
      return;
    }

    // Logged in → try to join
    const params = new URLSearchParams(location.search);
    const code = params.get("code");

    if (!code) {
      setSnackbarMessage("Không tìm thấy mã lớp trong liên kết!");
      setSnackbarSeverity("error");
      setSnackbarOpen(true);
      return;
    }

    const run = async () => {
      try {
        const res = await classService.joinClass(code);
        const msg = Array.isArray(res?.message)
          ? res.message[0] || "Tham gia lớp thành công!"
          : (res?.message || "Tham gia lớp thành công!");
        setSnackbarMessage(msg);
        setSnackbarSeverity("success");
        setSnackbarOpen(true);

        // Redirect after a short delay
        setTimeout(() => navigate("/student/classes", { replace: true }), 1500);
      } catch (err: any) {
        const msg = Array.isArray(err?.response?.data?.message)
          ? err.response.data.message[0] || "Tham gia lớp thất bại!"
          : (err?.response?.data?.message || "Tham gia lớp thất bại!");
        setSnackbarMessage(msg);
        setSnackbarSeverity("error");
        setSnackbarOpen(true);
      }
    };

    run();
  }, [location.search, location.pathname, navigate]);

  return (
    <>
      <div style={{ padding: "2rem", textAlign: "center" }}>Đang xử lý tham gia lớp...</div>
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity={snackbarSeverity} onClose={() => setSnackbarOpen(false)}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default JoinClassPage;
