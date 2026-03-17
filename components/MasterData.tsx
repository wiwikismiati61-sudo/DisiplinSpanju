
import React, { useState, useRef, useEffect } from 'react';
import { useFirebaseCollection } from '../hooks/useFirebaseCollection';
import { Student, Violation, Consequence, FollowUp, ViolationLevel, HomeroomTeacher, Counselor } from '../types';
import { parseStudentsFromExcel, parseNameListFromExcel } from '../utils/excel';
import { Plus, Trash2, Edit, UploadCloud, Save } from 'lucide-react';

type MasterTab = 'students' | 'violations' | 'consequences' | 'followups' | 'homeroomTeachers' | 'counselors';

const MasterData: React.FC = () => {
    const [activeTab, setActiveTab] = useState<MasterTab>('students');
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    
    const { data: students, setItem: setStudent, deleteItem: deleteStudent } = useFirebaseCollection<Student>('students');
    const { data: violations, setItem: setViolation, deleteItem: deleteViolation } = useFirebaseCollection<Violation>('violations');
    const { data: consequences, setItem: setConsequence, deleteItem: deleteConsequence } = useFirebaseCollection<Consequence>('consequences');
    const { data: followUps, setItem: setFollowUp, deleteItem: deleteFollowUp } = useFirebaseCollection<FollowUp>('followups');
    const { data: homeroomTeachers, setItem: setHomeroomTeacher, deleteItem: deleteHomeroomTeacher } = useFirebaseCollection<HomeroomTeacher>('homeroomTeachers');
    const { data: counselors, setItem: setCounselor, deleteItem: deleteCounselor } = useFirebaseCollection<Counselor>('counselors');

    const studentFileInputRef = useRef<HTMLInputElement>(null);
    const teacherFileInputRef = useRef<HTMLInputElement>(null);
    const counselorFileInputRef = useRef<HTMLInputElement>(null);

    const handleStudentFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const newStudents = await parseStudentsFromExcel(file);
            for (const ns of newStudents) {
                if (!students.some(ps => ps.name === ns.name && ps.class === ns.class)) {
                    await setStudent(ns.id, ns);
                }
            }
            alert(`${newStudents.length} data siswa berhasil di-upload.`);
        } catch (error) {
            console.error(error);
            alert(`Gagal meng-upload file. Pastikan format file benar (kolom 'Nama Siswa' dan 'Kelas'). Error: ${error}`);
        } finally {
            if (studentFileInputRef.current) {
                studentFileInputRef.current.value = '';
            }
        }
    };

    const handleNameListUpload = async (
        event: React.ChangeEvent<HTMLInputElement>,
        currentData: {id: string, name: string}[],
        setItem: (id: string, item: any) => Promise<void>,
        idPrefix: string,
        dataType: string
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const newList = await parseNameListFromExcel(file, idPrefix);
            for (const newItem of newList) {
                if (!currentData.some(p => p.name === newItem.name)) {
                    await setItem(newItem.id, newItem);
                }
            }
            alert(`${newList.length} data ${dataType} berhasil di-upload.`);
        } catch (error) {
            console.error(error);
            alert(`Gagal meng-upload file. Pastikan format file benar (kolom 'Nama'). Error: ${error}`);
        } finally {
            if (event.target) {
                event.target.value = '';
            }
        }
    };
    
    const renderStudents = () => (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                <h3 className="text-lg md:text-xl font-semibold text-gray-700">Data Siswa dan Kelas</h3>
                <button onClick={() => studentFileInputRef.current?.click()} className="w-full sm:w-auto flex justify-center items-center bg-green-500 text-white px-3 py-2 md:px-4 md:py-2 text-sm md:text-base rounded-lg hover:bg-green-600 transition">
                    <UploadCloud size={18} className="mr-2" /> Upload dari Excel
                </button>
                <input type="file" ref={studentFileInputRef} onChange={handleStudentFileUpload} className="hidden" accept=".xlsx, .xls" />
            </div>
            <div className="overflow-auto max-h-[60vh] rounded-lg border">
                <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-gray-100 sticky top-0"><tr><th className="p-2 md:p-3 text-sm font-medium text-gray-600">Nama Siswa</th><th className="p-2 md:p-3 text-sm font-medium text-gray-600">Kelas</th><th className="p-2 md:p-3 text-sm font-medium text-gray-600 w-24">Aksi</th></tr></thead>
                    <tbody>
                        {students.map(s => (
                            <tr key={s.id} className="border-b hover:bg-gray-50">
                                <td className="p-2 md:p-3 text-sm">{s.name}</td>
                                <td className="p-2 md:p-3 text-sm">{s.class}</td>
                                <td className="p-2 md:p-3 text-sm">
                                    <button onClick={() => deleteStudent(s.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
    
    const NameListComponent = ({ title, data, setItem, deleteItem, fileInputRef, onFileUpload, idPrefix, dataType }: {
        title: string,
        data: {id: string, name: string}[],
        setItem: (id: string, item: any) => Promise<void>,
        deleteItem: (id: string) => Promise<void>,
        fileInputRef: React.RefObject<HTMLInputElement>,
        onFileUpload: (event: React.ChangeEvent<HTMLInputElement>, currentData: {id: string, name: string}[], setItem: (id: string, item: any) => Promise<void>, idPrefix: string, dataType: string) => void,
        idPrefix: string,
        dataType: string
    }) => (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                <h3 className="text-lg md:text-xl font-semibold text-gray-700">{title}</h3>
                <button onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto flex justify-center items-center bg-green-500 text-white px-3 py-2 md:px-4 md:py-2 text-sm md:text-base rounded-lg hover:bg-green-600 transition">
                    <UploadCloud size={18} className="mr-2" /> Upload dari Excel
                </button>
                <input type="file" ref={fileInputRef} onChange={(e) => onFileUpload(e, data, setItem, idPrefix, dataType)} className="hidden" accept=".xlsx, .xls" />
            </div>
             <div className="overflow-auto max-h-[60vh] rounded-lg border">
                <table className="w-full text-left whitespace-nowrap">
                    <thead className="bg-gray-100 sticky top-0"><tr><th className="p-2 md:p-3 text-sm font-medium text-gray-600">Nama</th><th className="p-2 md:p-3 text-sm font-medium text-gray-600 w-24">Aksi</th></tr></thead>
                    <tbody>
                        {data.map(item => (
                            <tr key={item.id} className="border-b hover:bg-gray-50">
                                <td className="p-2 md:p-3 text-sm">{item.name}</td>
                                <td className="p-2 md:p-3 text-sm">
                                    <button onClick={() => deleteItem(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
    
    const CrudComponent = <T extends {id: string, [key: string]: any}>({ title, data, setItem, deleteItem, formFields }: { title: string, data: T[], setItem: (id: string, item: T) => Promise<void>, deleteItem: (id: string) => Promise<void>, formFields: { name: string, label: string, type: string, options?: string[] }[] }) => {
        const [formState, setFormState] = useState<Partial<T>>({});
        const fileInputRef = useRef<HTMLInputElement>(null);
        
        useEffect(() => {
            if (editingItemId) {
                const itemToEdit = data.find(item => item.id === editingItemId);
                if (itemToEdit) {
                    setFormState(itemToEdit);
                }
            } else {
                setFormState({});
            }
        }, [editingItemId, data]);

        const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
            const { name, value, type } = e.target;
            const isNumber = type === 'number';
            setFormState(prev => ({ ...prev, [name]: isNumber ? (value === '' ? '' : parseInt(value)) : value }));
        };

        const handleSubmit = async () => {
            if (formFields.some(f => !formState[f.name])) {
                alert('Semua field harus diisi');
                return;
            }
            const id = editingItemId || `item-${Date.now()}`;
            await setItem(id, { ...formState, id } as T);
            setFormState({});
            setEditingItemId(null);
        };
        
        const handleCancelEdit = () => {
            setFormState({});
            setEditingItemId(null);
        };

        const handleDelete = async (id: string) => {
            if (window.confirm('Anda yakin ingin menghapus item ini?')) {
                await deleteItem(id);
            }
        };

        const handleExcelUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const XLSX = await import('xlsx');
                    const dataBuffer = event.target?.result;
                    const workbook = XLSX.read(dataBuffer, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    const json = XLSX.utils.sheet_to_json<any>(worksheet);

                    let count = 0;
                    for (const [index, row] of json.entries()) {
                        const id = `item-${Date.now()}-${index}`;
                        const newItem: any = { id };
                        let isValid = true;
                        
                        formFields.forEach(f => {
                            const key = Object.keys(row).find(k => k.trim().toUpperCase() === f.label.toUpperCase());
                            if (key && row[key] !== undefined && row[key] !== null) {
                                newItem[f.name] = f.type === 'number' ? Number(row[key]) : String(row[key]);
                            } else {
                                isValid = false;
                            }
                        });

                        if (isValid) {
                            await setItem(id, newItem as T);
                            count++;
                        }
                    }

                    if (count === 0) {
                        throw new Error(`Tidak ada data valid. Pastikan file Excel memiliki kolom: ${formFields.map(f => f.label).join(', ')}`);
                    }

                    alert(`${count} data berhasil di-upload.`);
                } catch (error: any) {
                    console.error(error);
                    alert(`Gagal upload: ${error.message}`);
                } finally {
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }
            };
            reader.readAsArrayBuffer(file);
        };

        return (
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0">
                    <h3 className="text-lg md:text-xl font-semibold text-gray-700">{editingItemId ? `Edit ${title}` : title}</h3>
                    <button onClick={() => fileInputRef.current?.click()} className="w-full sm:w-auto flex justify-center items-center bg-green-500 text-white px-3 py-2 md:px-4 md:py-2 text-sm md:text-base rounded-lg hover:bg-green-600 transition">
                        <UploadCloud size={18} className="mr-2" /> Upload dari Excel
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleExcelUpload} className="hidden" accept=".xlsx, .xls" />
                </div>
                {editingItemId && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end bg-gray-50 p-4 rounded-lg">
                        {formFields.map(f => (
                            <div key={f.name}>
                                <label className="block text-xs md:text-sm font-medium text-gray-700">{f.label}</label>
                                {f.type === 'select' ? (
                                    <select name={f.name} value={(formState[f.name] as string) || ''} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 text-sm md:text-base">
                                        <option value="">Pilih...</option>
                                        {f.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                ) : (
                                    <input type={f.type} name={f.name} value={(formState[f.name] as any) || ''} onChange={handleFormChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 p-2 text-sm md:text-base"/>
                                )}
                            </div>
                        ))}
                        <div className="flex items-center justify-end space-x-2 sm:col-span-2 lg:col-start-4">
                            <button onClick={handleCancelEdit} className="flex-1 sm:flex-none bg-gray-500 text-white px-3 py-2 md:px-4 md:py-2 text-sm md:text-base rounded-lg hover:bg-gray-600 transition h-10">
                                Batal
                            </button>
                            <button onClick={handleSubmit} className="flex-1 sm:flex-none flex justify-center items-center bg-brand-primary text-white px-3 py-2 md:px-4 md:py-2 text-sm md:text-base rounded-lg hover:bg-brand-dark transition h-10">
                                <Save size={16} className="mr-2" /> Update
                            </button>
                        </div>
                    </div>
                )}
                 <div className="overflow-auto max-h-[60vh] rounded-lg border">
                    <table className="w-full text-left whitespace-nowrap">
                        <thead className="bg-gray-100 sticky top-0"><tr>{formFields.map(f => <th key={f.name} className="p-2 md:p-3 text-sm font-medium text-gray-600">{f.label}</th>)}<th className="p-2 md:p-3 text-sm font-medium text-gray-600 w-24">Aksi</th></tr></thead>
                        <tbody>
                            {data.map(item => (
                                <tr key={item.id} className="border-b hover:bg-gray-50">
                                    {formFields.map(f => <td key={f.name} className="p-2 md:p-3 text-sm">{item[f.name]}</td>)}
                                    <td className="p-2 md:p-3 text-sm whitespace-nowrap">
                                        <button onClick={() => { setEditingItemId(item.id); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-blue-500 hover:text-blue-700 mr-3"><Edit size={16}/></button>
                                        <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white p-4 md:p-6 rounded-xl shadow-md space-y-4 md:space-y-6">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Master Data</h1>
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-4 md:space-x-6 overflow-x-auto pb-1 scrollbar-hide">
                    {(Object.keys(tabLabels) as MasterTab[]).map(tab => (
                        <button key={tab} onClick={() => { setActiveTab(tab); setEditingItemId(null); }} className={`py-2 md:py-3 px-1 border-b-2 font-medium text-xs md:text-sm whitespace-nowrap ${activeTab === tab ? 'border-brand-primary text-brand-primary' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
                            {tabLabels[tab]}
                        </button>
                    ))}
                </nav>
            </div>
            <div>
                {activeTab === 'students' && renderStudents()}
                {activeTab === 'violations' && <CrudComponent title="Jenis Pelanggaran" data={violations} setItem={setViolation} deleteItem={deleteViolation} formFields={[ {name: 'name', label: 'Nama Pelanggaran', type: 'text'}, {name: 'level', label: 'Tingkatan', type: 'select', options: Object.values(ViolationLevel)}, {name: 'points', label: 'Bobot Poin', type: 'number'} ]} />}
                {activeTab === 'consequences' && <CrudComponent title="Konsekuensi" data={consequences} setItem={setConsequence} deleteItem={deleteConsequence} formFields={[ {name: 'description', label: 'Deskripsi Konsekuensi', type: 'text'}, {name: 'violationLevel', label: 'Tingkat Pelanggaran', type: 'select', options: Object.values(ViolationLevel)} ]} />}
                {activeTab === 'followups' && <CrudComponent title="Tindak Lanjut / Follow-up" data={followUps} setItem={setFollowUp} deleteItem={deleteFollowUp} formFields={[ {name: 'description', label: 'Deskripsi Tindak Lanjut', type: 'text'} ]} />}
                {activeTab === 'homeroomTeachers' && <NameListComponent title="Data Wali Kelas" data={homeroomTeachers} setItem={setHomeroomTeacher} deleteItem={deleteHomeroomTeacher} fileInputRef={teacherFileInputRef} onFileUpload={handleNameListUpload} idPrefix="teacher" dataType="Wali Kelas" />}
                {activeTab === 'counselors' && <NameListComponent title="Data Guru BK" data={counselors} setItem={setCounselor} deleteItem={deleteCounselor} fileInputRef={counselorFileInputRef} onFileUpload={handleNameListUpload} idPrefix="counselor" dataType="Guru BK" />}
            </div>
        </div>
    );
};

const tabLabels: { [key in MasterTab]: string } = {
    students: 'Siswa & Kelas',
    violations: 'Jenis Pelanggaran',
    consequences: 'Konsekuensi',
    followups: 'Tindak Lanjut',
    homeroomTeachers: 'Wali Kelas',
    counselors: 'Guru BK'
};

export default MasterData;
