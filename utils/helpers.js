// Format time to 12-hour format
export const formatTime12Hour = (timeString) => {
  if (!timeString) return '';
  
  const [hours, minutes] = timeString.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  
  return `${formattedHour}:${minutes} ${ampm}`;
};

// Generate mock data
export const generateMockMedications = () => [
  {
    id: '1',
    name: 'Aspirin',
    dosage: '100mg',
    time: '08:00',
    compartment: 'A1',
    days: ['Mon', 'Wed', 'Fri']
  },
  {
    id: '2', 
    name: 'Vitamin D',
    dosage: '1000IU',
    time: '12:00',
    compartment: 'B2',
    days: ['Daily']
  }
];