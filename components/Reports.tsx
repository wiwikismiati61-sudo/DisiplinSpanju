
import React, { useMemo, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Transaction, Student, Violation, FollowUp, Consequence } from '../types';
import { exportToExcel } from '../utils/excel';
import { Download, ChevronRight, ChevronDown, Filter } from 'lucide-react';

const Reports: React.FC = () => {
    const [transactions] = useLocalStorage<Transaction[]>('transactions', []);
    const [students] = useLocalStorage<Student[]>('students', []);
    const [violations] = useLocalStorage<Violation[]>('violations', []);
    const [followUps] = useLocalStorage<FollowUp[]>('followups', []);
    const [consequences] = useLocalStorage<Consequence[]>('consequences', []);

    // State untuk Laporan Detail Siswa
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

    // Toggle expand/collapse
    const toggleRow = (id: string) => {
        setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const uniqueClasses = useMemo(() => {
        const classes = new Set(students.map(s => s.class));
        return Array.from(classes).sort();
    }, [students]);

    // Logika Grouping Data untuk Laporan Detail (Pivot-like structure)
    const detailReportData = useMemo(() => {
        if (!selectedClass) return [];

        // 1. Filter Siswa berdasarkan Kelas
        const classStudents = students.filter(s => s.class === selectedClass);
        
        // 2. Map data siswa dengan struktur hierarki pelanggarannya
        const data = classStudents.map(student => {
            const studentTransactions = transactions.filter(t => t.studentId === student.id);
            
            if (studentTransactions.length === 0) return null;

            // Group by Violation Name
            const byViolation: Record<string, any> = {};
            
            studentTransactions.forEach(t => {
                const violation = violations.find(v => v.id === t.violationId);
                const vName = violation?.name || 'Unknown Violation';
                
                // Cari konsekuensi: Utamakan yang dipilih di transaksi, jika tidak ada, ambil default dari level pelanggaran
                let relatedConsequences = '-';
                if (t.consequenceId) {
                    const c = consequences.find(c => c.id === t.consequenceId);
                    relatedConsequences = c ? c.description : '-';
                } else {
                     relatedConsequences = consequences
                        .filter(c => c.violationLevel === violation?.level)
                        .map(c => c.description)
                        .join(', ');
                }

                if (!byViolation[vName]) {
                    byViolation[vName] = {
                        name: vName,
                        count: 0,
                        dates: {}
                    };
                }
                byViolation[vName].count += 1;

                // Group by Date
                if (!byViolation[vName].dates[t.date]) {
                    byViolation[vName].dates[t.date] = {
                        date: t.date,
                        count: 0,
                        times: {}
                    };
                }
                byViolation[vName].dates[t.date].count += 1;

                // Group by Time
                if (!byViolation[vName].dates[t.date].times[t.time]) {
                     byViolation[vName].dates[t.date].times[t.time] = {
                        time: t.time,
                        count: 0,
                        details: []
                     };
                }
                byViolation[vName].dates[t.date].times[t.time].count += 1;
                byViolation[vName].dates[t.date].times[t.time].details.push({
                    reason: t.reason,
                    consequence: relatedConsequences || '-'
                });
            });

            return {
                studentId: student.id,
                studentName: student.name,
                totalCount: studentTransactions.length,
                violations: Object.values(byViolation)
            };
        }).filter(item => item !== null);

        return data;
    }, [selectedClass, students, transactions, violations, consequences]);

    const grandTotal = useMemo(() => {
        return detailReportData.reduce((acc, curr) => acc + (curr?.totalCount || 0), 0);
    }, [detailReportData]);

    // Existing Logic for Downloads
    const studentViolationCounts = useMemo(() => {
        const counts: { [key: string]: number } = {};
        transactions.forEach(t => {
            counts[t.studentId] = (counts[t.studentId] || 0) + 1;
        });
        return counts;
    }, [transactions]);
    
    const handleDownloadAllViolations = () => {
        const dataToExport = transactions.map(t => {
            const student = students.find(s => s.id === t.studentId);
            const violation = violations.find(v => v.id === t.violationId);
            const followUp = followUps.find(f => f.id === t.followUpId);
            
            // Logika Konsekuensi untuk Excel
            let relatedConsequences = '-';
            if (t.consequenceId) {
                const c = consequences.find(c => c.id === t.consequenceId);
                relatedConsequences = c ? c.description : '-';
            } else {
                 relatedConsequences = consequences
                    .filter(c => c.violationLevel === violation?.level)
                    .map(c => c.description)
                    .join(', ');
            }

            return {
                'Tanggal': t.date,
                'Jam': t.time,
                'Nama Siswa': student?.name || 'N/A',
                'Kelas': student?.class || 'N/A',
                'Pelanggaran': violation?.name || 'N/A',
                'Tingkat': violation?.level || 'N/A',
                'Konsekuensi': relatedConsequences || '-',
                'Poin': violation?.points || 0,
                'Alasan': t.reason,
                'Wali Kelas': t.homeroomTeacher,
                'Guru BK': t.counselor,
                'Tindak Lanjut': followUp?.description || 'N/A'
            };
        });
        exportToExcel(dataToExport, 'Laporan_Siswa_Melanggar');
    };
    
    const handleDownloadFollowUp = () => {
        const dataToExport = transactions.map(t => {
            const student = students.find(s => s.id === t.studentId);
            const violation = violations.find(v => v.id === t.violationId);
            const followUp = followUps.find(f => f.id === t.followUpId);
            return {
                'Tanggal': t.date,
                'Nama Siswa': student?.name || 'N/A',
                'Kelas': student?.class || 'N/A',
                'Pelanggaran': violation?.name || 'N/A',
                'Keterangan Tindak Lanjut': followUp?.description || 'N/A',
            };
        });
        exportToExcel(dataToExport, 'Laporan_Tindak_Lanjut');
    };

    const handleDownloadSpecialAttention = () => {
        const specialAttentionStudents = Object.keys(studentViolationCounts)
            .filter((studentId) => studentViolationCounts[studentId] >= 3)
            .map((studentId) => {
                const student = students.find(s => s.id === studentId);
                return {
                    'Nama Siswa': student?.name || 'N/A',
                    'Kelas': student?.class || 'N/A',
                    'Jumlah Pelanggaran': studentViolationCounts[studentId],
                    'Status': 'Perlu Panggilan Orang Tua'
                };
            });
        exportToExcel(specialAttentionStudents, 'Laporan_Siswa_Perhatian_Khusus');
    };

    const ReportCard = ({ title, description, onDownload }: { title: string, description: string, onDownload: () => void }) => (
        <div className="bg-gray-50 p-6 rounded-lg border flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div>
                <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
                <p className="text-gray-600 mt-1 max-w-lg">{description}</p>
            </div>
            <button onClick={onDownload} className="flex items-center bg-brand-secondary text-white px-4 py-2 rounded-lg hover:bg-brand-primary transition whitespace-nowrap">
                <Download size={18} className="mr-2"/> Download Excel
            </button>
        </div>
    );

    return (
        <div className="bg-white p-6 rounded-xl shadow-md space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Laporan</h1>
                <p className="text-gray-600">Analisis pelanggaran siswa secara detail dan unduh laporan.</p>
            </div>

            {/* --- FITUR BARU: LAPORAN DETAIL SISWA (Pivot Style) --- */}
            <div className="border rounded-xl overflow-hidden shadow-sm">
                <div className="p-4 bg-white border-b flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold text-gray-800">Laporan Detail Siswa</h2>
                    <div className="flex items-center space-x-2">
                        <Filter size={18} className="text-gray-500" />
                        <label className="font-medium text-gray-700">Kelas:</label>
                        <select 
                            value={selectedClass} 
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="border-gray-300 border rounded-md shadow-sm p-2 focus:ring-brand-primary focus:border-brand-primary min-w-[150px]"
                        >
                            <option value="">Pilih Kelas...</option>
                            {uniqueClasses.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                </div>

                {!selectedClass ? (
                    <div className="p-8 text-center text-gray-500 bg-gray-50">
                        Silakan pilih kelas terlebih dahulu untuk melihat detail laporan.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-[#991b1b] text-white"> {/* Warna merah tua sesuai referensi */}
                                    <th className="p-3 border-r border-red-700 w-3/4">Pelanggaran</th>
                                    <th className="p-3 text-right w-1/4">Jumlah</th>
                                </tr>
                            </thead>
                            <tbody>
                                {detailReportData.map((student: any) => {
                                    const isExpanded = expandedRows[student.studentId];
                                    return (
                                        <React.Fragment key={student.studentId}>
                                            {/* Level 1: Nama Siswa */}
                                            <tr className="bg-red-100 hover:bg-red-200 border-b border-white transition-colors">
                                                <td className="p-2 font-bold text-gray-800 flex items-center cursor-pointer" onClick={() => toggleRow(student.studentId)}>
                                                    <span className="mr-2 text-gray-500">
                                                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                    </span>
                                                    {student.studentName}
                                                </td>
                                                <td className="p-2 text-right font-bold text-gray-800">{student.totalCount}</td>
                                            </tr>

                                            {/* Level 2: Jenis Pelanggaran */}
                                            {isExpanded && student.violations.map((violation: any, vIdx: number) => {
                                                const vKey = `${student.studentId}-v-${vIdx}`;
                                                const isVExpanded = expandedRows[vKey];
                                                return (
                                                    <React.Fragment key={vKey}>
                                                        <tr className="bg-white hover:bg-gray-50 border-b border-gray-100">
                                                            <td className="p-2 pl-8 flex items-center cursor-pointer" onClick={() => toggleRow(vKey)}>
                                                                <span className="mr-2 text-gray-400">
                                                                     {isVExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                                                </span>
                                                                <span className="font-semibold text-gray-700">{violation.name}</span>
                                                            </td>
                                                            <td className="p-2 text-right text-gray-700 font-semibold">{violation.count}</td>
                                                        </tr>

                                                        {/* Level 3: Tanggal */}
                                                        {isVExpanded && Object.values(violation.dates).map((dateObj: any, dIdx: number) => {
                                                            const dKey = `${vKey}-d-${dIdx}`;
                                                            const isDExpanded = expandedRows[dKey];
                                                            return (
                                                                <React.Fragment key={dKey}>
                                                                    <tr className="bg-gray-50">
                                                                        <td className="p-1 pl-14 flex items-center cursor-pointer text-sm" onClick={() => toggleRow(dKey)}>
                                                                             <span className="mr-2 text-gray-400">
                                                                                 {isDExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                                                             </span>
                                                                             {dateObj.date}
                                                                        </td>
                                                                        <td className="p-1 text-right text-sm">{dateObj.count}</td>
                                                                    </tr>

                                                                    {/* Level 4: Jam */}
                                                                    {isDExpanded && Object.values(dateObj.times).map((timeObj: any, tIdx: number) => {
                                                                         const tKey = `${dKey}-t-${tIdx}`;
                                                                         const isTExpanded = expandedRows[tKey];
                                                                         return (
                                                                             <React.Fragment key={tKey}>
                                                                                 <tr className="bg-gray-50">
                                                                                     <td className="p-1 pl-20 flex items-center cursor-pointer text-sm" onClick={() => toggleRow(tKey)}>
                                                                                          <span className="mr-2 text-gray-400">
                                                                                             {isTExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                                                                                         </span>
                                                                                         {timeObj.time}
                                                                                     </td>
                                                                                     <td className="p-1 text-right text-sm">{timeObj.count}</td>
                                                                                 </tr>

                                                                                 {/* Level 5: Alasan & Konsekuensi */}
                                                                                 {isTExpanded && timeObj.details.map((detail: any, rIdx: number) => (
                                                                                     <tr key={`${tKey}-r-${rIdx}`} className="bg-white">
                                                                                         <td className="p-1 pl-28 text-sm border-l-4 border-gray-200 ml-20 block">
                                                                                             <div className="mb-1 text-gray-600">
                                                                                                <span className="font-medium text-gray-800">Alasan:</span> {detail.reason}
                                                                                             </div>
                                                                                             <div className="text-red-700">
                                                                                                <span className="font-medium">Konsekuensi:</span> {detail.consequence}
                                                                                             </div>
                                                                                         </td>
                                                                                         <td className="p-1 text-right text-sm text-gray-400">1</td>
                                                                                     </tr>
                                                                                 ))}
                                                                             </React.Fragment>
                                                                         )
                                                                    })}
                                                                </React.Fragment>
                                                            )
                                                        })}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </React.Fragment>
                                    );
                                })}
                                {detailReportData.length === 0 && (
                                    <tr>
                                        <td colSpan={2} className="p-4 text-center text-gray-500">Tidak ada pelanggaran tercatat untuk kelas ini.</td>
                                    </tr>
                                )}
                                <tr className="bg-gray-100 font-bold border-t-2 border-gray-300">
                                    <td className="p-3 text-gray-800">Grand Total</td>
                                    <td className="p-3 text-right text-gray-800">{grandTotal}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <hr className="border-gray-200" />
            
            {/* Bagian Download Laporan Lama */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold text-gray-700">Download Laporan</h3>
                <ReportCard 
                    title="Laporan Siswa yang Melanggar"
                    description="Laporan lengkap berisi semua catatan pelanggaran siswa yang telah terjadi."
                    onDownload={handleDownloadAllViolations}
                />
                <ReportCard 
                    title="Laporan Keterangan Tindak Lanjut"
                    description="Laporan yang berfokus pada tindak lanjut yang diberikan untuk setiap pelanggaran."
                    onDownload={handleDownloadFollowUp}
                />
                <ReportCard 
                    title="Siswa yang Perlu Perhatian Khusus"
                    description="Daftar siswa yang telah melakukan 3 kali pelanggaran atau lebih dan memerlukan panggilan orang tua."
                    onDownload={handleDownloadSpecialAttention}
                />
            </div>
        </div>
    );
};

export default Reports;
