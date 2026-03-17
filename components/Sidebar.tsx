
import React, { useRef } from 'react';
import { Page } from '../types';
import { LayoutDashboard, Database, FileText, FileUp, FileDown, ListPlus, X, LogIn, LogOut, Settings } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestoreError';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  isLoggedIn: boolean;
  onLogout: () => void;
  onRestoreSuccess: () => void;
  showModal: (title: string, content: React.ReactNode) => void;
  hideModal: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, isLoggedIn, onLogout, onRestoreSuccess, showModal, hideModal, isOpen, setIsOpen }) => {
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'master', label: 'Master', icon: Database },
    { id: 'transaksi', label: 'Transaksi', icon: ListPlus },
    { id: 'laporan', label: 'Laporan', icon: FileText },
    ...(isLoggedIn ? [{ id: 'settings', label: 'Pengaturan', icon: Settings }] : []),
  ];

  const handleBackup = async () => {
    const appKeys = ['students', 'transactions', 'violations', 'consequences', 'followups', 'homeroomTeachers', 'counselors', 'credentials'];
    const data: { [key: string]: any } = {};
    
    try {
        for (const key of appKeys) {
            const querySnapshot = await getDocs(collection(db, key));
            data[key] = querySnapshot.docs.map(doc => doc.data());
        }
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `backup-disiplin-siswa-firebase-${new Date().toISOString().slice(0,10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    } catch (error) {
        console.error("Backup failed:", error);
        alert("Gagal melakukan backup data dari Firebase.");
    }
  };
  
  const handleRestore = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const uploader = event.target;

    if (!file) {
      if(uploader) uploader.value = '';
      return;
    }

    const reader = new FileReader();

    const showError = (message: string) => {
      showModal("Error Restore", <p className="text-red-600">{message}</p>);
    };

    reader.onerror = () => {
      showError("Gagal membaca file. File mungkin rusak atau Anda tidak memiliki izin untuk membacanya.");
      if(uploader) uploader.value = '';
    };

    reader.onload = (e) => {
        try {
            const text = e.target?.result;
            if (typeof text !== 'string' || text.trim() === '') {
                showError("File backup kosong atau tidak dapat dibaca.");
                return;
            }

            const data = JSON.parse(text);

            if (typeof data !== 'object' || data === null) {
                showError("Konten file backup tidak valid. Pastikan Anda menggunakan file backup yang benar dari aplikasi ini.");
                return;
            }

            const performRestore = async () => {
                try {
                    const appKeys = ['students', 'transactions', 'violations', 'consequences', 'followups', 'homeroomTeachers', 'counselors', 'credentials'];
                    
                    const batch = writeBatch(db);
                    
                    for (const key of appKeys) {
                        if (data[key] && Array.isArray(data[key])) {
                            // Note: This doesn't delete existing data in Firestore.
                            // For a true restore, we might want to delete existing docs first, 
                            // but that's dangerous and complex with batch limits.
                            // We'll just overwrite/add.
                            data[key].forEach((item: any) => {
                                if (item.id) {
                                    const docRef = doc(db, key, item.id);
                                    batch.set(docRef, item);
                                }
                            });
                        }
                    }

                    await batch.commit();

                    hideModal();
                    setTimeout(() => {
                      showModal("Sukses", <div className="flex flex-col items-center text-center"><p className="mb-4">Restore ke Firebase berhasil. Antarmuka akan diperbarui.</p><button onClick={hideModal} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-dark">OK</button></div>);
                      onRestoreSuccess();
                    }, 100); 
                } catch (err) {
                    console.error("Restore failed:", err);
                    try {
                      handleFirestoreError(err, OperationType.WRITE, "batch_restore");
                    } catch (e: any) {
                      // If it's the JSON error, we can show a better message
                      if (e.message.startsWith('{')) {
                        const info = JSON.parse(e.message);
                        if (info.error.includes('permission')) {
                          hideModal();
                          setTimeout(() => showError("Izin Ditolak: Anda harus login dengan akun Google Admin (wiwikismiati61@guru.smp.belajar.id) untuk melakukan restore data."), 10);
                          return;
                        }
                      }
                    }
                    hideModal();
                    setTimeout(() => showError("Kesalahan Kritis: Gagal menyimpan data ke Firebase saat restore."), 10);
                }
            };
            
            const summaryContent = (
              <div>
                <p className="mb-4">File backup terdeteksi berisi:</p>
                <ul className="list-disc list-inside mb-6 space-y-1 bg-gray-50 p-3 rounded-md">
                  <li>{data.students?.length || 0} Siswa</li>
                  <li>{data.transactions?.length || 0} Transaksi</li>
                  <li>{data.violations?.length || 0} Jenis Pelanggaran</li>
                </ul>
                <p className="font-semibold text-yellow-800 bg-yellow-100 p-3 rounded-md">Anda yakin ingin melanjutkan? Data di Firebase akan diperbarui dengan data dari file ini.</p>
                <div className="flex justify-end space-x-3 mt-6">
                  <button onClick={hideModal} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Batal</button>
                  <button onClick={performRestore} className="px-4 py-2 bg-brand-primary text-white rounded-md hover:bg-brand-dark">Lanjutkan</button>
                </div>
              </div>
            );

            showModal("Konfirmasi Restore Data", summaryContent);

        } catch (jsonError) {
            showError("Gagal memproses file. File backup tampaknya bukan file JSON yang valid.");
        } finally {
            if (uploader) {
                uploader.value = '';
            }
        }
    };

    reader.readAsText(file);
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      ></div>

      <aside className={`fixed top-0 left-0 h-full w-60 md:w-64 bg-brand-primary text-white flex flex-col z-40 transform transition-transform duration-300 md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center justify-between p-3 md:p-4 border-b border-brand-dark">
          <div className="flex items-center">
            <img src="https://iili.io/KDFk4fI.png" alt="Logo" className="h-10 w-10 md:h-12 md:w-12 mr-2 md:mr-3" />
            <span className="text-lg md:text-xl font-bold">Manajemen Disiplin</span>
          </div>
          <button onClick={() => setIsOpen(false)} className="md:hidden p-1 rounded-md hover:bg-brand-secondary">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 px-3 md:px-4 py-3 md:py-4 space-y-1 md:space-y-2">
          {navItems.map((item) => (
            <a
              key={item.id}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setCurrentPage(item.id as Page);
                setIsOpen(false); // Close sidebar on mobile after navigation
              }}
              className={`flex items-center px-3 md:px-4 py-2 md:py-3 rounded-lg transition-colors duration-200 ${currentPage === item.id ? 'bg-brand-dark' : 'hover:bg-brand-secondary'}`}>
              <item.icon className="w-5 h-5 mr-3" />
              <span className="text-sm md:text-base">{item.label}</span>
            </a>
          ))}
        </nav>
        <div className="px-3 md:px-4 py-3 md:py-4 border-t border-brand-dark space-y-1 md:space-y-2">
          {isLoggedIn && (
            <>
              <button onClick={handleBackup} className="w-full flex items-center px-3 md:px-4 py-2 md:py-3 rounded-lg hover:bg-brand-secondary transition-colors duration-200">
                  <FileDown className="w-5 h-5 mr-3" />
                  <span className="text-sm md:text-base">Backup Data</span>
              </button>
              <button onClick={() => backupFileInputRef.current?.click()} className="w-full flex items-center px-3 md:px-4 py-2 md:py-3 rounded-lg hover:bg-brand-secondary transition-colors duration-200">
                  <FileUp className="w-5 h-5 mr-3" />
                  <span className="text-sm md:text-base">Restore Data</span>
              </button>
              <input type="file" ref={backupFileInputRef} onChange={handleRestore} className="hidden" accept=".json" />
            </>
          )}

          {isLoggedIn ? (
            <button onClick={onLogout} className="w-full flex items-center px-3 md:px-4 py-2 md:py-3 rounded-lg hover:bg-brand-secondary transition-colors duration-200">
              <LogOut className="w-5 h-5 mr-3" />
              <span className="text-sm md:text-base">Logout</span>
            </button>
          ) : (
            <button onClick={() => { setCurrentPage('master'); setIsOpen(false); }} className="w-full flex items-center px-3 md:px-4 py-2 md:py-3 rounded-lg hover:bg-brand-secondary transition-colors duration-200">
              <LogIn className="w-5 h-5 mr-3" />
              <span className="text-sm md:text-base">Login Admin</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
