"use client";

import React, { useState, useEffect } from "react";
import { OrganizerLayout } from "@/components/dashboard/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Upload,
  Download,
  Users,
  FileText,
  CheckCircle,
  AlertTriangle,
  X,
  RefreshCw,
  Calendar,
  Eye,
  Trash2,
  Filter,
  Building,
  Mail,
  User,
  Phone,
  BookOpen,
} from "lucide-react";
import { format } from "date-fns";
import * as XLSX from "xlsx";

interface Event {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  location: string;
}

interface FacultyMember {
  id: string;
  name: string;
  email: string;
  department?: string;
  institution?: string;
  expertise?: string;
  phone?: string;
  uploadedAt: string;
  eventId: string;
  eventName: string;
}

interface EventFacultyData {
  eventId: string;
  eventName: string;
  facultyList: FacultyMember[];
  uploadedAt: string;
  totalCount: number;
}

export default function FacultyManagementPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [eventFacultyData, setEventFacultyData] = useState<EventFacultyData[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [filterEvent, setFilterEvent] = useState<string>("ALL");
  const [expandedEvent, setExpandedEvent] = useState<string>("");

  // Fetch events from database API
  const fetchEventsFromAPI = async () => {
    try {
      setEventsLoading(true);
      console.log('Fetching events from database API...');
      
      const response = await fetch('/api/events', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API Response:', data);

      if (data.success && data.data && data.data.events) {
        const fetchedEvents = data.data.events.map((event: any) => ({
          id: event.id,
          name: event.name,
          startDate: event.start_date || event.startDate,
          endDate: event.end_date || event.endDate,
          status: event.status,
          location: event.venue || event.location || 'TBA',
        }));

        console.log(`Successfully loaded ${fetchedEvents.length} events from database`);
        setEvents(fetchedEvents);
      } else {
        console.warn('API returned no events or invalid format:', data);
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setErrorMessage(`Failed to load events: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Fallback sample data only if API completely fails
      const fallbackEvents: Event[] = [
        {
          id: "event-1",
          name: "Academic Excellence Conference 2025",
          startDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString(),
          status: "PUBLISHED",
          location: "University Campus",
        },
      ];
      setEvents(fallbackEvents);
    } finally {
      setEventsLoading(false);
    }
  };

  useEffect(() => {
    loadEventsAndFacultyData();
  }, []);

  const loadEventsAndFacultyData = async () => {
    try {
      setLoading(true);
      await fetchEventsFromAPI();

      const savedFacultyData = localStorage.getItem("eventFacultyData");
      if (savedFacultyData) {
        try {
          const parsedData = JSON.parse(savedFacultyData);
          setEventFacultyData(parsedData);
        } catch (error) {
          console.error("Error parsing saved faculty data:", error);
          localStorage.removeItem("eventFacultyData");
        }
      }
    } catch (error) {
      console.error("Error loading data:", error);
      setErrorMessage("Failed to load events and faculty data");
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ];

      if (!allowedTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
        setErrorMessage("Please select a valid Excel file (.xlsx or .xls)");
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage("File size should be less than 5MB");
        return;
      }

      setSelectedFile(file);
      setErrorMessage("");
      setSuccessMessage("");
    }
  };

  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);
    setErrorMessage("");
    setSuccessMessage("");
  };

  const detectName = (row: any, index: number): string => {
    const nameFields = [
      "Name", "name", "NAME", "Full Name", "full name", "FULL NAME", "FullName", "fullName", "fullname",
      "First Name", "first name", "FIRST NAME", "FirstName", "firstName", "firstname",
      "Faculty Name", "faculty name", "FACULTY NAME", "FacultyName", "facultyName",
      "User Name", "user name", "USER NAME", "UserName", "userName", "username",
      "Participant Name", "participant name", "PARTICIPANT NAME",
      "Speaker Name", "speaker name", "SPEAKER NAME",
      "Professor Name", "professor name", "PROFESSOR NAME",
      "Dr Name", "dr name", "DR NAME",
    ];

    for (const field of nameFields) {
      if (row[field] && String(row[field]).trim() !== "") {
        return String(row[field]).trim();
      }
    }

    const rowKeys = Object.keys(row);
    for (const key of rowKeys) {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes("name") && row[key] && String(row[key]).trim() !== "") {
        return String(row[key]).trim();
      }
    }

    const possibleTextFields = Object.values(row).slice(0, 3);
    for (const value of possibleTextFields) {
      if (value && typeof value === "string" && value.trim() !== "" && !value.includes("@")) {
        const text = value.trim();
        if (text.length > 1 && !text.match(/^\d+$/)) {
          return text;
        }
      }
    }

    throw new Error(
      `Missing name at row ${index + 2}. Please ensure your Excel file has a column with names.`
    );
  };

  const detectEmail = (row: any, index: number): string => {
    const emailFields = [
      "Email", "email", "EMAIL", "E-mail", "e-mail", "E-MAIL", "E_mail", "e_mail",
      "Email Address", "email address", "EMAIL ADDRESS", "EmailAddress", "emailAddress", "emailaddress",
      "Email ID", "email id", "EMAIL ID", "EmailID", "emailID", "emailid",
      "Mail", "mail", "MAIL", "Mail ID", "mail id", "MAIL ID", "MailID", "mailID",
      "Contact Email", "contact email", "CONTACT EMAIL",
      "User Email", "user email", "USER EMAIL",
      "Faculty Email", "faculty email", "FACULTY EMAIL",
    ];

    for (const field of emailFields) {
      if (row[field] && String(row[field]).trim() !== "") {
        const email = String(row[field]).trim();
        if (email.includes("@")) {
          return email.toLowerCase();
        }
      }
    }

    const rowKeys = Object.keys(row);
    for (const key of rowKeys) {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes("email") || lowerKey.includes("mail")) {
        const value = row[key];
        if (value && String(value).trim() !== "" && String(value).includes("@")) {
          return String(value).trim().toLowerCase();
        }
      }
    }

    for (const [key, value] of Object.entries(row)) {
      if (value && typeof value === "string" && value.includes("@")) {
        return value.trim().toLowerCase();
      }
    }

    throw new Error(
      `Missing or invalid email at row ${index + 2}. Please ensure your Excel file has a column with valid email addresses.`
    );
  };

  const detectOptionalField = (row: any, fieldNames: string[]): string => {
    for (const field of fieldNames) {
      if (row[field] && String(row[field]).trim() !== "") {
        return String(row[field]).trim();
      }
    }

    const rowKeys = Object.keys(row);
    for (const key of rowKeys) {
      const lowerKey = key.toLowerCase();
      for (const fieldName of fieldNames) {
        if (lowerKey.includes(fieldName.toLowerCase()) && row[key] && String(row[key]).trim() !== "") {
          return String(row[key]).trim();
        }
      }
    }

    return "";
  };

  const processExcelFile = async (file: File, eventId: string): Promise<FacultyMember[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const workbook = XLSX.read(data, { type: "array" });

          const sheetNames = workbook.SheetNames;
          if (!sheetNames || sheetNames.length === 0) {
            throw new Error("Excel file has no worksheets");
          }

          const firstSheetName = sheetNames[0];
          if (!firstSheetName) {
            throw new Error("Excel file has no valid worksheet name.");
          }
          const worksheet = workbook.Sheets[firstSheetName];
          if (!worksheet) {
            throw new Error("Worksheet not found in the Excel file.");
          }
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          if (!Array.isArray(jsonData) || jsonData.length === 0) {
            throw new Error("Excel file is empty or contains no data rows.");
          }

          const selectedEvent = events.find((e) => e.id === eventId);
          const facultyMembers: FacultyMember[] = jsonData.map((row: any, index: number) => {
            try {
              const name = detectName(row, index);
              const email = detectEmail(row, index);

              const department = detectOptionalField(row, [
                "Department", "Dept", "Division", "Branch", "School", "Faculty", "Section",
              ]);

              const institution = detectOptionalField(row, [
                "Institution", "University", "College", "Organization", "Company", "Institute", "School",
              ]);

              const expertise = detectOptionalField(row, [
                "Expertise", "Specialization", "Subject", "Field", "Area", "Skills", "Research Area", "Domain",
              ]);

              const phone = detectOptionalField(row, [
                "Phone", "Mobile", "Contact", "Tel", "Telephone", "Cell", "Phone Number", "Contact Number",
              ]);

              return {
                id: `faculty-${eventId}-${Date.now()}-${index}`,
                name,
                email,
                department,
                institution,
                expertise,
                phone,
                uploadedAt: new Date().toISOString(),
                eventId,
                eventName: selectedEvent?.name || "Unknown Event",
              };
            } catch (error) {
              throw new Error(
                `Row ${index + 2}: ${error instanceof Error ? error.message : "Unknown error"}`
              );
            }
          });

          resolve(facultyMembers);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedEventId) {
      setErrorMessage("Please select both an event and an Excel file");
      return;
    }

    setUploading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const facultyMembers = await processExcelFile(selectedFile, selectedEventId);
      const selectedEvent = events.find((e) => e.id === selectedEventId);

      if (!selectedEvent) {
        throw new Error("Selected event not found");
      }

      const uniqueMembers = facultyMembers.filter(
        (member, index, self) => index === self.findIndex((m) => m.email === member.email)
      );

      const existingEventData = eventFacultyData.find((data) => data.eventId === selectedEventId);
      let finalFacultyList = uniqueMembers;
      let addedCount = uniqueMembers.length;

      if (existingEventData) {
        const existingEmails = existingEventData.facultyList.map((f) => f.email);
        const newMembers = uniqueMembers.filter((member) => !existingEmails.includes(member.email));
        finalFacultyList = [...existingEventData.facultyList, ...newMembers];
        addedCount = newMembers.length;
      }

      const newEventFacultyData: EventFacultyData = {
        eventId: selectedEventId,
        eventName: selectedEvent.name,
        facultyList: finalFacultyList,
        uploadedAt: new Date().toISOString(),
        totalCount: finalFacultyList.length,
      };

      const updatedEventFacultyData = eventFacultyData.filter((data) => data.eventId !== selectedEventId);
      updatedEventFacultyData.push(newEventFacultyData);
      setEventFacultyData(updatedEventFacultyData);

      localStorage.setItem("eventFacultyData", JSON.stringify(updatedEventFacultyData));

      window.dispatchEvent(
        new CustomEvent("eventFacultyDataUpdated", {
          detail: { eventFacultyData: updatedEventFacultyData },
        })
      );

      setSelectedFile(null);
      setSelectedEventId("");
      const fileInput = document.getElementById("faculty-upload") as HTMLInputElement;
      if (fileInput) {
        fileInput.value = "";
      }

      const skippedCount = uniqueMembers.length - addedCount;
      setSuccessMessage(
        `Successfully uploaded ${addedCount} faculty members for "${selectedEvent.name}"!${
          skippedCount > 0 ? ` ${skippedCount} duplicates were skipped.` : ""
        } Total: ${finalFacultyList.length} faculty members.`
      );
    } catch (error) {
      console.error("Upload error:", error);
      setErrorMessage(
        `Upload failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteEventFaculty = (eventId: string) => {
    const eventData = eventFacultyData.find((data) => data.eventId === eventId);
    if (!eventData) return;

    if (
      confirm(
        `Are you sure you want to delete all ${eventData.totalCount} faculty members for "${eventData.eventName}"?`
      )
    ) {
      const updatedData = eventFacultyData.filter((data) => data.eventId !== eventId);
      setEventFacultyData(updatedData);
      localStorage.setItem("eventFacultyData", JSON.stringify(updatedData));

      window.dispatchEvent(
        new CustomEvent("eventFacultyDataUpdated", {
          detail: { eventFacultyData: updatedData },
        })
      );

      setSuccessMessage(`Deleted faculty data for "${eventData.eventName}" successfully!`);
    }
  };

  const handleExportEventFaculty = (eventData: EventFacultyData) => {
    try {
      const excelData = eventData.facultyList.map((faculty, index) => ({
        "S.No": index + 1,
        Name: faculty.name,
        Email: faculty.email,
        Department: faculty.department || "",
        Institution: faculty.institution || "",
        Expertise: faculty.expertise || "",
        Phone: faculty.phone || "",
        Event: faculty.eventName,
        "Uploaded Date": format(new Date(faculty.uploadedAt), "dd/MM/yyyy HH:mm"),
      }));

      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);

      const colWidths = [
        { wch: 5 }, { wch: 25 }, { wch: 30 }, { wch: 20 }, { wch: 25 }, 
        { wch: 35 }, { wch: 15 }, { wch: 30 }, { wch: 18 },
      ];
      worksheet["!cols"] = colWidths;

      XLSX.utils.book_append_sheet(workbook, worksheet, "Faculty List");
      const fileName = `faculty-${eventData.eventName
        .replace(/[^a-z0-9]/gi, "-")
        .toLowerCase()}-${format(new Date(), "yyyy-MM-dd")}.xlsx`;

      XLSX.writeFile(workbook, fileName);
      setSuccessMessage(`Exported ${eventData.totalCount} faculty members to "${fileName}"!`);
    } catch (error) {
      console.error("Export error:", error);
      setErrorMessage("Failed to export data");
    }
  };

  const toggleEventExpansion = (eventId: string) => {
    setExpandedEvent(expandedEvent === eventId ? "" : eventId);
  };

  const filteredEventFacultyData = filterEvent === "ALL" 
    ? eventFacultyData 
    : eventFacultyData.filter((data) => data.eventId === filterEvent);

  if (loading) {
    return (
      <OrganizerLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </OrganizerLayout>
    );
  }

  return (
    <OrganizerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Faculty Management</h1>
            <p className="text-muted-foreground">Upload and manage faculty lists for your events</p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={loadEventsAndFacultyData}
              variant="outline"
              size="sm"
              disabled={eventsLoading}
            >
              {eventsLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh Data
            </Button>
          </div>
        </div>

        {/* Alert Messages */}
        {successMessage && (
          <Alert className="border-green-600 bg-green-50 backdrop-blur">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="flex items-center justify-between">
                <span>{successMessage}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 h-auto p-1"
                  onClick={() => setSuccessMessage("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {errorMessage && (
          <Alert className="border-red-600 bg-red-50 backdrop-blur">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <pre className="whitespace-pre-wrap text-sm">{errorMessage}</pre>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="ml-2 h-auto p-1 flex-shrink-0"
                  onClick={() => setErrorMessage("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Upload Section */}
          <Card className="border-gray-200 shadow-lg bg-gradient-to-br from-blue-50 to-purple-50">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Faculty List
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Event Selection */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  <Calendar className="h-4 w-4 inline mr-1" />
                  Select Event *
                </label>
                
                {eventsLoading ? (
                  <div className="w-full p-3 border-2 border-gray-300 rounded-lg bg-gray-100 flex items-center">
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin text-blue-500" />
                    <span className="text-gray-600">Loading events from database...</span>
                  </div>
                ) : events.length === 0 ? (
                  <div className="w-full p-3 border-2 border-red-300 rounded-lg bg-red-50 flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
                    <span className="text-red-600">No events available. Please create events first.</span>
                  </div>
                ) : (
                  <select
                    value={selectedEventId}
                    onChange={(e) => handleEventSelect(e.target.value)}
                    className="w-full p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  >
                    <option value="">Choose an event...</option>
                    {events.map((event) => (
                      <option key={event.id} value={event.id}>
                        {event.name} - {format(new Date(event.startDate), "MMM dd, yyyy")}
                      </option>
                    ))}
                  </select>
                )}

                {selectedEventId && (
                  <p className="text-xs text-blue-600 mt-1">
                    Selected: {events.find((e) => e.id === selectedEventId)?.name}
                  </p>
                )}
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  <FileText className="h-4 w-4 inline mr-1" />
                  Faculty Excel File *
                </label>
                <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition-all">
                  <Upload className="h-10 w-10 mx-auto text-blue-400 mb-3" />
                  <p className="text-sm text-gray-700 font-medium mb-2">
                    Upload Excel file with faculty details
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    Supports .xlsx and .xls files (max 5MB)
                  </p>
                  <input
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="faculty-upload"
                  />
                  <label
                    htmlFor="faculty-upload"
                    className="inline-flex items-center px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 cursor-pointer transition-all shadow-md hover:shadow-lg"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Choose File
                  </label>
                </div>

                {selectedFile && (
                  <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <FileText className="h-5 w-5 text-blue-600 mr-3" />
                        <div>
                          <p className="text-sm text-blue-800 font-semibold">{selectedFile.name}</p>
                          <p className="text-xs text-blue-600">
                            Size: {(selectedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedFile(null)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={!selectedEventId || !selectedFile || uploading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 font-semibold shadow-md hover:shadow-lg transition-all"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing Excel File...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Faculty List
                  </>
                )}
              </Button>

              {/* File Format Guide */}
              <div className="bg-gray-50 rounded-lg p-4 border">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Excel Format Guide
                </h4>
                <div className="text-xs text-gray-600 space-y-2">
                  <div>
                    <p className="font-medium text-green-700">Required columns (flexible names):</p>
                    <ul className="list-disc ml-4 space-y-1">
                      <li><strong>Name:</strong> Name, Full Name, First Name, Faculty Name, etc.</li>
                      <li><strong>Email:</strong> Email, E-mail, Email Address, Mail, etc.</li>
                    </ul>
                  </div>
                  <div>
                    <p className="font-medium text-blue-700">Optional columns:</p>
                    <ul className="list-disc ml-4 space-y-1">
                      <li><strong>Department:</strong> Department, Dept, Division, etc.</li>
                      <li><strong>Institution:</strong> Institution, University, College, etc.</li>
                      <li><strong>Expertise:</strong> Expertise, Specialization, Subject, etc.</li>
                      <li><strong>Phone:</strong> Phone, Mobile, Contact, etc.</li>
                    </ul>
                  </div>
                  <div className="bg-blue-100 p-2 rounded mt-2">
                    <p className="text-blue-800 font-medium">Smart Detection:</p>
                    <p className="text-blue-700">
                      Our system automatically detects column names in various formats!
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Faculty Data List */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Uploaded Faculty Lists
                    <Badge variant="secondary" className="ml-2">
                      {eventFacultyData.length} Events
                    </Badge>
                  </CardTitle>
                  <div className="flex items-center space-x-3">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select
                      value={filterEvent}
                      onChange={(e) => setFilterEvent(e.target.value)}
                      className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ALL">All Events</option>
                      {events.map((event) => (
                        <option key={event.id} value={event.id}>
                          {event.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredEventFacultyData.length > 0 ? (
                  <div className="space-y-4">
                    {filteredEventFacultyData.map((eventData) => (
                      <div
                        key={eventData.eventId}
                        className="border-2 border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-200 bg-gradient-to-r from-gray-50 to-white"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex-1">
                            <h4 className="font-bold text-lg text-gray-800">
                              {eventData.eventName}
                            </h4>
                            <div className="flex items-center space-x-6 text-sm text-gray-600 mt-1">
                              <span className="flex items-center bg-blue-100 px-2 py-1 rounded-full">
                                <Users className="h-3 w-3 mr-1 text-blue-600" />
                                <strong className="text-blue-700">
                                  {eventData.totalCount}
                                </strong>{" "}
                                faculty
                              </span>
                              <span className="flex items-center">
                                <Calendar className="h-3 w-3 mr-1 text-gray-500" />
                                {format(
                                  new Date(eventData.uploadedAt),
                                  "MMM dd, yyyy 'at' HH:mm"
                                )}
                              </span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleEventExpansion(eventData.eventId)}
                              className="border-blue-200 text-blue-600 hover:bg-blue-50"
                            >
                              <Eye className="h-3 w-3 mr-1" />
                              {expandedEvent === eventData.eventId ? "Hide" : "View"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleExportEventFaculty(eventData)}
                              className="border-green-200 text-green-600 hover:bg-green-50"
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Export
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteEventFaculty(eventData.eventId)}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>

                        {/* Faculty Preview/Expanded View */}
                        {expandedEvent === eventData.eventId ? (
                          <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <h5 className="text-sm font-semibold mb-3 text-gray-700">
                              Complete Faculty List:
                            </h5>
                            <div className="max-h-96 overflow-y-auto">
                              <div className="grid gap-3">
                                {eventData.facultyList.map((faculty, index) => (
                                  <div
                                    key={faculty.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border hover:bg-gray-100 transition-colors"
                                  >
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2">
                                      <div>
                                        <div className="flex items-center">
                                          <User className="h-3 w-3 mr-1 text-blue-500" />
                                          <span className="font-medium text-gray-800">
                                            {faculty.name}
                                          </span>
                                        </div>
                                      </div>
                                      <div>
                                        <div className="flex items-center">
                                          <Mail className="h-3 w-3 mr-1 text-green-500" />
                                          <span className="text-gray-600 text-sm">
                                            {faculty.email}
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex items-center space-x-2">
                                        {faculty.department && (
                                          <Badge variant="outline" className="text-xs">
                                            <Building className="h-2 w-2 mr-1" />
                                            {faculty.department}
                                          </Badge>
                                        )}
                                        {faculty.phone && (
                                          <Badge variant="outline" className="text-xs">
                                            <Phone className="h-2 w-2 mr-1" />
                                            {faculty.phone}
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="bg-white rounded-lg border border-gray-100 p-4">
                            <h5 className="text-sm font-medium mb-2 text-gray-700">
                              Faculty Preview:
                            </h5>
                            <div className="space-y-2">
                              {eventData.facultyList
                                .slice(0, 3)
                                .map((faculty, index) => (
                                  <div
                                    key={faculty.id}
                                    className="flex justify-between items-center py-1"
                                  >
                                    <div className="flex items-center">
                                      <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                                        <span className="text-xs text-blue-600 font-medium">
                                          {index + 1}
                                        </span>
                                      </div>
                                      <span className="font-medium text-sm">
                                        {faculty.name}
                                      </span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-gray-500 text-xs">
                                        {faculty.email}
                                      </span>
                                      {faculty.department && (
                                        <Badge variant="outline" className="text-xs">
                                          {faculty.department}
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              {eventData.facultyList.length > 3 && (
                                <div className="text-xs text-gray-500 text-center pt-2 border-t border-gray-200 font-medium">
                                  ... and {eventData.facultyList.length - 3}{" "}
                                  more faculty members
                                  <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() =>
                                      toggleEventExpansion(eventData.eventId)
                                    }
                                    className="ml-2 h-auto p-0 text-blue-600"
                                  >
                                    View All
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-gradient-to-b from-gray-50 to-white rounded-lg border-2 border-dashed border-gray-200">
                    <Users className="h-20 w-20 mx-auto text-gray-300 mb-6" />
                    <h3 className="text-xl font-semibold text-gray-700 mb-3">
                      No Faculty Lists Uploaded Yet
                    </h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      Get started by uploading your first faculty list using the
                      form on the left. You can manage multiple events and their
                      faculty lists from here.
                    </p>
                    <div className="flex flex-col items-center space-y-3 text-sm text-gray-400">
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                          <span className="text-xs text-blue-600 font-bold">1</span>
                        </div>
                        Select an event from your list
                      </div>
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                          <span className="text-xs text-blue-600 font-bold">2</span>
                        </div>
                        Upload Excel file with faculty details
                      </div>
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                          <span className="text-xs text-blue-600 font-bold">3</span>
                        </div>
                        Faculty data will be available across the system
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Stats */}
            {eventFacultyData.length > 0 && (
              <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-lg text-blue-800">
                    Faculty Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <div className="text-2xl font-bold text-blue-600">
                        {eventFacultyData.reduce(
                          (sum, data) => sum + data.totalCount,
                          0
                        )}
                      </div>
                      <div className="text-sm text-gray-600">Total Faculty</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <div className="text-2xl font-bold text-purple-600">
                        {eventFacultyData.length}
                      </div>
                      <div className="text-sm text-gray-600">
                        Events with Faculty
                      </div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(
                          eventFacultyData.reduce(
                            (sum, data) => sum + data.totalCount,
                            0
                          ) / eventFacultyData.length || 0
                        )}
                      </div>
                      <div className="text-sm text-gray-600">Avg per Event</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </OrganizerLayout>
  );
}