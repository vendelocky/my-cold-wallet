"use client";

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainPage from './components/MainPage';
import MnemonicGenerator from './components/MnemonicGenerator';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainPage />} />
        <Route path="/create-key" element={<MnemonicGenerator />} />
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>
    </Router>
  );
};

export default App;