const mongoose = require('mongoose');

const connectionString = 'mongodb+srv://dominica_admin:Hobfy5OCmXlSzPNO@cluster0.ek7bhnt.mongodb.net/dominica-news?retryWrites=true&w=majority&appName=Cluster0';

async function testConnection() {
  try {
    console.log('Testing MongoDB connection...');
    console.log('Connection string:', connectionString.replace(/:[^:@]*@/, ':****@'));
    
    await mongoose.connect(connectionString, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
    
    console.log('✅ Connection successful!');
    console.log('Connected to:', mongoose.connection.host);
    
    // Test a simple operation
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Available collections:', collections.map(c => c.name));
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected');
  }
}

testConnection();