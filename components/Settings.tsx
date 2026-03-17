import React, { useState, useEffect } from 'react';
import { useFirebaseCollection } from '../hooks/useFirebaseCollection';
import { Save } from 'lucide-react';

const Settings: React.FC = () => {
    const { data: credentialsList, setItem: setCredentials } = useFirebaseCollection<any>('credentials');
    const credentials = credentialsList.find(c => c.id === 'admin') || { username: 'admin', password: 'admin123' };
    
    const [formState, setFormState] = useState({
        username: '',
        newPassword: '',
        confirmPassword: ''
    });

    useEffect(() => {
        if (credentials) {
            setFormState(prev => ({
                ...prev,
                username: credentials.username
            }));
        }
    }, [credentials]);

    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormState({
            ...formState,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (formState.newPassword && formState.newPassword !== formState.confirmPassword) {
            setMessage({ type: 'error', text: 'Password baru dan konfirmasi password tidak cocok.' });
            return;
        }

        const newCredentials = {
            id: 'admin',
            username: formState.username || 'admin',
            password: formState.newPassword || credentials?.password || 'admin123'
        };

        await setCredentials('admin', newCredentials);
        setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan.' });
        setFormState({
            ...formState,
            newPassword: '',
            confirmPassword: ''
        });
    };

    return (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-md space-y-4 md:space-y-6 max-w-2xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Pengaturan Akun</h1>
            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700">Username</label>
                    <input
                        type="text"
                        name="username"
                        value={formState.username}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary text-sm md:text-base"
                        required
                    />
                </div>
                <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700">Password Baru (opsional)</label>
                    <input
                        type="password"
                        name="newPassword"
                        value={formState.newPassword}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary text-sm md:text-base"
                        placeholder="Biarkan kosong jika tidak ingin mengubah"
                    />
                </div>
                <div>
                    <label className="block text-xs md:text-sm font-medium text-gray-700">Konfirmasi Password Baru</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={formState.confirmPassword}
                        onChange={handleChange}
                        className="mt-1 block w-full px-3 py-2 md:px-4 md:py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-brand-secondary focus:border-brand-secondary text-sm md:text-base"
                    />
                </div>
                
                {message && (
                    <div className={`p-3 rounded-lg text-sm ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {message.text}
                    </div>
                )}

                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="w-full sm:w-auto flex justify-center items-center bg-brand-primary hover:bg-brand-dark text-white font-bold py-2 px-4 rounded-lg transition duration-300 text-sm md:text-base"
                    >
                        <Save size={18} className="mr-2" />
                        Simpan Perubahan
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Settings;
