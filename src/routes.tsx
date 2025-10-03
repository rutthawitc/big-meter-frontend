import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import DetailPage from "./screens/DetailPage";

const baseUrl = import.meta.env.BASE_URL || "/";
const basename =
  baseUrl.length > 1 && baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;

const router = createBrowserRouter(
  [
    { path: "/", element: <App /> },
    { path: "/details", element: <DetailPage /> },
  ],
  { basename },
);

export default function AppRouter() {
  return (
    <RouterProvider router={router} future={{ v7_startTransition: true }} />
  );
}
