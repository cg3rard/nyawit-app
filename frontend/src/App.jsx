import { BrowserRouter, Route, Routes } from "react-router-dom";
import Sidebar from "./components/layout/Sidebar";
import Dashboard from "./pages/Dashboard";
import PlaceholderPage from "./pages/PlaceholderPage";
import POS from "./pages/POS";
import Products from "./pages/Products";
import Inventory from "./pages/Inventory";
import Transactions from "./pages/Transactions";

function AppLayout({ children }) {
  return (
    <div className="flex min-h-screen">
      {/* Fixed sidebar — desktop only */}
      <div className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0">
        <Sidebar />
      </div>
      {/* Main area offset by sidebar width on desktop */}
      <div className="flex flex-1 flex-col min-w-0 lg:ml-64">
        {children}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            <AppLayout>
              <Dashboard />
            </AppLayout>
          }
        />
        <Route
          path="/pos"
          element={
            <div className="flex flex-1 flex-col min-h-screen">
              <POS />
            </div>
          }
        />
        <Route
          path="/transactions"
          element={
            <AppLayout>
              <div className="flex flex-1 flex-col min-h-screen">
                <Transactions />
              </div>
            </AppLayout>
          }
        />
        <Route
          path="/products"
          element={
            <AppLayout>
              <div className="flex flex-1 flex-col min-h-screen">
                <Products />
              </div>
            </AppLayout>
          }
        />
        <Route
          path="/inventory"
          element={
            <AppLayout>
              <div className="flex flex-1 flex-col min-h-screen">
                <Inventory />
              </div>
            </AppLayout>
          }
        />
        <Route
          path="/ai-insights"
          element={
            <AppLayout>
              <div className="flex flex-1 flex-col min-h-screen">
                <PlaceholderPage title="AI Insights" />
              </div>
            </AppLayout>
          }
        />
        <Route
          path="/settings"
          element={
            <AppLayout>
              <div className="flex flex-1 flex-col min-h-screen">
                <PlaceholderPage title="Settings" />
              </div>
            </AppLayout>
          }
        />
        <Route
          path="/support"
          element={
            <AppLayout>
              <div className="flex flex-1 flex-col min-h-screen">
                <PlaceholderPage title="Support" />
              </div>
            </AppLayout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
