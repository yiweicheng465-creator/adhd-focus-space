import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import AuraBackground from "./components/AuraBackground";
import { FilmGrainOverlay } from "./components/FilmGrain";
import { useWorkMode } from "./components/WorkModeToggle";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TimerProvider } from "./contexts/TimerContext";
import Home from "./pages/Home";

import Monthly from "@/pages/Monthly";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />

        <Route path="/monthly" component={Monthly} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Initialise work mode from localStorage on mount
  useWorkMode();

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TimerProvider>
        <TooltipProvider>
          {/* Global aura gradient background — behind everything */}
          <AuraBackground />

          {/* Film grain overlay — fixed, covers entire app */}
          <FilmGrainOverlay />

          {/* Main app */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <Toaster position="bottom-right" closeButton />
            <Router />
          </div>
        </TooltipProvider>
        </TimerProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
