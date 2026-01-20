import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./auth/LoginPage";
import SignupPage from "./auth/SignupPage";
import DJPlayModePage from "./DJPlayModePage";
import MyProfilePage from "./MyProfilePage";
import { authStore } from "../store/authStore";
import type { ReactNode } from "react";

function RedirectIfAuthed({ children }: { children: ReactNode }) {
  if (authStore.isAuthed()) return <Navigate to="/dj" replace />;
  return <>{children}</>;
}

export default function Routing() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dj" replace />} />

      <Route
        path="/login"
        element={
          <RedirectIfAuthed>
            <LoginPage />
          </RedirectIfAuthed>
        }
      />

      <Route
        path="/signup"
        element={
          <RedirectIfAuthed>
            <SignupPage />
          </RedirectIfAuthed>
        }
      />

      <Route path="/dj" element={<DJPlayModePage />} />
      <Route path="/my-profile" element={<MyProfilePage />} />
    </Routes>
  );
}