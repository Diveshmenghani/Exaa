import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClientMock";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProvider } from "@/hooks/use-wallet";
import { ContractProvider } from "@/hooks/use-contract";
import { NetworkProvider } from "@/hooks/use-network";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Home from "@/pages/home";
import Swap from "@/pages/swap";
import Stake from "@/pages/stake";
import Unstake from "@/pages/unstake";
import Profile from "@/pages/profile";
import RoadMap from "@/pages/roadmap";
import Navbar from "@/components/navbar";
import ParticleBackground from "@/components/particle-background";
import ScrollIndicator from "@/components/scroll-indicator";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/home">
        <>
          <Navbar />
          <Home />
        </>
      </Route>
      <Route path="/swap">
        <>
          <Navbar />
          <Swap />
        </>
      </Route>
      <Route path="/stake">
        <>
          <Navbar />
          <Stake />
        </>
      </Route>
      <Route path="/unstake">
        <>
          <Navbar />
          <Unstake />
        </>
      </Route>
      <Route path="/profile">
        <>
          <Navbar />
          <Profile />
        </>
      </Route>
      <Route path="/roadmap">
        <>
          <Navbar />
          <RoadMap />
        </>
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NetworkProvider>
        <WalletProvider>
          <ContractProvider>
            <TooltipProvider>
              <ParticleBackground />
              <ScrollIndicator />
              <Toaster />
              <Router />
            </TooltipProvider>
          </ContractProvider>
        </WalletProvider>
      </NetworkProvider>
    </QueryClientProvider>
  );
}

export default App;
