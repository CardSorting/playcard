import { Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import CardCreator from "./components/card-creator";
import Home from "./components/home";
import { Nav } from "./components/ui/nav";

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <div className="min-h-screen">
        <Nav />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CardCreator />} />
        </Routes>
      </div>
    </Suspense>
  );
}

export default App;
