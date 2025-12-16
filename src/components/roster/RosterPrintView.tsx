import { forwardRef } from 'react';
import { format } from 'date-fns';
import { Shift, StaffMember, Centre, OpenShift } from '@/types/roster';

interface RosterPrintViewProps {
  shifts: Shift[];
  openShifts: OpenShift[];
  staff: StaffMember[];
  centre: Centre;
  dates: Date[];
  weeklyBudget: number;
  costSummary: {
    regularCost: number;
    overtimeCost: number;
    totalCost: number;
    totalHours: number;
  };
}

export const RosterPrintView = forwardRef<HTMLDivElement, RosterPrintViewProps>(
  ({ shifts, openShifts, staff, centre, dates, weeklyBudget, costSummary }, ref) => {
    const getStaffName = (staffId: string) => staff.find(s => s.id === staffId)?.name || 'Unknown';
    const getRoomName = (roomId: string) => centre.rooms.find(r => r.id === roomId)?.name || roomId;

    // Group shifts by room and date
    const shiftsByRoomAndDate: Record<string, Record<string, Shift[]>> = {};
    centre.rooms.forEach(room => {
      shiftsByRoomAndDate[room.id] = {};
      dates.forEach(date => {
        const dateKey = format(date, 'yyyy-MM-dd');
        shiftsByRoomAndDate[room.id][dateKey] = shifts.filter(
          s => s.centreId === centre.id && s.roomId === room.id && s.date === dateKey
        );
      });
    });

    return (
      <div ref={ref} className="print-roster bg-white text-black p-8 min-h-screen">
        {/* Header */}
        <div className="border-b-2 border-black pb-4 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold">{centre.name} - Weekly Roster</h1>
              <p className="text-gray-600">
                {format(dates[0], 'MMMM d, yyyy')} - {format(dates[dates.length - 1], 'MMMM d, yyyy')}
              </p>
            </div>
            <div className="text-right text-sm">
              <p>Printed: {format(new Date(), 'MMM d, yyyy h:mm a')}</p>
              <p className="font-medium mt-1">Budget: ${weeklyBudget.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Cost Summary */}
        <div className="mb-6 p-4 bg-gray-100 rounded-lg">
          <h2 className="font-semibold mb-2">Cost Summary</h2>
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Regular Hours:</span>
              <span className="ml-2 font-medium">${costSummary.regularCost.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-600">Overtime:</span>
              <span className="ml-2 font-medium">${costSummary.overtimeCost.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-600">Total Cost:</span>
              <span className="ml-2 font-bold">${costSummary.totalCost.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-600">Variance:</span>
              <span className={`ml-2 font-bold ${costSummary.totalCost > weeklyBudget ? 'text-red-600' : 'text-green-600'}`}>
                {costSummary.totalCost > weeklyBudget ? '+' : '-'}
                ${Math.abs(costSummary.totalCost - weeklyBudget).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Roster Table */}
        <table className="w-full border-collapse text-sm mb-6">
          <thead>
            <tr>
              <th className="border border-gray-300 bg-gray-200 p-2 text-left font-semibold w-24">Room</th>
              {dates.map(date => (
                <th key={date.toISOString()} className="border border-gray-300 bg-gray-200 p-2 text-center font-semibold">
                  <div>{format(date, 'EEE')}</div>
                  <div className="text-xs font-normal">{format(date, 'MMM d')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {centre.rooms.map(room => (
              <tr key={room.id}>
                <td className="border border-gray-300 p-2 font-medium bg-gray-50">
                  {room.name}
                  <div className="text-xs text-gray-500">Ratio: {room.requiredRatio}</div>
                </td>
                {dates.map(date => {
                  const dateKey = format(date, 'yyyy-MM-dd');
                  const dayShifts = shiftsByRoomAndDate[room.id]?.[dateKey] || [];
                  const dayOpenShifts = openShifts.filter(os => os.roomId === room.id && os.date === dateKey);
                  
                  return (
                    <td key={dateKey} className="border border-gray-300 p-1 align-top min-w-[120px]">
                      {dayShifts.map(shift => (
                        <div key={shift.id} className="mb-1 p-1 bg-blue-50 rounded text-xs">
                          <div className="font-medium">{getStaffName(shift.staffId)}</div>
                          <div className="text-gray-600">{shift.startTime} - {shift.endTime}</div>
                        </div>
                      ))}
                      {dayOpenShifts.map(os => (
                        <div key={os.id} className="mb-1 p-1 bg-amber-50 border border-amber-200 rounded text-xs">
                          <div className="font-medium text-amber-700">OPEN</div>
                          <div className="text-gray-600">{os.startTime} - {os.endTime}</div>
                        </div>
                      ))}
                      {dayShifts.length === 0 && dayOpenShifts.length === 0 && (
                        <span className="text-gray-400 text-xs">-</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>

        {/* Staff Summary */}
        <div className="mb-6">
          <h2 className="font-semibold mb-2">Staff Hours Summary</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-gray-300 bg-gray-200 p-2 text-left">Staff Member</th>
                <th className="border border-gray-300 bg-gray-200 p-2 text-center">Role</th>
                <th className="border border-gray-300 bg-gray-200 p-2 text-center">Shifts</th>
                <th className="border border-gray-300 bg-gray-200 p-2 text-center">Hours</th>
                <th className="border border-gray-300 bg-gray-200 p-2 text-center">Overtime</th>
              </tr>
            </thead>
            <tbody>
              {staff.filter(s => shifts.some(sh => sh.staffId === s.id && sh.centreId === centre.id)).map(member => {
                const memberShifts = shifts.filter(s => s.staffId === member.id && s.centreId === centre.id);
                const totalHours = memberShifts.reduce((sum, shift) => {
                  const [startH, startM] = shift.startTime.split(':').map(Number);
                  const [endH, endM] = shift.endTime.split(':').map(Number);
                  return sum + ((endH * 60 + endM) - (startH * 60 + startM) - shift.breakMinutes) / 60;
                }, 0);
                const overtimeHours = Math.max(0, totalHours - member.maxHoursPerWeek);

                return (
                  <tr key={member.id}>
                    <td className="border border-gray-300 p-2">{member.name}</td>
                    <td className="border border-gray-300 p-2 text-center">{member.role}</td>
                    <td className="border border-gray-300 p-2 text-center">{memberShifts.length}</td>
                    <td className="border border-gray-300 p-2 text-center">{totalHours.toFixed(1)}h</td>
                    <td className={`border border-gray-300 p-2 text-center ${overtimeHours > 0 ? 'text-red-600 font-medium' : ''}`}>
                      {overtimeHours > 0 ? `+${overtimeHours.toFixed(1)}h` : '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Open Shifts */}
        {openShifts.filter(os => os.centreId === centre.id).length > 0 && (
          <div className="mb-6">
            <h2 className="font-semibold mb-2 text-amber-700">Open Shifts ({openShifts.filter(os => os.centreId === centre.id).length})</h2>
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="border border-gray-300 bg-amber-100 p-2 text-left">Room</th>
                  <th className="border border-gray-300 bg-amber-100 p-2 text-center">Date</th>
                  <th className="border border-gray-300 bg-amber-100 p-2 text-center">Time</th>
                  <th className="border border-gray-300 bg-amber-100 p-2 text-center">Urgency</th>
                </tr>
              </thead>
              <tbody>
                {openShifts.filter(os => os.centreId === centre.id).map(os => (
                  <tr key={os.id}>
                    <td className="border border-gray-300 p-2">{getRoomName(os.roomId)}</td>
                    <td className="border border-gray-300 p-2 text-center">{format(new Date(os.date), 'EEE, MMM d')}</td>
                    <td className="border border-gray-300 p-2 text-center">{os.startTime} - {os.endTime}</td>
                    <td className={`border border-gray-300 p-2 text-center font-medium ${os.urgency === 'high' ? 'text-red-600' : os.urgency === 'medium' ? 'text-amber-600' : ''}`}>
                      {os.urgency.toUpperCase()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-300 pt-4 mt-8 text-xs text-gray-500">
          <div className="flex justify-between">
            <span>Generated by Roster Scheduler</span>
            <span>Total Hours: {costSummary.totalHours}h | Staff Count: {staff.filter(s => shifts.some(sh => sh.staffId === s.id && sh.centreId === centre.id)).length}</span>
          </div>
        </div>

        {/* Print Styles */}
        <style>{`
          @media print {
            .print-roster {
              padding: 0;
              font-size: 10pt;
            }
            @page {
              size: landscape;
              margin: 1cm;
            }
            table {
              page-break-inside: auto;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
          }
        `}</style>
      </div>
    );
  }
);

RosterPrintView.displayName = 'RosterPrintView';
