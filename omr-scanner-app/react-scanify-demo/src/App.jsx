import './App.css';
import { Scanner } from './lib/components/scanner';

function App() {
  return (
    <>
      <h2 style={{ textAlign: 'center', marginTop: 0 }}> Click an image below to scan! </h2>
      <Scanner />
    </>
  );
}

export default App;
