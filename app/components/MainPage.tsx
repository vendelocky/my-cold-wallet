"use client";

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button } from '@mui/material';

const MainPage = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <Button variant="contained" color="primary" sx={{ mb: 2 }} onClick={() => navigate('/create-key')}>
        Create New Wallet
      </Button>
    </Box>
  );
};

export default MainPage;