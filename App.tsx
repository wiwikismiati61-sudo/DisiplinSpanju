
import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Dashboard from './components/Dashboard';
import MasterData from './components/MasterData';
import Transactions from './components/Transactions';
import Reports from './components/Reports';
import Sidebar from './components/Sidebar';
import Modal from './components/Modal';
import Login from './components/Login';
import Settings from './components/Settings';
import { Page } from './types';
import { migrateLocalStorageToFirebase } from './utils/migration';

import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [appKey, setAppKey] = useState(0);
  const [isMigrating, setIsMigrating] = useState(true);

  // Handle Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsLoggedIn(true);
        // Run migration when user logs in
        migrateLocalStorageToFirebase().then(() => {
          setIsMigrating(false);
          forceReRender();
        });
      } else {
        setIsMigrating(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Clear old localStorage login state if it exists to prevent confusion
  useEffect(() => {
    localStorage.removeItem('isLoggedIn');
  }, []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [modal, setModal] = useState<{
    isOpen: boolean;
    title: string;
    content: React.ReactNode | null;
  }>({ isOpen: false, title: '', content: null });

  const showModal = (title: string, content: React.ReactNode) => {
    setModal({ isOpen: true, title, content });
  };
  const hideModal = () => {
    setModal({ isOpen: false, title: '', content: null });
  };

  const forceReRender = () => {
    setAppKey(prevKey => prevKey + 1);
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentPage('dashboard');
  };
  
  const renderPage = () => {
    if (isMigrating) {
      return (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
          <p className="text-gray-600">Menghubungkan ke database...</p>
        </div>
      );
    }

    if (currentPage === 'dashboard') {
      return <Dashboard key={appKey} showModal={showModal} hideModal={hideModal} />;
    }

    if (currentPage === 'laporan') {
      return <Reports key={appKey} showModal={showModal} />;
    }

    if (!isLoggedIn) {
      return <Login onLogin={handleLogin} />;
    }

    switch (currentPage) {
      case 'master':
        return <MasterData key={appKey} />;
      case 'transaksi':
        return <Transactions key={appKey} />;
      case 'settings':
        return <Settings key={appKey} />;
      default:
        return <Dashboard key={appKey} showModal={showModal} hideModal={hideModal} />;
    }
  };

  return (
    <div className="relative min-h-screen md:flex bg-gray-100 font-sans">
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        onRestoreSuccess={forceReRender}
        showModal={showModal}
        hideModal={hideModal}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 w-full">
        <div className="md:hidden flex justify-between items-center mb-4">
            <span className="text-xl font-bold text-brand-primary">Manajemen Disiplin</span>
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-md bg-gray-200 text-gray-800">
                <Menu className="h-6 w-6" />
            </button>
        </div>
        {renderPage()}
      </main>
      <Modal isOpen={modal.isOpen} onClose={hideModal} title={modal.title}>
        {modal.content}
      </Modal>
    </div>
  );
};

export default App;
