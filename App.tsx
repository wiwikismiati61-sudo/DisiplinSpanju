
import React, { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import MasterData from './components/MasterData';
import Transactions from './components/Transactions';
import Reports from './components/Reports';
import Sidebar from './components/Sidebar';
import Settings from './components/Settings';
import Modal from './components/Modal';
import { Page } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useLocalStorage<boolean>('isLoggedIn', false);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [appKey, setAppKey] = useState(0);

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

  const handleLogin = () => {
    setIsLoggedIn(true);
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
  };

  const forceReRender = () => {
    setAppKey(prevKey => prevKey + 1);
  };
  
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard key={appKey} />;
      case 'master':
        return <MasterData key={appKey} />;
      case 'transaksi':
        return <Transactions key={appKey} />;
      case 'laporan':
        return <Reports key={appKey} />;
       case 'settings':
        return <Settings key={appKey} />;
      default:
        return <Dashboard key={appKey} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 font-sans">
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        onLogout={handleLogout} 
        onRestoreSuccess={forceReRender}
        showModal={showModal}
        hideModal={hideModal}
      />
      <main className="flex-1 overflow-y-auto p-6 md:p-8">
        {renderPage()}
      </main>
      <Modal isOpen={modal.isOpen} onClose={hideModal} title={modal.title}>
        {modal.content}
      </Modal>
    </div>
  );
};

export default App;
