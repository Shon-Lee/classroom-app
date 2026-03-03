import { useState, useEffect } from "react";

// ─── GOOGLE API CONFIGURATION ─────────────────────────────────────────────
// Add your Google API credentials here
const GOOGLE_CONFIG = {
  clientId: "783727248696-tnc8lnu3mtuheb2gqhlnu79k89obbur2.apps.googleusercontent.com",
  apiKey: "AIzaSyDmuJgZTpIxQQkS2orSgTKsc4QwJ1iKQdc",
  spreadsheetId: "1g2fevLQ4vMuyLceuGodd2k5XvRbLpDGm6RA8Yy6Vd64", // The ID of your Google Sheet
  scopes: "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile"
};

// Sheet names (tabs) in your Google Spreadsheet
const SHEET_NAMES = {
  CLASSES: "Classes",
  STUDENTS: "Students",
  STAFF: "Staff",
  KNOWLEDGE: "Knowledge",
  ANNOUNCEMENTS: "Announcements",
  TASKS: "Tasks",
  STUDENT_TASKS: "StudentTasks",
  TICKETS: "Tickets",
  SUBMISSIONS: "Submissions",
  STAFF_TASKS: "StaffTasks"
};

// ─── GOOGLE SHEETS DATA SERVICE ───────────────────────────────────────────
let gapiInited = false;
let gisInited = false;
let tokenClient = null;
let accessToken = null;

// Initialize Google API
function gapiInit() {
  return new Promise((resolve) => {
    if (typeof gapi !== 'undefined') {
      gapi.load('client', async () => {
        await gapi.client.init({
          apiKey: GOOGLE_CONFIG.apiKey,
          discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
        });
        gapiInited = true;
        resolve();
      });
    } else {
      resolve();
    }
  });
}

// Initialize Google Identity Services
function gisInit() {
  return new Promise((resolve) => {
    if (typeof google !== 'undefined' && google.accounts) {
      tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CONFIG.clientId,
        scope: GOOGLE_CONFIG.scopes,
        callback: '', // Will be set later
      });
      gisInited = true;
      resolve();
    } else {
      resolve();
    }
  });
}

// Get data from Google Sheets
async function getSheetData(sheetName, range = 'A:Z') {
  if (!accessToken) return [];
  
  try {
    const response = await gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_CONFIG.spreadsheetId,
      range: `${sheetName}!${range}`,
    });
    
    const rows = response.result.values || [];
    if (rows.length === 0) return [];
    
    // Convert rows to objects using first row as headers
    const headers = rows[0];
    return rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });
  } catch (error) {
    console.error(`Error reading ${sheetName}:`, error);
    return [];
  }
}

// Update data in Google Sheets
async function updateSheetData(sheetName, data) {
  if (!accessToken || !data || data.length === 0) return;
  
  try {
    // Get headers from first object
    const headers = Object.keys(data[0]);
    const rows = [headers, ...data.map(obj => headers.map(h => obj[h] || ''))];
    
    await gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: GOOGLE_CONFIG.spreadsheetId,
      range: `${sheetName}!A:Z`,
      valueInputOption: 'RAW',
      resource: { values: rows },
    });
  } catch (error) {
    console.error(`Error updating ${sheetName}:`, error);
  }
}

// Append row to Google Sheets
async function appendSheetData(sheetName, data) {
  if (!accessToken || !data) return;
  
  try {
    const values = [Object.values(data)];
    await gapi.client.sheets.spreadsheets.values.append({
      spreadsheetId: GOOGLE_CONFIG.spreadsheetId,
      range: `${sheetName}!A:A`,
      valueInputOption: 'RAW',
      resource: { values },
    });
  } catch (error) {
    console.error(`Error appending to ${sheetName}:`, error);
  }
}

// ─── ICON COMPONENTS ──────────────────────────────────────────────────────
const Icon = {
  LayoutGrid: (props) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>,
  Check: (props) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 6 9 17l-5-5"/></svg>,
  AlertCircle: (props) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>,
  Clock: (props) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Star: (props) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Circle: (props) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="10"/></svg>,
  MoreHorizontal: (props) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>,
  RefreshCw: (props) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>,
  Users: (props) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  School: (props) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
  Inbox: (props) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>,
  Megaphone: (props) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m3 11 18-5v12L3 14v-3z"/><path d="M11.6 16.8a3 3 0 1 1-5.8-1.6"/></svg>,
  Book: (props) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/></svg>,
  Ticket: (props) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>,
  Clipboard: (props) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>,
  BarChart: (props) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/></svg>,
  GraduationCap: (props) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21.42 10.922a1 1 0 0 0-.019-1.838L12.83 5.18a2 2 0 0 0-1.66 0L2.6 9.08a1 1 0 0 0 0 1.832l8.57 3.908a2 2 0 0 0 1.66 0z"/><path d="M22 10v6"/><path d="M6 12.5V16a6 3 0 0 0 12 0v-3.5"/></svg>,
  Search: (props) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>,
  PartyPopper: (props) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5.8 11.3 2 22l10.7-3.79"/><path d="M4 3h.01"/><path d="M22 8h.01"/><path d="M15 2h.01"/><path d="M22 20h.01"/><circle cx="12" cy="12" r="2"/><path d="m4.5 9 10-10"/><path d="M20.5 9 10 19"/></svg>,
  CheckCircle: (props) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  FileEdit: (props) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M4 13.5V4a2 2 0 0 1 2-2h8.5L20 7.5V20a2 2 0 0 1-2 2h-5.5"/><polyline points="14 2 14 8 20 8"/><path d="M10.42 12.61a2.1 2.1 0 1 1 2.97 2.97L7.95 21 4 22l.99-3.95 5.43-5.44Z"/></svg>,
  Building: (props) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>,
  User: (props) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  MailOpen: (props) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21.2 8.4c.5.38.8.97.8 1.6v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10a2 2 0 0 1 .8-1.6l8-6a2 2 0 0 1 2.4 0l8 6Z"/><path d="m22 10-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 10"/></svg>,
  Construction: (props) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><rect x="2" y="6" width="20" height="8" rx="1"/><path d="M17 14v7"/><path d="M7 14v7"/><path d="M17 3v3"/><path d="M7 3v3"/><path d="M10 14 2.3 6.3"/><path d="m14 6 7.7 7.7"/><path d="m8 6 8 8"/></svg>,
  UserCheck: (props) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>,
};

// ─── DESIGN TOKENS ─────────────────────────────────────────────────────────
const T = {
  bg:         "#FAFAF8",
  surface:    "#FFFFFF",
  border:     "#E8E5E0",
  borderSoft: "#F0EDE8",
  text:       "#1A1814",
  muted:      "#7A756E",
  subtle:     "#AEA89F",
  accent:     "#2D5BE3",
  accentBg:   "#EEF2FD",
  overdue:    { fg: "#C0392B", bg: "#FDF0EE", border: "#FADBD8" },
  dueSoon:    { fg: "#B45309", bg: "#FEFBF3", border: "#FDE68A" },
  submitted:  { fg: "#0E7490", bg: "#F0FBFE", border: "#BAE6FD" },
  graded:     { fg: "#166534", bg: "#F0FDF4", border: "#BBF7D0" },
  published:  { fg: "#374151", bg: "#F9FAFB", border: "#E5E7EB" },
  draft:      { fg: "#9CA3AF", bg: "#F9FAFB", border: "#E5E7EB" },
  purple:     { fg: "#6D28D9", bg: "#EDE9FE", border: "#DDD6FE" },
};

const statusMap = {
  "Overdue":   { ...T.overdue,   label: "Overdue",   icon: <Icon.AlertCircle /> },
  "Due Soon":  { ...T.dueSoon,   label: "Due Soon",  icon: <Icon.Clock /> },
  "Submitted": { ...T.submitted, label: "Submitted", icon: <Icon.Check /> },
  "Graded":    { ...T.graded,    label: "Graded",    icon: <Icon.Star /> },
  "Published": { ...T.published, label: "Active",    icon: <Icon.Circle /> },
  "Draft":     { ...T.draft,     label: "Draft",     icon: <Icon.MoreHorizontal /> },
  "Open":      { ...T.dueSoon,   label: "Open",      icon: <Icon.Circle /> },
  "In Review": { ...T.submitted, label: "In Review", icon: <Icon.RefreshCw /> },
  "Resolved":  { ...T.graded,    label: "Resolved",  icon: <Icon.Check /> },
};

// ─── INITIAL DATA ───────────────────────────────────────────────────────────
const CLASSES_INIT = [
  { id: 1, name: "English Literature", staffId: 2, staffName: "Prof. Sandra Chen",  students: 28, tasks: 8, documents: [] },
  { id: 2, name: "Mathematics",        staffId: 4, staffName: "Prof. David Kim",    students: 32, tasks: 12, documents: [] },
  { id: 3, name: "Biology",            staffId: 5, staffName: "Prof. James Wright", students: 24, tasks: 6, documents: [] },
  { id: 4, name: "History 101",        staffId: 6, staffName: "Prof. Ana Gomez",    students: 30, tasks: 9, documents: [] },
];

// Initial knowledge documents (Google Drive links)
const KNOWLEDGE_INIT = [
  { id: 1, classId: 1, title: "How to Write a Strong Thesis Statement", driveLink: "https://drive.google.com/file/d/example1", tags: ["Writing", "Academic"], added: "Feb 20", addedBy: "Prof. Sandra Chen" },
  { id: 2, classId: 1, title: "Shakespeare's Major Themes", driveLink: "https://drive.google.com/file/d/example2", tags: ["Literature", "Analysis"], added: "Feb 15", addedBy: "Prof. Sandra Chen" },
  { id: 3, classId: 2, title: "The Quadratic Formula Explained", driveLink: "https://drive.google.com/file/d/example3", tags: ["Math", "Formulas"], added: "Feb 18", addedBy: "Prof. David Kim" },
  { id: 4, classId: 2, title: "Trigonometry Basics", driveLink: "https://drive.google.com/file/d/example4", tags: ["Math", "Geometry"], added: "Feb 12", addedBy: "Prof. David Kim" },
  { id: 5, classId: 3, title: "Cell Organelles & Their Functions", driveLink: "https://drive.google.com/file/d/example5", tags: ["Biology", "Cells"], added: "Feb 22", addedBy: "Prof. James Wright" },
  { id: 6, classId: 4, title: "World War II Timeline", driveLink: "https://drive.google.com/file/d/example6", tags: ["History", "Events"], added: "Feb 14", addedBy: "Prof. Ana Gomez" },
];

// Students with classIds — some have NO class (unassigned, signed up via Google)
const STUDENTS_INIT = [
  { id: 101, name: "Alex Rivera",      email: "alex@gmail.com",     avatar: "A", classIds: [1, 2], status: "Active",   joinedVia: "Google", joinDate: "Feb 10" },
  { id: 102, name: "Marcus Johnson",   email: "marcus@gmail.com",   avatar: "M", classIds: [1, 3], status: "Active",   joinedVia: "Google", joinDate: "Feb 11" },
  { id: 103, name: "Priya Patel",      email: "priya@gmail.com",    avatar: "P", classIds: [],     status: "Active",   joinedVia: "Google", joinDate: "Feb 28" },
  { id: 104, name: "Jordan Lee",       email: "jordan@gmail.com",   avatar: "J", classIds: [],     status: "Active",   joinedVia: "Google", joinDate: "Feb 28" },
  { id: 105, name: "Sofia Martinez",   email: "sofia@gmail.com",    avatar: "S", classIds: [],     status: "Active",   joinedVia: "Google", joinDate: "Mar 1"  },
  { id: 106, name: "Ethan Brooks",     email: "ethan@gmail.com",    avatar: "E", classIds: [2],    status: "Active",   joinedVia: "Google", joinDate: "Feb 15" },
  { id: 107, name: "Aisha Kamara",     email: "aisha@gmail.com",    avatar: "A", classIds: [3, 4], status: "Active",   joinedVia: "Google", joinDate: "Feb 12" },
  { id: 108, name: "Noah Chen",        email: "noah@gmail.com",     avatar: "N", classIds: [],     status: "Inactive", joinedVia: "Google", joinDate: "Mar 1"  },
  { id: 109, name: "Isabella Torres",  email: "isa@gmail.com",      avatar: "I", classIds: [],     status: "Active",   joinedVia: "Google", joinDate: "Mar 1"  },
  { id: 110, name: "Liam O'Brien",     email: "liam@gmail.com",     avatar: "L", classIds: [1],    status: "Active",   joinedVia: "Google", joinDate: "Feb 20" },
];

const STAFF_INIT = [
  { id: 2, name: "Prof. Sandra Chen",  email: "sandra@school.edu",  avatar: "S", classIds: [1],    status: "Active",  joinDate: "Jan 5"  },
  { id: 4, name: "Prof. David Kim",    email: "david@school.edu",   avatar: "D", classIds: [2],    status: "Active",  joinDate: "Jan 5"  },
  { id: 5, name: "Prof. James Wright", email: "james@school.edu",   avatar: "J", classIds: [3],    status: "Active",  joinDate: "Jan 5"  },
  { id: 6, name: "Prof. Ana Gomez",    email: "ana@school.edu",     avatar: "A", classIds: [4],    status: "Active",  joinDate: "Jan 8"  },
  { id: 7, name: "Prof. Chris Hall",   email: "chris@school.edu",   avatar: "C", classIds: [],     status: "Active",  joinDate: "Feb 20" },
];

const STAFF_TASKS_INIT = [
  { id: 1, title: "Submit Q1 Grade Reports",     assignedTo: 2, assignedToName: "Prof. Sandra Chen",  dueDate: "Mar 5", status: "Open",      note: "Please use the provided template." },
  { id: 2, title: "Attend Department Meeting",   assignedTo: 4, assignedToName: "Prof. David Kim",    dueDate: "Mar 3", status: "In Review", note: "Prepare a 5-min progress update."  },
  { id: 3, title: "Update Syllabus for Biology", assignedTo: 5, assignedToName: "Prof. James Wright", dueDate: "Mar 8", status: "Open",      note: "Align with new curriculum standards." },
];

const ANNOUNCEMENTS_INIT = [
  { id: 1, title: "Midterm Schedule Released", classId: null, className: "All Classes",       authorName: "Dr. William Park",   role: "Admin", date: "Feb 28", content: "Midterms will be held March 20–24. Review materials are posted in the Knowledge section." },
  { id: 2, title: "Lab Safety Reminder",       classId: 3,   className: "Biology",           authorName: "Prof. James Wright", role: "Staff", date: "Feb 27", content: "All students must wear protective goggles and gloves during the next lab session on March 5." },
  { id: 3, title: "Poetry Essay Due Friday",   classId: 1,   className: "English Literature",authorName: "Prof. Sandra Chen",  role: "Staff", date: "Feb 26", content: "Reminder: your poetry analysis essay is due this Friday. Late submissions will be penalized." },
];

const STUDENT_TASKS_INIT = [
  { id: 1, title: "Essay: The Industrial Revolution", classId: 4, class: "History 101",        due: "Mar 2",  status: "Overdue"   },
  { id: 2, title: "Quadratic Equations Problem Set",  classId: 2, class: "Mathematics",         due: "Mar 3",  status: "Due Soon"  },
  { id: 3, title: "Lab Report: Photosynthesis",       classId: 3, class: "Biology",             due: "Mar 10", status: "Submitted" },
  { id: 4, title: "Poetry Analysis — Keats",          classId: 1, class: "English Literature",  due: "Feb 25", status: "Graded",
    grade: { score: 88, total: 100, feedback: "Excellent analysis of metaphor and symbolism. Strong thesis throughout.", rubric: [
      { label: "Analysis",  score: 35, total: 40 },
      { label: "Structure", score: 28, total: 30 },
      { label: "Writing",   score: 25, total: 30 },
    ]}},
  { id: 5, title: "Climate Change Research Paper",    classId: 3, class: "Biology",             due: "Mar 15", status: "Published" },
];

const TICKETS_INIT = [
  { id: 1, subject: "Need extra projector for Biology lab", staffId: 5, staffName: "Prof. James Wright", category: "Equipment", date: "Feb 26", status: "In Review", message: "The current projector in room 204 has a broken HDMI port. Could we get a replacement or spare before March 5?", adminReply: "We've ordered a replacement, should arrive by March 3." },
  { id: 2, subject: "Request for substitute teacher",       staffId: 2, staffName: "Prof. Sandra Chen",  category: "Staffing",   date: "Feb 28", status: "Open",      message: "I will be attending a conference on March 10. Could a substitute be arranged for my English Lit class?", adminReply: "" },
];

const SUBMISSIONS_DATA = [
  { id: 1, student: "Alex Rivera",    task: "Poetry Analysis", classId: 1, status: "Graded",    submittedAt: "Feb 24, 3:42 PM",  grade: 88,   late: false },
  { id: 2, student: "Marcus Johnson", task: "Poetry Analysis", classId: 1, status: "Submitted", submittedAt: "Feb 25, 11:20 AM", grade: null, late: false },
  { id: 3, student: "Priya Patel",    task: "Poetry Analysis", classId: 1, status: "Submitted", submittedAt: "Feb 26, 9:05 AM",  grade: null, late: true  },
  { id: 4, student: "Jordan Lee",     task: "Poetry Analysis", classId: 1, status: "Overdue",   submittedAt: null,               grade: null, late: false },
];

const STAFF_CURRENT = STAFF_INIT[0]; // Prof. Sandra Chen

// ─── SHARED COMPONENTS ─────────────────────────────────────────────────────

function Badge({ status }) {
  const s = statusMap[status] || statusMap["Draft"];
  return (
    <span style={{ background: s.bg, color: s.fg, border: `1px solid ${s.border}`, borderRadius: 20, padding: "4px 12px", fontSize: 12, fontWeight: 700, display: "inline-flex", alignItems: "center", gap: 5, whiteSpace: "nowrap" }}>
      <span style={{ fontSize: 9 }}>{s.icon}</span>{s.label}
    </span>
  );
}

function Card({ children, style = {}, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => onClick && setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 18, padding: "22px 26px", boxShadow: hov ? "0 6px 24px rgba(0,0,0,0.08)" : "0 1px 3px rgba(0,0,0,0.04)", transform: hov ? "translateY(-2px)" : "none", transition: "all 0.2s ease", cursor: onClick ? "pointer" : "default", ...style }}>
      {children}
    </div>
  );
}

function Btn({ children, variant = "primary", onClick, style = {}, disabled }) {
  const [hov, setHov] = useState(false);
  const variants = {
    primary:   { background: disabled ? "#A0AEC0" : hov ? "#1A46CC" : T.accent, color: "#fff", border: "none" },
    secondary: { background: hov ? T.borderSoft : T.bg, color: T.text, border: `1px solid ${T.border}` },
    ghost:     { background: "transparent", color: T.accent, border: "none" },
    danger:    { background: hov ? "#FEE2E2" : "transparent", color: "#C0392B", border: "1px solid #FADBD8" },
    success:   { background: hov ? "#14532D" : T.graded.fg, color: "#fff", border: "none" },
    google:    { background: hov ? "#f5f5f5" : "#fff", color: "#3c4043", border: "1px solid #dadce0" },
  };
  return (
    <button onClick={disabled ? undefined : onClick} onMouseEnter={() => !disabled && setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ borderRadius: 12, padding: "10px 20px", fontSize: 14, fontWeight: 600, cursor: disabled ? "not-allowed" : "pointer", fontFamily: "inherit", transition: "all 0.15s", display: "inline-flex", alignItems: "center", gap: 7, opacity: disabled ? 0.6 : 1, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

function FieldInput({ label, as, children, ...props }) {
  const [focused, setFocused] = useState(false);
  const s = { width: "100%", background: T.surface, fontFamily: "inherit", border: `1.5px solid ${focused ? T.accent : T.border}`, borderRadius: 12, padding: "11px 15px", fontSize: 14, color: T.text, outline: "none", transition: "border 0.15s", boxSizing: "border-box" };
  return (
    <div>
      {label && <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 7 }}>{label}</label>}
      {as === "select" ? <select onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={s} {...props}>{children}</select>
       : as === "textarea" ? <textarea onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={{ ...s, resize: "vertical" }} {...props} />
       : <input onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={s} {...props} />}
    </div>
  );
}

function SectionTitle({ children, sub }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: 0, letterSpacing: "-0.02em" }}>{children}</h2>
      {sub && <p style={{ fontSize: 14, color: T.muted, marginTop: 5, margin: 0 }}>{sub}</p>}
    </div>
  );
}

function EmptyState({ icon, text }) {
  return (
    <div style={{ textAlign: "center", padding: "52px 24px", color: T.subtle }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>{icon}</div>
      <div style={{ fontSize: 15 }}>{text}</div>
    </div>
  );
}

function PermissionNote({ text }) {
  return (
    <div style={{ background: T.accentBg, border: `1px solid ${T.accent}30`, borderRadius: 12, padding: "12px 18px", marginBottom: 20, fontSize: 13, color: T.accent, display: "flex", alignItems: "center", gap: 10 }}>
      <span style={{ fontSize: 16 }}>🔒</span> {text}
    </div>
  );
}

function Avatar({ name, size = 36, color = T.accentBg, textColor = T.accent }) {
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: color, border: `2px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", color: textColor, fontWeight: 800, fontSize: size * 0.38, flexShrink: 0 }}>
      {name[0].toUpperCase()}
    </div>
  );
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: "flex", background: T.bg, borderRadius: 14, padding: 4, border: `1px solid ${T.border}`, gap: 3, width: "fit-content", marginBottom: 24 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          background: active === t.id ? T.surface : "transparent",
          color: active === t.id ? T.text : T.muted,
          border: "none", borderRadius: 11, padding: "9px 20px",
          fontSize: 14, fontWeight: active === t.id ? 700 : 500,
          cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
          boxShadow: active === t.id ? "0 1px 6px rgba(0,0,0,0.08)" : "none",
          display: "flex", alignItems: "center", gap: 7,
        }}>
          {t.icon && <span>{t.icon}</span>}
          {t.label}
          {t.count !== undefined && (
            <span style={{ background: active === t.id ? T.accent : T.border, color: active === t.id ? "#fff" : T.muted, borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── TOP BAR ───────────────────────────────────────────────────────────────

function TopBar({ role, setRole, userName, ticketCount, onSignOut }) {
  const [showMenu, setShowMenu] = useState(false);
  
  return (
    <div style={{ height: 66, background: T.surface, borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", padding: "0 28px", gap: 16, position: "sticky", top: 0, zIndex: 100 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: "auto" }}>
        <div style={{ width: 36, height: 36, borderRadius: 11, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 18 }}>C</div>
        <span style={{ fontWeight: 800, fontSize: 17, color: T.text, letterSpacing: "-0.03em" }}>ClassRoom</span>
      </div>
      <div style={{ background: T.bg, borderRadius: 12, padding: "9px 16px", display: "flex", alignItems: "center", gap: 9, border: `1px solid ${T.border}`, width: 230 }}>
        <span style={{ color: T.subtle, fontSize: 14 }}>🔍</span>
        <input placeholder="Search…" style={{ background: "none", border: "none", outline: "none", color: T.text, fontSize: 14, width: "100%", fontFamily: "inherit" }} />
      </div>
      <div style={{ display: "flex", background: T.bg, borderRadius: 12, padding: 3, border: `1px solid ${T.border}` }}>
        {["Student", "Staff", "Admin"].map(r => (
          <button key={r} onClick={() => setRole(r)} style={{ background: role === r ? T.surface : "transparent", color: role === r ? T.text : T.muted, border: "none", borderRadius: 9, padding: "7px 16px", fontSize: 13, fontWeight: role === r ? 700 : 400, cursor: "pointer", fontFamily: "inherit", boxShadow: role === r ? "0 1px 6px rgba(0,0,0,0.09)" : "none", transition: "all 0.15s" }}>{r}</button>
        ))}
      </div>
      <button style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 11, width: 40, height: 40, cursor: "pointer", fontSize: 16, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
        🔔
        {ticketCount > 0 && role === "Admin" && <span style={{ position: "absolute", top: 7, right: 7, width: 8, height: 8, background: "#E53E3E", borderRadius: "50%", border: `2px solid ${T.surface}` }} />}
      </button>
      <div style={{ position: "relative" }}>
        <div onClick={() => setShowMenu(!showMenu)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <Avatar name={userName} size={38} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.text, lineHeight: 1.3 }}>{userName.split(" ")[0]}</div>
            <div style={{ fontSize: 11, color: T.muted }}>{role}</div>
          </div>
        </div>
        {showMenu && (
          <>
            <div onClick={() => setShowMenu(false)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 150 }} />
            <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 8, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.12)", minWidth: 180, zIndex: 151 }}>
              <button onClick={() => { setShowMenu(false); onSignOut(); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500, color: T.text, fontFamily: "inherit", textAlign: "left", borderRadius: 12 }}>🚪 Sign Out</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── SIDEBAR ───────────────────────────────────────────────────────────────

function Sidebar({ role, active, setActive, ticketBadge }) {
  const navMap = {
    Student: [
      { label: "Dashboard",     icon: <Icon.LayoutGrid /> },
      { label: "My Tasks",      icon: <Icon.Check /> },
      { label: "Announcements", icon: <Icon.Megaphone /> },
      { label: "Knowledge",     icon: <Icon.Book /> },
    ],
    Staff: [
      { label: "Dashboard",     icon: <Icon.LayoutGrid /> },
      { label: "My Classes",    icon: <Icon.School /> },
      { label: "Submissions",   icon: <Icon.Inbox /> },
      { label: "Announcements", icon: <Icon.Megaphone /> },
      { label: "Knowledge",     icon: <Icon.Book /> },
      { label: "Send Ticket",   icon: <Icon.Ticket /> },
    ],
    Admin: [
      { label: "Dashboard",     icon: <Icon.LayoutGrid /> },
      { label: "Users",         icon: <Icon.Users /> },
      { label: "Classes",       icon: <Icon.Building /> },
      { label: "Assign Tasks",  icon: <Icon.Clipboard /> },
      { label: "Announcements", icon: <Icon.Megaphone /> },
      { label: "Tickets",       icon: <Icon.Ticket />, badge: ticketBadge },
      { label: "Reports",       icon: <Icon.BarChart /> },
    ],
  };
  return (
    <div style={{ width: 232, background: T.surface, borderRight: `1px solid ${T.border}`, padding: "22px 14px", display: "flex", flexDirection: "column", gap: 4 }}>
      {navMap[role].map(({ label, icon, badge }) => {
        const on = active === label;
        return (
          <button key={label} onClick={() => setActive(label)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 15px", borderRadius: 13, background: on ? T.accentBg : "transparent", border: "none", cursor: "pointer", color: on ? T.accent : T.muted, fontSize: 14, fontWeight: on ? 700 : 500, fontFamily: "inherit", textAlign: "left", width: "100%", transition: "all 0.15s" }}>
            <span style={{ display: "flex", alignItems: "center", opacity: on ? 1 : 0.7 }}>{icon}</span>
            <span style={{ flex: 1 }}>{label}</span>
            {badge > 0 && <span style={{ background: "#E53E3E", color: "#fff", borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{badge}</span>}
          </button>
        );
      })}
    </div>
  );
}

// ─── GOOGLE SIGN-IN LANDING (Student) ──────────────────────────────────────

function GoogleSignIn({ onSignIn }) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Load Google API scripts
    const script1 = document.createElement('script');
    script1.src = 'https://apis.google.com/js/api.js';
    script1.async = true;
    script1.defer = true;
    script1.onload = () => gapiInit();
    document.body.appendChild(script1);

    const script2 = document.createElement('script');
    script2.src = 'https://accounts.google.com/gsi/client';
    script2.async = true;
    script2.defer = true;
    script2.onload = () => gisInit();
    document.body.appendChild(script2);

    return () => {
      document.body.removeChild(script1);
      document.body.removeChild(script2);
    };
  }, []);

  async function handleSignIn() {
    setLoading(true);
    setError("");

    // Check if APIs are initialized
    if (!gapiInited || !gisInited) {
      setError("Google APIs not loaded yet. Please try again.");
      setLoading(false);
      return;
    }

    try {
      // Request authorization and get access token
      tokenClient.callback = async (response) => {
        if (response.error) {
          setError("Authorization failed. Please try again.");
          setLoading(false);
          return;
        }

        accessToken = response.access_token;

        // Get user info
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        const userInfo = await userInfoResponse.json();

        setDone(true);
        setTimeout(() => {
          onSignIn(userInfo); // Pass user info to parent
        }, 1200);
      };

      // Trigger the authorization flow
      tokenClient.requestAccessToken({ prompt: 'consent' });
    } catch (err) {
      setError("Sign-in failed. Please try again.");
      setLoading(false);
      console.error("Sign-in error:", err);
    }
  }

  return (
    <div style={{ width: "100vw", height: "100vh", background: T.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", fontFamily: "'Nunito', sans-serif", padding: "40px 20px" }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap'); * { box-sizing: border-box; margin: 0; padding: 0; }`}</style>
      <div style={{ width: "100%", maxWidth: "500px", textAlign: "center" }}>
        <div style={{ width: 80, height: 80, borderRadius: 20, background: T.accent, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800, fontSize: 36, margin: "0 auto 30px" }}>C</div>
        <div style={{ fontSize: 32, fontWeight: 800, color: T.text, marginBottom: 12, letterSpacing: "-0.02em" }}>Welcome to ClassRoom</div>
        <div style={{ fontSize: 16, color: T.muted, marginBottom: 48, lineHeight: 1.6 }}>Sign in with your school Google account to access your classes, tasks, and grades.</div>

        {error && (
          <div style={{ background: T.overdue.bg, border: `1px solid ${T.overdue.border}`, borderRadius: 16, padding: "18px 24px", fontSize: 15, color: T.overdue.fg, marginBottom: 24, lineHeight: 1.6 }}>
            {error}
          </div>
        )}

        {done ? (
          <div style={{ background: T.graded.bg, border: `1px solid ${T.graded.border}`, borderRadius: 16, padding: "20px 28px", fontSize: 17, color: T.graded.fg, fontWeight: 700 }}>
            ✓ Signed in! Setting up your account…
          </div>
        ) : (
          <Btn variant="google" onClick={handleSignIn} disabled={loading} style={{ width: "100%", justifyContent: "center", padding: "16px 32px", fontSize: 17, borderRadius: 16 }}>
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 18, height: 18, border: "2px solid #dadce0", borderTopColor: T.accent, borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                Signing in…
              </span>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Continue with Google
              </>
            )}
          </Btn>
        )}

        <div style={{ marginTop: 36, padding: "20px 24px", background: T.accentBg, borderRadius: 16, fontSize: 15, color: T.accent, lineHeight: 1.7 }}>
          <strong>New students:</strong> After signing in, an admin will assign you to your class. You'll receive a notification once you're enrolled.
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// ─── STUDENT VIEWS ─────────────────────────────────────────────────────────

function StudentDashboard({ tasks, announcements }) {
  const overdue  = tasks.filter(t => t.status === "Overdue");
  const upcoming = tasks.filter(t => ["Due Soon", "Published"].includes(t.status));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, width: "100%" }}>
      <div style={{ background: T.accent, borderRadius: 22, padding: "30px 34px", color: "#fff" }}>
        <div style={{ fontSize: 13, opacity: 0.65, marginBottom: 5 }}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>Good morning, Alex 👋</div>
        <div style={{ opacity: 0.78, marginTop: 8, fontSize: 15 }}>You have <strong>{overdue.length} overdue</strong> and <strong>{upcoming.length} upcoming</strong> tasks.</div>
      </div>
      {overdue.length > 0 && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: T.overdue.fg }}>⚠ Overdue</span>
            <span style={{ background: T.overdue.bg, color: T.overdue.fg, border: `1px solid ${T.overdue.border}`, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>{overdue.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{overdue.map(t => <TaskRow key={t.id} task={t} />)}</div>
        </div>
      )}
      <div>
        <SectionTitle>Upcoming Tasks</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{upcoming.length ? upcoming.map(t => <TaskRow key={t.id} task={t} />) : <EmptyState icon={<Icon.CheckCircle />} text="You're all caught up!" />}</div>
      </div>
      <div>
        <SectionTitle>Recent Announcements</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{announcements.slice(0, 3).map(a => <AnnouncementCard key={a.id} a={a} />)}</div>
      </div>
    </div>
  );
}

function TaskRow({ task }) {
  const isOverdue = task.status === "Overdue";
  return (
    <Card style={{ borderColor: isOverdue ? T.overdue.border : T.border, background: isOverdue ? T.overdue.bg : T.surface, padding: "18px 24px" }} onClick={() => {}}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 5 }}>{task.title}</div>
          <div style={{ display: "flex", gap: 18, fontSize: 13, color: T.muted }}><span>📘 {task.class}</span><span>📅 Due {task.due}</span></div>
        </div>
        <Badge status={task.status} />
        <Btn variant={isOverdue ? "danger" : "secondary"} style={{ padding: "8px 18px", fontSize: 13 }}>View →</Btn>
      </div>
      {task.status === "Graded" && task.grade && (
        <div style={{ marginTop: 18, paddingTop: 18, borderTop: `1px solid ${T.border}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 14 }}>
            <div style={{ background: T.graded.bg, border: `1px solid ${T.graded.border}`, borderRadius: 14, padding: "12px 22px" }}>
              <div style={{ fontSize: 11, color: T.graded.fg, fontWeight: 700, marginBottom: 2, letterSpacing: "0.06em" }}>YOUR GRADE</div>
              <div style={{ fontSize: 30, fontWeight: 800, color: T.graded.fg, lineHeight: 1 }}>{task.grade.score}<span style={{ fontSize: 14, opacity: 0.55 }}>/{task.grade.total}</span></div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, marginBottom: 5, letterSpacing: "0.06em" }}>TEACHER FEEDBACK</div>
              <div style={{ fontSize: 14, color: T.text, lineHeight: 1.65 }}>{task.grade.feedback}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {task.grade.rubric.map((r, i) => (
              <div key={i} style={{ flex: 1, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 16px" }}>
                <div style={{ fontSize: 11, color: T.muted, marginBottom: 5, fontWeight: 600 }}>{r.label}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: T.text, marginBottom: 8 }}>{r.score}<span style={{ fontSize: 12, color: T.subtle }}>/{r.total}</span></div>
                <div style={{ height: 5, background: T.border, borderRadius: 5 }}><div style={{ width: `${(r.score / r.total) * 100}%`, height: "100%", background: T.graded.fg, borderRadius: 5 }} /></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}

function AnnouncementCard({ a }) {
  const [open, setOpen] = useState(false);
  return (
    <Card>
      <div onClick={() => setOpen(!open)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 13, background: T.accentBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>📢</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{a.title}</div>
          <div style={{ fontSize: 12, color: T.muted, marginTop: 4, display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ background: a.classId === null ? T.accentBg : T.bg, color: a.classId === null ? T.accent : T.muted, border: `1px solid ${a.classId === null ? T.accent + "30" : T.border}`, borderRadius: 7, padding: "2px 9px", fontWeight: 700, fontSize: 11 }}>{a.className}</span>
            <span>by {a.authorName}</span><span>· {a.date}</span>
          </div>
        </div>
        <span style={{ color: T.subtle, fontSize: 13, display: "block", transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
      </div>
      {open && <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.borderSoft}`, fontSize: 14, color: T.muted, lineHeight: 1.7 }}>{a.content}</div>}
    </Card>
  );
}

function StudentTasks({ tasks }) {
  const filters = ["All", "Due Soon", "Overdue", "Submitted", "Graded"];
  const [filter, setFilter] = useState("All");
  const filtered = filter === "All" ? tasks : tasks.filter(t => t.status === filter);
  return (
    <div style={{ width: "100%" }}>
      <SectionTitle sub="Click any task to open it and submit your work.">My Tasks</SectionTitle>
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={{ background: filter === f ? T.accent : T.surface, color: filter === f ? "#fff" : T.muted, border: `1.5px solid ${filter === f ? T.accent : T.border}`, borderRadius: 22, padding: "8px 20px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s" }}>{f}</button>
        ))}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.map(t => <TaskRow key={t.id} task={t} />)}
        {!filtered.length && <EmptyState icon={<Icon.PartyPopper />} text="Nothing here!" />}
      </div>
    </div>
  );
}

// ─── ADMIN USERS PAGE (tabbed: Students / Staff) ────────────────────────────

function AdminUsers({ students, setStudents, classes, staff }) {
  const [tab, setTab] = useState("students");
  const unassigned = students.filter(s => s.classIds.length === 0);

  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
        <SectionTitle sub="Manage all students and staff members in one place." />
      </div>

      <Tabs
        active={tab}
        onChange={setTab}
        tabs={[
          { id: "students", label: "Students", icon: <Icon.GraduationCap />, count: students.length },
          { id: "staff",    label: "Staff",    icon: <Icon.UserCheck />, count: staff.length },
        ]}
      />

      {tab === "students" && (
        <StudentsTab students={students} setStudents={setStudents} classes={classes} unassignedCount={unassigned.length} />
      )}
      {tab === "staff" && (
        <StaffTab classes={classes} staff={staff} />
      )}
    </div>
  );
}

// ── STUDENTS TAB ─────────────────────────────────────────────────────────────

function StudentsTab({ students, setStudents, classes, unassignedCount }) {
  const [search, setSearch]       = useState("");
  const [filter, setFilter]       = useState("all");   // all | unassigned | assigned
  const [selected, setSelected]   = useState([]);       // ids of checked students
  const [massClass, setMassClass] = useState("");
  const [toast, setToast]         = useState("");
  const [addOpen, setAddOpen]     = useState(false);

  const filtered = students.filter(s => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" ? true : filter === "unassigned" ? s.classIds.length === 0 : s.classIds.length > 0;
    return matchSearch && matchFilter;
  });

  function toggleSelect(id) {
    setSelected(sel => sel.includes(id) ? sel.filter(x => x !== id) : [...sel, id]);
  }
  function toggleAll() {
    if (selected.length === filtered.length) setSelected([]);
    else setSelected(filtered.map(s => s.id));
  }

  function handleMassAssign() {
    if (!massClass || selected.length === 0) return;
    const cid = parseInt(massClass);
    setStudents(prev => prev.map(s => selected.includes(s.id) && !s.classIds.includes(cid)
      ? { ...s, classIds: [...s.classIds, cid] }
      : s
    ));
    const cls = classes.find(c => c.id === cid);
    setToast(`✓ ${selected.length} student(s) assigned to ${cls?.name}`);
    setSelected([]);
    setMassClass("");
    setTimeout(() => setToast(""), 3500);
  }

  return (
    <div>
      {toast && (
        <div style={{ background: T.graded.bg, border: `1px solid ${T.graded.border}`, borderRadius: 12, padding: "12px 20px", marginBottom: 16, fontSize: 14, color: T.graded.fg, fontWeight: 700, display: "flex", alignItems: "center", gap: 10 }}>
          {toast}
        </div>
      )}

      {/* Unassigned alert */}
      {unassignedCount > 0 && (
        <div onClick={() => setFilter("unassigned")} style={{ background: T.dueSoon.bg, border: `1px solid ${T.dueSoon.border}`, borderRadius: 14, padding: "14px 20px", marginBottom: 18, display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}>
          <span style={{ fontSize: 22 }}>👤</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.dueSoon.fg }}>{unassignedCount} student{unassignedCount > 1 ? "s" : ""} not yet assigned to a class</div>
            <div style={{ fontSize: 13, color: T.muted, marginTop: 2 }}>These students signed up but haven't been placed. Click to filter and assign them.</div>
          </div>
          <span style={{ fontSize: 13, color: T.dueSoon.fg, fontWeight: 700 }}>Filter →</span>
        </div>
      )}

      {/* Controls row */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 200, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "9px 14px", display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ color: T.subtle }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search students…" style={{ background: "none", border: "none", outline: "none", fontSize: 14, color: T.text, fontFamily: "inherit", width: "100%" }} />
        </div>

        {/* Filter pills */}
        <div style={{ display: "flex", gap: 6 }}>
          {[
            { id: "all",        label: "All" },
            { id: "unassigned", label: `No Class (${unassignedCount})`, warn: unassignedCount > 0 },
            { id: "assigned",   label: "Assigned" },
          ].map(f => (
            <button key={f.id} onClick={() => setFilter(f.id)} style={{
              background: filter === f.id ? (f.warn ? T.dueSoon.fg : T.accent) : T.surface,
              color: filter === f.id ? "#fff" : f.warn ? T.dueSoon.fg : T.muted,
              border: `1.5px solid ${filter === f.id ? (f.warn ? T.dueSoon.fg : T.accent) : f.warn ? T.dueSoon.border : T.border}`,
              borderRadius: 22, padding: "7px 16px", fontSize: 13, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit", transition: "all 0.15s",
            }}>{f.label}</button>
          ))}
        </div>

        <Btn onClick={() => setAddOpen(true)} style={{ padding: "9px 18px", fontSize: 13 }}>+ Add Student</Btn>
      </div>

      {/* Mass assign toolbar — shows when rows selected */}
      {selected.length > 0 && (
        <div style={{ background: T.accentBg, border: `1px solid ${T.accent}30`, borderRadius: 14, padding: "12px 18px", marginBottom: 14, display: "flex", alignItems: "center", gap: 14 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: T.accent }}>{selected.length} selected</span>
          <select value={massClass} onChange={e => setMassClass(e.target.value)} style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 10, padding: "8px 14px", fontSize: 13, color: T.text, fontFamily: "inherit", outline: "none" }}>
            <option value="">Assign to class…</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <Btn onClick={handleMassAssign} disabled={!massClass} style={{ padding: "8px 18px", fontSize: 13 }}>Assign Now</Btn>
          <Btn variant="ghost" onClick={() => setSelected([])} style={{ fontSize: 13, padding: "8px 14px" }}>Clear</Btn>
        </div>
      )}

      {/* Table */}
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {filtered.length === 0 ? <EmptyState icon={<Icon.Search />} text="No students match your search." /> : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}`, background: T.bg }}>
                <th style={{ padding: "13px 18px", width: 40 }}>
                  <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} style={{ width: 16, height: 16, accentColor: T.accent, cursor: "pointer" }} />
                </th>
                {["Student", "Email", "Joined Via", "Classes", "Status", "Joined", ""].map(h => (
                  <th key={h} style={{ padding: "13px 18px", color: T.muted, fontSize: 12, fontWeight: 700, textAlign: "left", letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => {
                const isSelected = selected.includes(s.id);
                const classNames = classes.filter(c => s.classIds.includes(c.id)).map(c => c.name);
                const isUnassigned = s.classIds.length === 0;
                return (
                  <tr key={s.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${T.borderSoft}` : "none", background: isSelected ? T.accentBg : "transparent", transition: "background 0.15s" }}>
                    <td style={{ padding: "14px 18px" }}>
                      <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(s.id)} style={{ width: 16, height: 16, accentColor: T.accent, cursor: "pointer" }} />
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Avatar name={s.name} size={34} />
                        <span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{s.name}</span>
                      </div>
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: 13, color: T.muted }}>{s.email}</td>
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#fff", border: "1px solid #dadce0", borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 600, color: "#3c4043" }}>
                        <svg width="12" height="12" viewBox="0 0 24 24" style={{ flexShrink: 0 }}><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                        Google
                      </span>
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      {isUnassigned ? (
                        <span style={{ background: T.dueSoon.bg, color: T.dueSoon.fg, border: `1px solid ${T.dueSoon.border}`, borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>No class yet</span>
                      ) : (
                        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                          {classNames.map(cn => (
                            <span key={cn} style={{ background: T.accentBg, color: T.accent, borderRadius: 8, padding: "3px 9px", fontSize: 12, fontWeight: 600 }}>{cn}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "14px 18px" }}>
                      <span style={{ color: s.status === "Active" ? T.graded.fg : T.subtle, fontSize: 13, fontWeight: 600 }}>{s.status === "Active" ? "● Active" : "○ Inactive"}</span>
                    </td>
                    <td style={{ padding: "14px 18px", fontSize: 12, color: T.subtle }}>{s.joinDate}</td>
                    <td style={{ padding: "14px 18px" }}>
                      <div style={{ display: "flex", gap: 6 }}>
                        <Btn variant="secondary" style={{ padding: "5px 12px", fontSize: 12 }}>Edit</Btn>
                        <Btn variant="danger" style={{ padding: "5px 12px", fontSize: 12 }}>Remove</Btn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>

      {/* Add Student modal */}
      {addOpen && (
        <>
          <div onClick={() => setAddOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(26,24,20,0.18)", zIndex: 200 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 420, background: T.surface, borderRadius: 22, padding: 30, zIndex: 201, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>Add Student Manually</div>
              <button onClick={() => setAddOpen(false)} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontSize: 16 }}>✕</button>
            </div>
            <div style={{ background: T.accentBg, borderRadius: 12, padding: "11px 16px", fontSize: 13, color: T.accent }}>
              💡 Most students join automatically via Google Sign-In. Use this form only for manual additions.
            </div>
            <FieldInput label="Full Name" placeholder="e.g. John Smith" />
            <FieldInput label="Email" type="email" placeholder="student@gmail.com" />
            <FieldInput label="Assign to Class (optional)" as="select">
              <option value="">No class yet</option>
              {classes.map(c => <option key={c.id}>{c.name}</option>)}
            </FieldInput>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setAddOpen(false)}>Cancel</Btn>
              <Btn style={{ flex: 1, justifyContent: "center" }} onClick={() => setAddOpen(false)}>Add Student</Btn>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── STAFF TAB ─────────────────────────────────────────────────────────────────

function StaffTab({ classes, staff }) {
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const filtered = staff.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <div style={{ flex: 1, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: "9px 14px", display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ color: T.subtle }}>🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff members…" style={{ background: "none", border: "none", outline: "none", fontSize: 14, color: T.text, fontFamily: "inherit", width: "100%" }} />
        </div>
        <Btn onClick={() => setAddOpen(true)} style={{ padding: "9px 18px", fontSize: 13 }}>+ Add Staff</Btn>
      </div>

      <Card style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}`, background: T.bg }}>
              {["Staff Member", "Email", "Assigned Classes", "Students", "Status", "Since", ""].map(h => (
                <th key={h} style={{ padding: "13px 20px", color: T.muted, fontSize: 12, fontWeight: 700, textAlign: "left", letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => {
              const assignedClasses = classes.filter(c => s.classIds.includes(c.id));
              const totalStudents = assignedClasses.reduce((sum, c) => sum + c.students, 0);
              const hasClass = s.classIds.length > 0;
              return (
                <tr key={s.id} style={{ borderBottom: i < filtered.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}>
                  <td style={{ padding: "15px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                      <Avatar name={s.name} size={36} color={T.purple.bg} textColor={T.purple.fg} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: T.subtle, marginTop: 2 }}>Staff</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "15px 20px", fontSize: 13, color: T.muted }}>{s.email}</td>
                  <td style={{ padding: "15px 20px" }}>
                    {!hasClass ? (
                      <span style={{ background: T.draft.bg, color: T.draft.fg, border: `1px solid ${T.draft.border}`, borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>No class assigned</span>
                    ) : (
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                        {assignedClasses.map(c => (
                          <span key={c.id} style={{ background: T.purple.bg, color: T.purple.fg, border: `1px solid ${T.purple.border}`, borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 600 }}>{c.name}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "15px 20px", fontSize: 14, fontWeight: 700, color: T.text }}>{totalStudents || "—"}</td>
                  <td style={{ padding: "15px 20px" }}>
                    <span style={{ color: s.status === "Active" ? T.graded.fg : T.subtle, fontSize: 13, fontWeight: 600 }}>{s.status === "Active" ? "● Active" : "○ Inactive"}</span>
                  </td>
                  <td style={{ padding: "15px 20px", fontSize: 12, color: T.subtle }}>{s.joinDate}</td>
                  <td style={{ padding: "15px 20px" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Btn variant="secondary" style={{ padding: "5px 12px", fontSize: 12 }}>Edit</Btn>
                      <Btn variant="danger" style={{ padding: "5px 12px", fontSize: 12 }}>Remove</Btn>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {addOpen && (
        <>
          <div onClick={() => setAddOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(26,24,20,0.18)", zIndex: 200 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 420, background: T.surface, borderRadius: 22, padding: 30, zIndex: 201, boxShadow: "0 20px 60px rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", gap: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>Add Staff Member</div>
              <button onClick={() => setAddOpen(false)} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, width: 34, height: 34, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: T.muted, fontSize: 16 }}>✕</button>
            </div>
            <FieldInput label="Full Name" placeholder="e.g. Prof. Sarah Lee" />
            <FieldInput label="Email" type="email" placeholder="teacher@school.edu" />
            <FieldInput label="Assign to Class (optional)" as="select">
              <option value="">No class yet</option>
              {classes.map(c => <option key={c.id}>{c.name}</option>)}
            </FieldInput>
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setAddOpen(false)}>Cancel</Btn>
              <Btn style={{ flex: 1, justifyContent: "center" }} onClick={() => setAddOpen(false)}>Add Staff</Btn>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── STAFF VIEWS ───────────────────────────────────────────────────────────

function StaffDashboard({ submissions, setActive, classes, user }) {
  const myClasses = classes.filter(c => user.classIds.includes(c.id));
  const needsGrading = submissions.filter(s => s.status === "Submitted" && user.classIds.includes(s.classId)).length;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, width: "100%" }}>
      <div style={{ background: T.accent, borderRadius: 22, padding: "26px 30px", color: "#fff" }}>
        <div style={{ fontSize: 13, opacity: 0.65, marginBottom: 5 }}>{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
        <div style={{ fontSize: 24, fontWeight: 800 }}>Welcome back, {user.name.split(" ")[1]} 👋</div>
        <div style={{ opacity: 0.78, marginTop: 6, fontSize: 14 }}>You're teaching {myClasses.map(c => c.name).join(" & ")}.</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        {[
          { label: "My Classes",    value: myClasses.length, icon: <Icon.School />, col: { fg: T.accent, bg: T.accentBg } },
          { label: "Needs Grading", value: needsGrading,     icon: <Icon.FileEdit />, col: T.dueSoon },
          { label: "Total Students",value: myClasses.reduce((s, c) => s + c.students, 0), icon: <Icon.Users />, col: T.graded },
        ].map(s => (
          <Card key={s.label} style={{ padding: "24px 28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 15, background: s.col.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22 }}><span style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>{s.icon}</span></div>
              <div>
                <div style={{ fontSize: 32, fontWeight: 800, color: s.col.fg, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 13, color: T.muted, marginTop: 4 }}>{s.label}</div>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <Btn onClick={() => setActive("Announcements")}>+ New Announcement</Btn>
        <Btn variant="secondary" onClick={() => setActive("Send Ticket")}>🎫 Send Ticket to Admin</Btn>
      </div>
      <div>
        <SectionTitle sub="Submissions waiting to be graded.">Needs Grading</SectionTitle>
        <SubmissionsTable submissions={submissions.filter(s => s.status === "Submitted" && user.classIds.includes(s.classId))} />
      </div>
    </div>
  );
}

function StaffMyClasses({ classes, user }) {
  const myClasses = classes.filter(c => user.classIds.includes(c.id));
  return (
    <div style={{ width: "100%" }}>
      <PermissionNote text="You can only see and manage classes that have been assigned to you by the admin." />
      <SectionTitle sub="Classes you are currently teaching.">My Classes</SectionTitle>
      {myClasses.length === 0 ? <EmptyState icon={<Icon.School />} text="No classes assigned yet. Contact your admin." /> : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: 16 }}>
          {myClasses.map(c => (
            <Card key={c.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: T.text, marginBottom: 4 }}>{c.name}</div>
                  <div style={{ fontSize: 13, color: T.muted }}>Assigned by admin</div>
                </div>
                <span style={{ background: T.graded.bg, color: T.graded.fg, border: `1px solid ${T.graded.border}`, borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700 }}>Active</span>
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                {[{ val: c.students, label: "Students", col: T.accent }, { val: c.tasks, label: "Tasks", col: T.dueSoon.fg }].map(s => (
                  <div key={s.label} style={{ flex: 1, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 14, padding: "14px 18px", textAlign: "center" }}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: s.col }}>{s.val}</div>
                    <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${T.borderSoft}`, display: "flex", gap: 8 }}>
                <Btn variant="secondary" style={{ fontSize: 13, padding: "7px 14px" }}>View Students</Btn>
                <Btn variant="secondary" style={{ fontSize: 13, padding: "7px 14px" }}>View Tasks</Btn>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function SubmissionsTable({ submissions }) {
  const [grading, setGrading] = useState(null);
  const [grade, setGrade] = useState("");
  const [feedback, setFeedback] = useState("");
  return (
    <div style={{ position: "relative" }}>
      <Card style={{ padding: 0, overflow: "hidden" }}>
        {submissions.length === 0 ? <EmptyState icon={<Icon.PartyPopper />} text="No submissions to grade right now." /> : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${T.border}`, background: T.bg }}>
                {["Student", "Task", "Status", "Submitted At", "Late?", "Grade", "Action"].map(h => (
                  <th key={h} style={{ padding: "13px 20px", color: T.muted, fontSize: 12, fontWeight: 700, textAlign: "left", letterSpacing: "0.05em", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {submissions.map((s, i) => (
                <tr key={s.id} style={{ borderBottom: i < submissions.length - 1 ? `1px solid ${T.borderSoft}` : "none" }}>
                  <td style={{ padding: "15px 20px" }}><div style={{ display: "flex", alignItems: "center", gap: 10 }}><Avatar name={s.student} size={34} /><span style={{ fontSize: 14, fontWeight: 600, color: T.text }}>{s.student}</span></div></td>
                  <td style={{ padding: "15px 20px", fontSize: 13, color: T.muted }}>{s.task}</td>
                  <td style={{ padding: "15px 20px" }}><Badge status={s.status} /></td>
                  <td style={{ padding: "15px 20px", fontSize: 13, color: T.muted }}>{s.submittedAt || "—"}</td>
                  <td style={{ padding: "15px 20px" }}>{s.late ? <span style={{ background: T.overdue.bg, color: T.overdue.fg, border: `1px solid ${T.overdue.border}`, borderRadius: 8, padding: "3px 10px", fontSize: 12, fontWeight: 700 }}>Late</span> : <span style={{ color: T.graded.fg, fontSize: 13, fontWeight: 600 }}>On time</span>}</td>
                  <td style={{ padding: "15px 20px", fontSize: 15, fontWeight: 800, color: s.grade ? T.graded.fg : T.subtle }}>{s.grade ? `${s.grade}/100` : "—"}</td>
                  <td style={{ padding: "15px 20px" }}>
                    {s.status === "Submitted" && <Btn onClick={() => { setGrading(s); setGrade(""); setFeedback(""); }} style={{ padding: "8px 18px", fontSize: 13 }}>Grade</Btn>}
                    {s.status === "Graded" && <span style={{ color: T.subtle, fontSize: 13 }}>Returned ✓</span>}
                    {s.status === "Overdue" && <span style={{ color: T.overdue.fg, fontSize: 13 }}>Missing</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
      {grading && (
        <>
          <div onClick={() => setGrading(null)} style={{ position: "fixed", inset: 0, background: "rgba(26,24,20,0.18)", zIndex: 200 }} />
          <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 450, background: T.surface, borderLeft: `1px solid ${T.border}`, padding: 30, zIndex: 201, overflowY: "auto", boxShadow: "-12px 0 50px rgba(0,0,0,0.10)", display: "flex", flexDirection: "column", gap: 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: T.text }}>Grade Submission</div>
              <button onClick={() => setGrading(null)} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, width: 36, height: 36, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: T.muted }}>✕</button>
            </div>
            <Card style={{ background: T.bg, padding: "16px 20px" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 4 }}>{grading.student}</div>
              <div style={{ fontSize: 13, color: T.muted }}>{grading.task}</div>
              <div style={{ fontSize: 12, color: T.subtle, marginTop: 6 }}>📅 {grading.submittedAt}</div>
              {grading.late && <div style={{ marginTop: 10, background: T.overdue.bg, color: T.overdue.fg, border: `1px solid ${T.overdue.border}`, borderRadius: 10, padding: "7px 14px", fontSize: 13, fontWeight: 600 }}>⚠ Late submission</div>}
            </Card>
            <div style={{ background: T.bg, border: `1.5px dashed ${T.border}`, borderRadius: 16, padding: "40px 24px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>📄</div>
              <div style={{ color: T.muted, fontSize: 14, marginBottom: 14 }}>Student's files appear here</div>
              <Btn variant="secondary" style={{ fontSize: 13 }}>Preview Submission</Btn>
            </div>
            <FieldInput label="Grade (out of 100)" type="number" value={grade} onChange={e => setGrade(e.target.value)} placeholder="e.g. 88" />
            <FieldInput label="Feedback for student" as="textarea" rows={5} value={feedback} onChange={e => setFeedback(e.target.value)} placeholder="Write helpful feedback here…" />
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="secondary" style={{ flex: 1, justifyContent: "center" }}>Save Draft</Btn>
              <Btn variant="success" style={{ flex: 1, justifyContent: "center" }}>Return to Student ✓</Btn>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SendTicket({ tickets, setTickets }) {
  const [form, setForm] = useState({ subject: "", category: "", message: "" });
  const [sent, setSent] = useState(false);
  const myTickets = tickets.filter(t => t.staffId === STAFF_CURRENT.id);
  function handleSubmit() {
    if (!form.subject || !form.message) return;
    setTickets([{ id: tickets.length + 1, subject: form.subject, staffId: STAFF_CURRENT.id, staffName: STAFF_CURRENT.name, category: form.category || "General", date: "Today", status: "Open", message: form.message, adminReply: "" }, ...tickets]);
    setForm({ subject: "", category: "", message: "" });
    setSent(true); setTimeout(() => setSent(false), 3000);
  }
  return (
    <div>
      <SectionTitle sub="Send a request or message directly to the admin team.">Send a Ticket</SectionTitle>
      {sent && <div style={{ background: T.graded.bg, border: `1px solid ${T.graded.border}`, borderRadius: 12, padding: "12px 20px", marginBottom: 20, fontSize: 14, color: T.graded.fg, fontWeight: 600 }}>✓ Ticket sent! Admin will respond soon.</div>}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <Card>
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            <FieldInput label="Subject" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Request for substitute teacher" />
            <FieldInput label="Category" as="select" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
              <option value="">Select a category…</option>
              {["Equipment", "Staffing", "Schedule", "Resources", "Other"].map(o => <option key={o}>{o}</option>)}
            </FieldInput>
            <FieldInput label="Your Message" as="textarea" rows={6} value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Describe your request in detail…" />
            <Btn onClick={handleSubmit} disabled={!form.subject || !form.message}>Send Ticket →</Btn>
          </div>
        </Card>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 14 }}>My Previous Tickets</div>
          {myTickets.length === 0 ? <EmptyState icon={<Icon.Ticket />} text="No tickets sent yet." /> : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {myTickets.map(t => (
                <Card key={t.id} style={{ padding: "16px 20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{t.subject}</div><Badge status={t.status} /></div>
                  <div style={{ fontSize: 12, color: T.muted, marginBottom: 8, display: "flex", gap: 10 }}><span style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: "2px 8px" }}>{t.category}</span><span>{t.date}</span></div>
                  <div style={{ fontSize: 13, color: T.muted, lineHeight: 1.6 }}>{t.message}</div>
                  {t.adminReply && <div style={{ background: T.accentBg, border: `1px solid ${T.accent}30`, borderRadius: 10, padding: "10px 14px", marginTop: 10 }}><div style={{ fontSize: 11, color: T.accent, fontWeight: 700, marginBottom: 4 }}>ADMIN REPLY</div><div style={{ fontSize: 13, color: T.text }}>{t.adminReply}</div></div>}
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StaffAnnouncements({ announcements, setAnnouncements, role, classes, user }) {
  const isAdmin = role === "Admin";
  const myClasses = isAdmin ? classes : classes.filter(c => user?.classIds?.includes(c.id));
  const [form, setForm] = useState({ title: "", classId: "", content: "" });
  const [posted, setPosted] = useState(false);
  const myAnnouncements = isAdmin ? announcements : announcements.filter(a => a.classId !== null && user?.classIds?.includes(a.classId));

  function handlePost() {
    if (!form.title || !form.content) return;
    const cls = isAdmin && !form.classId ? null : classes.find(c => c.id === parseInt(form.classId));
    setAnnouncements([{ id: announcements.length + 1, title: form.title, classId: cls ? cls.id : null, className: cls ? cls.name : "All Classes", authorName: user?.name || "Staff", role: isAdmin ? "Admin" : "Staff", date: "Today", content: form.content }, ...announcements]);
    setForm({ title: "", classId: "", content: "" });
    setPosted(true); setTimeout(() => setPosted(false), 3000);
  }

  return (
    <div style={{ width: "100%" }}>
      {!isAdmin && <PermissionNote text="You can only post announcements to your assigned classes." />}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: 24 }}>
        <div>
          <SectionTitle sub={isAdmin ? "Post to any class or school-wide." : "Post to your assigned classes."}>New Announcement</SectionTitle>
          {posted && <div style={{ background: T.graded.bg, border: `1px solid ${T.graded.border}`, borderRadius: 12, padding: "12px 20px", marginBottom: 16, fontSize: 14, color: T.graded.fg, fontWeight: 600 }}>✓ Posted! Students can see it now.</div>}
          <Card>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <FieldInput label="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Reminder: Essay due Friday" />
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 7 }}>Post to Class</label>
                <select value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value }))} style={{ width: "100%", background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 12, padding: "11px 15px", fontSize: 14, color: T.text, fontFamily: "inherit", outline: "none" }}>
                  {isAdmin && <option value="">📣 All Classes (School-wide)</option>}
                  {!isAdmin && <option value="">Select a class…</option>}
                  {myClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <FieldInput label="Content" as="textarea" rows={5} value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Write your announcement…" />
              <Btn onClick={handlePost} disabled={!form.title || !form.content || (!isAdmin && !form.classId)}>Post Announcement</Btn>
            </div>
          </Card>
        </div>
        <div>
          <SectionTitle sub="Previously posted.">Posted</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{myAnnouncements.length === 0 ? <EmptyState icon={<Icon.Megaphone />} text="No announcements yet." /> : myAnnouncements.map(a => <AnnouncementCard key={a.id} a={a} />)}</div>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN VIEWS ───────────────────────────────────────────────────────────

function AdminDashboard({ tickets, setActive, students, staff, classes }) {
  const unassigned = students.filter(s => s.classIds.length === 0).length;
  const openTickets = tickets.filter(t => t.status === "Open").length;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28, width: "100%" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16 }}>
        {[
          { label: "Total Students",   value: students.length,   icon: <Icon.GraduationCap />, col: T.accent },
          { label: "Staff Members",    value: staff.length, icon: <Icon.UserCheck />, col: T.submitted },
          { label: "Unassigned",       value: unassigned,        icon: <Icon.User />,  col: unassigned > 0 ? T.dueSoon : { fg: T.muted, bg: T.bg } },
          { label: "Open Tickets",     value: openTickets,       icon: <Icon.Ticket />,  col: openTickets > 0 ? T.overdue : { fg: T.muted, bg: T.bg } },
        ].map(s => (
          <Card key={s.label} style={{ padding: "22px 24px" }} onClick={s.label === "Open Tickets" ? () => setActive("Tickets") : s.label === "Unassigned" ? () => setActive("Users") : undefined}>
            <div style={{ fontSize: 26, marginBottom: 10, display: "flex", alignItems: "center" }}><span style={{ width: 26, height: 26, display: "flex" }}>{s.icon}</span></div>
            <div style={{ fontSize: 30, fontWeight: 800, color: s.col.fg || s.col, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 13, color: T.muted, marginTop: 6 }}>{s.label}</div>
          </Card>
        ))}
      </div>
      {unassigned > 0 && (
        <div onClick={() => setActive("Users")} style={{ background: T.dueSoon.bg, border: `1px solid ${T.dueSoon.border}`, borderRadius: 16, padding: "18px 24px", display: "flex", alignItems: "center", gap: 16, cursor: "pointer" }}>
          <span style={{ fontSize: 28 }}>👤</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: T.dueSoon.fg }}>{unassigned} students waiting to be assigned to a class</div>
            <div style={{ fontSize: 13, color: T.muted, marginTop: 3 }}>They signed in with Google but haven't been placed yet. Click to manage.</div>
          </div>
          <Btn style={{ background: T.dueSoon.fg, padding: "9px 20px", fontSize: 13 }}>Assign Now →</Btn>
        </div>
      )}
      <div style={{ display: "flex", gap: 12 }}>
        <Btn onClick={() => setActive("Assign Tasks")}>📋 Assign Task to Staff</Btn>
        <Btn variant="secondary" onClick={() => setActive("Announcements")}>📢 Post Announcement</Btn>
      </div>
      <div>
        <SectionTitle sub="All classes and their assigned staff.">Classes</SectionTitle>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: 16 }}>
          {classes.map(c => (
            <Card key={c.id}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div><div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 4 }}>{c.name}</div><div style={{ fontSize: 13, color: T.muted }}>👤 {c.staffName}</div></div>
                <span style={{ background: T.graded.bg, color: T.graded.fg, border: `1px solid ${T.graded.border}`, borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700 }}>Active</span>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                {[{ val: c.students, label: "Students", col: T.accent }, { val: c.tasks, label: "Tasks", col: T.dueSoon.fg }].map(s => (
                  <div key={s.label} style={{ flex: 1, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, padding: "12px 16px", textAlign: "center" }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: s.col }}>{s.val}</div>
                    <div style={{ fontSize: 12, color: T.muted, marginTop: 4 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminAssignTasks({ staffTasks, setStaffTasks, staff }) {
  const [form, setForm] = useState({ title: "", staffId: "", dueDate: "", note: "" });
  const [assigned, setAssigned] = useState(false);
  const up = (k, v) => setForm(f => ({ ...f, [k]: v }));
  function handleAssign() {
    if (!form.title || !form.staffId) return;
    const staffMember = staff.find(s => s.id === parseInt(form.staffId));
    setStaffTasks([{ id: staffTasks.length + 1, title: form.title, assignedTo: staffMember.id, assignedToName: staffMember.name, dueDate: form.dueDate || "TBD", status: "Open", note: form.note }, ...staffTasks]);
    setForm({ title: "", staffId: "", dueDate: "", note: "" });
    setAssigned(true); setTimeout(() => setAssigned(false), 3000);
  }
  return (
    <div>
      <PermissionNote text="Only admins can assign tasks to staff members." />
      <SectionTitle sub="Create and assign duties to staff members.">Assign Task to Staff</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        <div>
          {assigned && <div style={{ background: T.graded.bg, border: `1px solid ${T.graded.border}`, borderRadius: 12, padding: "12px 20px", marginBottom: 16, fontSize: 14, color: T.graded.fg, fontWeight: 600 }}>✓ Task assigned!</div>}
          <Card>
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <FieldInput label="Task Title" value={form.title} onChange={e => up("title", e.target.value)} placeholder="e.g. Submit Q1 Grade Reports" />
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 7 }}>Assign To (Staff Member)</label>
                <select value={form.staffId} onChange={e => up("staffId", e.target.value)} style={{ width: "100%", background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 12, padding: "11px 15px", fontSize: 14, color: T.text, fontFamily: "inherit", outline: "none" }}>
                  <option value="">Select a staff member…</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <FieldInput label="Due Date" type="date" value={form.dueDate} onChange={e => up("dueDate", e.target.value)} />
              <FieldInput label="Notes (optional)" as="textarea" rows={4} value={form.note} onChange={e => up("note", e.target.value)} placeholder="Any specific instructions…" />
              <Btn onClick={handleAssign} disabled={!form.title || !form.staffId}>Assign Task →</Btn>
            </div>
          </Card>
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.text, marginBottom: 14 }}>All Assigned Tasks</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {staffTasks.map(t => (
              <Card key={t.id} style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}><div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{t.title}</div><Badge status={t.status} /></div>
                <div style={{ fontSize: 13, color: T.muted, display: "flex", gap: 12 }}><span>👤 {t.assignedToName}</span><span>📅 {t.dueDate}</span></div>
                {t.note && <div style={{ fontSize: 13, color: T.subtle, background: T.bg, borderRadius: 8, padding: "8px 12px", marginTop: 8 }}>{t.note}</div>}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminClasses({ classes, setClasses, knowledge, setKnowledge, staff }) {
  const [showModal, setShowModal] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [selectedStaff, setSelectedStaff] = useState(staff[0]?.id || 1);
  const [templateClass, setTemplateClass] = useState("blank");

  function handleCreateClass() {
    if (!newClassName.trim()) return;
    
    const newId = Math.max(...classes.map(c => c.id), 0) + 1;
    const staffMember = staff.find(s => s.id === selectedStaff);
    
    const newClass = {
      id: newId,
      name: newClassName.trim(),
      staffId: selectedStaff,
      staffName: staffMember.name,
      students: 0,
      tasks: 0,
      documents: []
    };

    // Copy knowledge documents from template class if selected
    if (templateClass !== "blank") {
      const templateDocs = knowledge.filter(doc => doc.classId === parseInt(templateClass));
      const copiedDocs = templateDocs.map(doc => ({
        ...doc,
        id: Math.max(...knowledge.map(d => d.id), 0) + knowledge.indexOf(doc) + 1,
        classId: newId
      }));
      setKnowledge([...knowledge, ...copiedDocs]);
    }

    setClasses([...classes, newClass]);
    setShowModal(false);
    setNewClassName("");
    setSelectedStaff(STAFF_INIT[0].id);
    setTemplateClass("blank");
  }

  return (
    <div>
      <PermissionNote text="Assign classes to staff here. Staff only see their assigned classes." />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
        <SectionTitle>Classes & Staff Assignments</SectionTitle>
        <Btn onClick={() => setShowModal(true)}>+ New Class</Btn>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {classes.map(c => (
          <Card key={c.id}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: T.text, marginBottom: 4 }}>{c.name}</div>
                <div style={{ fontSize: 13, color: T.muted, display: "flex", gap: 16 }}>
                  <span><Icon.User /> <strong style={{ color: T.text }}>{c.staffName}</strong></span>
                  <span><Icon.Users /> {c.students} students</span>
                  <span><Icon.Clipboard /> {c.tasks} tasks</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10 }}>
                <span style={{ background: T.graded.bg, color: T.graded.fg, border: `1px solid ${T.graded.border}`, borderRadius: 20, padding: "4px 14px", fontSize: 12, fontWeight: 700 }}>Active</span>
                <Btn variant="secondary" style={{ fontSize: 13, padding: "8px 16px" }}>Reassign Staff</Btn>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {showModal && (
        <>
          <div onClick={() => setShowModal(false)} style={{ position: "fixed", inset: 0, background: "rgba(26,24,20,0.18)", zIndex: 200 }} />
          <div style={{ position: "fixed", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 480, maxWidth: "90vw", background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 30, zIndex: 201, boxShadow: "0 20px 60px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>Create New Class</div>
              <button onClick={() => setShowModal(false)} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, width: 36, height: 36, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: T.muted }}>✕</button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <FieldInput 
                label="Class Name" 
                value={newClassName} 
                onChange={e => setNewClassName(e.target.value)} 
                placeholder="e.g., Advanced Mathematics" 
              />
              
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 8, letterSpacing: "0.05em", textTransform: "uppercase" }}>Assign Staff</div>
                <select 
                  value={selectedStaff} 
                  onChange={e => setSelectedStaff(parseInt(e.target.value))}
                  style={{ width: "100%", padding: "10px 14px", fontSize: 14, border: `1px solid ${T.border}`, borderRadius: 10, background: T.bg, color: T.text, cursor: "pointer" }}
                >
                  {STAFF_INIT.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 8, letterSpacing: "0.05em", textTransform: "uppercase" }}>Knowledge Base Template</div>
                <select 
                  value={templateClass} 
                  onChange={e => setTemplateClass(e.target.value)}
                  style={{ width: "100%", padding: "10px 14px", fontSize: 14, border: `1px solid ${T.border}`, borderRadius: 10, background: T.bg, color: T.text, cursor: "pointer" }}
                >
                  <option value="blank">Start with blank (no knowledge links)</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>Copy from: {c.name}</option>
                  ))}
                </select>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 6, fontStyle: "italic" }}>
                  Choose "blank" to add Google Drive links later, or copy from an existing class.
                </div>
              </div>

              <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                <Btn variant="secondary" onClick={() => setShowModal(false)} style={{ flex: 1, justifyContent: "center" }}>Cancel</Btn>
                <Btn onClick={handleCreateClass} style={{ flex: 1, justifyContent: "center" }}>Create Class</Btn>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function AdminTickets({ tickets, setTickets }) {
  const [selected, setSelected] = useState(null);
  const [reply, setReply] = useState("");
  const open = tickets.filter(t => t.status === "Open");
  const others = tickets.filter(t => t.status !== "Open");
  function handleResolve() { setTickets(tickets.map(t => t.id === selected.id ? { ...t, status: "Resolved", adminReply: reply } : t)); setSelected(null); setReply(""); }
  function handleReview() { setTickets(tickets.map(t => t.id === selected.id ? { ...t, status: "In Review", adminReply: reply } : t)); setSelected(null); setReply(""); }
  return (
    <div style={{ position: "relative" }}>
      <SectionTitle sub="Requests and messages from staff members.">Staff Tickets</SectionTitle>
      {open.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 15, fontWeight: 800, color: T.dueSoon.fg }}>● Open</span>
            <span style={{ background: T.dueSoon.bg, color: T.dueSoon.fg, border: `1px solid ${T.dueSoon.border}`, borderRadius: 20, padding: "2px 10px", fontSize: 12, fontWeight: 700 }}>{open.length}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{open.map(t => <TicketRow key={t.id} t={t} onClick={() => { setSelected(t); setReply(t.adminReply || ""); }} />)}</div>
        </div>
      )}
      {others.length > 0 && (
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.muted, marginBottom: 12 }}>Resolved & In Review</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{others.map(t => <TicketRow key={t.id} t={t} onClick={() => { setSelected(t); setReply(t.adminReply || ""); }} />)}</div>
        </div>
      )}
      {selected && (
        <>
          <div onClick={() => setSelected(null)} style={{ position: "fixed", inset: 0, background: "rgba(26,24,20,0.18)", zIndex: 200 }} />
          <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: 460, background: T.surface, borderLeft: `1px solid ${T.border}`, padding: 30, zIndex: 201, overflowY: "auto", boxShadow: "-12px 0 50px rgba(0,0,0,0.10)", display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: T.text }}>Ticket Details</div>
              <button onClick={() => setSelected(null)} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, width: 36, height: 36, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", color: T.muted }}>✕</button>
            </div>
            <Card style={{ background: T.bg, padding: "16px 20px" }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 6 }}>{selected.subject}</div>
              <div style={{ display: "flex", gap: 10, marginBottom: 10 }}><span style={{ background: T.purple.bg, color: T.purple.fg, border: `1px solid ${T.purple.border}`, borderRadius: 7, padding: "2px 9px", fontSize: 11, fontWeight: 700 }}>{selected.category}</span><Badge status={selected.status} /></div>
              <div style={{ fontSize: 13, color: T.muted }}>From: <strong style={{ color: T.text }}>{selected.staffName}</strong> · {selected.date}</div>
            </Card>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.muted, marginBottom: 8, letterSpacing: "0.05em", textTransform: "uppercase" }}>Staff Message</div>
              <div style={{ fontSize: 14, color: T.text, lineHeight: 1.7, background: T.bg, border: `1px solid ${T.border}`, borderRadius: 12, padding: "14px 18px" }}>{selected.message}</div>
            </div>
            <FieldInput label="Your Reply" as="textarea" rows={5} value={reply} onChange={e => setReply(e.target.value)} placeholder="Write a reply…" />
            <div style={{ display: "flex", gap: 10 }}>
              <Btn variant="secondary" style={{ flex: 1, justifyContent: "center", fontSize: 13 }} onClick={handleReview}>Mark In Review</Btn>
              <Btn variant="success" style={{ flex: 1, justifyContent: "center", fontSize: 13 }} onClick={handleResolve}>Resolve ✓</Btn>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TicketRow({ t, onClick }) {
  return (
    <Card style={{ padding: "16px 22px" }} onClick={onClick}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: T.purple.bg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>🎫</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.text, marginBottom: 4 }}>{t.subject}</div>
          <div style={{ fontSize: 12, color: T.muted, display: "flex", gap: 10, alignItems: "center" }}>
            <span>From: {t.staffName}</span>
            <span style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: "1px 8px" }}>{t.category}</span>
            <span>{t.date}</span>
          </div>
        </div>
        <Badge status={t.status} />
        <span style={{ color: T.accent, fontSize: 13, fontWeight: 600 }}>Open →</span>
      </div>
    </Card>
  );
}

function Knowledge({ role, studentClassIds = [], staffClassIds = [], documents, setDocuments, userName, classes }) {
  const [search, setSearch] = useState("");
  const [selectedClass, setSelectedClass] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [newDoc, setNewDoc] = useState({ title: "", driveLink: "", tags: "", classId: "" });
 
  // Filter documents based on role
  let availableClassIds = [];
  if (role === "Student") {
    availableClassIds = studentClassIds;
  } else if (role === "Staff") {
    availableClassIds = staffClassIds;
  } else if (role === "Admin") {
    availableClassIds = classes.map(c => c.id);
  }

  const availableDocs = documents.filter(doc => availableClassIds.includes(doc.classId));
  const availableClasses = classes.filter(c => availableClassIds.includes(c.id));

  // Apply filters
  let filtered = availableDocs;
  if (selectedClass !== "all") {
    filtered = filtered.filter(doc => doc.classId === parseInt(selectedClass));
  }
  if (search) {
    filtered = filtered.filter(doc => 
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase()))
    );
  }

  // Group by class
  const groupedDocs = {};
  filtered.forEach(doc => {
    if (!groupedDocs[doc.classId]) {
      groupedDocs[doc.classId] = [];
    }
    groupedDocs[doc.classId].push(doc);
  });

  function handleAddDocument() {
    if (!newDoc.title || !newDoc.driveLink || !newDoc.classId) {
      alert("Please fill in all required fields");
      return;
    }
    const doc = {
      id: Date.now(),
      classId: parseInt(newDoc.classId),
      title: newDoc.title,
      driveLink: newDoc.driveLink,
      tags: newDoc.tags.split(",").map(t => t.trim()).filter(Boolean),
      added: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      addedBy: userName
    };
    setDocuments([...documents, doc]);
    setNewDoc({ title: "", driveLink: "", tags: "", classId: "" });
    setShowModal(false);
  }

  const canAddDocs = role === "Staff" || role === "Admin";

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <SectionTitle sub="Browse class documents and learning resources.">Knowledge Base</SectionTitle>
        {canAddDocs && (
          <Btn variant="primary" onClick={() => setShowModal(true)}>
            <span style={{ fontSize: 16, marginRight: 6 }}>+</span> Add Document
          </Btn>
        )}
      </div>
      
      <div style={{ display: "flex", gap: 12, marginBottom: 22 }}>
        <div style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 14, padding: "11px 18px", display: "flex", alignItems: "center", gap: 10, flex: 1 }}>
          <span style={{ display: "flex", alignItems: "center", color: T.subtle }}><Icon.Search /></span>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search documents…" style={{ background: "none", border: "none", outline: "none", color: T.text, fontSize: 14, width: "100%", fontFamily: "inherit" }} />
        </div>
        <select value={selectedClass} onChange={e => setSelectedClass(e.target.value)} style={{ background: T.surface, border: `1.5px solid ${T.border}`, borderRadius: 14, padding: "11px 18px", color: T.text, fontSize: 14, fontWeight: 500, fontFamily: "inherit", cursor: "pointer", minWidth: 200 }}>
          <option value="all">All Classes ({availableDocs.length})</option>
          {availableClasses.map(c => {
            const docCount = availableDocs.filter(doc => doc.classId === c.id).length;
            return <option key={c.id} value={c.id}>{c.name} ({docCount})</option>;
          })}
        </select>
      </div>

      {Object.keys(groupedDocs).length === 0 ? (
        <EmptyState icon={<Icon.Book />} text={canAddDocs ? "No documents yet. Click 'Add Document' to get started." : "No documents available."} />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {Object.entries(groupedDocs).map(([classId, docs]) => {
            const classInfo = classes.find(c => c.id === parseInt(classId));
            return (
              <div key={classId}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: T.accentBg, display: "flex", alignItems: "center", justifyContent: "center", color: T.accent }}>
                    <Icon.School />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>{classInfo.name}</div>
                    <div style={{ fontSize: 12, color: T.muted }}>{docs.length} document{docs.length !== 1 ? 's' : ''} • {classInfo.staffName}</div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {docs.map(doc => (
                    <Card key={doc.id}>
                      <div style={{ display: "flex", gap: 16 }}>
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: "#4285F4", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4c-1.48 0-2.85.43-4.01 1.17l1.46 1.46C10.21 6.23 11.08 6 12 6c3.04 0 5.5 2.46 5.5 5.5v.5H19c1.66 0 3 1.34 3 3 0 1.13-.64 2.11-1.56 2.62l1.45 1.45C23.16 18.16 24 16.68 24 15c0-2.64-2.05-4.78-4.65-4.96zM3 5.27l2.75 2.74C2.56 8.15 0 10.77 0 14c0 3.31 2.69 6 6 6h11.73l2 2L21 20.73 4.27 4 3 5.27zM7.73 10l8 8H6c-2.21 0-4-1.79-4-4s1.79-4 4-4h1.73z"/>
                          </svg>
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: 6 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{doc.title}</div>
                            <span style={{ fontSize: 12, color: T.subtle, marginLeft: 16, flexShrink: 0 }}>Added {doc.added}</span>
                          </div>
                          <div style={{ fontSize: 12, color: T.muted, marginBottom: 12 }}>By {doc.addedBy}</div>
                          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                            {doc.tags.map(t => <span key={t} style={{ background: T.accentBg, color: T.accent, borderRadius: 7, padding: "3px 10px", fontSize: 11, fontWeight: 600 }}>{t}</span>)}
                            <Btn 
                              variant="primary" 
                              onClick={() => window.open(doc.driveLink, "_blank")} 
                              style={{ marginLeft: "auto", fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4c-1.48 0-2.85.43-4.01 1.17l1.46 1.46C10.21 6.23 11.08 6 12 6c3.04 0 5.5 2.46 5.5 5.5v.5H19c1.66 0 3 1.34 3 3 0 1.13-.64 2.11-1.56 2.62l1.45 1.45C23.16 18.16 24 16.68 24 15c0-2.64-2.05-4.78-4.65-4.96zM3 5.27l2.75 2.74C2.56 8.15 0 10.77 0 14c0 3.31 2.69 6 6 6h11.73l2 2L21 20.73 4.27 4 3 5.27zM7.73 10l8 8H6c-2.21 0-4-1.79-4-4s1.79-4 4-4h1.73z"/>
                              </svg>
                              Open in Drive
                            </Btn>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Document Modal */}
      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }} onClick={() => setShowModal(false)}>
          <div style={{ background: T.surface, borderRadius: 20, padding: "32px 36px", width: 520, maxWidth: "90vw", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 20, fontWeight: 800, color: T.text, marginBottom: 20 }}>Add Document Link</div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>Document Title *</label>
                <input 
                  value={newDoc.title} 
                  onChange={e => setNewDoc({...newDoc, title: e.target.value})}
                  placeholder="e.g., Calculus Study Guide"
                  style={{ width: "100%", padding: "11px 16px", border: `1.5px solid ${T.border}`, borderRadius: 12, fontSize: 14, fontFamily: "inherit", outline: "none" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>Google Drive Link *</label>
                <input 
                  value={newDoc.driveLink} 
                  onChange={e => setNewDoc({...newDoc, driveLink: e.target.value})}
                  placeholder="https://drive.google.com/file/d/..."
                  style={{ width: "100%", padding: "11px 16px", border: `1.5px solid ${T.border}`, borderRadius: 12, fontSize: 14, fontFamily: "inherit", outline: "none" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>Class *</label>
                <select 
                  value={newDoc.classId} 
                  onChange={e => setNewDoc({...newDoc, classId: e.target.value})}
                  style={{ width: "100%", padding: "11px 16px", border: `1.5px solid ${T.border}`, borderRadius: 12, fontSize: 14, fontFamily: "inherit", outline: "none", cursor: "pointer" }}
                >
                  <option value="">Select a class</option>
                  {availableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 8 }}>Tags (comma separated)</label>
                <input 
                  value={newDoc.tags} 
                  onChange={e => setNewDoc({...newDoc, tags: e.target.value})}
                  placeholder="Math, Formulas, Study Guide"
                  style={{ width: "100%", padding: "11px 16px", border: `1.5px solid ${T.border}`, borderRadius: 12, fontSize: 14, fontFamily: "inherit", outline: "none" }}
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
              <Btn variant="ghost" onClick={() => setShowModal(false)} style={{ flex: 1 }}>Cancel</Btn>
              <Btn variant="primary" onClick={handleAddDocument} style={{ flex: 1 }}>Add Document</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── DATA SYNC AND USER HELPERS ────────────────────────────────────────────

// Determine user role from email and Google Sheets data
async function determineUserRole(email, students, staff) {
  // Check if admin (you can customize this logic)
  const adminEmails = ["lebuibaoson.work@gmail.com"];
  if (adminEmails.includes(email.toLowerCase())) {
    return { role: "Admin", userData: { name: "Admin", email, id: 1 } };
  }
  
  // Check if staff
  const staffMember = staff.find(s => s.email.toLowerCase() === email.toLowerCase());
  if (staffMember) {
    return { role: "Staff", userData: staffMember };
  }
  
  // Check if student
  const student = students.find(s => s.email.toLowerCase() === email.toLowerCase());
  if (student) {
    return { role: "Student", userData: student };
  }
  
  // New user - create as student
  return { role: "Student", userData: null, isNewUser: true };
}

// Create new student in Google Sheets
async function createNewStudent(userInfo) {
  const newStudent = {
    id: Date.now(),
    name: userInfo.name,
    email: userInfo.email,
    avatar: userInfo.name.charAt(0).toUpperCase(),
    classIds: [],
    status: "Active",
    joinedVia: "Google",
    joinDate: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  };
  
  await appendSheetData(SHEET_NAMES.STUDENTS, newStudent);
  return newStudent;
}

// Parse classIds from comma-separated string to array
function parseClassIds(classIdsStr) {
  if (!classIdsStr || classIdsStr === '') return [];
  return classIdsStr.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id));
}

// Format classIds array to comma-separated string for Sheets
function formatClassIds(classIds) {
  return Array.isArray(classIds) ? classIds.join(',') : '';
}

// ─── APP ROOT ───────────────────────────────────────────────────────────────

export default function App() {
  // User authentication state
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // App state
  const [section, setSection]         = useState("Dashboard");
  const [students, setStudents]       = useState(STUDENTS_INIT);
  const [staff, setStaff]             = useState(STAFF_INIT);
  const [classes, setClasses]         = useState(CLASSES_INIT);
  const [announcements, setAnnouncements] = useState(ANNOUNCEMENTS_INIT);
  const [staffTasks, setStaffTasks]   = useState(STAFF_TASKS_INIT);
  const [tickets, setTickets]         = useState(TICKETS_INIT);
  const [knowledge, setKnowledge]     = useState(KNOWLEDGE_INIT);
  const [studentTasks, setStudentTasks] = useState(STUDENT_TASKS_INIT);
  const [submissions, setSubmissions] = useState(SUBMISSIONS_DATA);

  // Check for existing session on mount
  useEffect(() => {
    const savedSession = localStorage.getItem('classroomSession');
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        setUser(session.user);
        setRole(session.role);
        setStudents(session.students || STUDENTS_INIT);
        setStaff(session.staff || STAFF_INIT);
        setClasses(session.classes || CLASSES_INIT);
        setAnnouncements(session.announcements || ANNOUNCEMENTS_INIT);
        setStaffTasks(session.staffTasks || STAFF_TASKS_INIT);
        setTickets(session.tickets || TICKETS_INIT);
        setKnowledge(session.knowledge || KNOWLEDGE_INIT);
        setStudentTasks(session.studentTasks || STUDENT_TASKS_INIT);
        setSubmissions(session.submissions || SUBMISSIONS_DATA);
      } catch (error) {
        console.error('Failed to restore session:', error);
        localStorage.removeItem('classroomSession');
      }
    }
    setLoading(false);
  }, []);

  // Auto-sync data to Google Sheets when state changes
  useEffect(() => {
    if (user && students.length > 0) {
      updateSheetData(SHEET_NAMES.STUDENTS, students).catch(err => console.error('Failed to sync students:', err));
    }
  }, [students, user]);

  useEffect(() => {
    if (user && staff.length > 0) {
      updateSheetData(SHEET_NAMES.STAFF, staff).catch(err => console.error('Failed to sync staff:', err));
    }
  }, [staff, user]);

  useEffect(() => {
    if (user && classes.length > 0) {
      updateSheetData(SHEET_NAMES.CLASSES, classes).catch(err => console.error('Failed to sync classes:', err));
    }
  }, [classes, user]);

  useEffect(() => {
    if (user && announcements.length > 0) {
      updateSheetData(SHEET_NAMES.ANNOUNCEMENTS, announcements).catch(err => console.error('Failed to sync announcements:', err));
    }
  }, [announcements, user]);

  useEffect(() => {
    if (user && staffTasks.length > 0) {
      updateSheetData(SHEET_NAMES.STAFF_TASKS, staffTasks).catch(err => console.error('Failed to sync staff tasks:', err));
    }
  }, [staffTasks, user]);

  useEffect(() => {
    if (user && tickets.length > 0) {
      updateSheetData(SHEET_NAMES.TICKETS, tickets).catch(err => console.error('Failed to sync tickets:', err));
    }
  }, [tickets, user]);

  useEffect(() => {
    if (user && knowledge.length > 0) {
      updateSheetData(SHEET_NAMES.KNOWLEDGE, knowledge).catch(err => console.error('Failed to sync knowledge:', err));
    }
  }, [knowledge, user]);

  useEffect(() => {
    if (user && studentTasks.length > 0) {
      updateSheetData(SHEET_NAMES.STUDENT_TASKS, studentTasks).catch(err => console.error('Failed to sync student tasks:', err));
    }
  }, [studentTasks, user]);

  useEffect(() => {
    if (user && submissions.length > 0) {
      updateSheetData(SHEET_NAMES.SUBMISSIONS, submissions).catch(err => console.error('Failed to sync submissions:', err));
    }
  }, [submissions, user]);

  // Update localStorage session when data changes
  useEffect(() => {
    if (user && role) {
      localStorage.setItem('classroomSession', JSON.stringify({
        user,
        role,
        students,
        staff,
        classes,
        announcements,
        staffTasks,
        tickets,
        knowledge,
        studentTasks,
        submissions
      }));
    }
  }, [user, role, students, staff, classes, announcements, staffTasks, tickets, knowledge, studentTasks, submissions]);

  // Handle Google Sign-In
  async function handleSignIn(userInfo) {
    setLoading(true);
    
    // Load ALL data from Google Sheets
    try {
      const [
        loadedClasses,
        loadedStudents,
        loadedStaff,
        loadedKnowledge,
        loadedAnnouncements,
        loadedStaffTasks,
        loadedTickets,
        loadedStudentTasks,
        loadedSubmissions
      ] = await Promise.all([
        getSheetData(SHEET_NAMES.CLASSES),
        getSheetData(SHEET_NAMES.STUDENTS),
        getSheetData(SHEET_NAMES.STAFF),
        getSheetData(SHEET_NAMES.KNOWLEDGE),
        getSheetData(SHEET_NAMES.ANNOUNCEMENTS),
        getSheetData(SHEET_NAMES.STAFF_TASKS),
        getSheetData(SHEET_NAMES.TICKETS),
        getSheetData(SHEET_NAMES.STUDENT_TASKS),
        getSheetData(SHEET_NAMES.SUBMISSIONS)
      ]);
      
      // Update all state with loaded data
      setClasses(loadedClasses);
      setStudents(loadedStudents);
      setStaff(loadedStaff);
      setKnowledge(loadedKnowledge);
      setAnnouncements(loadedAnnouncements);
      setStaffTasks(loadedStaffTasks);
      setTickets(loadedTickets);
      setStudentTasks(loadedStudentTasks);
      setSubmissions(loadedSubmissions);
      
      const { role: userRole, userData, isNewUser } = await determineUserRole(userInfo.email, loadedStudents, loadedStaff);
      
      let finalUserData = userData;
      
      // If new user, create student record
      if (isNewUser) {
        finalUserData = await createNewStudent(userInfo);
        setStudents([...loadedStudents, finalUserData]);
      }
      
      const fullUser = { ...userInfo, ...finalUserData };
      setUser(fullUser);
      setRole(userRole);
      
      // Save session to localStorage
      localStorage.setItem('classroomSession', JSON.stringify({
        user: fullUser,
        role: userRole,
        students: loadedStudents,
        staff: loadedStaff,
        classes: loadedClasses,
        announcements: loadedAnnouncements,
        staffTasks: loadedStaffTasks,
        tickets: loadedTickets,
        knowledge: loadedKnowledge,
        studentTasks: loadedStudentTasks,
        submissions: loadedSubmissions
      }));
    } catch (error) {
      console.error("Error loading data:", error);
      alert("Failed to load data from Google Sheets. Check console for details.");
    }
    
    setLoading(false);
  }

  // Handle Sign Out
  function handleSignOut() {
    localStorage.removeItem('classroomSession');
    setUser(null);
    setRole(null);
    setSection("Dashboard");
  }

  useEffect(() => { setSection("Dashboard"); }, [role]);

  const userName = user?.name || "User";
  const openTicketCount = tickets.filter(t => t.status === "Open").length;
  
  // Get user's class IDs based on role
  let userClassIds = [];
  if (role === "Student" && user) {
    userClassIds = user.classIds || [];
  } else if (role === "Staff" && user) {
    userClassIds = user.classIds || [];
  }
  
  const studentAnnouncements = announcements.filter(a => a.classId === null || userClassIds.includes(a.classId));

  // Show Google sign-in if not authenticated
  if (!user || !role) {
    return <GoogleSignIn onSignIn={handleSignIn} />;
  }

  // Show loading state
  if (loading) {
    return (
      <div style={{ width: "100vw", height: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "'Nunito', sans-serif" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ width: 60, height: 60, border: `5px solid ${T.border}`, borderTopColor: T.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 24px" }} />
          <div style={{ fontSize: 18, fontWeight: 600, color: T.text }}>Loading your classroom...</div>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  function renderContent() {
    if (role === "Student") {
      if (section === "Dashboard")     return <StudentDashboard tasks={studentTasks.filter(t => userClassIds.includes(t.classId))} announcements={studentAnnouncements} />;
      if (section === "My Tasks")      return <StudentTasks tasks={studentTasks.filter(t => userClassIds.includes(t.classId))} />;
      if (section === "Announcements") return <div><SectionTitle sub="From your teachers and the school.">Announcements</SectionTitle><div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{studentAnnouncements.map(a => <AnnouncementCard key={a.id} a={a} />)}</div></div>;
      if (section === "Knowledge")     return <Knowledge role="Student" studentClassIds={userClassIds} documents={knowledge} setDocuments={setKnowledge} userName={userName} classes={classes} />;
    }
    if (role === "Staff") {
      if (section === "Dashboard")     return <StaffDashboard submissions={submissions.filter(s => userClassIds.includes(s.classId))} setActive={setSection} classes={classes} user={user} />;
      if (section === "My Classes")    return <StaffMyClasses classes={classes} user={user} />;
      if (section === "Submissions")   return <><SectionTitle sub="Click 'Grade' to open the grading panel.">Submissions</SectionTitle><SubmissionsTable submissions={submissions.filter(s => userClassIds.includes(s.classId))} /></>;
      if (section === "Announcements") return <StaffAnnouncements announcements={announcements} setAnnouncements={setAnnouncements} role="Staff" classes={classes} user={user} />;
      if (section === "Knowledge")     return <Knowledge role="Staff" staffClassIds={userClassIds} documents={knowledge} setDocuments={setKnowledge} userName={userName} classes={classes} />;
      if (section === "Send Ticket")   return <SendTicket tickets={tickets} setTickets={setTickets} />;
    }
    if (role === "Admin") {
      if (section === "Dashboard")     return <AdminDashboard tickets={tickets} setActive={setSection} students={students} staff={staff} classes={classes} />;
      if (section === "Users")         return <AdminUsers students={students} setStudents={setStudents} classes={classes} staff={staff} />;
      if (section === "Classes")       return <AdminClasses classes={classes} setClasses={setClasses} knowledge={knowledge} setKnowledge={setKnowledge} staff={staff} />;
      if (section === "Assign Tasks")  return <AdminAssignTasks staffTasks={staffTasks} setStaffTasks={setStaffTasks} staff={staff} />;
      if (section === "Announcements") return <StaffAnnouncements announcements={announcements} setAnnouncements={setAnnouncements} role="Admin" classes={classes} user={user} />;
      if (section === "Tickets")       return <AdminTickets tickets={tickets} setTickets={setTickets} />;
      if (section === "Knowledge")     return <Knowledge role="Admin" documents={knowledge} setDocuments={setKnowledge} userName={userName} classes={classes} />;
    }
    return <EmptyState icon={<Icon.Construction />} text="This section is coming soon." />;
  }

  return (
    <div style={{ width: "100vw", height: "100vh", background: T.bg, fontFamily: "'Nunito', 'Segoe UI', sans-serif", color: T.text, overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: ${T.bg}; }
        ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 5px; }
        select option { background: #fff; color: ${T.text}; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
      <TopBar role={role} setRole={setRole} userName={userName} ticketCount={openTicketCount} onSignOut={handleSignOut} />
      <div style={{ display: "flex", height: "calc(100vh - 66px)", width: "100vw" }}>
        <Sidebar role={role} active={section} setActive={setSection} ticketBadge={openTicketCount} />
        <main style={{ flex: 1, overflowY: "auto", padding: "34px 40px", minWidth: 0 }}>
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
