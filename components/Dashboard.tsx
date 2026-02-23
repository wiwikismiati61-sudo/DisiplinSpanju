
import React, { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { Transaction, Student, Violation } from '../types';
import { User, Users, PieChart as PieChartIcon, AlertTriangle } from 'lucide-react';

const Dashboard: React.FC = () => {
    const [transactions] = useLocalStorage<Transaction[]>('transactions', []);
    const [students] = useLocalStorage<Student[]>('students', []);
    const [violations] = useLocalStorage<Violation[]>('violations', []);

    const totalStudents = students.length;
    const studentsWithViolations = useMemo(() => new Set(transactions.map(t => t.studentId)).size, [transactions]);
    const violationPercentage = totalStudents > 0 ? (studentsWithViolations / totalStudents) * 100 : 0;

    const frequentOffenders = useMemo(() => {
        const violationCounts: { [key: string]: { count: number, name: string, class: string } } = {};
        transactions.forEach(t => {
            if (!violationCounts[t.studentId]) {
                const student = students.find(s => s.id === t.studentId);
                violationCounts[t.studentId] = { count: 0, name: student?.name || 'Unknown', class: student?.class || 'Unknown' };
            }
            violationCounts[t.studentId].count++;
        });
        return Object.entries(violationCounts)
            .sort(([, a], [, b]) => b.count - a.count)
            .slice(0, 5)
            .map(([id, data]) => ({ id, ...data }));
    }, [transactions, students]);

    const violationLevelData = useMemo(() => {
        const counts = { Ringan: 0, Sedang: 0, Berat: 0 };
        transactions.forEach(t => {
            const violation = violations.find(v => v.id === t.violationId);
            if (violation) {
                counts[violation.level]++;
            }
        });
        return [
            { name: 'Ringan', value: counts.Ringan },
            { name: 'Sedang', value: counts.Sedang },
            { name: 'Berat', value: counts.Berat },
        ];
    }, [transactions, violations]);

    const violationsPerClassData = useMemo(() => {
        const classCounts: { [key: string]: number } = {};
        transactions.forEach(t => {
            const student = students.find(s => s.id === t.studentId);
            const className = student?.class || 'Tidak Diketahui';
            classCounts[className] = (classCounts[className] || 0) + 1;
        });

        return Object.entries(classCounts)
            .map(([name, count]) => ({ name, count }))
            // Sort alphanumeric (e.g., X, XI, XII)
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    }, [transactions, students]);

    const COLORS = ['#4CAF50', '#FFC107', '#F44336'];
    const CLASS_BAR_COLOR = '#1976D2';

    const StatCard = ({ title, value, icon: Icon, color }: { title: string, value: string | number, icon: React.ElementType, color: string }) => (
        <div className="bg-white p-6 rounded-xl shadow-md flex items-center space-x-4">
            <div className={`p-3 rounded-full ${color}`}>
                <Icon className="h-8 w-8 text-white" />
            </div>
            <div>
                <p className="text-sm text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Siswa" value={totalStudents} icon={Users} color="bg-blue-500" />
                <StatCard title="Siswa Melanggar" value={studentsWithViolations} icon={User} color="bg-yellow-500" />
                <StatCard title="Total Pelanggaran" value={transactions.length} icon={AlertTriangle} color="bg-red-500" />
                <StatCard title="% Siswa Melanggar" value={`${violationPercentage.toFixed(1)}%`} icon={PieChartIcon} color="bg-green-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-md">
                    <h2 className="text-lg font-semibold text-gray-700 mb-4">Frekuensi Pelanggaran per Tingkatan</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={violationLevelData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" name="Jumlah Pelanggaran">
                                {violationLevelData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-md">
                     <h2 className="text-lg font-semibold text-gray-700 mb-4">Distribusi Tingkat Pelanggaran</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={violationLevelData} cx="50%" cy="50%" labelLine={false} outerRadius={100} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {violationLevelData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Grafik Baru: Pelanggaran per Kelas */}
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Statistik Pelanggaran per Kelas</h2>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={violationsPerClassData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip cursor={{fill: 'transparent'}} />
                            <Legend />
                            <Bar dataKey="count" name="Jumlah Pelanggaran" fill={CLASS_BAR_COLOR} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-lg font-semibold text-gray-700 mb-4">Siswa Paling Sering Melanggar</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b">
                                <th className="p-3 font-medium text-gray-600">Nama Siswa</th>
                                <th className="p-3 font-medium text-gray-600">Kelas</th>
                                <th className="p-3 font-medium text-gray-600">Jumlah Pelanggaran</th>
                                <th className="p-3 font-medium text-gray-600">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {frequentOffenders.map(offender => (
                                <tr key={offender.id} className="border-b hover:bg-gray-50">
                                    <td className="p-3">{offender.name}</td>
                                    <td className="p-3">{offender.class}</td>
                                    <td className="p-3 font-semibold">{offender.count}</td>
                                    <td className="p-3">
                                    {offender.count >= 3 ? 
                                        <span className="px-3 py-1 text-xs font-semibold text-red-800 bg-red-200 rounded-full">Panggilan Orang Tua</span> : 
                                        <span className="px-3 py-1 text-xs font-semibold text-green-800 bg-green-200 rounded-full">Aman</span>
                                    }
                                    </td>
                                </tr>
                            ))}
                             {frequentOffenders.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="text-center p-4 text-gray-500">Belum ada data pelanggaran.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
