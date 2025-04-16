// src/AppRouter.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DataTable from './components/DataTable';
import App from './App.jsx';

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/preview" element={<DataTable />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;