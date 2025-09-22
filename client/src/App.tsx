import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WalletProvider } from "@/hooks/use-wallet";
import { ContractProvider } from "@/hooks/use-contract";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Swap from "@/pages/swap";
import Stake from "@/pages/stake";
import Unstake from "@/pages/unstake";
import Profile from "@/pages/profile";
import Navbar from "@/components/navbar";
import CustomCursor from "@/components/custom-cursor";
import ParticleBackground from "@/components/particle-background";
import ScrollIndicator from "@/components/scroll-indicator";

function Router() {
  return (
    <>
      <Navbar />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/swap" component={Swap} />
        <Route path="/stake" component={Stake} />
        <Route path="/unstake" component={Unstake} />
        <Route path="/profile" component={Profile} />
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <ContractProvider>
          <TooltipProvider>
            <CustomCursor />
            <ParticleBackground />
            <ScrollIndicator />
            <Toaster />
            <Router />
          </TooltipProvider>
        </ContractProvider>
      </WalletProvider>
    </QueryClientProvider>
  );
}

export default App;
