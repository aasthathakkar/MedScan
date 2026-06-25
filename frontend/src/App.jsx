import { Routes, Route } from 'react-router-dom';
import Nav from './components/Nav';
import Home from './pages/Home';
import Symptoms from './pages/Symptoms';
import Scan from './pages/Scan';
import Check from './pages/Check';
import Medicines from './pages/Medicines';
import History from './pages/History';
import s from './App.module.css';

export default function App() {
  return (
    <>
      <Nav />
      <main className={s.main}>
        <Routes>
          <Route path="/"          element={<Home />}      />
          <Route path="/symptoms"  element={<Symptoms />}  />
          <Route path="/scan"      element={<Scan />}      />
          <Route path="/check"     element={<Check />}     />
          <Route path="/medicines" element={<Medicines />} />
          <Route path="/history"   element={<History />}   />
        </Routes>
      </main>
    </>
  );
}