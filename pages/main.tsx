import React from 'react';
import {createRoot} from 'react-dom/client';
import ClubDashboard from '../app/club-dashboard';
import LiveApp from './live-app';
import '../app/globals.css';

createRoot(document.getElementById('root')!).render(import.meta.env.VITE_COCKPIT_MODE==='live'?<LiveApp/>:<ClubDashboard/>);
