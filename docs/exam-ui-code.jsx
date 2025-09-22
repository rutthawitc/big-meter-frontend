import React, { useState } from 'react';

// FAKE DATA: In a real application, this data would come from an API call.
// Added more previous month data for demonstration
const MOCK_DATA = [
    { id: 1, branch: 'ม.ชุมแพ', userNo: '106200000402', name: 'วัดสว่างเวียงจอง', meterNo: '000058', meterSize: '3/4', currentUsage: 193, percentage: 32, history: [265, 221, 257, 240, 231, 255, 260, 270, 245, 233, 241, 250] },
    { id: 2, branch: 'ม.ชุมแพ', userNo: '10620002934', name: 'การไฟฟ้าส่วนภูมิภาค(สาขาย่อย)', meterNo: '000054', meterSize: '3/4', currentUsage: 89, percentage: 8, history: [122, 156, 115, 130, 145, 125, 110, 119, 134, 142, 128, 133] },
    { id: 3, branch: 'ม.ชุมแพ', userNo: '10620002998', name: 'ธนาคารออมสิน สาขาสุพรรณบุรี', meterNo: '000070', meterSize: '1', currentUsage: 126, percentage: 18, history: [152, 175, 141, 160, 155, 168, 170, 162, 158, 149, 163, 151] },
    { id: 4, branch: 'ม.ชุมแพ', userNo: '10620003162', name: 'โรงเรียนอนุบาลสุพรรณบุรี', meterNo: '59222093826BY8', meterSize: '1', currentUsage: 126, percentage: 23, history: [164, 119, 86, 100, 112, 95, 120, 135, 122, 110, 99, 105] },
];

// Helper to generate month headers dynamically
const generateMonthHeaders = (count) => {
    const months = [];
    const thaiMonthAbbr = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    let date = new Date(2025, 7, 1); // Start from August 2025 (Month is 0-indexed for JS) for previous months

    for (let i = 0; i < count; i++) {
        const month = thaiMonthAbbr[date.getMonth()];
        const year = (date.getFullYear() + 543).toString().slice(-2);
        months.push(`${month} ${year}`);
        date.setMonth(date.getMonth() - 1);
    }
    return months;
};

const allMonthHeaders = generateMonthHeaders(12);

// -- Reusable Icon Components --
const SearchIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
);

const ExportIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
);


// -- UI Component: Header --
const Header = () => (
    <header className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800">ระบบแสดงผลผู้ใช้น้ำรายใหญ่</h1>
            <p className="text-slate-500 mt-1">แดชบอร์ดสรุปข้อมูลการใช้น้ำ</p>
        </div>
        <div className="flex items-center gap-4">
            <a href="#" className="text-slate-600 hover:text-blue-600">Home</a>
            <img src="https://placehold.co/40x40/E2E8F0/475569?text=U" alt="User Avatar" className="rounded-full" />
        </div>
    </header>
);

// -- UI Component: FiltersCard --
const FiltersCard = () => (
    <div className="bg-white rounded-xl shadow-md p-6 mb-8 hover:shadow-lg transition-shadow duration-300">
        <h2 className="text-xl font-semibold text-slate-700 mb-4">ตัวกรองข้อมูล</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div>
                <label htmlFor="month" className="block text-sm font-medium text-slate-600 mb-1">เดือน/ปี</label>
                <div className="flex gap-2">
                    <select id="month" className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        <option>กันยายน</option>
                        <option>สิงหาคม</option>
                        <option>กรกฎาคม</option>
                    </select>
                    <select id="year" className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                        <option>2568</option>
                        <option>2567</option>
                        <option>2566</option>
                    </select>
                </div>
            </div>
            <div>
                <label htmlFor="branch" className="block text-sm font-medium text-slate-600 mb-1">สาขา</label>
                <select id="branch" className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                    <option>1062 - กปภ.สาขาสุพรรณบุรี</option>
                    <option>1063 - กปภ.สาขาอื่น</option>
                </select>
            </div>
            <div>
                <label htmlFor="percentage" className="block text-sm font-medium text-slate-600 mb-1">เปอร์เซ็นต์ผลต่าง (น้อยกว่า)</label>
                <div className="relative">
                    <input type="number" id="percentage" defaultValue="10" className="w-full p-2 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 pr-8" />
                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-500">%</span>
                </div>
            </div>
        </div>
        <div className="flex flex-col md:flex-row justify-end items-center mt-4 pt-4 border-t border-slate-200">
            <div className="flex gap-2 mt-4 md:mt-0">
                <button className="bg-slate-200 text-slate-800 font-semibold px-6 py-2.5 rounded-lg hover:bg-slate-300 transition-colors">ล้างค่า</button>
                <button className="bg-blue-600 text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-blue-700 transition-colors">แสดงรายงาน</button>
            </div>
        </div>
    </div>
);


// -- UI Component: StatusPill for table cells --
const StatusPill = ({ value, percentage }) => {
    let colorClasses = 'bg-yellow-100 text-yellow-700';
    if (percentage > 30) {
        colorClasses = 'bg-red-100 text-red-700';
    } else if (percentage > 15) {
        colorClasses = 'bg-orange-100 text-orange-700';
    }

    return (
        <span className={`font-semibold px-2 py-1 rounded-full text-xs ${colorClasses}`}>
            {value} (-{percentage}%)
        </span>
    );
};

// -- UI Component: DataTable --
const DataTable = ({ data, viewMode, monthRange }) => {
    const monthsToDisplay = viewMode === 'expanded' ? 12 : monthRange;
    const headersToShow = allMonthHeaders.slice(0, monthsToDisplay);

    return (
        <div className="overflow-x-auto">
            <table id="data-table" className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-100 border-b-2 border-slate-200">
                    <tr>
                        <th className="p-3">ลำดับ</th>
                        <th className="p-3">กปภ.สาขา</th>
                        <th className="p-3">เลขที่ผู้ใช้น้ำ</th>
                        <th className="p-3">ชื่อผู้ใช้น้ำ</th>
                        <th className="p-3">หมายเลขมาตร</th>
                        <th className="p-3">ขนาดมาตร</th>
                        <th className="p-3 text-center">หน่วยน้ำเดือนนี้ (ก.ย. 68)</th>
                        {headersToShow.map(header => (
                            <th key={header} className="p-3 text-center">{header}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                    {data.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50">
                            <td className="p-3">{row.id}</td>
                            <td className="p-3">{row.branch}</td>
                            <td className="p-3">{row.userNo}</td>
                            <td className="p-3">{row.name}</td>
                            <td className="p-3">{row.meterNo}</td>
                            <td className="p-3">{row.meterSize}</td>
                            <td className="p-3 text-center">
                                <StatusPill value={row.currentUsage} percentage={row.percentage} />
                            </td>
                            {row.history.slice(0, monthsToDisplay).map((usage, index) => (
                                <td key={index} className="p-3 text-center">{usage}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

// -- UI Component: Pagination --
const Pagination = () => (
    <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4">
        <div className="flex items-center gap-2 text-sm">
            <label htmlFor="rows-per-page" className="text-slate-600">แสดง:</label>
            <select id="rows-per-page" className="p-1 border border-slate-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500">
                <option>10</option>
                <option>25</option>
                <option>50</option>
                <option>100</option>
            </select>
            <span className="text-slate-500">จากทั้งหมด 53 รายการ</span>
        </div>
        <div className="flex items-center gap-1">
            <button className="p-2 rounded-md hover:bg-slate-100 text-slate-500">&laquo; ก่อนหน้า</button>
            <button className="p-2 w-8 h-8 rounded-md bg-blue-600 text-white">1</button>
            <button className="p-2 w-8 h-8 rounded-md hover:bg-slate-100">2</button>
            <button className="p-2 w-8 h-8 rounded-md hover:bg-slate-100">3</button>
            <span className="p-2">...</span>
            <button className="p-2 w-8 h-8 rounded-md hover:bg-slate-100">6</button>
            <button className="p-2 rounded-md hover:bg-slate-100 text-slate-500">ถัดไป &raquo;</button>
        </div>
    </div>
);


// -- Main App Component --
export default function App() {
    const [viewMode, setViewMode] = useState('compact'); // Default to 'compact'
    const [monthRange, setMonthRange] = useState(3); // Default to 3 months

    const MonthRangeButton = ({ months }) => (
         <button
            type="button"
            onClick={() => setMonthRange(months)}
            className={`px-3 py-1 text-sm font-medium border hover:bg-slate-100 focus:z-10 focus:ring-2 focus:ring-blue-500
            ${monthRange === months && viewMode === 'compact' ? 'bg-blue-100 text-blue-700 border-blue-300' : 'bg-white text-slate-900 border-slate-300'}
            ${months === 3 ? 'rounded-l-lg' : ''}
            ${months === 12 ? 'rounded-r-md' : 'border-r-0'}
            `}
        >
            {months} เดือน
        </button>
    );

    return (
        <div className="p-4 md:p-8 bg-gray-50 min-h-screen" style={{ fontFamily: "'Sarabun', 'Inter', sans-serif" }}>
            <div className="max-w-7xl mx-auto">
                <Header />
                <FiltersCard />

                {/* Results Section */}
                <div className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow duration-300">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-800">ผลลัพธ์: <span className="text-blue-600">53 รายชื่อ</span> ที่เข้าเงื่อนไข</h3>
                            <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                                <span>คำอธิบายสี:</span>
                                <div className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-400 rounded-full"></span><span>= 5-15%</span></div>
                                <div className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-500 rounded-full"></span><span>= 15-30%</span></div>
                                <div className="flex items-center gap-1"><span className="w-3 h-3 bg-red-500 rounded-full"></span><span>&gt; 30%</span></div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap justify-start md:justify-end">
                            <div className="relative">
                                <input type="text" placeholder="ค้นหาในตาราง..." className="w-full md:w-auto p-2 border border-slate-300 rounded-md pl-10" />
                                <SearchIcon />
                            </div>
                            <button className="flex items-center gap-2 bg-slate-200 text-slate-800 font-semibold px-4 py-2 rounded-lg hover:bg-slate-300 transition-colors">
                                <ExportIcon />
                                <span>Export</span>
                            </button>
                             {/* View Toggle Controller */}
                            <div className="flex items-center rounded-lg bg-slate-200 p-1 text-sm font-medium">
                                <button
                                    onClick={() => setViewMode('compact')}
                                    className={`px-3 py-1 rounded-md ${viewMode === 'compact' ? 'bg-white text-blue-600 shadow' : 'text-slate-600'}`}>
                                    ย่อ
                                </button>
                                <button
                                    onClick={() => setViewMode('expanded')}
                                    className={`px-3 py-1 rounded-md ${viewMode === 'expanded' ? 'bg-white text-blue-600 shadow' : 'text-slate-600'}`}>
                                    ขยาย
                                </button>
                            </div>
                             {/* Month history Toggle */}
                            <div className="inline-flex rounded-md shadow-sm" role="group">
                                <MonthRangeButton months={3} />
                                <MonthRangeButton months={6} />
                                <MonthRangeButton months={12} />
                            </div>
                        </div>
                    </div>

                    <DataTable data={MOCK_DATA} viewMode={viewMode} monthRange={monthRange} />
                    <Pagination />
                </div>
            </div>
        </div>
    );
}
