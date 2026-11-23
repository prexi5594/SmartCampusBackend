/* Demonstration catalogue only. No entries, aliases or positions are official campus data.
 * schematic positions use the original 900 × 600 drawing, never latitude/longitude.
 * Classic scripts preserve direct file:// preview without a build step or local server.
 */
window.CampusDemoFacilities = {
  schemaVersion: 1,
  kind: 'demo',
  coordinateSpace: 'schematic-900x600',
  categories: [
    { id: 'academic', name: 'Academic' },
    { id: 'support', name: 'Student support' },
    { id: 'food', name: 'Food & drink' },
    { id: 'transport', name: 'Transport' },
    { id: 'recreation', name: 'Sports & recreation' }
  ],
  // The original search keywords are retained as demonstration aliases.
  places: [
    { id: 'library', name: 'Library', mapName: 'Library', category: 'academic', icon: 'book', schematic: { x: 450, y: 180 }, description: 'Find your quiet corner. Books, study spaces and resources.', aliases: ['books', 'research', 'reading', 'study'] },
    { id: 'lectures', name: 'Lecture Halls', mapName: 'Lecture Halls', category: 'academic', icon: 'lecture', schematic: { x: 150, y: 180 }, description: 'Your next class, closer. Large teaching rooms and auditoriums.', aliases: ['classes', 'classrooms', 'teaching'] },
    { id: 'labs', name: 'Computer Laboratories', mapName: 'Computer Labs', category: 'academic', icon: 'monitor', schematic: { x: 750, y: 180 }, description: 'Connect and create. Discover computing and practical labs.', aliases: ['computers', 'ict', 'practical', 'technology'] },
    { id: 'admin', name: 'Administration Offices', mapName: 'Administration', category: 'support', icon: 'building', schematic: { x: 150, y: 385 }, description: 'Get the support you need. Admissions, records and enquiries.', aliases: ['registration', 'fees', 'admissions', 'records', 'finance'] },
    { id: 'student', name: 'Student Centre', mapName: 'Student Centre', category: 'support', icon: 'people', schematic: { x: 450, y: 385 }, description: 'The heart of campus life. Meet, collaborate and get involved.', aliases: ['clubs', 'societies', 'students', 'events'] },
    { id: 'cafe', name: 'Cafeteria', mapName: 'Cafeteria', category: 'food', icon: 'food', schematic: { x: 750, y: 385 }, description: 'Take a delicious break. Explore places to eat and recharge.', aliases: ['food', 'lunch', 'meals', 'dining'] },
    { id: 'parking', name: 'Parking Area', mapName: 'Parking Area', category: 'transport', icon: 'parking', schematic: { x: 150, y: 555 }, description: 'Arrive without the guesswork. Find convenient campus parking.', aliases: ['cars', 'vehicles', 'parking'] },
    { id: 'sports', name: 'Sports Facilities', mapName: 'Sports Facilities', category: 'recreation', icon: 'trophy', schematic: { x: 750, y: 555 }, description: 'Make your next move. Find courts, fields and fitness spaces.', aliases: ['gym', 'football', 'basketball', 'fitness'] }
  ],
  entrance: { id: 'main', name: 'Main Entrance', mapName: 'Main Entrance', schematic: { x: 300, y: 555 } }
};
