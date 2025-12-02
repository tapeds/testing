import { useMemo, useState } from 'react';
import type { DayOffRequest, Holiday, Engagement } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DeveloperCalendarProps {
  developerName: string;
  engagement: Engagement;
  month: string;
  dayOffRequests: DayOffRequest[];
  holidays: Holiday[];
  totalCredits: number;
  onAddDayOff?: (date: string, engagementId: string) => void;
  onAddHoliday?: (date: string, engagementId: string) => void;
}

export default function DeveloperCalendar({
  developerName,
  engagement,
  month,
  dayOffRequests,
  holidays,
  totalCredits,
  onAddDayOff,
  onAddHoliday,
}: DeveloperCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<{
    date: string;
    dayOffRequests: DayOffRequest[];
    holidays: Holiday[];
  } | null>(null);

  const calendar = useMemo(() => {
    const date = new Date(month);
    const year = date.getFullYear();
    const monthNum = date.getMonth();
    
    const firstDay = new Date(year, monthNum, 1);
    const lastDay = new Date(year, monthNum + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: Array<{
      date: number;
      fullDate: string;
      isApprovedDayOff: boolean;
      dayOffType?: string;
      isHoliday: boolean;
      holidayName?: string;
      isCreditDay: boolean;
      dayOffRequests: DayOffRequest[];
      holidays: Holiday[];
    }> = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({
        date: 0,
        fullDate: '',
        isApprovedDayOff: false,
        isHoliday: false,
        isCreditDay: false,
        dayOffRequests: [],
        holidays: [],
      });
    }

    // Add actual days
    for (let day = 1; day <= daysInMonth; day++) {
      const fullDate = `${year}-${String(monthNum + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      const requestsForDay = dayOffRequests.filter(
        (req) =>
          req.status === 'client_approved' &&
          new Date(req.startDate) <= new Date(fullDate) &&
          new Date(req.endDate) >= new Date(fullDate)
      );
      
      const isApprovedDayOff = requestsForDay.length > 0;
      const dayOffType = requestsForDay[0]?.type;

      const holidaysForDay = holidays.filter((h) => h.date === fullDate);
      const holiday = holidaysForDay[0];
      const isHoliday = !!holiday;
      const isCreditDay = holiday?.isTaken === false;

      days.push({
        date: day,
        fullDate,
        isApprovedDayOff,
        dayOffType,
        isHoliday,
        holidayName: holiday?.name,
        isCreditDay,
        dayOffRequests: requestsForDay,
        holidays: holidaysForDay,
      });
    }

    // Debug logging
    const daysWithEvents = days.filter(d => d.isApprovedDayOff || d.isHoliday);
    if (daysWithEvents.length > 0) {
      console.log('Calendar has events:', daysWithEvents.map(d => ({
        date: d.fullDate,
        dayOff: d.isApprovedDayOff,
        holiday: d.isHoliday,
        type: d.dayOffType
      })));
    }
    
    return days;
  }, [month, dayOffRequests, holidays]);

  const approvedDaysInMonth = dayOffRequests
    .filter((req) => req.status === 'client_approved')
    .reduce((sum, req) => {
      const start = new Date(req.startDate);
      const end = new Date(req.endDate);
      const monthDate = new Date(month);
      const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
      const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);

      if (start <= monthEnd && end >= monthStart) {
        const overlapStart = start > monthStart ? start : monthStart;
        const overlapEnd = end < monthEnd ? end : monthEnd;
        const days = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        return sum + days;
      }
      return sum;
    }, 0);

  const handleDateClick = (day: typeof calendar[0]) => {
    if (day.date === 0) return;
    setSelectedDate({
      date: day.fullDate,
      dayOffRequests: day.dayOffRequests,
      holidays: day.holidays,
    });
  };

  const getDayOffColor = (type?: string) => {
    switch (type) {
      case 'vacation':
        return 'bg-blue-500/20 border-blue-500';
      case 'sick_leave':
        return 'bg-red-500/20 border-red-500';
      case 'personal':
        return 'bg-yellow-500/20 border-yellow-500';
      case 'unpaid':
        return 'bg-gray-500/20 border-gray-500';
      default:
        return 'bg-blue-500/20 border-blue-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{developerName}</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">
              Days off: {approvedDaysInMonth}
            </Badge>
            <Badge variant="default" className="bg-green-500">
              Credits: {totalCredits}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-muted-foreground p-2"
            >
              {day}
            </div>
          ))}
          {calendar.map((day, idx) => {
            // Priority: Holiday > Day Off > Normal
            let bgClass = '';
            if (day.isHoliday && day.isCreditDay) {
              bgClass = 'bg-green-500/20 border-green-500';
            } else if (day.isHoliday && !day.isCreditDay) {
              bgClass = 'bg-purple-500/20 border-purple-500';
            } else if (day.isApprovedDayOff) {
              bgClass = getDayOffColor(day.dayOffType);
            }
            
            const uniqueKey = day.fullDate 
              ? `${engagement.id}-${day.fullDate}` 
              : `${engagement.id}-empty-${idx}`;
            
            return (
              <div
                key={uniqueKey}
                onClick={() => handleDateClick(day)}
                className={cn(
                  'aspect-square p-2 text-center text-sm rounded-md border transition-all',
                  day.date === 0 && 'invisible',
                  day.date > 0 && 'cursor-pointer hover:shadow-md hover:scale-105',
                  bgClass
                )}
                title={
                  day.isHoliday
                    ? `${day.holidayName} (${day.isCreditDay ? 'Credit' : 'Taken'})`
                    : day.isApprovedDayOff
                    ? `Day Off: ${day.dayOffType?.replace('_', ' ')}`
                    : 'Click to add event'
                }
              >
                {day.date > 0 && day.date}
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border border-blue-500 bg-blue-500/20" />
            <span>Vacation</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border border-red-500 bg-red-500/20" />
            <span>Sick Leave</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border border-yellow-500 bg-yellow-500/20" />
            <span>Personal</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border border-gray-500 bg-gray-500/20" />
            <span>Unpaid</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border border-purple-500 bg-purple-500/20" />
            <span>Holiday (Taken)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded border border-green-500 bg-green-500/20" />
            <span>Holiday (Credit)</span>
          </div>
        </div>
      </CardContent>

      {/* Date Details Dialog */}
      <Dialog open={!!selectedDate} onOpenChange={() => setSelectedDate(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedDate && new Date(selectedDate.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* Existing Events */}
            {selectedDate && (selectedDate.dayOffRequests.length > 0 || selectedDate.holidays.length > 0) && (
              <div className="space-y-2">
                <h3 className="font-medium">Events on this date:</h3>
                
                {selectedDate.dayOffRequests.map((request) => (
                  <div key={request.id} className="flex items-center gap-2 p-3 bg-muted rounded-md">
                    <Calendar className="w-4 h-4" />
                    <div className="flex-1">
                      <div className="font-medium capitalize">{request.type.replace('_', ' ')}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                      </div>
                      {request.reason && (
                        <div className="text-sm text-muted-foreground">{request.reason}</div>
                      )}
                    </div>
                    <Badge variant="default">Day Off</Badge>
                  </div>
                ))}

                {selectedDate.holidays.map((holiday) => (
                  <div key={holiday.id} className="flex items-center gap-2 p-3 bg-muted rounded-md">
                    <Calendar className="w-4 h-4" />
                    <div className="flex-1">
                      <div className="font-medium">{holiday.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {holiday.isTaken ? 'Taken' : 'Saved as Credit'}
                      </div>
                    </div>
                    <Badge variant={holiday.isTaken ? 'secondary' : 'default'}>Holiday</Badge>
                  </div>
                ))}
              </div>
            )}

            {selectedDate && selectedDate.dayOffRequests.length === 0 && selectedDate.holidays.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No events on this date</p>
            )}

            {/* Quick Actions */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  if (selectedDate && onAddDayOff) {
                    onAddDayOff(selectedDate.date, engagement.id);
                    setSelectedDate(null);
                  }
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Day Off Request
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  if (selectedDate && onAddHoliday) {
                    onAddHoliday(selectedDate.date, engagement.id);
                    setSelectedDate(null);
                  }
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Holiday
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
