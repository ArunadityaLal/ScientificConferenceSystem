import { useState, useEffect } from "react";

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

export function useEventFaculty() {
  const [eventFacultyData, setEventFacultyData] = useState<EventFacultyData[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const loadEventFacultyData = () => {
    try {
      const savedData = localStorage.getItem("eventFacultyData");
      if (savedData) {
        const parsedData = JSON.parse(savedData);
        setEventFacultyData(parsedData);
        console.log("📋 Loaded event faculty data:", parsedData);
      }
    } catch (error) {
      console.error("Error loading event faculty data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getFacultyByEvent = (eventId: string): FacultyMember[] => {
    const eventData = eventFacultyData.find((data) => data.eventId === eventId);
    return eventData?.facultyList || [];
  };

  const getFacultyCount = (eventId: string): number => {
    const eventData = eventFacultyData.find((data) => data.eventId === eventId);
    return eventData?.totalCount || 0;
  };

  const getAllFaculty = (): FacultyMember[] => {
    return eventFacultyData.flatMap((data) => data.facultyList);
  };

  const getUniqueFaculty = (): FacultyMember[] => {
    const allFaculty = getAllFaculty();
    const uniqueFaculty = allFaculty.filter(
      (faculty, index, self) =>
        index === self.findIndex((f) => f.email === faculty.email)
    );
    return uniqueFaculty;
  };

  useEffect(() => {
    loadEventFacultyData();

    // Listen for storage changes
    const handleStorageChange = () => {
      console.log("📡 Storage change detected, reloading event faculty data");
      loadEventFacultyData();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("eventFacultyDataUpdated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener(
        "eventFacultyDataUpdated",
        handleStorageChange
      );
    };
  }, []);

  return {
    eventFacultyData,
    loading,
    getFacultyByEvent,
    getFacultyCount,
    getAllFaculty,
    getUniqueFaculty,
    refetch: loadEventFacultyData,
  };
}
