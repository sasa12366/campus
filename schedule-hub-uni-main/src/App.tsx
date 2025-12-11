import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useParams } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const AdminRoute = () => <Index initialRole="admin" forceAdminPanel />;

const ScheduleRoute = () => {
  const { type, value } = useParams();
  const safeType = type === 'teacher' ? 'teacher' : 'group';
  const name = value ? decodeURIComponent(value) : '';
  const initialEntity = name ? { id: name, name, type: safeType as 'group' | 'teacher' } : undefined;
  return <Index initialEntity={initialEntity} />;
};

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin" element={<AdminRoute />} />
          <Route path="/schedule/:type/:value" element={<ScheduleRoute />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
