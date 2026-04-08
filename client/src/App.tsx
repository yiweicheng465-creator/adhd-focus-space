import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { useState } from "react";
import { Route, Switch } from "wouter";
import AuraBackground from "./components/AuraBackground";
import DailySplash, { markSplashSeen, shouldShowSplash } from "./components/DailySplash";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import TimerPrototypes from "./pages/TimerPrototypes";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/timer-prototypes"} component={TimerPrototypes} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [splashDone, setSplashDone] = useState(() => !shouldShowSplash());

  function handleSplashDone() {
    markSplashSeen();
    setSplashDone(true);
  }

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          {/* Global aura gradient background — behind everything */}
          <AuraBackground />

          {/* Daily opening splash — shown once per day */}
          {!splashDone && <DailySplash onDone={handleSplashDone} />}

          {/* Main app */}
          <div style={{ position: "relative", zIndex: 1 }}>
            <Toaster />
            <Router />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
