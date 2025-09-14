// src/hooks/use-rooms.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

// Types
export interface Room {
  id: string;
  name: string;
  capacity: number;
  location: string;
  amenities?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface RoomsResponse {
  success: boolean;
  data: Room[];
}

// API functions
const roomsApi = {
  // Get all rooms
  getRooms: async (): Promise<RoomsResponse> => {
    const response = await fetch('/api/rooms', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch rooms');
    }

    const data = await response.json();
    return {
      success: true,
      data: data
    };
  },

  // Get active rooms only
  getActiveRooms: async (): Promise<RoomsResponse> => {
    const response = await fetch('/api/rooms?active=true', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch active rooms');
    }

    const data = await response.json();
    return {
      success: true,
      data: data
    };
  },

  // Create new room
  createRoom: async (roomData: Omit<Room, 'id' | 'createdAt'>): Promise<Room> => {
    const response = await fetch('/api/rooms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(roomData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create room');
    }

    return response.json();
  },

  // Update room
  updateRoom: async ({ roomId, updates }: { roomId: string; updates: Partial<Room> }): Promise<Room> => {
    const response = await fetch(`/api/rooms/${roomId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update room');
    }

    return response.json();
  },

  // Delete room
  deleteRoom: async (roomId: string): Promise<void> => {
    const response = await fetch(`/api/rooms/${roomId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete room');
    }
  },
};

// Hooks
export function useRooms(activeOnly: boolean = false) {
  return useQuery({
    queryKey: ['rooms', activeOnly],
    queryFn: () => activeOnly ? roomsApi.getActiveRooms() : roomsApi.getRooms(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useRoom(roomId: string) {
  return useQuery({
    queryKey: ['rooms', roomId],
    queryFn: async () => {
      const response = await fetch(`/api/rooms/${roomId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch room');
      }
      return response.json();
    },
    enabled: !!roomId,
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: roomsApi.createRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Room created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create room');
    },
  });
}

export function useUpdateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: roomsApi.updateRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Room updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update room');
    },
  });
}

export function useDeleteRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: roomsApi.deleteRoom,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast.success('Room deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete room');
    },
  });
}