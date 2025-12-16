import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import TimesheetSettings from "./pages/TimesheetSettings";
import TimesheetAdmin from "./pages/TimesheetAdmin";
import EmployeePortal from "./pages/EmployeePortal";
import RosterScheduler from "./pages/RosterScheduler";
import StaffList from "./pages/StaffList";
import StaffDetail from "./pages/StaffDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/settings" element={<TimesheetSettings />} />
            <Route path="/timesheet-admin" element={<TimesheetAdmin />} />
            <Route path="/employee-portal" element={<EmployeePortal />} />
            <Route path="/roster" element={<RosterScheduler />} />
            <Route path="/workforce" element={<StaffList />} />
            <Route path="/workforce/:id" element={<StaffDetail />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
