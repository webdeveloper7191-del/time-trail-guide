/**
 * Industry-Specific Import Configuration
 * 
 * Provides field definitions, validation rules, and terminology for each industry
 */

import type { IndustryType } from '../timefold/industryConstraints';
import type { TargetFieldDefinition, TransformType } from './demandCSVImport';

// ==================== INDUSTRY IMPORT TYPES ====================

export type IndustryImportType = 
  | 'demand' 
  | 'summary' 
  | 'historical' 
  | 'realtime' 
  | 'locations';

export interface IndustryImportTypeConfig {
  id: IndustryImportType;
  label: string;
  description: string;
  icon: string; // lucide icon name
}

export interface IndustryFieldAlias {
  aliases: string[];
  transform?: TransformType;
}

export interface IndustryImportConfig {
  id: IndustryType;
  name: string;
  description: string;
  /** Import type labels (industry-specific terminology) */
  importTypes: IndustryImportTypeConfig[];
  /** Field definitions per import type */
  fields: Record<IndustryImportType, TargetFieldDefinition[]>;
  /** Field aliases for auto-detection */
  fieldAliases: Record<string, IndustryFieldAlias>;
  /** Validation notes shown during import */
  validationNotes: string[];
  /** CSV template examples */
  templateExamples: Record<IndustryImportType, { headers: string[]; example: string }>;
}

// ==================== CHILDCARE INDUSTRY ====================

export const childcareImportConfig: IndustryImportConfig = {
  id: 'childcare',
  name: 'Early Childhood Education & Care',
  description: 'Long day care, preschools, OSHC',
  importTypes: [
    { id: 'demand', label: 'Child Bookings', description: 'Individual booking records with child details', icon: 'Calendar' },
    { id: 'summary', label: 'Booking Summary', description: 'Aggregated booking counts by time slot', icon: 'Users' },
    { id: 'historical', label: 'Historical Attendance', description: 'Past attendance records for forecasting', icon: 'Clock' },
    { id: 'realtime', label: "Today's Attendance", description: 'Real-time sign-in/sign-out events', icon: 'UserCheck' },
    { id: 'locations', label: 'Room Configuration', description: 'Room capacity and age group settings', icon: 'MapPin' },
  ],
  fields: {
    locations: [
      { path: 'roomId', label: 'Room ID', type: 'string', required: true, category: 'Identification' },
      { path: 'roomName', label: 'Room Name', type: 'string', required: true, category: 'Identification' },
      { path: 'centreId', label: 'Centre ID', type: 'string', required: true, category: 'Identification' },
      { path: 'ageGroup', label: 'Age Group', type: 'enum', required: true, category: 'Configuration', enumValues: ['babies', 'toddlers', 'preschool', 'kindy'] },
      { path: 'capacity', label: 'Capacity', type: 'number', required: true, category: 'Configuration' },
      { path: 'operatingHours.start', label: 'Operating Start', type: 'time', required: false, category: 'Configuration' },
      { path: 'operatingHours.end', label: 'Operating End', type: 'time', required: false, category: 'Configuration' },
      { path: 'minQualifiedStaff', label: 'Min Qualified Staff', type: 'number', required: true, category: 'Configuration' },
    ],
    demand: [
      { path: 'date', label: 'Date', type: 'date', required: true, category: 'Booking' },
      { path: 'centreId', label: 'Centre ID', type: 'string', required: true, category: 'Location' },
      { path: 'roomId', label: 'Room ID', type: 'string', required: true, category: 'Location' },
      { path: 'childId', label: 'Child ID', type: 'string', required: true, category: 'Child' },
      { path: 'childName', label: 'Child Name', type: 'string', required: false, category: 'Child' },
      { path: 'ageMonths', label: 'Age (Months)', type: 'number', required: true, category: 'Child' },
      { path: 'bookingType', label: 'Booking Type', type: 'enum', required: true, category: 'Booking', enumValues: ['permanent', 'casual', 'makeup', 'extra'] },
      { path: 'startTime', label: 'Start Time', type: 'time', required: true, category: 'Booking' },
      { path: 'endTime', label: 'End Time', type: 'time', required: true, category: 'Booking' },
      { path: 'status', label: 'Status', type: 'enum', required: true, category: 'Booking', enumValues: ['confirmed', 'pending', 'cancelled', 'waitlist'] },
      { path: 'guardianContact', label: 'Guardian Contact', type: 'string', required: false, category: 'Child' },
      { path: 'notes', label: 'Notes', type: 'string', required: false, category: 'Other' },
    ],
    summary: [
      { path: 'date', label: 'Date', type: 'date', required: true, category: 'Summary' },
      { path: 'centreId', label: 'Centre ID', type: 'string', required: true, category: 'Location' },
      { path: 'roomId', label: 'Room ID', type: 'string', required: true, category: 'Location' },
      { path: 'timeSlotStart', label: 'Time Slot Start', type: 'time', required: true, category: 'Summary' },
      { path: 'timeSlotEnd', label: 'Time Slot End', type: 'time', required: true, category: 'Summary' },
      { path: 'bookedCount', label: 'Booked Count', type: 'number', required: true, category: 'Counts' },
      { path: 'confirmedCount', label: 'Confirmed Count', type: 'number', required: true, category: 'Counts' },
      { path: 'casualCount', label: 'Casual Count', type: 'number', required: true, category: 'Counts' },
      { path: 'capacity', label: 'Capacity', type: 'number', required: true, category: 'Counts' },
      { path: 'utilisationPercent', label: 'Utilisation %', type: 'number', required: false, category: 'Counts' },
    ],
    historical: [
      { path: 'date', label: 'Date', type: 'date', required: true, category: 'Record' },
      { path: 'centreId', label: 'Centre ID', type: 'string', required: true, category: 'Location' },
      { path: 'roomId', label: 'Room ID', type: 'string', required: true, category: 'Location' },
      { path: 'timeSlot', label: 'Time Slot', type: 'string', required: true, category: 'Record' },
      { path: 'bookedChildren', label: 'Booked Children', type: 'number', required: true, category: 'Attendance' },
      { path: 'attendedChildren', label: 'Attended Children', type: 'number', required: true, category: 'Attendance' },
      { path: 'absentChildren', label: 'Absent Children', type: 'number', required: false, category: 'Attendance' },
      { path: 'lateArrivals', label: 'Late Arrivals', type: 'number', required: false, category: 'Attendance' },
      { path: 'earlyDepartures', label: 'Early Departures', type: 'number', required: false, category: 'Attendance' },
      { path: 'attendanceRate', label: 'Attendance Rate %', type: 'number', required: false, category: 'Attendance' },
      { path: 'dayOfWeek', label: 'Day of Week', type: 'number', required: false, category: 'Metadata' },
      { path: 'weekNumber', label: 'Week Number', type: 'number', required: false, category: 'Metadata' },
      { path: 'isSchoolHoliday', label: 'School Holiday', type: 'boolean', required: false, category: 'Metadata' },
      { path: 'isPublicHoliday', label: 'Public Holiday', type: 'boolean', required: false, category: 'Metadata' },
    ],
    realtime: [
      { path: 'timestamp', label: 'Timestamp', type: 'string', required: true, category: 'Event' },
      { path: 'centreId', label: 'Centre ID', type: 'string', required: true, category: 'Location' },
      { path: 'roomId', label: 'Room ID', type: 'string', required: true, category: 'Location' },
      { path: 'childId', label: 'Child ID', type: 'string', required: true, category: 'Event' },
      { path: 'eventType', label: 'Event Type', type: 'enum', required: true, category: 'Event', enumValues: ['sign_in', 'sign_out', 'room_transfer', 'absent_notified', 'late_arrival'] },
      { path: 'actualTime', label: 'Actual Time', type: 'time', required: true, category: 'Event' },
      { path: 'bookedTime', label: 'Booked Time', type: 'time', required: true, category: 'Event' },
      { path: 'recordedBy', label: 'Recorded By', type: 'string', required: false, category: 'Other' },
      { path: 'transferToRoomId', label: 'Transfer To Room', type: 'string', required: false, category: 'Other' },
      { path: 'notes', label: 'Notes', type: 'string', required: false, category: 'Other' },
    ],
  },
  fieldAliases: {
    date: { aliases: ['date', 'booking date', 'record date', 'attendance date'], transform: 'date_dmy' },
    centreId: { aliases: ['centre id', 'center id', 'centreid', 'centerid', 'centre', 'center', 'location id', 'site id'] },
    roomId: { aliases: ['room id', 'roomid', 'room', 'classroom', 'class id'] },
    roomName: { aliases: ['room name', 'roomname', 'room', 'classroom name'] },
    ageGroup: { aliases: ['age group', 'agegroup', 'age', 'group', 'age category'], transform: 'age_group' },
    ageMonths: { aliases: ['age months', 'age in months', 'agemonths', 'months old', 'age'], transform: 'integer' },
    capacity: { aliases: ['capacity', 'max capacity', 'room capacity', 'licensed capacity'], transform: 'integer' },
    minQualifiedStaff: { aliases: ['min qualified staff', 'minimum staff', 'required staff', 'qualified staff'], transform: 'integer' },
    childId: { aliases: ['child id', 'childid', 'child', 'student id', 'enrolment id'] },
    childName: { aliases: ['child name', 'childname', 'name', 'student name', 'full name'] },
    guardianContact: { aliases: ['guardian contact', 'parent contact', 'emergency contact', 'contact number'] },
    bookingType: { aliases: ['booking type', 'bookingtype', 'type', 'enrolment type'], transform: 'booking_type' },
    status: { aliases: ['status', 'booking status', 'state'], transform: 'booking_status' },
    startTime: { aliases: ['start time', 'starttime', 'arrival time', 'booked start', 'from'], transform: 'time_hhmm' },
    endTime: { aliases: ['end time', 'endtime', 'departure time', 'booked end', 'to'], transform: 'time_hhmm' },
    bookedChildren: { aliases: ['booked children', 'bookedchildren', 'total booked', 'children booked'], transform: 'integer' },
    attendedChildren: { aliases: ['attended children', 'attendedchildren', 'actual attendance', 'attended'], transform: 'integer' },
    eventType: { aliases: ['event type', 'eventtype', 'type', 'action'], transform: 'event_type' },
  },
  validationNotes: [
    'NQF ratios are validated automatically (1:4 babies, 1:5 toddlers, 1:10 preschool, 1:11 kindy)',
    'Age group values: babies, toddlers, preschool, kindy',
    'Booking types: permanent, casual, makeup, extra',
  ],
  templateExamples: {
    locations: { headers: ['room_id', 'room_name', 'centre_id', 'age_group', 'capacity', 'operating_start', 'operating_end', 'min_qualified_staff'], example: 'room-1a,Joeys,centre-1,babies,12,06:30,18:30,2' },
    demand: { headers: ['date', 'centre_id', 'room_id', 'child_id', 'child_name', 'age_months', 'booking_type', 'start_time', 'end_time', 'status'], example: '2024-03-15,centre-1,room-1a,child-001,Emma Smith,18,permanent,07:30,17:30,confirmed' },
    summary: { headers: ['date', 'centre_id', 'room_id', 'time_slot_start', 'time_slot_end', 'booked_count', 'confirmed_count', 'casual_count', 'capacity', 'utilisation_percent'], example: '2024-03-15,centre-1,room-1a,09:00,12:00,10,8,2,12,83' },
    historical: { headers: ['date', 'centre_id', 'room_id', 'time_slot', 'booked_children', 'attended_children', 'absent_children', 'late_arrivals', 'early_departures'], example: '2024-03-14,centre-1,room-1a,09:00-12:00,10,9,1,2,1' },
    realtime: { headers: ['timestamp', 'centre_id', 'room_id', 'child_id', 'event_type', 'actual_time', 'booked_time', 'recorded_by'], example: '2024-03-15T07:45:00Z,centre-1,room-1a,child-001,sign_in,07:45,07:30,Sarah Johnson' },
  },
};

// ==================== AGED CARE INDUSTRY ====================

export const agedCareImportConfig: IndustryImportConfig = {
  id: 'aged_care',
  name: 'Residential Aged Care',
  description: 'Nursing homes and aged care facilities',
  importTypes: [
    { id: 'demand', label: 'Resident Care Plans', description: 'Individual resident care requirements', icon: 'HeartPulse' },
    { id: 'summary', label: 'Care Minutes Summary', description: 'AN-ACC care minutes by time period', icon: 'Timer' },
    { id: 'historical', label: 'Historical Care Delivery', description: 'Past care delivery records', icon: 'ClipboardList' },
    { id: 'realtime', label: 'Live Care Events', description: 'Real-time care delivery tracking', icon: 'Activity' },
    { id: 'locations', label: 'Wing/Ward Configuration', description: 'Ward capacity and care levels', icon: 'Building2' },
  ],
  fields: {
    locations: [
      { path: 'wardId', label: 'Ward/Wing ID', type: 'string', required: true, category: 'Identification' },
      { path: 'wardName', label: 'Ward/Wing Name', type: 'string', required: true, category: 'Identification' },
      { path: 'facilityId', label: 'Facility ID', type: 'string', required: true, category: 'Identification' },
      { path: 'careLevel', label: 'Care Level', type: 'enum', required: true, category: 'Configuration', enumValues: ['low', 'medium', 'high', 'dementia'] },
      { path: 'bedCapacity', label: 'Bed Capacity', type: 'number', required: true, category: 'Configuration' },
      { path: 'operatingHours.start', label: 'Shift Start', type: 'time', required: false, category: 'Configuration' },
      { path: 'operatingHours.end', label: 'Shift End', type: 'time', required: false, category: 'Configuration' },
      { path: 'minRNStaff', label: 'Min RN Staff', type: 'number', required: true, category: 'Configuration' },
      { path: 'targetCareMinutes', label: 'Target Care Min/Day', type: 'number', required: false, category: 'Configuration' },
    ],
    demand: [
      { path: 'date', label: 'Date', type: 'date', required: true, category: 'Care Plan' },
      { path: 'facilityId', label: 'Facility ID', type: 'string', required: true, category: 'Location' },
      { path: 'wardId', label: 'Ward ID', type: 'string', required: true, category: 'Location' },
      { path: 'residentId', label: 'Resident ID', type: 'string', required: true, category: 'Resident' },
      { path: 'residentName', label: 'Resident Name', type: 'string', required: false, category: 'Resident' },
      { path: 'anAccClass', label: 'AN-ACC Class', type: 'enum', required: true, category: 'Care Plan', enumValues: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13'] },
      { path: 'careMinutesRequired', label: 'Care Minutes Required', type: 'number', required: true, category: 'Care Plan' },
      { path: 'rnMinutesRequired', label: 'RN Minutes Required', type: 'number', required: true, category: 'Care Plan' },
      { path: 'specialNeeds', label: 'Special Needs', type: 'string', required: false, category: 'Care Plan' },
      { path: 'status', label: 'Status', type: 'enum', required: true, category: 'Care Plan', enumValues: ['active', 'discharged', 'hospital', 'leave'] },
    ],
    summary: [
      { path: 'date', label: 'Date', type: 'date', required: true, category: 'Summary' },
      { path: 'facilityId', label: 'Facility ID', type: 'string', required: true, category: 'Location' },
      { path: 'wardId', label: 'Ward ID', type: 'string', required: true, category: 'Location' },
      { path: 'shiftType', label: 'Shift Type', type: 'enum', required: true, category: 'Summary', enumValues: ['am', 'pm', 'night'] },
      { path: 'totalResidents', label: 'Total Residents', type: 'number', required: true, category: 'Counts' },
      { path: 'totalCareMinutesRequired', label: 'Total Care Minutes', type: 'number', required: true, category: 'Counts' },
      { path: 'rnMinutesRequired', label: 'RN Minutes Required', type: 'number', required: true, category: 'Counts' },
      { path: 'enMinutesRequired', label: 'EN Minutes Required', type: 'number', required: false, category: 'Counts' },
      { path: 'pcwMinutesRequired', label: 'PCW Minutes Required', type: 'number', required: false, category: 'Counts' },
    ],
    historical: [
      { path: 'date', label: 'Date', type: 'date', required: true, category: 'Record' },
      { path: 'facilityId', label: 'Facility ID', type: 'string', required: true, category: 'Location' },
      { path: 'wardId', label: 'Ward ID', type: 'string', required: true, category: 'Location' },
      { path: 'shiftType', label: 'Shift Type', type: 'enum', required: true, category: 'Record', enumValues: ['am', 'pm', 'night'] },
      { path: 'residentsPresent', label: 'Residents Present', type: 'number', required: true, category: 'Delivery' },
      { path: 'careMinutesDelivered', label: 'Care Minutes Delivered', type: 'number', required: true, category: 'Delivery' },
      { path: 'rnMinutesDelivered', label: 'RN Minutes Delivered', type: 'number', required: true, category: 'Delivery' },
      { path: 'incidentCount', label: 'Incidents', type: 'number', required: false, category: 'Delivery' },
      { path: 'complianceRate', label: 'Compliance Rate %', type: 'number', required: false, category: 'Delivery' },
    ],
    realtime: [
      { path: 'timestamp', label: 'Timestamp', type: 'string', required: true, category: 'Event' },
      { path: 'facilityId', label: 'Facility ID', type: 'string', required: true, category: 'Location' },
      { path: 'wardId', label: 'Ward ID', type: 'string', required: true, category: 'Location' },
      { path: 'residentId', label: 'Resident ID', type: 'string', required: true, category: 'Event' },
      { path: 'eventType', label: 'Care Event', type: 'enum', required: true, category: 'Event', enumValues: ['medication', 'personal_care', 'mobility', 'nutrition', 'wound_care', 'vital_signs', 'incident'] },
      { path: 'duration', label: 'Duration (mins)', type: 'number', required: true, category: 'Event' },
      { path: 'staffId', label: 'Staff ID', type: 'string', required: true, category: 'Event' },
      { path: 'staffRole', label: 'Staff Role', type: 'enum', required: true, category: 'Event', enumValues: ['rn', 'en', 'pcw', 'allied_health'] },
      { path: 'notes', label: 'Clinical Notes', type: 'string', required: false, category: 'Other' },
    ],
  },
  fieldAliases: {
    date: { aliases: ['date', 'care date', 'shift date'], transform: 'date_dmy' },
    facilityId: { aliases: ['facility id', 'site id', 'facility', 'site', 'home id'] },
    wardId: { aliases: ['ward id', 'wing id', 'unit id', 'ward', 'wing', 'unit'] },
    wardName: { aliases: ['ward name', 'wing name', 'unit name'] },
    residentId: { aliases: ['resident id', 'residentid', 'patient id', 'client id'] },
    residentName: { aliases: ['resident name', 'patient name', 'client name', 'name'] },
    anAccClass: { aliases: ['an-acc class', 'anacc', 'an acc', 'classification', 'care class'] },
    careMinutesRequired: { aliases: ['care minutes', 'minutes required', 'daily minutes'], transform: 'number' },
    rnMinutesRequired: { aliases: ['rn minutes', 'registered nurse minutes', 'rn time'], transform: 'number' },
    careLevel: { aliases: ['care level', 'level', 'acuity', 'dependency level'] },
    bedCapacity: { aliases: ['bed capacity', 'beds', 'capacity', 'bed count'], transform: 'integer' },
    shiftType: { aliases: ['shift type', 'shift', 'period', 'session'] },
    staffRole: { aliases: ['staff role', 'role', 'position', 'staff type'] },
  },
  validationNotes: [
    'AN-ACC classes 1-13 determine care minute requirements',
    'RN minutes must be tracked separately for compliance',
    'Care levels: low, medium, high, dementia',
    'Shift types: am (6-14), pm (14-22), night (22-6)',
  ],
  templateExamples: {
    locations: { headers: ['ward_id', 'ward_name', 'facility_id', 'care_level', 'bed_capacity', 'min_rn_staff', 'target_care_minutes'], example: 'ward-1a,Sunrise Wing,facility-1,high,20,2,215' },
    demand: { headers: ['date', 'facility_id', 'ward_id', 'resident_id', 'resident_name', 'an_acc_class', 'care_minutes_required', 'rn_minutes_required', 'status'], example: '2024-03-15,facility-1,ward-1a,res-001,John Smith,8,180,44,active' },
    summary: { headers: ['date', 'facility_id', 'ward_id', 'shift_type', 'total_residents', 'total_care_minutes', 'rn_minutes_required'], example: '2024-03-15,facility-1,ward-1a,am,18,3240,792' },
    historical: { headers: ['date', 'facility_id', 'ward_id', 'shift_type', 'residents_present', 'care_minutes_delivered', 'rn_minutes_delivered'], example: '2024-03-14,facility-1,ward-1a,am,18,3100,750' },
    realtime: { headers: ['timestamp', 'facility_id', 'ward_id', 'resident_id', 'event_type', 'duration', 'staff_id', 'staff_role'], example: '2024-03-15T08:30:00Z,facility-1,ward-1a,res-001,medication,15,staff-001,rn' },
  },
};

// ==================== HOSPITALITY INDUSTRY ====================

export const hospitalityImportConfig: IndustryImportConfig = {
  id: 'hospitality',
  name: 'Hospitality',
  description: 'Hotels, restaurants, and cafes',
  importTypes: [
    { id: 'demand', label: 'Reservations', description: 'Booking and reservation records', icon: 'CalendarCheck' },
    { id: 'summary', label: 'Covers Summary', description: 'Expected covers by time period', icon: 'Users' },
    { id: 'historical', label: 'Historical Covers', description: 'Past covers and revenue data', icon: 'TrendingUp' },
    { id: 'realtime', label: 'Live Orders', description: 'Real-time order tracking', icon: 'ShoppingBag' },
    { id: 'locations', label: 'Venue Configuration', description: 'Section capacity and service types', icon: 'Store' },
  ],
  fields: {
    locations: [
      { path: 'sectionId', label: 'Section ID', type: 'string', required: true, category: 'Identification' },
      { path: 'sectionName', label: 'Section Name', type: 'string', required: true, category: 'Identification' },
      { path: 'venueId', label: 'Venue ID', type: 'string', required: true, category: 'Identification' },
      { path: 'serviceType', label: 'Service Type', type: 'enum', required: true, category: 'Configuration', enumValues: ['dining', 'bar', 'events', 'takeaway'] },
      { path: 'seatCapacity', label: 'Seat Capacity', type: 'number', required: true, category: 'Configuration' },
      { path: 'operatingHours.start', label: 'Opens', type: 'time', required: false, category: 'Configuration' },
      { path: 'operatingHours.end', label: 'Closes', type: 'time', required: false, category: 'Configuration' },
      { path: 'minStaff', label: 'Min Staff', type: 'number', required: true, category: 'Configuration' },
    ],
    demand: [
      { path: 'date', label: 'Date', type: 'date', required: true, category: 'Reservation' },
      { path: 'venueId', label: 'Venue ID', type: 'string', required: true, category: 'Location' },
      { path: 'sectionId', label: 'Section ID', type: 'string', required: true, category: 'Location' },
      { path: 'reservationId', label: 'Reservation ID', type: 'string', required: true, category: 'Reservation' },
      { path: 'guestName', label: 'Guest Name', type: 'string', required: false, category: 'Guest' },
      { path: 'partySize', label: 'Party Size', type: 'number', required: true, category: 'Reservation' },
      { path: 'reservationType', label: 'Type', type: 'enum', required: true, category: 'Reservation', enumValues: ['standard', 'vip', 'event', 'walkin'] },
      { path: 'startTime', label: 'Booking Time', type: 'time', required: true, category: 'Reservation' },
      { path: 'status', label: 'Status', type: 'enum', required: true, category: 'Reservation', enumValues: ['confirmed', 'seated', 'completed', 'cancelled', 'noshow'] },
    ],
    summary: [
      { path: 'date', label: 'Date', type: 'date', required: true, category: 'Summary' },
      { path: 'venueId', label: 'Venue ID', type: 'string', required: true, category: 'Location' },
      { path: 'sectionId', label: 'Section ID', type: 'string', required: true, category: 'Location' },
      { path: 'mealPeriod', label: 'Meal Period', type: 'enum', required: true, category: 'Summary', enumValues: ['breakfast', 'lunch', 'dinner', 'late_night'] },
      { path: 'expectedCovers', label: 'Expected Covers', type: 'number', required: true, category: 'Counts' },
      { path: 'reservedCovers', label: 'Reserved Covers', type: 'number', required: true, category: 'Counts' },
      { path: 'walkinEstimate', label: 'Walk-in Estimate', type: 'number', required: false, category: 'Counts' },
      { path: 'eventCovers', label: 'Event Covers', type: 'number', required: false, category: 'Counts' },
    ],
    historical: [
      { path: 'date', label: 'Date', type: 'date', required: true, category: 'Record' },
      { path: 'venueId', label: 'Venue ID', type: 'string', required: true, category: 'Location' },
      { path: 'sectionId', label: 'Section ID', type: 'string', required: true, category: 'Location' },
      { path: 'mealPeriod', label: 'Meal Period', type: 'enum', required: true, category: 'Record', enumValues: ['breakfast', 'lunch', 'dinner', 'late_night'] },
      { path: 'actualCovers', label: 'Actual Covers', type: 'number', required: true, category: 'Performance' },
      { path: 'revenue', label: 'Revenue', type: 'number', required: false, category: 'Performance' },
      { path: 'avgSpendPerHead', label: 'Avg Spend/Head', type: 'number', required: false, category: 'Performance' },
      { path: 'staffHours', label: 'Staff Hours Used', type: 'number', required: false, category: 'Performance' },
    ],
    realtime: [
      { path: 'timestamp', label: 'Timestamp', type: 'string', required: true, category: 'Event' },
      { path: 'venueId', label: 'Venue ID', type: 'string', required: true, category: 'Location' },
      { path: 'sectionId', label: 'Section ID', type: 'string', required: true, category: 'Location' },
      { path: 'tableId', label: 'Table ID', type: 'string', required: true, category: 'Event' },
      { path: 'eventType', label: 'Event', type: 'enum', required: true, category: 'Event', enumValues: ['seated', 'order_placed', 'food_served', 'bill_requested', 'payment', 'departed'] },
      { path: 'partySize', label: 'Party Size', type: 'number', required: false, category: 'Event' },
      { path: 'orderValue', label: 'Order Value', type: 'number', required: false, category: 'Event' },
      { path: 'staffId', label: 'Staff ID', type: 'string', required: false, category: 'Other' },
    ],
  },
  fieldAliases: {
    date: { aliases: ['date', 'booking date', 'service date'], transform: 'date_dmy' },
    venueId: { aliases: ['venue id', 'restaurant id', 'outlet id', 'site id'] },
    sectionId: { aliases: ['section id', 'area id', 'zone id', 'section'] },
    reservationId: { aliases: ['reservation id', 'booking id', 'booking ref'] },
    guestName: { aliases: ['guest name', 'customer name', 'name', 'party name'] },
    partySize: { aliases: ['party size', 'covers', 'guests', 'pax'], transform: 'integer' },
    mealPeriod: { aliases: ['meal period', 'period', 'session', 'service'] },
    expectedCovers: { aliases: ['expected covers', 'forecast covers', 'predicted covers'], transform: 'integer' },
  },
  validationNotes: [
    'Covers represent number of diners/guests',
    'Meal periods: breakfast, lunch, dinner, late_night',
    'Service types: dining, bar, events, takeaway',
  ],
  templateExamples: {
    locations: { headers: ['section_id', 'section_name', 'venue_id', 'service_type', 'seat_capacity', 'min_staff'], example: 'sec-1,Main Dining,venue-1,dining,60,4' },
    demand: { headers: ['date', 'venue_id', 'section_id', 'reservation_id', 'guest_name', 'party_size', 'reservation_type', 'start_time', 'status'], example: '2024-03-15,venue-1,sec-1,res-001,Smith,4,standard,19:00,confirmed' },
    summary: { headers: ['date', 'venue_id', 'section_id', 'meal_period', 'expected_covers', 'reserved_covers', 'walkin_estimate'], example: '2024-03-15,venue-1,sec-1,dinner,80,55,25' },
    historical: { headers: ['date', 'venue_id', 'section_id', 'meal_period', 'actual_covers', 'revenue', 'avg_spend_per_head'], example: '2024-03-14,venue-1,sec-1,dinner,75,5250,70' },
    realtime: { headers: ['timestamp', 'venue_id', 'section_id', 'table_id', 'event_type', 'party_size', 'order_value'], example: '2024-03-15T19:15:00Z,venue-1,sec-1,table-5,seated,4,' },
  },
};

// ==================== RETAIL INDUSTRY ====================

export const retailImportConfig: IndustryImportConfig = {
  id: 'retail',
  name: 'Retail',
  description: 'Stores and shopping centres',
  importTypes: [
    { id: 'demand', label: 'Sales Forecast', description: 'Predicted transactions by period', icon: 'ShoppingCart' },
    { id: 'summary', label: 'Traffic Summary', description: 'Expected foot traffic by hour', icon: 'Footprints' },
    { id: 'historical', label: 'Historical Sales', description: 'Past sales and traffic data', icon: 'Receipt' },
    { id: 'realtime', label: 'Live Transactions', description: 'Real-time POS data', icon: 'CreditCard' },
    { id: 'locations', label: 'Store Configuration', description: 'Department capacity and trading hours', icon: 'Store' },
  ],
  fields: {
    locations: [
      { path: 'departmentId', label: 'Department ID', type: 'string', required: true, category: 'Identification' },
      { path: 'departmentName', label: 'Department Name', type: 'string', required: true, category: 'Identification' },
      { path: 'storeId', label: 'Store ID', type: 'string', required: true, category: 'Identification' },
      { path: 'departmentType', label: 'Department Type', type: 'enum', required: true, category: 'Configuration', enumValues: ['sales_floor', 'checkout', 'stockroom', 'customer_service'] },
      { path: 'floorSpace', label: 'Floor Space (sqm)', type: 'number', required: false, category: 'Configuration' },
      { path: 'tradingHours.start', label: 'Opens', type: 'time', required: true, category: 'Configuration' },
      { path: 'tradingHours.end', label: 'Closes', type: 'time', required: true, category: 'Configuration' },
      { path: 'minStaff', label: 'Min Staff', type: 'number', required: true, category: 'Configuration' },
    ],
    demand: [
      { path: 'date', label: 'Date', type: 'date', required: true, category: 'Forecast' },
      { path: 'storeId', label: 'Store ID', type: 'string', required: true, category: 'Location' },
      { path: 'departmentId', label: 'Department ID', type: 'string', required: true, category: 'Location' },
      { path: 'hourSlot', label: 'Hour Slot', type: 'time', required: true, category: 'Forecast' },
      { path: 'expectedTransactions', label: 'Expected Transactions', type: 'number', required: true, category: 'Forecast' },
      { path: 'expectedRevenue', label: 'Expected Revenue', type: 'number', required: false, category: 'Forecast' },
      { path: 'expectedFootTraffic', label: 'Expected Foot Traffic', type: 'number', required: false, category: 'Forecast' },
    ],
    summary: [
      { path: 'date', label: 'Date', type: 'date', required: true, category: 'Summary' },
      { path: 'storeId', label: 'Store ID', type: 'string', required: true, category: 'Location' },
      { path: 'departmentId', label: 'Department ID', type: 'string', required: true, category: 'Location' },
      { path: 'tradingPeriod', label: 'Trading Period', type: 'enum', required: true, category: 'Summary', enumValues: ['opening', 'morning', 'lunch', 'afternoon', 'evening', 'closing'] },
      { path: 'expectedTraffic', label: 'Expected Traffic', type: 'number', required: true, category: 'Counts' },
      { path: 'expectedTransactions', label: 'Expected Transactions', type: 'number', required: true, category: 'Counts' },
      { path: 'conversionRate', label: 'Conversion Rate %', type: 'number', required: false, category: 'Counts' },
    ],
    historical: [
      { path: 'date', label: 'Date', type: 'date', required: true, category: 'Record' },
      { path: 'storeId', label: 'Store ID', type: 'string', required: true, category: 'Location' },
      { path: 'departmentId', label: 'Department ID', type: 'string', required: true, category: 'Location' },
      { path: 'hourSlot', label: 'Hour Slot', type: 'time', required: true, category: 'Record' },
      { path: 'actualTransactions', label: 'Actual Transactions', type: 'number', required: true, category: 'Performance' },
      { path: 'actualRevenue', label: 'Actual Revenue', type: 'number', required: true, category: 'Performance' },
      { path: 'footTraffic', label: 'Foot Traffic', type: 'number', required: false, category: 'Performance' },
      { path: 'staffHours', label: 'Staff Hours', type: 'number', required: false, category: 'Performance' },
    ],
    realtime: [
      { path: 'timestamp', label: 'Timestamp', type: 'string', required: true, category: 'Event' },
      { path: 'storeId', label: 'Store ID', type: 'string', required: true, category: 'Location' },
      { path: 'departmentId', label: 'Department ID', type: 'string', required: true, category: 'Location' },
      { path: 'registerId', label: 'Register ID', type: 'string', required: true, category: 'Event' },
      { path: 'transactionType', label: 'Transaction Type', type: 'enum', required: true, category: 'Event', enumValues: ['sale', 'return', 'exchange', 'void'] },
      { path: 'transactionValue', label: 'Transaction Value', type: 'number', required: true, category: 'Event' },
      { path: 'itemCount', label: 'Item Count', type: 'number', required: false, category: 'Event' },
      { path: 'staffId', label: 'Staff ID', type: 'string', required: false, category: 'Other' },
    ],
  },
  fieldAliases: {
    date: { aliases: ['date', 'trading date', 'sales date'], transform: 'date_dmy' },
    storeId: { aliases: ['store id', 'shop id', 'location id', 'outlet id'] },
    departmentId: { aliases: ['department id', 'dept id', 'section id', 'area id'] },
    expectedTransactions: { aliases: ['expected transactions', 'forecast transactions', 'predicted sales'], transform: 'integer' },
    expectedRevenue: { aliases: ['expected revenue', 'forecast revenue', 'predicted revenue'], transform: 'number' },
    footTraffic: { aliases: ['foot traffic', 'traffic', 'customers', 'visitors'], transform: 'integer' },
    tradingPeriod: { aliases: ['trading period', 'period', 'session', 'time block'] },
  },
  validationNotes: [
    'Trading periods align with typical retail patterns',
    'Transaction counts help determine checkout staffing',
    'Foot traffic used for floor staff planning',
  ],
  templateExamples: {
    locations: { headers: ['department_id', 'department_name', 'store_id', 'department_type', 'trading_start', 'trading_end', 'min_staff'], example: 'dept-1,Fashion,store-1,sales_floor,09:00,17:30,3' },
    demand: { headers: ['date', 'store_id', 'department_id', 'hour_slot', 'expected_transactions', 'expected_revenue', 'expected_foot_traffic'], example: '2024-03-15,store-1,dept-1,10:00,45,2250,120' },
    summary: { headers: ['date', 'store_id', 'department_id', 'trading_period', 'expected_traffic', 'expected_transactions', 'conversion_rate'], example: '2024-03-15,store-1,dept-1,morning,350,85,24' },
    historical: { headers: ['date', 'store_id', 'department_id', 'hour_slot', 'actual_transactions', 'actual_revenue', 'foot_traffic'], example: '2024-03-14,store-1,dept-1,10:00,42,2100,115' },
    realtime: { headers: ['timestamp', 'store_id', 'department_id', 'register_id', 'transaction_type', 'transaction_value', 'item_count'], example: '2024-03-15T10:23:00Z,store-1,dept-1,reg-1,sale,89.50,3' },
  },
};

// ==================== GENERAL/DEFAULT INDUSTRY ====================

export const generalImportConfig: IndustryImportConfig = {
  id: 'general',
  name: 'General Business',
  description: 'Generic workforce scheduling',
  importTypes: [
    { id: 'demand', label: 'Demand Forecast', description: 'Expected workload by time period', icon: 'TrendingUp' },
    { id: 'summary', label: 'Workload Summary', description: 'Aggregated demand by period', icon: 'BarChart3' },
    { id: 'historical', label: 'Historical Data', description: 'Past workload records', icon: 'History' },
    { id: 'realtime', label: 'Live Activity', description: 'Real-time activity tracking', icon: 'Activity' },
    { id: 'locations', label: 'Location Configuration', description: 'Location capacity settings', icon: 'Building2' },
  ],
  fields: {
    locations: [
      { path: 'locationId', label: 'Location ID', type: 'string', required: true, category: 'Identification' },
      { path: 'locationName', label: 'Location Name', type: 'string', required: true, category: 'Identification' },
      { path: 'siteId', label: 'Site ID', type: 'string', required: true, category: 'Identification' },
      { path: 'locationType', label: 'Type', type: 'string', required: false, category: 'Configuration' },
      { path: 'capacity', label: 'Capacity', type: 'number', required: true, category: 'Configuration' },
      { path: 'operatingHours.start', label: 'Opens', type: 'time', required: false, category: 'Configuration' },
      { path: 'operatingHours.end', label: 'Closes', type: 'time', required: false, category: 'Configuration' },
      { path: 'minStaff', label: 'Min Staff', type: 'number', required: true, category: 'Configuration' },
    ],
    demand: [
      { path: 'date', label: 'Date', type: 'date', required: true, category: 'Demand' },
      { path: 'siteId', label: 'Site ID', type: 'string', required: true, category: 'Location' },
      { path: 'locationId', label: 'Location ID', type: 'string', required: true, category: 'Location' },
      { path: 'timeSlot', label: 'Time Slot', type: 'time', required: true, category: 'Demand' },
      { path: 'demandUnits', label: 'Demand Units', type: 'number', required: true, category: 'Demand' },
      { path: 'priority', label: 'Priority', type: 'enum', required: false, category: 'Demand', enumValues: ['low', 'medium', 'high', 'critical'] },
      { path: 'notes', label: 'Notes', type: 'string', required: false, category: 'Other' },
    ],
    summary: [
      { path: 'date', label: 'Date', type: 'date', required: true, category: 'Summary' },
      { path: 'siteId', label: 'Site ID', type: 'string', required: true, category: 'Location' },
      { path: 'locationId', label: 'Location ID', type: 'string', required: true, category: 'Location' },
      { path: 'period', label: 'Period', type: 'string', required: true, category: 'Summary' },
      { path: 'totalDemand', label: 'Total Demand', type: 'number', required: true, category: 'Counts' },
      { path: 'peakDemand', label: 'Peak Demand', type: 'number', required: false, category: 'Counts' },
      { path: 'avgDemand', label: 'Avg Demand', type: 'number', required: false, category: 'Counts' },
    ],
    historical: [
      { path: 'date', label: 'Date', type: 'date', required: true, category: 'Record' },
      { path: 'siteId', label: 'Site ID', type: 'string', required: true, category: 'Location' },
      { path: 'locationId', label: 'Location ID', type: 'string', required: true, category: 'Location' },
      { path: 'timeSlot', label: 'Time Slot', type: 'time', required: true, category: 'Record' },
      { path: 'actualDemand', label: 'Actual Demand', type: 'number', required: true, category: 'Performance' },
      { path: 'staffHours', label: 'Staff Hours', type: 'number', required: false, category: 'Performance' },
      { path: 'efficiency', label: 'Efficiency %', type: 'number', required: false, category: 'Performance' },
    ],
    realtime: [
      { path: 'timestamp', label: 'Timestamp', type: 'string', required: true, category: 'Event' },
      { path: 'siteId', label: 'Site ID', type: 'string', required: true, category: 'Location' },
      { path: 'locationId', label: 'Location ID', type: 'string', required: true, category: 'Location' },
      { path: 'eventType', label: 'Event Type', type: 'string', required: true, category: 'Event' },
      { path: 'value', label: 'Value', type: 'number', required: false, category: 'Event' },
      { path: 'staffId', label: 'Staff ID', type: 'string', required: false, category: 'Other' },
      { path: 'notes', label: 'Notes', type: 'string', required: false, category: 'Other' },
    ],
  },
  fieldAliases: {
    date: { aliases: ['date', 'record date'], transform: 'date_dmy' },
    siteId: { aliases: ['site id', 'siteid', 'site', 'location'] },
    locationId: { aliases: ['location id', 'locationid', 'area id', 'zone id'] },
    demandUnits: { aliases: ['demand units', 'demand', 'workload', 'volume'], transform: 'number' },
    timeSlot: { aliases: ['time slot', 'timeslot', 'slot', 'time'], transform: 'time_hhmm' },
  },
  validationNotes: [
    'Demand units are flexible and can represent any workload metric',
    'Configure industry-specific fields as needed',
  ],
  templateExamples: {
    locations: { headers: ['location_id', 'location_name', 'site_id', 'location_type', 'capacity', 'min_staff'], example: 'loc-1,Main Area,site-1,office,50,5' },
    demand: { headers: ['date', 'site_id', 'location_id', 'time_slot', 'demand_units', 'priority'], example: '2024-03-15,site-1,loc-1,09:00,25,medium' },
    summary: { headers: ['date', 'site_id', 'location_id', 'period', 'total_demand', 'peak_demand', 'avg_demand'], example: '2024-03-15,site-1,loc-1,morning,150,35,25' },
    historical: { headers: ['date', 'site_id', 'location_id', 'time_slot', 'actual_demand', 'staff_hours', 'efficiency'], example: '2024-03-14,site-1,loc-1,09:00,23,8,92' },
    realtime: { headers: ['timestamp', 'site_id', 'location_id', 'event_type', 'value', 'staff_id'], example: '2024-03-15T09:15:00Z,site-1,loc-1,task_completed,1,staff-001' },
  },
};

// ==================== INDUSTRY REGISTRY ====================

export const INDUSTRY_IMPORT_CONFIGS: Record<IndustryType, IndustryImportConfig> = {
  childcare: childcareImportConfig,
  aged_care: agedCareImportConfig,
  hospitality: hospitalityImportConfig,
  retail: retailImportConfig,
  disability_services: generalImportConfig, // Placeholder - uses general
  healthcare: generalImportConfig, // Placeholder - uses general
  education: generalImportConfig, // Placeholder - uses general
  general: generalImportConfig,
};

// ==================== HELPER FUNCTIONS ====================

export function getIndustryImportConfig(industry: IndustryType): IndustryImportConfig {
  return INDUSTRY_IMPORT_CONFIGS[industry] || INDUSTRY_IMPORT_CONFIGS.general;
}

export function getIndustryImportTypes(industry: IndustryType): IndustryImportTypeConfig[] {
  return getIndustryImportConfig(industry).importTypes;
}

export function getIndustryFields(industry: IndustryType, importType: IndustryImportType): TargetFieldDefinition[] {
  return getIndustryImportConfig(industry).fields[importType] || [];
}

export function getIndustryFieldAliases(industry: IndustryType): Record<string, IndustryFieldAlias> {
  return getIndustryImportConfig(industry).fieldAliases;
}

export function getIndustryTemplateExample(industry: IndustryType, importType: IndustryImportType): { headers: string[]; example: string } | null {
  const config = getIndustryImportConfig(industry);
  return config.templateExamples[importType] || null;
}

export function listImplementedIndustries(): { id: IndustryType; name: string; description: string }[] {
  return [
    { id: 'childcare', name: 'Early Childhood Education & Care', description: 'Long day care, preschools, OSHC' },
    { id: 'aged_care', name: 'Residential Aged Care', description: 'Nursing homes and aged care facilities' },
    { id: 'hospitality', name: 'Hospitality', description: 'Hotels, restaurants, and cafes' },
    { id: 'retail', name: 'Retail', description: 'Stores and shopping centres' },
    { id: 'general', name: 'General Business', description: 'Generic workforce scheduling' },
  ];
}
