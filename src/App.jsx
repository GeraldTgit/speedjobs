import { Routes, Route } from "react-router-dom";
import Signup from "./pages/SignupForm";
import Home from "./pages/Home";
import PartTimer from "./pages/PartTimer";
import Employer from "./pages/Employer";
import ListJob from "./pages/ListJob";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Signup />} />
      <Route path="/home" element={<Home />} />
      <Route path="/part-timer" element={<PartTimer />} />
      <Route path="/employer" element={<Employer />} />
      <Route path="/list-job" element={<ListJob />} />
      <Route path="/list-job/:id" element={<ListJob />} />
      {/* other routes */}
    </Routes>
  );
}

export default App;
