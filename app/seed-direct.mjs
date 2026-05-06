import mysql from 'mysql2/promise';

const url = 'mysql://aWNc63eaXKg4htF.root:tbnG72TGzUM6ZeHm@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test?ssl={"rejectUnauthorized":true}';

async function seed() {
  console.log('Connecting to TiDB Cloud...');
  const conn = await mysql.createConnection(url);
  console.log('Connected!');

  // Check existing tables
  const [tables] = await conn.execute('SHOW TABLES');
  console.log('Tables found:', tables.length);

  // Check if client already exists
  const [existing] = await conn.execute('SELECT id FROM clients WHERE apiKey = ?', ['rv_demo_client_12345']);
  if (existing.length > 0) {
    console.log('Demo client already exists, skipping seed.');
    await conn.end();
    return;
  }

  console.log('Inserting demo client...');
  const [result] = await conn.execute(
    'INSERT INTO clients (name, email, domain, apiKey, plan, status, theme, primaryColor) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    ['Transportes Riviera Maya', 'contact@transportesrm.com', 'transportesrivieramaya.com', 'rv_demo_client_12345', 'professional', 'active', 'light', '#C75E3A']
  );
  const clientId = Number(result.insertId);
  console.log('Client created with ID:', clientId);

  console.log('Inserting services...');
  const svcs = [
    ['Aeropuerto → Hotel', 'airport-to-hotel', 'AirplaneLanding', 'Traslado desde el aeropuerto a tu hotel', '45.00'],
    ['Hotel → Aeropuerto', 'hotel-to-airport', 'AirplaneTakeoff', 'Traslado desde tu hotel al aeropuerto', '45.00'],
    ['Tour Privado', 'private-tour', 'MapTrifold', 'Tour personalizado por la zona', '85.00'],
    ['Por Horas', 'hourly', 'Clock', 'Servicio de transporte por horas', '35.00'],
  ];
  for (const [name, slug, icon, desc, price] of svcs) {
    await conn.execute(
      'INSERT INTO services (clientId, name, slug, icon, description, basePrice, active, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [clientId, name, slug, icon, desc, price, true, 1]
    );
  }
  console.log('Services inserted');

  console.log('Inserting vehicles...');
  const vehs = [
    ['Suburban Premium', '/vehicle-suburban.jpg', 1, 6, JSON.stringify(['WiFi', 'A/C', 'Agua']), '125.00'],
    ['Van Ejecutiva', '/vehicle-van.jpg', 1, 10, JSON.stringify(['WiFi', 'A/C', 'Agua', 'TV']), '165.00'],
    ['Sprinter Luxury', '/vehicle-sprinter.jpg', 1, 16, JSON.stringify(['WiFi', 'A/C', 'Bar', 'TV']), '245.00'],
  ];
  for (const [name, image, cMin, cMax, features, price] of vehs) {
    await conn.execute(
      'INSERT INTO vehicles (clientId, name, image, capacityMin, capacityMax, features, basePrice, active, sortOrder) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [clientId, name, image, cMin, cMax, features, price, true, 1]
    );
  }
  console.log('Vehicles inserted');

  await conn.end();
  console.log('Seed complete!');
}

seed().catch(err => { console.error('Seed error:', err.message); process.exit(1); });
