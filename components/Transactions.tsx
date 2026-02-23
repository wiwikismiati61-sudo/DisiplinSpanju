
import React, { useState, useMemo } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Transaction, Student, Violation, FollowUp, HomeroomTeacher, Counselor, Consequence } from '../types';
import { Plus, Trash2, Edit, Save } from 'lucide-react';

const Transactions: React.FC = () => {
    const [transactions, setTransactions] = useLocalStorage<Transaction[]>('transactions', []);
    const [students] = useLocalStorage<Student[]>('students', []);
    const [violations] = useLocalStorage<Violation[]>('violations', []);
    const [followUps] = useLocalStorage<FollowUp[]>('followups', []);
    const [consequences] = useLocalStorage<Consequence[]>('consequences', []);
    const [homeroomTeachers] = useLocalStorage<HomeroomTeacher[]>('homeroomTeachers', []);
    const [counselors] = useLocalStorage<Counselor[]>('counselors', []);

    const [selectedClass, setSelectedClass] = useState<string>('');
    const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
    const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toTimeString().slice(0, 5),
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        setNewTransaction({ ...newTransaction, [e.target.name]: e.target.value });
    };

    // Filter konsekuensi berdasarkan pelanggaran yang dipilih
    const availableConsequences = useMemo(() => {
        if (!newTransaction.violationId) return [];
        const selectedViolation = violations.find(v => v.id === newTransaction.violationId);
        if (!selectedViolation) return [];
        return consequences.filter(c => c.violationLevel === selectedViolation.level);
    }, [newTransaction.violationId, violations, consequences]);

    const resetForm = () => {
        setEditingTransactionId(null);
        setNewTransaction({
            date: new Date().toISOString().slice(0, 10),
            time: new Date().toTimeString().slice(0, 5),
        });
        setSelectedClass('');
    };

    const handleEdit = (transactionId: string) => {
        const transactionToEdit = transactions.find(t => t.id === transactionId);
        if (transactionToEdit) {
            const student = students.find(s => s.id === transactionToEdit.studentId);
            setEditingTransactionId(transactionId);
            setNewTransaction(transactionToEdit);
            setSelectedClass(student?.class || '');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Validasi form, consequenceId sekarang wajib jika tersedia di sistem, tapi kita buat fleksibel
        if (!newTransaction.date || !newTransaction.time || !newTransaction.studentId || !newTransaction.violationId || !newTransaction.reason || !newTransaction.homeroomTeacher || !newTransaction.counselor || !newTransaction.followUpId) {
            alert('Harap isi semua field yang wajib diisi.');
            return;
        }

        if (editingTransactionId) {
            setTransactions(prev => prev.map(t => t.id === editingTransactionId ? { ...newTransaction, id: editingTransactionId } as Transaction : t));
        } else {
            setTransactions(prev => [{ ...newTransaction, id: `trans-${Date.now()}` } as Transaction, ...prev]);
        }
        
        resetForm();
    };
    
    const populatedTransactions = useMemo(() => {
        return transactions.map(t => {
            const student = students.find(s => s.id === t.studentId);
            const violation = violations.find(v => v.id === t.violationId);
            return {
                ...t,
                studentName: student?.name || 'N/A',
                studentClass: student?.class || 'N/A',
                violationName: violation?.name || 'N/A'
            };
        });
    }, [transactions, students, violations]);

    const uniqueClasses = useMemo(() => Array.from(new Set(students.map(s => s.class))).sort(), [students]);
    const filteredStudents = useMemo(() => {
        if (!selectedClass) return [];
        return students.filter(s => s.class === selectedClass);
    }, [students, selectedClass]);

    return (
        <div className="bg-white p-6 rounded-xl shadow-md space-y-6">
            <h1 className="text-3xl font-bold text-gray-800">Transaksi Pelanggaran</h1>
            
            <form onSubmit={handleSubmit} className="p-6 border rounded-lg bg-gray-50 space-y-4">
                <h2 className="text-xl font-semibold text-gray-700">{editingTransactionId ? 'Edit Transaksi' : 'Catat Pelanggaran Baru'}</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium">Tanggal</label>
                        <input type="date" name="date" value={newTransaction.date || ''} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Jam</label>
                        <input type="time" name="time" value={newTransaction.time || ''} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Kelas</label>
                        <select name="class" value={selectedClass} onChange={(e) => { setSelectedClass(e.target.value); setNewTransaction(prev => ({...prev, studentId: ''})); }} className="mt-1 w-full p-2 border rounded-md">
                            <option value="">Pilih Kelas</option>
                            {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Siswa</label>
                        <select name="studentId" value={newTransaction.studentId || ''} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md" disabled={!selectedClass}>
                            <option value="">Pilih Siswa</option>
                            {filteredStudents.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-medium">Jenis Pelanggaran</label>
                        <select name="violationId" value={newTransaction.violationId || ''} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md">
                            <option value="">Pilih Pelanggaran</option>
                            {violations.map(v => <option key={v.id} value={v.id}>{v.name} ({v.level})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Konsekuensi</label>
                        <select 
                            name="consequenceId" 
                            value={newTransaction.consequenceId || ''} 
                            onChange={handleInputChange} 
                            className="mt-1 w-full p-2 border rounded-md"
                            disabled={!newTransaction.violationId}
                        >
                            <option value="">{newTransaction.violationId ? "Pilih Konsekuensi" : "Pilih Pelanggaran Dahulu"}</option>
                            {availableConsequences.map(c => <option key={c.id} value={c.id}>{c.description}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium">Tindak Lanjut</label>
                        <select name="followUpId" value={newTransaction.followUpId || ''} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md">
                             <option value="">Pilih Tindak Lanjut</option>
                            {followUps.map(f => <option key={f.id} value={f.id}>{f.description}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Nama Wali Kelas</label>
                        <select name="homeroomTeacher" value={newTransaction.homeroomTeacher || ''} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md">
                            <option value="">Pilih Wali Kelas</option>
                            {homeroomTeachers.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                        </select>
                    </div>
                     <div>
                        <label className="block text-sm font-medium">Nama Guru BK</label>
                        <select name="counselor" value={newTransaction.counselor || ''} onChange={handleInputChange} className="mt-1 w-full p-2 border rounded-md">
                            <option value="">Pilih Guru BK</option>
                            {counselors.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="md:col-span-2 lg:col-span-3">
                        <label className="block text-sm font-medium">Alasan Melanggar</label>
                        <textarea name="reason" value={newTransaction.reason || ''} onChange={handleInputChange} rows={2} className="mt-1 w-full p-2 border rounded-md"></textarea>
                    </div>
                </div>
                <div className="flex justify-end space-x-2">
                    {editingTransactionId && (
                        <button type="button" onClick={resetForm} className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition">
                            Batal
                        </button>
                    )}
                    <button type="submit" className="flex items-center bg-brand-primary text-white px-4 py-2 rounded-lg hover:bg-brand-dark transition">
                        {editingTransactionId ? <Save size={18} className="mr-2"/> : <Plus size={18} className="mr-2" />}
                        {editingTransactionId ? 'Update Transaksi' : 'Simpan Transaksi'}
                    </button>
                </div>
            </form>

            <div>
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Riwayat Transaksi</h2>
                <div className="overflow-auto max-h-[50vh] rounded-lg border">
                    <table className="w-full text-left">
                        <thead className="bg-gray-100 sticky top-0">
                            <tr>
                                <th className="p-3">Tanggal</th>
                                <th className="p-3">Nama Siswa</th>
                                <th className="p-3">Kelas</th>
                                <th className="p-3">Pelanggaran</th>
                                <th className="p-3">Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {populatedTransactions.map(t => (
                                <tr key={t.id} className="border-b">
                                    <td className="p-3">{t.date}</td>
                                    <td className="p-3">{t.studentName}</td>
                                    <td className="p-3">{t.studentClass}</td>
                                    <td className="p-3">{t.violationName}</td>
                                    <td className="p-3 whitespace-nowrap">
                                        <button onClick={() => handleEdit(t.id)} className="text-blue-500 hover:text-blue-700 mr-3"><Edit size={18}/></button>
                                        <button onClick={() => setTransactions(ts => ts.filter(tsItem => tsItem.id !== t.id))} className="text-red-500 hover:text-red-700"><Trash2 size={18}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Transactions;
