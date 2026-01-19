import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./auth/LoginPage";
import SignupPage from "./auth/SignupPage";
import DJPlayModePage from "./DJPlayModePage";

export default function Routing() {
  return (
    <Routes>
    <Route path="/" element={<Navigate to="/login" replace />} />

    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<SignupPage />} />

    <Route path="/dj" element={<DJPlayModePage />} />
    </Routes>
  );
}