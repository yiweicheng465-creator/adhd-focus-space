import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import AuraBackground from "./components/AuraBackground";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { TimerProvider } from "./contexts/TimerContext";
import Home from "./pages/Home";
import TimerPrototypes from "./pages/TimerPrototypes";
import Monthly from "@/pages/Monthly";
import Insight from "@/pages/Insight";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/timer-prototypes"} component={TimerPrototypes} />
        <Route path="/monthly" component={Monthly} />
        <Route path="/insight" component={Insight} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TimerProvider>
        <TooltipProvider>
          {/* Global aura gradient background — behind everything */}
          <AuraBackground />

          {/* Main app */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <Toaster />
            <Router />
          </div>
        </TooltipProvider>
        </TimerProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
