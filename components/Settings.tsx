import React, { useState } from 'react';
import { useFirebaseCollection } from '../hooks/useFirebaseCollection';
import { Save, Trash2, Shield, Edit, Eye } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updatePassword, deleteUser as deleteAuthUser } from 'firebase/auth';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import firebaseConfig from '../firebase-applet-config.json';
import ConfirmModal from './ConfirmModal';

interface UserRole {
    id: string; // fake email (username@app.local)
    username: string;
    name: string;
    role: 'viewer' | 'editor' | 'admin';
}

const Settings: React.FC = () => {
    const { data: users, setItem: setUser, deleteItem: deleteUser } = useFirebaseCollection<UserRole>('users');
    
    const [formState, setFormState] = useState({
        id: '', // Store original ID for editing
        username: '',
        name: '',
        password: '',
        role: 'viewer' as 'viewer' | 'editor' | 'admin'
    });
    const [isEditing, setIsEditing] = useState(false);

    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormState({
            ...formState,
            [e.target.name]: e.target.value
        });
    };

    const handleEditClick = (user: UserRole) => {
        setFormState({
            id: user.id,
            username: user.username || user.id.replace('@app.local', ''),
            name: user.name,
            password: '', // Don't populate password on edit
            role: user.role
        });
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (!formState.username || !formState.name) {
            setMessage({ type: 'error', text: 'Username dan Nama wajib diisi.' });
            return;
        }

        if (!isEditing && !formState.password) {
            setMessage({ type: 'error', text: 'Password wajib diisi untuk pengguna baru.' });
            return;
        }

        try {
            // Use existing ID if editing, otherwise generate fake email
            const userId = isEditing ? formState.id : `${formState.username.toLowerCase().replace(/\s+/g, '')}@app.local`;

            if (!isEditing) {
                // Create user in Firebase Auth using a secondary app instance to avoid logging out the admin
                const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp" + Date.now());
                const secondaryAuth = getAuth(secondaryApp);
                await createUserWithEmailAndPassword(secondaryAuth, userId, formState.password);
                await secondaryAuth.signOut();
                // Save password secretly for future edits by admin
                await setDoc(doc(db, 'user_secrets', userId), { password: formState.password });
            } else {
                if (formState.password) {
                    if (!userId.endsWith('@app.local')) {
                        throw new Error("Tidak dapat mengubah password untuk akun Google/Eksternal.");
                    }
                    const secretDoc = await getDoc(doc(db, 'user_secrets', userId));
                    if (secretDoc.exists()) {
                        const oldPassword = secretDoc.data().password;
                        const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp" + Date.now());
                        const secondaryAuth = getAuth(secondaryApp);
                        await signInWithEmailAndPassword(secondaryAuth, userId, oldPassword);
                        await updatePassword(secondaryAuth.currentUser!, formState.password);
                        await secondaryAuth.signOut();
                        await setDoc(doc(db, 'user_secrets', userId), { password: formState.password });
                    } else {
                        throw new Error("Data password lama tidak ditemukan. Silakan hapus dan buat ulang pengguna ini.");
                    }
                }
            }

            const newUser: UserRole = {
                id: userId,
                username: formState.username.toLowerCase().replace(/\s+/g, ''),
                name: formState.name,
                role: formState.role
            };

            await setUser(newUser.id, newUser);
            setMessage({ type: 'success', text: isEditing ? 'Pengguna berhasil diperbarui.' : 'Pengguna berhasil ditambahkan.' });
            setFormState({
                id: '',
                username: '',
                name: '',
                password: '',
                role: 'viewer'
            });
            setIsEditing(false);
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Gagal menyimpan pengguna: ' + error.message });
        }
    };

    const handleCancelEdit = () => {
        setFormState({
            id: '',
            username: '',
            name: '',
            password: '',
            role: 'viewer'
        });
        setIsEditing(false);
        setMessage(null);
    };

    const [userToDelete, setUserToDelete] = useState<UserRole | null>(null);

    const confirmDeleteUser = async () => {
        if (!userToDelete) return;
        const user = userToDelete;
        try {
            if (user.id.endsWith('@app.local')) {
                const secretDoc = await getDoc(doc(db, 'user_secrets', user.id));
                if (secretDoc.exists()) {
                    const oldPassword = secretDoc.data().password;
                    const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp" + Date.now());
                    const secondaryAuth = getAuth(secondaryApp);
                    await signInWithEmailAndPassword(secondaryAuth, user.id, oldPassword);
                    await deleteAuthUser(secondaryAuth.currentUser!);
                    await deleteDoc(doc(db, 'user_secrets', user.id));
                }
            }
            await deleteUser(user.id);
            setMessage({ type: 'success', text: 'Pengguna berhasil dihapus.' });
        } catch (error: any) {
            setMessage({ type: 'error', text: 'Gagal menghapus pengguna: ' + error.message });
        }
        setUserToDelete(null);
    };

    const handleDelete = (user: UserRole) => {
        setUserToDelete(user);
    };

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin':
                return <span className="flex items-center text-xs font-medium px-2.5 py-0.5 rounded bg-red-100 text-red-800"><Shield size={12} className="mr-1" /> Full Access</span>;
            case 'editor':
                return <span className="flex items-center text-xs font-medium px-2.5 py-0.5 rounded bg-blue-100 text-blue-800"><Edit size={12} className="mr-1" /> Input & Edit</span>;
            case 'viewer':
                return <span className="flex items-center text-xs font-medium px-2.5 py-0.5 rounded bg-gray-100 text-gray-800"><Eye size={12} className="mr-1" /> Views</span>;
            default:
                return <span className="text-xs font-medium px-2.5 py-0.5 rounded bg-gray-100 text-gray-800">{role}</span>;
        }
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <ConfirmModal
                isOpen={!!userToDelete}
                title="Hapus Pengguna"
                message={`Apakah Anda yakin ingin menghapus akses untuk ${userToDelete?.username || userToDelete?.name || userToDelete?.id}?`}
                onConfirm={confirmDeleteUser}
                onCancel={() => setUserToDelete(null)}
            />
            <div className="bg-white p-4 md:p-6 rounded-xl shadow-md space-y-4 md:space-y-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Pengaturan Akun (Multiuser)</h1>
                <p className="text-gray-600 text-sm">{isEditing ? 'Edit hak akses pengguna.' : 'Tambahkan pengguna baru dan atur hak akses mereka untuk menggunakan aplikasi ini.'}</p>
                
                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs md:text-sm font-medium text-gray-700">User Name</label>
                            <input
                                type="text"
                                name="username"
                                value={formState.username}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary text-sm md:text-base bg-gray-50"
                                placeholder="username"
                                required
                                disabled={isEditing}
                            />
                        </div>
                        <div>
                            <label className="block text-xs md:text-sm font-medium text-gray-700">Nama Lengkap</label>
                            <input
                                type="text"
                                name="name"
                                value={formState.name}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary text-sm md:text-base"
                                placeholder="Nama Pengguna"
                                required
                            />
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs md:text-sm font-medium text-gray-700">
                                Password {isEditing && <span className="text-gray-400 font-normal">(Kosongkan jika tidak diubah)</span>}
                            </label>
                            <input
                                type="password"
                                name="password"
                                value={formState.password}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary text-sm md:text-base disabled:bg-gray-100"
                                placeholder={isEditing ? "Kosongkan jika tidak ingin mengubah password" : "Masukkan password"}
                                required={!isEditing}
                                disabled={isEditing && !formState.id.endsWith('@app.local')}
                            />
                            {isEditing && formState.id.endsWith('@app.local') && <p className="text-xs text-gray-500 mt-1">Anda dapat mengubah password pengguna ini.</p>}
                            {isEditing && !formState.id.endsWith('@app.local') && <p className="text-xs text-gray-500 mt-1">Password akun Google tidak dapat diubah di sini.</p>}
                        </div>
                        <div>
                            <label className="block text-xs md:text-sm font-medium text-gray-700">Hak Akses</label>
                            <select
                                name="role"
                                value={formState.role}
                                onChange={handleChange}
                                className="mt-1 block w-full px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary text-sm md:text-base"
                            >
                                <option value="viewer">Views (Hanya Lihat)</option>
                                <option value="editor">Input dan Edit (Tidak Boleh Delete)</option>
                                <option value="admin">Full Access (Admin)</option>
                            </select>
                        </div>
                    </div>
                    
                    {message && (
                        <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {message.text}
                        </div>
                    )}

                    <div className="flex justify-end space-x-3">
                        {isEditing && (
                            <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="w-full sm:w-auto flex justify-center items-center bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded-lg transition duration-300 text-sm md:text-base"
                            >
                                Batal
                            </button>
                        )}
                        <button
                            type="submit"
                            className="w-full sm:w-auto flex justify-center items-center bg-brand-primary hover:bg-brand-dark text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-sm md:text-base"
                        >
                            <Save size={18} className="mr-2" />
                            {isEditing ? 'Simpan Perubahan' : 'Simpan Pengguna'}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white p-4 md:p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-bold text-gray-800 mb-4">Daftar Pengguna</h2>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hak Akses</th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.username || user.id.replace('@app.local', '')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getRoleBadge(user.role)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleEditClick(user)}
                                            className="text-blue-600 hover:text-blue-900 mr-3"
                                            title="Edit Pengguna"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user)}
                                            className="text-red-600 hover:text-red-900"
                                            title="Hapus Pengguna"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {users.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                        Belum ada pengguna yang ditambahkan.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Settings;
