import { Routes, Route } from 'react-router-dom';
import Nav from './components/Nav';
import Home from './pages/Home';
import Symptoms from './pages/Symptoms';
import Scan from './pages/Scan';
import Check from './pages/Check';
import Cabinet from './pages/Cabinet';
import Medicines from './pages/Medicines';
import History from './pages/History';

export default function App() {
  return (
    <>
      <Nav />
      <main style={{
        marginLeft: 'var(--sidebar-width)',
        flex: 1,
        minHeight: '100vh',
        padding: 'var(--space-xl)',
        background: 'var(--color-bg)',
        overflowX: 'hidden',
      }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/symptoms" element={<Symptoms />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/check" element={<Check />} />
          <Route path="/cabinet" element={<Cabinet />} />
          <Route path="/medicines" element={<Medicines />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </main>
    </>
  );
}